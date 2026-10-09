import { NextRequest } from "next/server";
import { requireAgent, ok, fail, isUuid } from "@/lib/agent/server";
import { cleanBody, notReady } from "@/lib/agent/support-guard";
import { closeTicket, getTicket, replyToTicket } from "@/lib/db/support-repo";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    const { id } = await params;
    if (!isUuid(id)) return fail("Ticket not found.", 404);
    const t = await getTicket(user.id, id);
    return t ? ok(t) : fail("Ticket not found.", 404);
  } catch (error) {
    const pending = notReady(error);
    if (pending) return pending;
    console.error("[GET /api/agent/support/tickets/:id]", error);
    return fail("Could not load the ticket.", 500);
  }
}

/** Body: { body } to reply, or { action: "close" } to close the ticket. */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    const { id } = await params;
    if (!isUuid(id)) return fail("Ticket not found.", 404);
    const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
    if (b.action === "close") return (await closeTicket(user.id, id)) ? ok(true, { message: "Ticket closed." }) : fail("Ticket not found.", 404);
    const body = cleanBody(b.body, 5000);
    if (!body) return fail("Type a reply first.");
    try {
      const msg = await replyToTicket(user.id, id, body);
      return msg ? ok(msg, { status: 201 }) : fail("Ticket not found.", 404);
    } catch (e) {
      if ((e as Error).message === "CLOSED") return fail("This ticket is closed. Open a new ticket if you still need help.", 409);
      throw e;
    }
  } catch (error) {
    const pending = notReady(error);
    if (pending) return pending;
    console.error("[POST /api/agent/support/tickets/:id]", error);
    return fail("Could not send your reply.", 500);
  }
}
