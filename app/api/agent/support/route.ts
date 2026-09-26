import { NextRequest } from "next/server";
import SupportMessage from "@/models/SupportMessage";
import { requireAgent, ok, fail } from "@/lib/agent/server";

export async function GET() {
  const { user, response } = await requireAgent();
  if (response) return response;
  const rows = await SupportMessage.find({ agentId: user._id }).sort({ createdAt: 1 }).limit(300);
  return ok(rows.map((m) => ({ id: m._id.toString(), from: m.from, body: m.body, createdAt: m.createdAt.toISOString() })));
}

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const text = String(body?.body ?? "").trim();
    if (!text) return fail("Type a message first.");
    if (text.length > 4000) return fail("Message is too long.");
    const m = await SupportMessage.create({ agentId: user._id, from: "agent", body: text });
    return ok({ id: m._id.toString(), from: m.from, body: m.body, createdAt: m.createdAt.toISOString() }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/agent/support]", error);
    return fail("Could not send your message. Try again.", 500);
  }
}
