import mongoose, { Schema, Document, Model } from "mongoose";

export type PartnerType = "travel_agent" | "tour_operator" | "dmc" | "hotel" | "other";
export type AgentStatus = "INACTIVE" | "ACTIVE" | "SUSPENDED";
export type SubscriptionPlan = "silver" | "gold" | "platinum";

export interface IDocumentNumberSettings {
  invoicePrefix: string;
  proformaPrefix: string;
  receiptPrefix: string;
  digits: number;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  organization?: string;
  role: "owner" | "admin" | "staff";
  resetToken?: string;
  resetTokenExpiry?: Date;

  // Agent profile
  mobile?: string;
  landlineNumber?: string;
  brandName?: string;
  companyName?: string;
  partnerType?: PartnerType;
  partnerTypeOther?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  gstNumber?: string;
  iataNumber?: string;
  brandLogo?: string;
  companyStamp?: string;
  bankAccountHolder?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankBranchAddress?: string;
  paymentUpi?: string;

  // Account state
  status: AgentStatus;
  isVerified: boolean;
  agentLevel?: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt?: Date;

  // Feature flags
  airTicketingEnabled: boolean;
  travelServiceVoucherEnabled: boolean;
  welcomePlacardEnabled: boolean;

  documentNumberSettings?: IDocumentNumberSettings;

  // Upload auto-fill usage
  extractUsage?: {
    day: string;
    voucher: number;
    airTicket: number;
    yearStart?: Date;
    yearTotal: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

const str = { type: String, trim: true };

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    organization: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "staff"],
      default: "owner",
    },
    resetToken: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false },

    mobile: str,
    landlineNumber: str,
    brandName: str,
    companyName: str,
    partnerType: {
      type: String,
      enum: ["travel_agent", "tour_operator", "dmc", "hotel", "other"],
    },
    partnerTypeOther: str,
    address: str,
    city: str,
    state: str,
    country: { type: String, trim: true, default: "India" },
    pincode: str,
    gstNumber: str,
    iataNumber: str,
    brandLogo: { type: String },
    companyStamp: { type: String },
    bankAccountHolder: str,
    bankName: str,
    bankAccountNumber: str,
    bankIfscCode: str,
    bankBranchAddress: str,
    paymentUpi: str,

    status: {
      type: String,
      enum: ["INACTIVE", "ACTIVE", "SUSPENDED"],
      default: "INACTIVE",
    },
    isVerified: { type: Boolean, default: false },
    agentLevel: { type: String, default: "Normal" },
    subscriptionPlan: {
      type: String,
      enum: ["silver", "gold", "platinum"],
      default: "silver",
    },
    subscriptionExpiresAt: { type: Date },

    airTicketingEnabled: { type: Boolean, default: true },
    travelServiceVoucherEnabled: { type: Boolean, default: true },
    welcomePlacardEnabled: { type: Boolean, default: true },

    documentNumberSettings: {
      invoicePrefix: { type: String, default: "INV-" },
      proformaPrefix: { type: String, default: "PI-" },
      receiptPrefix: { type: String, default: "RCPT-" },
      digits: { type: Number, default: 4 },
    },

    extractUsage: {
      day: { type: String, default: "" },
      voucher: { type: Number, default: 0 },
      airTicket: { type: Number, default: 0 },
      yearStart: { type: Date },
      yearTotal: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: Record<string, unknown>) => {
        delete (ret as { password?: unknown }).password;
        delete (ret as { resetToken?: unknown }).resetToken;
        delete (ret as { resetTokenExpiry?: unknown }).resetTokenExpiry;
        ret["id"] = ret["_id"];
        return ret;
      },
    },
  }
);

// In dev, hot reload keeps the old compiled model; drop it so schema changes apply.
if (process.env.NODE_ENV !== "production" && mongoose.models.User) {
  mongoose.deleteModel("User");
}

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
