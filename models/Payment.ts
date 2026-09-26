import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  eventId: mongoose.Types.ObjectId;
  attendeeId: mongoose.Types.ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: "created" | "paid" | "failed" | "refunded";
  notes?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    attendeeId: {
      type: Schema.Types.ObjectId,
      ref: "Attendee",
      required: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    razorpayPaymentId: { type: String, index: true },
    razorpaySignature: { type: String, select: false },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created",
      index: true,
    },
    notes: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: Record<string, unknown>) => {
        delete (ret as { razorpaySignature?: unknown }).razorpaySignature;
        ret["id"] = ret["_id"];
        return ret;
      },
    },
  }
);

const Payment: Model<IPayment> =
  mongoose.models.Payment ||
  mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
