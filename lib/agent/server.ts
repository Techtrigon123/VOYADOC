import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/jwt";
import User, { type IUser } from "@/models/User";
import AgentDocument, { type IAgentDocument } from "@/models/AgentDocument";
import type { Agent, DocumentSummary } from "./types";
import { computeAutoVerified, missingActivationFields } from "./profile";
import { documentAccess, effectivePlan } from "./plans";

export function ok<T>(data: T, init?: { status?: number; message?: string }) {
  return NextResponse.json(
    { success: true, data, ...(init?.message ? { message: init.message } : {}) },
    { status: init?.status ?? 200 }
  );
}

export function fail(message: string, status = 400, code?: string) {
  return NextResponse.json({ success: false, error: { message, code } }, { status });
}

type Guarded = { user: IUser; response?: never } | { user?: never; response: NextResponse };

/** Resolve the signed-in agent or produce the 401/404 response to return. */
export async function requireAgent(): Promise<Guarded> {
  const session = await getSession();
  if (!session) return { response: fail("Your session expired. Please sign in again.", 401, "UNAUTHORIZED") };
  await connectDB();
  const user = await User.findById(session.userId);
  if (!user) return { response: fail("Account not found.", 404, "ACCOUNT_NOT_FOUND") };
  if (user.status === "SUSPENDED")
    return { response: fail("Your account is suspended. Please contact support.", 403, "SUSPENDED") };
  return { user };
}

export function serializeAgent(u: IUser): Agent {
  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    mobile: u.mobile,
    landlineNumber: u.landlineNumber,
    brandName: u.brandName,
    companyName: u.companyName ?? u.organization,
    partnerType: u.partnerType,
    partnerTypeOther: u.partnerTypeOther,
    address: u.address,
    city: u.city,
    state: u.state,
    country: u.country,
    pincode: u.pincode,
    gstNumber: u.gstNumber,
    iataNumber: u.iataNumber,
    brandLogo: u.brandLogo,
    companyStamp: u.companyStamp,
    bankAccountHolder: u.bankAccountHolder,
    bankName: u.bankName,
    bankAccountNumber: u.bankAccountNumber,
    bankIfscCode: u.bankIfscCode,
    bankBranchAddress: u.bankBranchAddress,
    paymentUpi: u.paymentUpi,
    status: u.status ?? "INACTIVE",
    isVerified: !!u.isVerified,
    agentLevel: u.agentLevel,
    subscriptionPlan: effectivePlan(u),
    subscriptionExpiresAt: u.subscriptionExpiresAt?.toISOString(),
    airTicketingEnabled: u.airTicketingEnabled !== false,
    travelServiceVoucherEnabled: u.travelServiceVoucherEnabled !== false,
    welcomePlacardEnabled: u.welcomePlacardEnabled !== false,
    documentNumberSettings: u.documentNumberSettings
      ? {
          invoicePrefix: u.documentNumberSettings.invoicePrefix ?? "INV-",
          proformaPrefix: u.documentNumberSettings.proformaPrefix ?? "PI-",
          receiptPrefix: u.documentNumberSettings.receiptPrefix ?? "RCPT-",
          digits: u.documentNumberSettings.digits ?? 4,
        }
      : undefined,
    createdAt: u.createdAt?.toISOString(),
  };
}

/**
 * Recompute Verified + Active after a profile or document change.
 * Active = the four activation fields are filled AND at least one document exists.
 */
export async function refreshAgentState(user: IUser): Promise<IUser> {
  if (user.status === "SUSPENDED") return user;
  const plain = serializeAgent(user);
  const verified = computeAutoVerified(plain);
  let status = user.status ?? "INACTIVE";
  if (missingActivationFields(plain).length === 0) {
    const hasDoc = await AgentDocument.exists({ agentId: user._id });
    status = hasDoc ? "ACTIVE" : "INACTIVE";
  } else {
    status = "INACTIVE";
  }
  if (verified !== user.isVerified || status !== user.status) {
    user.isVerified = verified;
    user.status = status;
    await user.save();
  }
  return user;
}

export function summarizeDocument(d: IAgentDocument, user: IUser): DocumentSummary {
  return {
    id: d._id.toString(),
    kind: d.kind,
    title: d.title,
    subtitle: d.subtitle,
    number: d.number,
    groupKey: d.groupKey,
    version: d.version ?? 1,
    status: d.status,
    hasStoredPdf: !!d.pdfGeneratedAt,
    currency: d.currency,
    total: d.total,
    paidAmount: d.paidAmount,
    parentId: d.parentId?.toString(),
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    access: documentAccess(effectivePlan(user), d.createdAt),
  };
}

export function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Accept only image data URLs under a size cap (base64 length ≈ 1.37× bytes). */
export function validImageDataUrl(v: unknown, maxBytes = 1.5 * 1024 * 1024): v is string {
  return (
    typeof v === "string" &&
    /^data:image\/(png|jpe?g|webp|gif);base64,/.test(v) &&
    v.length <= maxBytes * 1.4
  );
}
