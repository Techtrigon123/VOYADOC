import { createHmac } from "crypto";
import { requireAgent, ok, fail } from "@/lib/agent/server";
import { effectivePlan } from "@/lib/agent/plans";

/**
 * Who the signed-in agent is, for the live-chat widget, so conversations arrive in the
 * Chatwoot inbox with the agent's name, email, company and plan.
 *
 * If CHATWOOT_HMAC_TOKEN is set (Chatwoot → Inbox settings → Configuration → Identity validation),
 * an identifier hash is included so nobody can open a chat pretending to be another agent.
 */
export async function GET() {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;

    const secret = process.env.CHATWOOT_HMAC_TOKEN?.trim();
    const identifier = user.id;
    return ok({
      identifier,
      identifierHash: secret ? createHmac("sha256", secret).update(identifier).digest("hex") : null,
      name: user.name,
      email: user.email,
      companyName: user.companyName ?? null,
      plan: effectivePlan(user),
      status: user.status,
    });
  } catch (error) {
    console.error("[GET /api/agent/chat-identity]", error);
    return fail("Could not load chat details.", 500);
  }
}
