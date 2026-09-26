import AgentDocument from "@/models/AgentDocument";
import Customer from "@/models/Customer";
import PlanPayment from "@/models/PlanPayment";
import { requireAgent, ok, fail } from "@/lib/agent/server";

const ACTIVITY_WINDOW_DAYS = 30;

export async function GET() {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;

    const [counts, customers, pending] = await Promise.all([
      AgentDocument.aggregate<{ _id: string; count: number }>([
        { $match: { agentId: user._id } },
        { $group: { _id: "$kind", count: { $sum: 1 } } },
      ]),
      Customer.countDocuments({ agentId: user._id }),
      PlanPayment.exists({ agentId: user._id, status: "pending" }),
    ]);

    // Activity board: documents created in the last 30 days, ranked across all agents.
    const since = new Date(Date.now() - ACTIVITY_WINDOW_DAYS * 86400000);
    const board = await AgentDocument.aggregate<{ _id: unknown; score: number }>([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$agentId", score: { $sum: 1 } } },
      { $sort: { score: -1 } },
    ]);
    const index = board.findIndex((b) => String(b._id) === user._id.toString());
    const activityScore = index >= 0 ? board[index].score : 0;
    const rank = index >= 0 ? index + 1 : null;
    const topTier = rank == null ? null : rank <= 10 ? "top_10" : rank <= 20 ? "top_20" : rank <= 30 ? "top_30" : null;

    const documentCounts = counts.map((c) => ({ key: c._id, count: c.count }));
    return ok({
      documentCounts,
      totalDocuments: documentCounts.reduce((sum, c) => sum + c.count, 0),
      customers,
      planPaymentPending: !!pending,
      ranking: { activityScore, rank, topTier },
    });
  } catch (error) {
    console.error("[GET /api/agent/dashboard/summary]", error);
    return fail("We could not load your stats. Please try again.", 500);
  }
}
