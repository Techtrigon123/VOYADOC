import type { Agent, AgentStatus, PartnerType } from "./types";

export const PARTNER_TYPES: PartnerType[] = [
  "travel_agent",
  "tour_operator",
  "dmc",
  "hotel",
  "other",
];

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  travel_agent: "Travel agent",
  tour_operator: "Tour operator",
  dmc: "DMC",
  hotel: "Hotel",
  other: "Other",
};

export function isPartnerType(v: unknown): v is PartnerType {
  return typeof v === "string" && (PARTNER_TYPES as string[]).includes(v);
}

export function partnerTypeLabel(type?: string, other?: string): string {
  if (!type) return "";
  if (!isPartnerType(type)) return type;
  if (type === "other") {
    const o = String(other ?? "").trim();
    return o ? `Other — ${o}` : PARTNER_TYPE_LABELS.other;
  }
  return PARTNER_TYPE_LABELS[type];
}

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

/** Keep digits only and strip a +91 / leading 0 so we store a bare 10-digit number. */
export function normalizeMobile(raw: string): string {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.length >= 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length > 10) d = d.slice(-10);
  return d;
}

export function isValidMobile(raw?: string): boolean {
  return normalizeMobile(raw ?? "").length === 10;
}

const filled = (v: unknown, min = 2) => String(v ?? "").trim().length >= min;

/**
 * Quick setup gate: every agent must have these before using the panel.
 * Mirrors the "Role → Profile" two-step setup.
 */
export function needsQuickSetup(a: Partial<Agent> | null | undefined): boolean {
  if (!a) return true;
  const partnerOk =
    isPartnerType(a.partnerType) &&
    (a.partnerType !== "other" || filled(a.partnerTypeOther));
  return (
    !filled(a.name) ||
    !filled(a.companyName) ||
    !partnerOk ||
    !isValidMobile(a.mobile) ||
    !String(a.state ?? "").trim() ||
    !filled(a.city)
  );
}

/* ─── Activation (5 steps: 4 profile fields + first document) ────────────── */

export type ActivationStepId = "companyName" | "brandLogo" | "address" | "mobile" | "document";

export interface ActivationStep {
  id: ActivationStepId;
  label: string;
  hint: string;
  done: boolean;
  locked: boolean;
  href: string;
  pageName: string;
  sectionName: string;
  fieldName: string;
}

/** DOM ids the activation guide scrolls to on the edit-profile page / dashboard. */
export const ACTIVATION_ANCHORS: Record<ActivationStepId, string> = {
  companyName: "agent-activation-companyName",
  brandLogo: "agent-activation-brandLogo",
  address: "agent-activation-address",
  mobile: "agent-activation-mobile",
  document: "agent-activation-documents",
};

export function missingActivationFields(a: Partial<Agent>): string[] {
  const out: string[] = [];
  if (!filled(a.companyName)) out.push("company name");
  if (!filled(a.brandLogo, 1)) out.push("brand logo");
  if (!filled(a.address)) out.push("address");
  if (!isValidMobile(a.mobile)) out.push("mobile number");
  return out;
}

export function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export const isActive = (s?: AgentStatus) => s === "ACTIVE";
export const isSuspended = (s?: AgentStatus) => s === "SUSPENDED";

export function statusLabel(s?: AgentStatus): string {
  if (s === "ACTIVE") return "Active";
  if (s === "SUSPENDED") return "Suspended";
  return "Inactive";
}

export function activationSteps(a: Partial<Agent>): ActivationStep[] {
  const profileDone = missingActivationFields(a).length === 0;
  const anchor = (id: ActivationStepId) => `/dashboard/profile/edit#${ACTIVATION_ANCHORS[id]}`;
  const profileSteps: ActivationStep[] = [
    {
      id: "companyName",
      label: "Company name",
      hint: "Your registered agency or business name",
      done: filled(a.companyName),
      locked: false,
      href: anchor("companyName"),
      pageName: "Edit profile",
      sectionName: "Business Information",
      fieldName: "Company Name",
    },
    {
      id: "brandLogo",
      label: "Brand logo",
      hint: "Upload your logo — it appears on vouchers and invoices",
      done: filled(a.brandLogo, 1),
      locked: false,
      href: anchor("brandLogo"),
      pageName: "Edit profile",
      sectionName: "Brand logo & stamp",
      fieldName: "Brand Logo",
    },
    {
      id: "address",
      label: "Registered address",
      hint: "Your office or billing address for PDF documents",
      done: filled(a.address),
      locked: false,
      href: anchor("address"),
      pageName: "Edit profile",
      sectionName: "Address Details",
      fieldName: "Full Address",
    },
    {
      id: "mobile",
      label: "Mobile number",
      hint: "A valid 10-digit number for client contact",
      done: isValidMobile(a.mobile),
      locked: false,
      href: isValidMobile(a.mobile) ? anchor("mobile") : "/setup",
      pageName: isValidMobile(a.mobile) ? "Edit profile" : "Quick setup",
      sectionName: "Basic Information",
      fieldName: "Mobile Number",
    },
  ];
  return [
    ...profileSteps,
    {
      id: "document",
      label: "Create your first document",
      hint: profileDone
        ? "Pick voucher, invoice, ticket, or any option on your dashboard"
        : "Finish the profile steps above first",
      done: isActive(a.status),
      locked: !profileDone,
      href: `/dashboard#${ACTIVATION_ANCHORS.document}`,
      pageName: "Dashboard",
      sectionName: "Create documents",
      fieldName: "Any document card",
    },
  ];
}

export function activationProgress(a: Partial<Agent>) {
  const steps = activationSteps(a);
  const open = steps.filter((s) => !s.locked);
  const completed = open.filter((s) => s.done).length;
  const total = open.length;
  return {
    steps,
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    nextStep: steps.find((s) => !s.done && !s.locked) ?? null,
  };
}

/** Whether the "Activate account" guide should be offered at all. */
export function needsActivationPrompt(a: Partial<Agent> | null | undefined): boolean {
  if (!a) return false;
  return !isActive(a.status) && !isSuspended(a.status);
}

export function activationMessage(a: Partial<Agent>): string | null {
  if (!needsActivationPrompt(a)) return null;
  const missing = missingActivationFields(a);
  return missing.length > 0
    ? `Add ${joinList(missing)} in profile, then create a document to activate your account.`
    : "Create a voucher, invoice, or other document to activate your account.";
}

export function activationAction(a: Partial<Agent>): { label: string; href: string } | null {
  if (!needsActivationPrompt(a)) return null;
  if (missingActivationFields(a).length > 0) {
    const next = activationSteps(a).find((s) => !s.done && !s.locked);
    return { label: "Edit profile", href: next?.href ?? "/dashboard/profile/edit" };
  }
  return { label: "Create document", href: `/dashboard#${ACTIVATION_ANCHORS.document}` };
}

export function statusTooltip(a: Partial<Agent>): string {
  if (isActive(a.status))
    return "Your account is Active.\nYou created at least one document and added company name, brand logo, address, and mobile.";
  if (isSuspended(a.status)) return "Your account is suspended. Please contact support if you need help.";
  return [
    "Steps to get Active (separate from Verified):",
    "1. Add company name, brand logo, address, and mobile in Edit profile",
    "2. Create a voucher, invoice, or other document",
    "3. Your account becomes Active",
  ].join("\n");
}

/* ─── Verified badge ─────────────────────────────────────────────────────── */

function missingVerifyFields(a: Partial<Agent>): string[] {
  if (a.partnerType === "other") return [];
  const out: string[] = [];
  if (!String(a.companyName ?? "").trim()) out.push("company name");
  if (!String(a.brandLogo ?? "").trim()) out.push("brand logo");
  if (!String(a.address ?? "").trim()) out.push("address");
  return out;
}

/** Non-"other" partners are verified automatically once the three fields exist. */
export function computeAutoVerified(a: Partial<Agent>): boolean {
  if (a.partnerType === "other") return !!a.isVerified;
  return missingVerifyFields(a).length === 0;
}

export function verifyMessage(a: Partial<Agent>): string | null {
  if (a.isVerified) return null;
  if (a.verification) {
    if (a.verification.status === "pending" || a.verification.status === "checked") return "Your profile is with our team for review. You'll get the Verified badge once it's approved.";
    if (a.verification.status === "denied") return "Your profile wasn't approved yet. Update your details and it goes back for review.";
    return "Complete your profile (company name, brand logo, address and mobile) to send it for review.";
  }
  if (a.partnerType === "other") {
    return String(a.brandLogo ?? "").trim()
      ? "Your profile is under review. Our team will award the Verified badge after checking your details."
      : "Add your brand logo and address in profile settings. Our team will review your account and award the Verified badge.";
  }
  const m = missingVerifyFields(a);
  return m.length === 0
    ? "Your profile is complete. Your Verified badge will appear automatically in a moment."
    : `Add ${joinList(m)} in profile settings to earn your Verified badge.`;
}

export function verifyTooltip(a: Partial<Agent>): string {
  if (a.verification) {
    if (a.isVerified) return "Verified — the Vouchlio team reviewed and approved your business details.";
    return verifyMessage(a) ?? "";
  }
  if (a.isVerified)
    return a.partnerType === "other"
      ? "Verified by our team after reviewing your profile."
      : "Verified — your profile has company name, brand logo, and address.";
  if (a.partnerType === "other") {
    const lines = [
      "Steps to get your Verified badge:",
      "1. Open Edit profile",
      "2. Add company name, brand logo, and address",
      "3. Wait for our team to review and verify you",
    ];
    if (!String(a.brandLogo ?? "").trim()) lines.push("Tip: Add your brand logo so we can review faster.");
    return lines.join("\n");
  }
  const m = missingVerifyFields(a);
  return m.length === 0
    ? "Steps to get your Verified badge:\n1. Your profile is complete\n2. The badge will appear automatically"
    : ["Steps to get your Verified badge:", "1. Open Edit profile", `2. Add ${joinList(m)}`, "3. Save — your Verified badge is applied automatically"].join("\n");
}

/* ─── Profile strength (0–100) ───────────────────────────────────────────── */

const CORE_FIELDS: (keyof Agent)[] = [
  "mobile", "name", "email", "city", "landlineNumber", "companyName", "brandName",
  "address", "country", "state", "pincode",
];
const BRAND_FIELDS: (keyof Agent)[] = ["brandLogo", "gstNumber"];
const PAYMENT_FIELDS: (keyof Agent)[] = [
  "bankAccountHolder", "bankName", "bankAccountNumber", "bankIfscCode", "bankBranchAddress", "paymentUpi",
];

const has = (a: Partial<Agent>, k: keyof Agent) => {
  const v = a[k];
  return typeof v === "string" ? v.trim().length > 0 : !!v;
};
const ratio = (a: Partial<Agent>, keys: (keyof Agent)[]) =>
  keys.length === 0 ? 1 : keys.filter((k) => has(a, k)).length / keys.length;

export function agentHasPaymentInfo(a: Partial<Agent>): boolean {
  return PAYMENT_FIELDS.some((k) => has(a, k));
}

/** Core fields fill 0–50%, brand 50–75%, payment details 75–100%. */
export function profileStrength(a: Partial<Agent>): number {
  const core = ratio(a, CORE_FIELDS);
  if (core < 1) return Math.round(core * 50);
  const brand = ratio(a, BRAND_FIELDS);
  if (brand < 1) return Math.round(50 + brand * 25);
  return Math.round(75 + ratio(a, PAYMENT_FIELDS) * 25);
}

export function displayName(a: Partial<Agent>): string {
  return a.name?.trim() || a.brandName?.trim() || a.companyName?.trim() || "Agent";
}

export function initials(a: Partial<Agent>): string {
  const parts = displayName(a).split(/\s+/).filter(Boolean);
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : displayName(a).slice(0, 2).toUpperCase();
}

export function agencyLine(a: Partial<Agent>, fallback: string): string {
  const parts = [a.brandName, a.companyName].map((v) => v?.trim()).filter(Boolean) as string[];
  return [...new Set(parts)].join(" · ") || fallback;
}
