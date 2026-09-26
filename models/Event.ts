import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITicketTier {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  description?: string;
}

export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  category: string;
  status: "draft" | "published" | "ongoing" | "completed" | "cancelled";
  startDate: Date;
  endDate: Date;
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode?: string;
  };
  coverImage?: string;
  organizerId: mongoose.Types.ObjectId;
  ticketTiers: ITicketTier[];
  totalCapacity: number;
  totalRegistrations: number;
  totalCheckedIn: number;
  requiresPayment: boolean;
  certificateEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TicketTierSchema = new Schema<ITicketTier>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    sold: { type: Number, default: 0 },
    description: { type: String },
  },
  { _id: false }
);

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    category: {
      type: String,
      enum: [
        "conference",
        "workshop",
        "meetup",
        "sports",
        "concert",
        "exhibition",
        "corporate",
        "other",
      ],
      default: "other",
    },
    status: {
      type: String,
      enum: ["draft", "published", "ongoing", "completed", "cancelled"],
      default: "draft",
      index: true,
    },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    venue: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String },
    },
    coverImage: { type: String },
    organizerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ticketTiers: { type: [TicketTierSchema], default: [] },
    totalCapacity: { type: Number, required: true, min: 1 },
    totalRegistrations: { type: Number, default: 0 },
    totalCheckedIn: { type: Number, default: 0 },
    requiresPayment: { type: Boolean, default: false },
    certificateEnabled: { type: Boolean, default: false },
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

// Compound index for organizer + status queries
EventSchema.index({ organizerId: 1, status: 1 });
EventSchema.index({ organizerId: 1, startDate: -1 });

const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

export default Event;
