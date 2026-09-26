import { requireAgent, serializeAgent, fail } from "@/lib/agent/server";

export async function GET() {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    const agent = serializeAgent(user);
    // `user` kept for older callers that read `json.user`.
    return Response.json({ success: true, data: agent, user: agent });
  } catch (error) {
    console.error("[GET /api/auth/me]", error);
    return fail("Internal server error.", 500);
  }
}
