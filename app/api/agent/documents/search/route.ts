import { NextRequest } from "next/server";
import { requireAgent, ok, fail } from "@/lib/agent/server";
import { searchDocuments } from "@/lib/db/repo";

/** Header search palette: vouchers, tickets, invoices… by number, guest or hotel. */
export async function GET(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;

    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    if (q.length < 2) return ok({ items: [] });

    const docs = await searchDocuments(user.id, q, 20);
    return ok({
      items: docs.map((d) => ({
        id: d.id,
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
