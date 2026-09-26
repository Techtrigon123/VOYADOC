import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISupportMessage extends Document {
  agentId: Types.ObjectId;
  from: "agent" | "support";
  body: string;
  createdAt: Date;
}

const SupportMessageSchema = new Schema<ISupportMessage>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    from: { type: String, enum: ["agent", "support"], required: true },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production" && mongoose.models.SupportMessage) {
  mongoose.deleteModel("SupportMessage");
}

const SupportMessage: Model<ISupportMessage> =
  mongoose.models.SupportMessage ||
  mongoose.model<ISupportMessage>("SupportMessage", SupportMessageSchema);

export default SupportMessage;
