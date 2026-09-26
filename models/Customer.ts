import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICustomer extends Document {
  agentId: Types.ObjectId;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  gstTreatment?: string;
  gstin?: string;
  placeOfSupply?: string;
  pan?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const str = { type: String, trim: true };

const CustomerSchema = new Schema<ICustomer>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    company: str,
    email: str,
    phone: str,
    gstTreatment: str,
    gstin: str,
    placeOfSupply: str,
    pan: str,
    address: str,
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production" && mongoose.models.Customer) {
  mongoose.deleteModel("Customer");
}

const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);

export default Customer;
