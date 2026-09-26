import { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import AgentDocument from "@/models/AgentDocument";
import { requireAgent, refreshAgentState, summarizeDocument, serializeAgent, ok, fail } from "@/lib/agent/server";
import {
  describeDocument,
  paymentReferenceRule,
  INVOICE_LABELS,
  type InvoiceData,
  type InvoiceKind,
} from "@/lib/agent/documents";

type Ctx = { params: Promise<{ id: string }> };

async function loadParent(id: string) {
  const { user, response } = await requireAgent();
  if (response) return { response };
  if (!isValidObjectId(id)) return { response: fail("Could not open this document.", 404) };
  const doc = await AgentDocument.findOne({ _id: id, agentId: user._id });
  if (!doc) return { response: fail("Could not open this document.", 404) };
  if (doc.kind !== "invoice" && doc.kind !== "proforma")
    return { response: fail("This document cannot receive a payment from here.") };
  return { user, doc };
}

/** Payment history for an invoice / proforma. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const { user, doc, response } = await loadParent(id);
    if (response) return response;
    const receipts = await AgentDocument.find({ agentId: user._id, parentId: doc._id }).sort({ createdAt: 1 }).select("-data");
    const total = doc.total ?? 0;
    const paid = doc.paidAmount ?? 0;
    return ok({
      document: summarizeDocument(doc, user),
      total,
      paid,
      balanceDue: Math.max(0, Math.round((total - paid) * 100) / 100),
      payments: receipts.map((r) => summarizeDocument(r, user)),
    });
  } catch (error) {
    console.error("[GET payments]", error);
    return fail("Could not open this document. Try again.", 500);
  }
}

/** Record a payment: creates a receipt linked to the invoice and updates its balance. */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const { user, doc, response } = await loadParent(id);
    if (response) return response;

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const date = String(body?.date ?? "");
    const mode = String(body?.mode ?? "");
    const amount = Number(body?.amount);
    const reference = String(body?.reference ?? "").trim();
    const note = String(body?.note ?? "").trim();
    const number = String(body?.receiptNumber ?? "").trim();

    if (!date) return fail("Choose a payment date.");
    if (!mode) return fail("Choose a payment mode.");
    if (!Number.isFinite(amount) || amount <= 0) return fail("Enter an amount greater than zero.");
    const rule = paymentReferenceRule(mode);
    if (rule?.required && !reference) return fail("Enter the payment reference.");

    const balance = Math.round(((doc.total ?? 0) - (doc.paidAmount ?? 0)) * 100) / 100;
    if (balance <= 0) return fail("This document is already fully paid.");
    if (amount > balance + 0.001) return fail(`Enter up to ${doc.currency ?? "INR"} ${balance.toFixed(2)} (balance due).`);
    if (!number) return fail("Enter a receipt number.");
    if (await AgentDocument.exists({ agentId: user._id, kind: "receipt", number }))
      return fail("This receipt number is already used. Choose another.", 409, "DUPLICATE_NUMBER");

    const parent = doc.data as unknown as InvoiceData;
    const parentKind = doc.kind as InvoiceKind;
    const label = INVOICE_LABELS[parentKind].title;
    const lines = [`Payment against ${label} ${doc.number}.`, `Payment mode: ${mode}.`];
    if (reference) lines.push(`Reference: ${reference}.`);
    if (note) lines.push(note);

    const data: InvoiceData = {
      docType: "receipt",
      number,
      orderNumber: parent.orderNumber ?? "",
      date,
      customerId: parent.customerId ?? "",
      billTo: parent.billTo,
      showCustomerGst: parent.showCustomerGst,
      items: [{ description: `Payment received — ${label} ${doc.number}`, qty: "1", rate: String(amount), tax: "OUT_OF_SCOPE" }],
      notes: lines.join("\n"),
      terms: "",
      currency: doc.currency ?? "INR",
      roundOff: "",
      payment: { mode, reference, againstId: doc._id.toString(), againstNumber: doc.number ?? "", againstType: parentKind },
    };

    const agent = serializeAgent(user);
    const receipt = await AgentDocument.create({
      agentId: user._id,
      kind: "receipt",
      ...describeDocument("receipt", data as unknown as Record<string, unknown>, agent.state),
      version: 1,
      data: data as unknown as Record<string, unknown>,
      parentId: doc._id,
      pdfGeneratedAt: new Date(),
    });
    receipt.groupKey = receipt._id.toString();
    await receipt.save();

    doc.paidAmount = Math.round(((doc.paidAmount ?? 0) + amount) * 100) / 100;
    await doc.save();
    await refreshAgentState(user);

    return ok({ receipt: summarizeDocument(receipt, user), paid: doc.paidAmount, balanceDue: Math.max(0, (doc.total ?? 0) - doc.paidAmount) }, { status: 201 });
  } catch (error) {
    console.error("[POST payments]", error);
    return fail("Could not save this payment. Try again.", 500);
  }
}
