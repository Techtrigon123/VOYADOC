import { NextRequest } from "next/server";
import { requireAgent, ok, fail, isUuid } from "@/lib/agent/server";
import { cancelCallback } from "@/lib/db/support-repo";
import { notReady } from "@/lib/agent/support-guard";

type Ctx = { params: Promise<{ id: string }> };

/** Body: { action: "cancel" } */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    const { id } = await params;
    if (!isUuid(id)) return fail("Request not found.", 404);
    const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
    if (b.action !== "cancel") return fail("Unknown action.");
    return (await cancelCallback(user.id, id)) ? ok(true, { message: "Callback cancelled." }) : fail("This request can no longer be cancelled.", 409);
  } catch (error) {
    const pending = notReady(error);
    if (pending) return pending;
    console.error("[POST /api/agent/support/callbacks/:id]", error);
    return fail("Could not cancel the request.", 500);
  }
}
