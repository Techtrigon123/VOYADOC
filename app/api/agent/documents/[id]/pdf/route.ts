import { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import AgentDocument from "@/models/AgentDocument";
import { requireAgent, serializeAgent, summarizeDocument, fail } from "@/lib/agent/server";
import { effectivePlan } from "@/lib/agent/plans";
import { renderDocumentPdf, pdfFileName } from "@/lib/pdf/render";

type Ctx = { params: Promise<{ id: string }> };

/** Stream a document's PDF. ?download=1 forces a file download. */
export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const { user, response } = await requireAgent();
    if (response) return response;
    if (!isValidObjectId(id)) return fail("Document not found.", 404);
    const doc = await AgentDocument.findOne({ _id: id, agentId: user._id });
    if (!doc) return fail("Document not found.", 404);

    if (summarizeDocument(doc, user).access.locked)
      return fail("This PDF is locked on your plan. Upgrade to Gold or Platinum to open it again.", 403, "HISTORY_LOCKED");

    const bytes = await renderDocumentPdf(doc.kind, doc.data, serializeAgent(user), effectivePlan(user), {
      paidAmount: doc.paidAmount,
    });
    if (!bytes) return fail("This document is rendered in your browser.", 400, "CLIENT_RENDERED");

    if (!doc.pdfGeneratedAt) {
      doc.pdfGeneratedAt = new Date();
      await doc.save();
    }
    const name = pdfFileName(doc.kind, doc.number, doc.title);
    const disposition = req.nextUrl.searchParams.get("download") ? "attachment" : "inline";
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${name}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[GET /api/agent/documents/:id/pdf]", error);
    return fail("Could not generate PDF. Please try again.", 500);
  }
}
