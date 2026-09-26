import { NextRequest } from "next/server";
import AgentDocument, { DOCUMENT_KINDS, type DocumentKind } from "@/models/AgentDocument";
import {
  requireAgent,
  refreshAgentState,
  summarizeDocument,
  escapeRegex,
  serializeAgent,
  ok,
  fail,
} from "@/lib/agent/server";
import { describeDocument, validateDocument } from "@/lib/agent/documents";
import { isFeatureEnabled } from "@/lib/agent/features";

const isKind = (k: unknown): k is DocumentKind =>
  typeof k === "string" && (DOCUMENT_KINDS as readonly string[]).includes(k);

/**
 * List saved documents.
 * ?kind=hotel_voucher (or several, comma-separated) &q=…&field=all|title|number|ref|preparedBy
 * &from=YYYY-MM-DD&to=YYYY-MM-DD&status=…
 */
export async function GET(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;

    const sp = req.nextUrl.searchParams;
    const kinds = (sp.get("kind") ?? "").split(",").filter(isKind);
    const filter: Record<string, any> = { agentId: user._id }; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (kinds.length) filter.kind = { $in: kinds };

    const q = (sp.get("q") ?? "").trim();
    if (q) {
      const re = new RegExp(escapeRegex(q), "i");
      const field = sp.get("field") ?? "all";
      if (field === "title") filter.title = re;
      else if (field === "number") filter.number = re;
      else if (field === "ref") filter["data.bookingRef"] = re;
      else if (field === "preparedBy") filter["data.preparedBy"] = re;
      else filter.$or = [{ title: re }, { number: re }, { subtitle: re }, { searchText: re }];
    }

    const status = sp.get("status");
    if (status) filter.status = status;

    const from = sp.get("from");
    const to = sp.get("to");
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00`);
      if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999`);
    }

    const docs = await AgentDocument.find(filter).sort({ createdAt: -1 }).limit(500).select("-data");
    return ok(docs.map((d) => summarizeDocument(d, user)));
  } catch (error) {
    console.error("[GET /api/agent/documents]", error);
    return fail("Could not load your documents.", 500);
  }
}

/** Create a document. Body: { kind, data, generatePdf?, groupKey?, version? } */
export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || !isKind(body.kind) || typeof body.data !== "object" || !body.data)
      return fail("Invalid request body.");

    const kind = body.kind;
    const agent = serializeAgent(user);
    if (!isFeatureEnabled(agent, kind))
      return fail("This document type is not enabled for your account.", 403, "FEATURE_DISABLED");

    const data = body.data as Record<string, unknown>;
    const companyName = kind === "welcome_placard" ? agent.brandName || agent.companyName : agent.companyName;
    const invalid = validateDocument(kind, data, companyName, agent.state);
    if (invalid) return fail(invalid, 422, "VALIDATION");

    const desc = describeDocument(kind, data, agent.state);

    if ((kind === "invoice" || kind === "proforma" || kind === "receipt") && desc.number) {
      const dup = await AgentDocument.exists({ agentId: user._id, kind, number: desc.number });
      if (dup) return fail("This document number is already used. Choose another.", 409, "DUPLICATE_NUMBER");
    }

    const doc = await AgentDocument.create({
      agentId: user._id,
      kind,
      ...desc,
      groupKey: typeof body.groupKey === "string" ? body.groupKey : desc.groupKey,
      version: typeof body.version === "number" ? body.version : 1,
      data,
      pdfGeneratedAt: body.generatePdf ? new Date() : undefined,
    });
    if (!doc.groupKey) {
      doc.groupKey = doc._id.toString();
      await doc.save();
    }

    const wasActive = user.status === "ACTIVE";
    await refreshAgentState(user);
    return ok(
      { document: summarizeDocument(doc, user), data: doc.data, becameActive: !wasActive && user.status === "ACTIVE" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/agent/documents]", error);
    return fail("Could not save. Please try again.", 500);
  }
}
