import { NextRequest } from "next/server";
import AgentDocument from "@/models/AgentDocument";
import { requireAgent, escapeRegex, ok, fail } from "@/lib/agent/server";

/** Header search palette: vouchers, tickets, invoices… by number, guest or hotel. */
export async function GET(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;

    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    if (q.length < 2) return ok({ items: [] });

    const re = new RegExp(escapeRegex(q), "i");
    const docs = await AgentDocument.find({
      agentId: user._id,
      $or: [{ title: re }, { number: re }, { subtitle: re }, { searchText: re }],
    })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select("kind title subtitle number groupKey pdfGeneratedAt");

    return ok({
      items: docs.map((d) => ({
        id: d._id.toString(),
        kind: d.kind,
        title: d.title,
        subtitle: d.subtitle,
        number: d.number,
        hasStoredPdf: !!d.pdfGeneratedAt,
      })),
    });
  } catch (error) {
    console.error("[GET /api/agent/documents/search]", error);
    return fail("Could not search. Try again.", 500);
  }
}
