import "server-only";
import { db } from "@/lib/db/supabase";

/* Support centre data access for the agent app (migration 0010). Every query is scoped to one agent. */

export const TICKET_CATEGORIES = ["general", "documents", "billing", "account", "technical", "bug"] as const;
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];
export type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";
export const CALLBACK_SLOTS = ["morning", "afternoon", "evening"] as const;
export type CallbackSlot = (typeof CALLBACK_SLOTS)[number];

export interface Ticket {
  id: string;
  number: number;
  kind: "ticket" | "bug";
  subject: string;
  category: TicketCategory;
  priority: "low" | "normal" | "high" | "urgent";
  status: TicketStatus;
  lastReplyFrom: "agent" | "support";
  lastReplyAt: string;
  createdAt: string;
}

export interface TicketMessage {
  id: string;
  from: "agent" | "support";
  authorName: string | null;
  body: string;
  attachment: string | null;
  createdAt: string;
}

export interface CallbackRequest {
  id: string;
  phone: string;
  preferredDate: string;
  preferredSlot: CallbackSlot;
  topic: string;
  note: string | null;
  status: "requested" | "scheduled" | "completed" | "cancelled" | "missed";
  scheduledAt: string | null;
  adminNote: string | null;
  createdAt: string;
}

/** Thrown when migration 0010 hasn't been run, so routes can answer "not set up yet" instead of failing. */
export class SupportNotReadyError extends Error {
  constructor() {
    super("Support centre tables are missing — run supabase/migrations/0010_support_center.sql.");
    this.name = "SupportNotReadyError";
  }
}

/** PostgREST "table not found" (PGRST205) or Postgres "relation does not exist" (42P01). */
const isMissingTable = (e: { code?: string; message: string }) => e.code === "PGRST205" || e.code === "42P01" || /could not find the table|does not exist/i.test(e.message);

function check<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
  if (res.error) {
    if (isMissingTable(res.error)) throw new SupportNotReadyError();
    throw new Error(`Supabase: ${res.error.message}`);
  }
  return res.data;
}

/** Read helpers return "nothing yet" while the tables don't exist. */
async function orEmpty<T>(run: () => Promise<T>, empty: T): Promise<T> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof SupportNotReadyError) return empty;
    throw e;
  }
}

type Row = Record<string, unknown>;
const ticket = (r: Row): Ticket => ({
  id: r.id as string,
  number: Number(r.number),
  kind: r.kind as Ticket["kind"],
  subject: r.subject as string,
  category: r.category as TicketCategory,
  priority: r.priority as Ticket["priority"],
  status: r.status as TicketStatus,
  lastReplyFrom: r.last_reply_from as Ticket["lastReplyFrom"],
  lastReplyAt: r.last_reply_at as string,
  createdAt: r.created_at as string,
});
const message = (r: Row): TicketMessage => ({
  id: r.id as string,
  from: r.from as TicketMessage["from"],
  authorName: (r.author_name as string | null) ?? null,
  body: r.body as string,
  attachment: (r.attachment as string | null) ?? null,
  createdAt: r.created_at as string,
});
const callback = (r: Row): CallbackRequest => ({
  id: r.id as string,
  phone: r.phone as string,
  preferredDate: r.preferred_date as string,
  preferredSlot: r.preferred_slot as CallbackSlot,
  topic: r.topic as string,
  note: (r.note as string | null) ?? null,
  status: r.status as CallbackRequest["status"],
  scheduledAt: (r.scheduled_at as string | null) ?? null,
  adminNote: (r.admin_note as string | null) ?? null,
  createdAt: r.created_at as string,
});

const TICKET_COLS = "id,number,kind,subject,category,priority,status,last_reply_from,last_reply_at,created_at";

export async function listTickets(agentId: string): Promise<Ticket[]> {
  return orEmpty(async () => {
    const rows = check(await db().from("support_tickets").select(TICKET_COLS).eq("agent_id", agentId).order("last_reply_at", { ascending: false }).limit(100));
    return ((rows ?? []) as Row[]).map(ticket);
  }, []);
}

export async function getTicket(agentId: string, id: string): Promise<{ ticket: Ticket; messages: TicketMessage[] } | null> {
  return orEmpty(() => loadTicket(agentId, id), null);
}

async function loadTicket(agentId: string, id: string): Promise<{ ticket: Ticket; messages: TicketMessage[] } | null> {
  const row = check(await db().from("support_tickets").select(TICKET_COLS).eq("agent_id", agentId).eq("id", id).maybeSingle());
  if (!row) return null;
  const msgs = check(await db().from("support_ticket_messages").select("id,from,author_name,body,attachment,created_at").eq("ticket_id", id).order("created_at"));
  return { ticket: ticket(row as Row), messages: ((msgs ?? []) as Row[]).map(message) };
}

export async function createTicket(
  agentId: string,
  input: { kind: "ticket" | "bug"; subject: string; category: TicketCategory; priority: Ticket["priority"]; body: string; attachment?: string; attachmentType?: string; context?: Record<string, unknown> }
): Promise<Ticket> {
  const row = check(
    await db()
      .from("support_tickets")
      .insert({ agent_id: agentId, kind: input.kind, subject: input.subject, category: input.category, priority: input.priority, context: input.context ?? {} })
      .select(TICKET_COLS)
      .single()
  ) as Row;
  const t = ticket(row);
  try {
    check(
      await db().from("support_ticket_messages").insert({
        ticket_id: t.id,
        from: "agent",
        body: input.body,
        attachment: input.attachment ?? null,
        attachment_type: input.attachmentType ?? null,
      })
    );
  } catch (e) {
    // Don't leave an empty ticket behind if the first message can't be saved.
    await db().from("support_tickets").delete().eq("id", t.id);
    throw e;
  }
  return t;
}

/** Agent reply: reopens a resolved ticket and puts it back in the support queue. */
export async function replyToTicket(agentId: string, id: string, body: string): Promise<TicketMessage | null> {
  const row = check(await db().from("support_tickets").select("id,status").eq("agent_id", agentId).eq("id", id).maybeSingle()) as Row | null;
  if (!row) return null;
  if (row.status === "closed") throw new Error("CLOSED");
  const msg = check(await db().from("support_ticket_messages").insert({ ticket_id: id, from: "agent", body }).select("id,from,author_name,body,attachment,created_at").single()) as Row;
  check(await db().from("support_tickets").update({ last_reply_from: "agent", last_reply_at: new Date().toISOString(), status: row.status === "resolved" || row.status === "waiting" ? "open" : row.status }).eq("id", id));
  return message(msg);
}

export async function closeTicket(agentId: string, id: string): Promise<boolean> {
  const res = check(await db().from("support_tickets").update({ status: "closed" }).eq("agent_id", agentId).eq("id", id).select("id"));
  return ((res ?? []) as Row[]).length > 0;
}

export async function countOpenTickets(agentId: string): Promise<number> {
  const { count } = await db().from("support_tickets").select("id", { count: "exact", head: true }).eq("agent_id", agentId).in("status", ["open", "in_progress", "waiting"]);
  return count ?? 0;
}

export async function listCallbacks(agentId: string): Promise<CallbackRequest[]> {
  return orEmpty(async () => {
    const rows = check(await db().from("callback_requests").select("*").eq("agent_id", agentId).order("created_at", { ascending: false }).limit(20));
    return ((rows ?? []) as Row[]).map(callback);
  }, []);
}

export async function activeCallbackCount(agentId: string): Promise<number> {
  const { count } = await db().from("callback_requests").select("id", { count: "exact", head: true }).eq("agent_id", agentId).in("status", ["requested", "scheduled"]);
  return count ?? 0;
}

export async function createCallback(agentId: string, input: { phone: string; preferredDate: string; preferredSlot: CallbackSlot; topic: string; note?: string }): Promise<CallbackRequest> {
  const row = check(
    await db()
      .from("callback_requests")
      .insert({ agent_id: agentId, phone: input.phone, preferred_date: input.preferredDate, preferred_slot: input.preferredSlot, topic: input.topic, note: input.note || null })
      .select("*")
      .single()
  ) as Row;
  return callback(row);
}

export async function cancelCallback(agentId: string, id: string): Promise<boolean> {
  const res = check(await db().from("callback_requests").update({ status: "cancelled" }).eq("agent_id", agentId).eq("id", id).in("status", ["requested", "scheduled"]).select("id"));
  return ((res ?? []) as Row[]).length > 0;
}
