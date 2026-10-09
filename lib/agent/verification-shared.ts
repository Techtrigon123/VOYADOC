/**
 * Profile verification rules shared by the server and the screens (no server-only imports).
 * Workflow: the agent completes their profile → a sub-admin checks it → a master admin approves or
 * denies it (Vouchlio Admin portal). See supabase/migrations/0007_profile_verification.sql.
 */

export type VerificationStatus = "not_submitted" | "pending" | "checked" | "approved" | "changes_pending" | "changes_checked" | "denied";

export interface VerificationInfo {
  status: VerificationStatus;
  /** Denial reason (shown to the agent when denied). */
  note: string | null;
  /** Details changed since approval that are being reviewed. */
  changes: string[];
}

/** Profile details that need review — any change after approval is reviewed again. */
export const VERIFIED_FIELDS = {
  name: "Contact name",
  companyName: "Company name",
  brandName: "Brand name",
  brandLogo: "Brand logo",
  companyStamp: "Company stamp",
  gstNumber: "GSTIN",
  iataNumber: "IATA number",
  address: "Address",
  city: "City",
  state: "State",
  pincode: "PIN code",
  mobile: "Mobile number",
  landlineNumber: "Landline",
  bankAccountHolder: "Bank account holder",
  bankName: "Bank name",
  bankAccountNumber: "Bank account number",
  bankIfscCode: "IFSC code",
  bankBranchAddress: "Bank branch",
  paymentUpi: "UPI ID",
  partnerType: "Business type",
  partnerTypeOther: "Business type (other)",
} as const;

export type VerifiedField = keyof typeof VERIFIED_FIELDS;

/** Approved agents — including approved agents whose later edits are being reviewed — may download PDFs. */
export function canDownloadStatus(status: VerificationStatus | undefined): boolean {
  return status === undefined || status === "approved" || status === "changes_pending" || status === "changes_checked";
}

export const isVerifiedStatus = (s: VerificationStatus | undefined) => s === "approved" || s === "changes_pending" || s === "changes_checked";

export function verificationLabel(s: VerificationStatus | undefined): string {
  switch (s) {
    case "pending":
    case "checked":
      return "Under review";
    case "approved":
      return "Verified";
    case "changes_pending":
    case "changes_checked":
      return "Verified · changes in review";
    case "denied":
      return "Not approved";
    default:
      return "Not submitted";
  }
}

export const DOWNLOAD_BLOCKED_MESSAGE =
  "Downloads unlock once our team approves your profile details. You can keep creating and saving documents meanwhile.";
