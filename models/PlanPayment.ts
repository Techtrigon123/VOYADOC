import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPlanPayment extends Document {
  agentId: Types.ObjectId;
  planId: "gold" | "platinum";
  amountInr: number;
  paymentTransactionId: string;
  /** Screenshot or PDF proof as a data URL. */
  proof: string;
  proofType: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const PlanPaymentSchema = new Schema<IPlanPayment>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    planId: { type: String, enum: ["gold", "platinum"], required: true },
    amountInr: { type: Number, required: true },
    paymentTransactionId: { type: String, required: true, trim: true },
    proof: { type: String, required: true },
    proofType: { type: String, default: "image/png" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production" && mongoose.models.PlanPayment) {
  mongoose.deleteModel("PlanPayment");
}

const PlanPayment: Model<IPlanPayment> =
  mongoose.models.PlanPayment || mongoose.model<IPlanPayment>("PlanPayment", PlanPaymentSchema);

export default PlanPayment;
