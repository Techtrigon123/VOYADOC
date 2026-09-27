import { NextRequest } from "next/server";
import {
  requireAgent,
  refreshAgentState,
  summarizeDocument,
  serializeAgent,
  isUuid,
  ok,
  fail,
} from "@/lib/agent/server";
import { describeDocument, validateDocument } from "@/lib/agent/documents";
import {
  createDocument,
  deleteDocument,
  documentExists,
  getDocument,
  latestVersionInGroup,
  updateDocument,
} from "@/lib/db/repo";

type Ctx = { params: Promise<{ id: string }> };

const LOCKED_MESSAGE =
  "Locked — Silver keeps documents open for 30 days from creation. Upgrade to Gold or Platinum to open this again.";

async function load(id: string) {
  const { user, response } = await requireAgent();
  if (response) return { response };
  if (!isUuid(id)) return { response: fail("Document not found.", 404) };
  const doc = await getDocument(user.id, id);
  if (!doc) return { response: fail("Document not found.", 404) };
  return { user, doc };
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const { user, doc, response } = await load(id);
    if (response) return response;
    const summary = summarizeDocument(doc, user);
    if (summary.access.locked) return fail(LOCKED_MESSAGE, 403, "HISTORY_LOCKED");
    return ok({ document: summary, data: doc.data });
  } catch (error) {
    console.error("[GET /api/agent/documents/:id]", error);
    return fail("Could not open this document. Try again.", 500);
  }
}

/**
 * Update a document. Body: { data?, generatePdf?, asNewVersion? }.
 * `asNewVersion` keeps the old row (and its PDF) and saves a new version in the same group.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const { user, doc, response } = await load(id);
    if (response) return response;
    if (summarizeDocument(doc, user).access.locked) return fail(LOCKED_MESSAGE, 403, "HISTORY_LOCKED");

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return fail("Invalid request body.");

    const agent = serializeAgent(user);
    const data = (body.data && typeof body.data === "object" ? body.data : doc.data) as Record<string, unknown>;
    if (body.data) {
      const companyName = doc.kind === "welcome_placard" ? agent.brandName || agent.companyName : agent.companyName;
      const invalid = validateDocument(doc.kind, data, companyName, agent.state);
      if (invalid) return fail(invalid, 422, "VALIDATION");
    }
    const desc = describeDocument(doc.kind, data, agent.state);

    if (desc.number && desc.number !== doc.number && ["invoice", "proforma", "receipt"].includes(doc.kind)) {
      if (await documentExists(user.id, { kind: doc.kind, number: desc.number, excludeId: doc.id }))
        return fail("This document number is already used. Choose another.", 409, "DUPLICATE_NUMBER");
    }

    if (body.asNewVersion) {
      const groupKey = doc.groupKey || doc.id;
      const created = await createDocument({
        agentId: user.id,
        kind: doc.kind,
        ...desc,
        groupKey,
        version: (await latestVersionInGroup(user.id, groupKey)) + 1,
        data,
        pdfGeneratedAt: body.generatePdf ? new Date() : undefined,
      });
      const fresh = await refreshAgentState(user);
      return ok({ document: summarizeDocument(created, fresh), data: created.data });
    }

    const updated = await updateDocument(user.id, doc.id, {
      ...desc,
      data,
      // Keep the group of an existing voucher stable even if the HCN is edited.
      groupKey: doc.groupKey || desc.groupKey || doc.id,
      ...(body.generatePdf ? { pdfGeneratedAt: new Date() } : {}),
    });
    const fresh = await refreshAgentState(user);
    return ok({ document: summarizeDocument(updated, fresh), data: updated.data });
  } catch (error) {
    console.error("[PATCH /api/agent/documents/:id]", error);
    return fail("Could not save. Please try again.", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const { user, doc, response } = await load(id);
    if (response) return response;
    await deleteDocument(user.id, doc.id);
    // Payments recorded against an invoice go with it.
    if (doc.kind === "receipt" && doc.parentId) {
      const parent = await getDocument(user.id, doc.parentId);
      if (parent) {
        await updateDocument(user.id, parent.id, {
          paidAmount: Math.max(0, Number(parent.paidAmount ?? 0) - Number(doc.total ?? 0)),
        });
      }
    }
    await refreshAgentState(user);
    return ok(true);
  } catch (error) {
    console.error("[DELETE /api/agent/documents/:id]", error);
    return fail("Could not delete. Try again.", 500);
  }
}
