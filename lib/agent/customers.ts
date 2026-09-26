import type { ICustomer } from "@/models/Customer";

export const CUSTOMER_FIELDS = [
  "name", "company", "email", "phone", "gstTreatment", "gstin", "placeOfSupply", "pan", "address",
] as const;

export function serializeCustomer(c: ICustomer) {
  return {
    id: c._id.toString(),
    name: c.name,
    company: c.company ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    gstTreatment: c.gstTreatment ?? "consumer",
    gstin: c.gstin ?? "",
    placeOfSupply: c.placeOfSupply ?? "",
    pan: c.pan ?? "",
    address: c.address ?? "",
    updatedAt: c.updatedAt.toISOString(),
  };
}

export function pickCustomer(body: Record<string, unknown>) {
  const out: Record<string, string> = {};
  for (const k of CUSTOMER_FIELDS) if (k in body) out[k] = String(body[k] ?? "").trim().slice(0, 500);
  return out;
}
