import { NextRequest } from "next/server";
import { requireAgent, ok, fail } from "@/lib/agent/server";
import { channelOff, clean, cleanBody, notReady } from "@/lib/agent/support-guard";
import { createTicket, listTickets, TICKET_CATEGORIES, type TicketCategory } from "@/lib/db/support-repo";

const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export async function GET() {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    return ok(await listTickets(user.id));
  } catch (error) {
    const pending = notReady(error);
    if (pending) return pending;
    console.error("[GET /api/agent/support/tickets]", error);
    return fail("Could not load your tickets.", 500);
  }
}

/** Body: { subject, category, priority, body } */
export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    const off = await channelOff("tickets");
    if (off) return off;
    const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
    const subject = clean(b.subject, 140);
    const body = cleanBody(b.body, 5000);
    const category =
      (TICKET_CATEGORIES as readonly string[]).includes(String(b.category)) && b.category !== "bug" ? (b.category as TicketCategory) : "general";
    const priority = (PRIORITIES as readonly string[]).includes(String(b.priority)) ? (b.priority as (typeof PRIORITIES)[number]) : "normal";
    if (subject.length < 3) return fail("Add a short subject (at least 3 characters).");
    if (body.length < 10) return fail("Describe the issue in a little more detail (at least 10 characters).");
    return ok(await createTicket(user.id, { kind: "ticket", subject, category, priority, body }), {
      status: 201,
      message: "Ticket created. We'll reply right here.",
    });
  } catch (error) {
    const pending = notReady(error);
    if (pending) return pending;
    console.error("[POST /api/agent/support/tickets]", error);
    return fail("Could not create the ticket. Please try again.", 500);
  }
}
