import { requireAgent, ok, fail } from "@/lib/agent/server";
import { getAppSettings } from "@/lib/settings";
import { activeCallbackCount, countOpenTickets } from "@/lib/db/support-repo";

/** What the Support menu shows: enabled channels, callback hours, and the agent's open items. */
export async function GET() {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    const [{ support }, openTickets, activeCallbacks] = await Promise.all([
      getAppSettings(),
      countOpenTickets(user.id).catch(() => 0),
      activeCallbackCount(user.id).catch(() => 0),
    ]);
    return ok({ channels: support, openTickets, activeCallbacks });
  } catch (error) {
    console.error("[GET /api/agent/support/center]", error);
    return fail("Could not load support options.", 500);
  }
}
