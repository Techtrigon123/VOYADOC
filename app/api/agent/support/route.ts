import { NextRequest } from "next/server";
import { requireAgent, ok, fail } from "@/lib/agent/server";
import { createSupportMessage, listSupportMessages, type SupportMessageRecord } from "@/lib/db/repo";

const serialize = (m: SupportMessageRecord) => ({ id: m.id, from: m.from, body: m.body, createdAt: m.createdAt.toISOString() });

export async function GET() {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    return ok((await listSupportMessages(user.id)).map(serialize));
  } catch (error) {
    console.error("[GET /api/agent/support]", error);
    return fail("Could not load your messages. Try again.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const text = String(body?.body ?? "").trim();
    if (!text) return fail("Type a message first.");
    if (text.length > 4000) return fail("Message is too long.");
    return ok(serialize(await createSupportMessage(user.id, text)), { status: 201 });
  } catch (error) {
    console.error("[POST /api/agent/support]", error);
    return fail("Could not send your message. Try again.", 500);
  }
}
