import { NextRequest } from "next/server";
import { requireAgent, serializeAgent, summarizeDocument, isUuid, fail } from "@/lib/agent/server";
import { effectivePlan } from "@/lib/agent/plans";
import { lockedDocument } from "@/lib/agent/entitlements";
import { canDownloadStatus, DOWNLOAD_BLOCKED_MESSAGE, type VerificationStatus } from "@/lib/agent/verification-shared";
import { renderDocumentPdf, pdfFileName } from "@/lib/pdf/render";
import { getDocument, updateDocument } from "@/lib/db/repo";

type Ctx = { params: Promise<{ id: string }> };

/** Stream a document's PDF. ?download=1 forces a file download. */
export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const { user, response } = await requireAgent();
    if (response) return response;
    if (!isUuid(id)) return fail("Document not found.", 404);
    const doc = await getDocument(user.id, id);
    if (!doc) return fail("Document not found.", 404);

    const access = summarizeDocument(doc, user).access;
    if (access.locked) {
      const lock = lockedDocument(access, doc.kind);
      return fail(lock.message, lock.status, lock.code);
    }
    if (!canDownloadStatus(user.verificationStatus as VerificationStatus | undefined))
      return fail(DOWNLOAD_BLOCKED_MESSAGE, 403, "VERIFICATION_REQUIRED");

    const bytes = await renderDocumentPdf(doc.kind, doc.data, serializeAgent(user), effectivePlan(user), {
      paidAmount: Number(doc.paidAmount ?? 0),
    });
    if (!bytes) return fail("This document is rendered in your browser.", 400, "CLIENT_RENDERED");

    if (!doc.pdfGeneratedAt) await updateDocument(user.id, doc.id, { pdfGeneratedAt: new Date() });

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
