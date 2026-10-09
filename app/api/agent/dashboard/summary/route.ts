import { requireAgent, ok, fail } from "@/lib/agent/server";
import { activityRank, countCustomers, documentCounts, findPendingPlanPayment, listDocuments, weeklyActivity } from "@/lib/db/repo";
import { freeUsage } from "@/lib/agent/entitlements";

const ACTIVITY_WINDOW_DAYS = 30;

export async function GET() {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;

    // Activity board: documents created in the last 30 days, ranked across all agents.
    const since = new Date(Date.now() - ACTIVITY_WINDOW_DAYS * 86400000);
    const [counts, customers, pending, ranking, usage, weekly, recentDocs] = await Promise.all([
      documentCounts(user.id),
      countCustomers(user.id),
      findPendingPlanPayment(user.id),
      activityRank(user.id, since),
      freeUsage(user),
      // Chart and activity feed are extras: if they fail, the rest of the dashboard still loads.
      weeklyActivity(user.id, 8).catch(() => []),
      listDocuments(user.id, { limit: 6, order: "updated_desc" }).catch(() => []),
    ]);
    const rank = ranking.activityScore > 0 ? ranking.rank : null;
    const topTier = rank == null ? null : rank <= 10 ? "top_10" : rank <= 20 ? "top_20" : rank <= 30 ? "top_30" : null;

    return ok({
      documentCounts: counts,
      totalDocuments: counts.reduce((sum, c) => sum + c.count, 0),
      customers,
      planPaymentPending: !!pending,
      freeUsage: usage,
      ranking: { activityScore: ranking.activityScore, rank, topTier },
      weekly,
      recent: recentDocs.map((d) => ({
        id: d.id,
        kind: d.kind,
        title: d.title,
        number: d.number ?? null,
        version: d.version,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
    });
  } catch (error) {
    console.error("[GET /api/agent/dashboard/summary]", error);
    return fail("We could not load your stats. Please try again.", 500);
  }
}
