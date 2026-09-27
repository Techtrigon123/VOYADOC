import { requireAgent, ok, fail } from "@/lib/agent/server";
import { activityRank, countCustomers, documentCounts, findPendingPlanPayment } from "@/lib/db/repo";

const ACTIVITY_WINDOW_DAYS = 30;

export async function GET() {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;

    // Activity board: documents created in the last 30 days, ranked across all agents.
    const since = new Date(Date.now() - ACTIVITY_WINDOW_DAYS * 86400000);
    const [counts, customers, pending, ranking] = await Promise.all([
      documentCounts(user.id),
      countCustomers(user.id),
      findPendingPlanPayment(user.id),
      activityRank(user.id, since),
    ]);
    const rank = ranking.activityScore > 0 ? ranking.rank : null;
    const topTier = rank == null ? null : rank <= 10 ? "top_10" : rank <= 20 ? "top_20" : rank <= 30 ? "top_30" : null;

    return ok({
      documentCounts: counts,
      totalDocuments: counts.reduce((sum, c) => sum + c.count, 0),
      customers,
      planPaymentPending: !!pending,
      ranking: { activityScore: ranking.activityScore, rank, topTier },
    });
  } catch (error) {
    console.error("[GET /api/agent/dashboard/summary]", error);
    return fail("We could not load your stats. Please try again.", 500);
  }
}
