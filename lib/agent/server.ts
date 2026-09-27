import { NextResponse } from "next/server";
import { getSession, passwordVersion } from "@/lib/auth/jwt";
import { documentExists, findUserWithPassword, updateUser, type DocRecord, type UserRecord } from "@/lib/db/repo";
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

type Guarded = { user: UserRecord; response?: never } | { user?: never; response: NextResponse };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string) => UUID_RE.test(v);

/** Resolve the signed-in agent or produce the 401/404 response to return. */
export async function requireAgent(): Promise<Guarded> {
  const session = await getSession();
  if (!session) return { response: fail("Your session expired. Please sign in again.", 401, "UNAUTHORIZED") };
  // Sessions issued before the Supabase move carry MongoDB ids — treat them as signed out.
  if (!isUuid(session.userId)) return { response: fail("Your session expired. Please sign in again.", 401, "UNAUTHORIZED") };
  const withHash = await findUserWithPassword({ id: session.userId });
  if (!withHash) return { response: fail("Account not found.", 404, "ACCOUNT_NOT_FOUND") };
  // A password change or reset invalidates every session issued before it.
  const { passwordHash, ...user } = withHash;
  if (!session.pv || session.pv !== passwordVersion(passwordHash))
    return { response: fail("Your session expired. Please sign in again.", 401, "UNAUTHORIZED") };
  if (user.status === "SUSPENDED")
    return { response: fail("Your account is suspended. Please contact support.", 403, "SUSPENDED") };
  return { user };
}

export function serializeAgent(u: UserRecord): Agent {
  const s = u.documentNumberSettings;
  return {
    id: u.id,
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
    documentNumberSettings: {
      invoicePrefix: s?.invoicePrefix ?? "INV-",
      proformaPrefix: s?.proformaPrefix ?? "PI-",
      receiptPrefix: s?.receiptPrefix ?? "RCPT-",
      digits: s?.digits ?? 4,
    },
    createdAt: u.createdAt?.toISOString(),
  };
}

/**
 * Recompute Verified + Active after a profile or document change.
 * Active = the four activation fields are filled AND at least one document exists.
 * Returns the (possibly updated) user.
 */
export async function refreshAgentState(user: UserRecord): Promise<UserRecord> {
  if (user.status === "SUSPENDED") return user;
  const plain = serializeAgent(user);
  const verified = computeAutoVerified(plain);
  const status =
    missingActivationFields(plain).length === 0 && (await documentExists(user.id)) ? "ACTIVE" : "INACTIVE";
  if (verified !== user.isVerified || status !== user.status) {
    return updateUser(user.id, { isVerified: verified, status });
  }
  return user;
}

export function summarizeDocument(d: DocRecord, user: UserRecord): DocumentSummary {
  return {
    id: d.id,
    kind: d.kind,
    title: d.title,
    subtitle: d.subtitle,
    number: d.number,
    groupKey: d.groupKey,
    version: d.version ?? 1,
    status: d.status,
    hasStoredPdf: !!d.pdfGeneratedAt,
    currency: d.currency,
    total: d.total == null ? undefined : Number(d.total),
    paidAmount: d.paidAmount == null ? undefined : Number(d.paidAmount),
    parentId: d.parentId,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    access: documentAccess(effectivePlan(user), d.createdAt),
  };
}

/** Accept only image data URLs under a size cap (base64 length ≈ 1.37× bytes). */
export function validImageDataUrl(v: unknown, maxBytes = 1.5 * 1024 * 1024): v is string {
  return (
    typeof v === "string" &&
    /^data:image\/(png|jpe?g|webp|gif);base64,/.test(v) &&
    v.length <= maxBytes * 1.4
  );
}
