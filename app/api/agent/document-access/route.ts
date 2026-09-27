import { listDocuments } from "@/lib/db/repo";
import { requireAgent, summarizeDocument, ok, fail } from "@/lib/agent/server";
import { effectivePlan, SILVER_RETENTION_DAYS } from "@/lib/agent/plans";
import { KIND_LABELS } from "@/lib/agent/documents";

const URGENT_DAYS = 3;
const CLOSING_DAYS = 7;

/**
 * Silver file-access overview: which PDFs are closing soon or already locked.
 * Paid plans never lose access, so the warning is off for them.
 */
export async function GET() {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;

    const plan = effectivePlan(user);
    const docs = await listDocuments(user.id, { limit: 1000 });
    const rows = docs.map((d) => {
      const s = summarizeDocument(d, user);
      return {
        id: s.id,
        title: s.title,
        documentType: d.kind,
        documentTypeLabel: KIND_LABELS[d.kind],
        createdAt: s.createdAt,
        accessUntil: s.access.accessUntil,
        remainingDays: s.access.remainingDays,
        locked: s.access.locked,
      };
    });

    const open = rows.filter((r) => !r.locked);
    const closing = open.filter((r) => (r.remainingDays ?? 99) <= CLOSING_DAYS);
    const urgent = open.filter((r) => (r.remainingDays ?? 99) <= URGENT_DAYS);
    const locked = rows.filter((r) => r.locked);
    const atRisk = closing.length + locked.length;

    const headline =
      locked.length > 0 && closing.length > 0
        ? `${closing.length} file${closing.length === 1 ? "" : "s"} closing soon · ${locked.length} locked`
        : locked.length > 0
          ? `${locked.length} file${locked.length === 1 ? " is" : "s are"} locked`
          : `${closing.length} file${closing.length === 1 ? " is" : "s are"} closing soon`;

    return ok({
      plan,
      retentionDays: SILVER_RETENTION_DAYS,
      showWarning: plan === "silver" && atRisk > 0,
      headline,
      message:
        "On Silver, each PDF stays open for 30 days from creation. Download copies now, or upgrade to keep every file open.",
      expiringSoonCount: closing.length,
      urgentCount: urgent.length,
      lockedCount: locked.length,
      totalAtRiskCount: atRisk,
      samples: [
        ...closing.sort((a, b) => (a.remainingDays ?? 999) - (b.remainingDays ?? 999)),
        ...locked.sort((a, b) => new Date(b.accessUntil ?? 0).getTime() - new Date(a.accessUntil ?? 0).getTime()),
      ].slice(0, 40),
      openCount: open.length,
      totalCount: rows.length,
    });
  } catch (error) {
    console.error("[GET /api/agent/document-access]", error);
    return fail("We could not load your file access status. Please try again.", 500);
  }
}
