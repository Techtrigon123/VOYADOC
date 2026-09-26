import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAttendee extends Document {
  eventId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  ticketTierId?: string;
  ticketTierName?: string;
  registrationId: string;
  qrCode: string;
  status: "registered" | "confirmed" | "checked_in" | "cancelled";
  checkedInAt?: Date;
  checkedInBy?: mongoose.Types.ObjectId;
  paymentId?: mongoose.Types.ObjectId;
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  amountPaid?: number;
  certificateUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendeeSchema = new Schema<IAttendee>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    organization: { type: String, trim: true },
    ticketTierId: { type: String },
    ticketTierName: { type: String },
    registrationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    qrCode: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["registered", "confirmed", "checked_in", "cancelled"],
      default: "registered",
      index: true,
    },
    checkedInAt: { type: Date },
    checkedInBy: { type: Schema.Types.ObjectId, ref: "User" },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
    },
    amountPaid: { type: Number },
    certificateUrl: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: Record<string, unknown>) => {
        ret["id"] = ret["_id"];
        return ret;
      },
    },
  }
);

// Compound indexes
AttendeeSchema.index({ eventId: 1, email: 1 }, { unique: true });
AttendeeSchema.index({ eventId: 1, status: 1 });
AttendeeSchema.index({ eventId: 1, name: "text", email: "text" });

const Attendee: Model<IAttendee> =
  mongoose.models.Attendee ||
  mongoose.model<IAttendee>("Attendee", AttendeeSchema);

export default Attendee;
