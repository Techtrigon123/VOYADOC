import mongoose, { Schema, Document, Model, Types } from "mongoose";

export const DOCUMENT_KINDS = [
  "hotel_voucher",
  "air_ticket",
  "pickup_voucher",
  "welcome_placard",
  "invoice",
  "proforma",
  "receipt",
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export interface IAgentDocument extends Document {
  agentId: Types.ObjectId;
  kind: DocumentKind;
  title: string;
  subtitle?: string;
  /** HCN, booking ref, invoice number, voucher number… */
  number?: string;
  /** Groups versions of the same document (hotel voucher HCN, placard series). */
  groupKey?: string;
  version: number;
  status?: string;
  data: Record<string, unknown>;
  /** Set once a PDF has been generated — documents without it are drafts. */
  pdfGeneratedAt?: Date;
  /** Invoice-family money fields, denormalised for lists, payments and export. */
  currency?: string;
  total?: number;
  paidAmount?: number;
  /** Receipt → the invoice/proforma it pays against. */
  parentId?: Types.ObjectId;
  searchText: string;
  createdAt: Date;
  updatedAt: Date;
}

const AgentDocumentSchema = new Schema<IAgentDocument>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: DOCUMENT_KINDS, required: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    number: { type: String, trim: true },
    groupKey: { type: String, trim: true },
    version: { type: Number, default: 1 },
    status: { type: String },
    data: { type: Schema.Types.Mixed, default: {} },
    pdfGeneratedAt: { type: Date },
    currency: { type: String },
    total: { type: Number },
    paidAmount: { type: Number, default: 0 },
    parentId: { type: Schema.Types.ObjectId, ref: "AgentDocument" },
    searchText: { type: String, default: "" },
  },
  { timestamps: true, minimize: false }
);

AgentDocumentSchema.index({ agentId: 1, kind: 1, createdAt: -1 });
AgentDocumentSchema.index({ agentId: 1, kind: 1, number: 1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.AgentDocument) {
  mongoose.deleteModel("AgentDocument");
}

const AgentDocument: Model<IAgentDocument> =
  mongoose.models.AgentDocument ||
  mongoose.model<IAgentDocument>("AgentDocument", AgentDocumentSchema);

export default AgentDocument;
