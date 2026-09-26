import type { DocumentAccess, PlanId } from "./types";

export const PAID_PLAN_PRICE_INR = { gold: 1999, platinum: 6999 } as const;
export type PaidPlanId = keyof typeof PAID_PLAN_PRICE_INR;

/** Silver keeps generated documents open for this many days from creation. */
export const SILVER_RETENTION_DAYS = 30;

/** Upload auto-fill allowances. */
export const EXTRACT_LIMITS = {
  silverVoucherPerDay: 2,
  silverAirTicketPerDay: 2,
  goldPerYear: 200,
} as const;

export function isPaidPlan(p: string): p is PaidPlanId {
  return p === "gold" || p === "platinum";
}

export function normalizePlan(p: unknown): PlanId {
  const v = String(p ?? "silver").toLowerCase();
  return v === "gold" || v === "platinum" ? v : "silver";
}

/** Effective plan — a paid plan past its expiry falls back to Silver. */
export function effectivePlan(a: { subscriptionPlan?: string; subscriptionExpiresAt?: string | Date | null }): PlanId {
  const plan = normalizePlan(a.subscriptionPlan);
  if (plan === "silver") return "silver";
  if (a.subscriptionExpiresAt) {
    const t = new Date(a.subscriptionExpiresAt).getTime();
    if (!Number.isNaN(t) && t < Date.now()) return "silver";
  }
  return plan;
}

export function planLabel(p: PlanId): string {
  return `${p.charAt(0).toUpperCase()}${p.slice(1)} plan`;
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function documentAccess(plan: PlanId, createdAt: Date | string, now = Date.now()): DocumentAccess {
  if (plan !== "silver") return { locked: false, remainingDays: null, accessUntil: null };
  const until = new Date(new Date(createdAt).getTime() + SILVER_RETENTION_DAYS * DAY_MS);
  const remaining = Math.ceil((until.getTime() - now) / DAY_MS);
  return {
    locked: until.getTime() <= now,
    remainingDays: Math.max(0, remaining),
    accessUntil: until.toISOString(),
  };
}

export function accessLabel(a: DocumentAccess): string {
  if (a.locked) return "Access closed";
  if (a.remainingDays == null) return "Open";
  if (a.remainingDays <= 0) return "Closes today";
  if (a.remainingDays === 1) return "Last day";
  return `${a.remainingDays} days left`;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  headline: string;
  yearlyPrice: number | null;
  cta: string;
  featured?: boolean;
  badge?: string;
  subscriptionNote?: string;
  highlights: { value: string; label: string }[];
  features: string[];
}

export const PLANS: PlanDefinition[] = [
  {
    id: "silver",
    name: "Silver",
    headline: "Start free. Impress clients from day one.",
    yearlyPrice: null,
    cta: "Get started free",
    subscriptionNote: "No credit card · upgrade anytime",
    highlights: [
      { value: "7+", label: "Document types" },
      { value: "30 days", label: "History saved" },
      { value: "2/day", label: "Hotel upload fill" },
      { value: "2/day", label: "Air ticket uploads" },
    ],
    features: [
      "Hotel vouchers, invoices, proforma & receipts",
      "Air tickets, pickup vouchers & welcome placards",
      "Ready-made professional templates",
      "Watermarked PDFs",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    headline: "Win trust — clean PDFs, your logo, zero watermark.",
    yearlyPrice: PAID_PLAN_PRICE_INR.gold,
    cta: "Choose Gold",
    featured: true,
    badge: "Popular",
    highlights: [
      { value: "Forever", label: "Document history" },
      { value: "200/yr", label: "Auto-fill uploads" },
      { value: "No watermark", label: "Clean PDFs" },
    ],
    features: ["Everything in Silver", "Your logo on every document", "All library template styles", "Priority support"],
  },
  {
    id: "platinum",
    name: "Platinum",
    headline: "Stand out — vouchers designed only for your agency.",
    yearlyPrice: PAID_PLAN_PRICE_INR.platinum,
    cta: "Choose Platinum",
    badge: "Exclusive",
    subscriptionNote: "Your design is never shared with other agents",
    highlights: [
      { value: "Unlimited", label: "Auto-fill uploads" },
      { value: "Custom", label: "Voucher design" },
      { value: "1 year", label: "Revisions included" },
    ],
    features: [
      "Everything in Gold",
      "Exclusive layouts, colours & fonts",
      "Fields tailored to your workflow",
      "Dedicated onboarding",
    ],
  },
];

export const PLAN_COMPARISON: { label: string; silver: boolean | string; gold: boolean | string; platinum: boolean | string }[] = [
  { label: "Hotel vouchers", silver: true, gold: true, platinum: true },
  { label: "Invoices & proforma", silver: true, gold: true, platinum: true },
  { label: "Payment receipts", silver: true, gold: true, platinum: true },
  { label: "Air tickets", silver: true, gold: true, platinum: true },
  { label: "Pickup vouchers", silver: true, gold: true, platinum: true },
  { label: "Airport placards", silver: true, gold: true, platinum: true },
  { label: "Ready-made templates", silver: true, gold: true, platinum: true },
  { label: "Document history", silver: "30 days", gold: "Forever", platinum: "Forever" },
  { label: "Upload to auto-fill (hotel + air ticket)", silver: "2/day each", gold: "200 / year", platinum: "Unlimited" },
  { label: "Clean PDFs (no watermark)", silver: false, gold: true, platinum: true },
  { label: "Your logo on documents", silver: false, gold: true, platinum: true },
  { label: "Custom-designed templates", silver: false, gold: false, platinum: true },
  { label: "Template revisions", silver: false, gold: false, platinum: true },
  { label: "Priority support", silver: false, gold: true, platinum: true },
];

export const PRICING_FAQ = [
  {
    q: "What is included in the Silver plan?",
    a: "Hotel vouchers, invoices, proforma invoices, receipts, air tickets, pickup vouchers, and welcome placards — all with ready-made templates. Document history is kept for 30 days. Upload auto-fill is limited to 2 per day for hotel vouchers and air tickets. PDFs include a watermark. No subscription or credit card required.",
  },
  {
    q: "How does the Gold plan work?",
    a: `Pay ${formatInr(PAID_PLAN_PRICE_INR.gold)} per year (GST inclusive) for everything in Silver, plus forever document history, 200 upload auto-fills per year, clean PDFs with no watermark, your logo on documents, and priority support.`,
  },
  {
    q: "When should I choose the Platinum plan?",
    a: `When you need unlimited upload auto-fill and vouchers designed only for your brand (${formatInr(PAID_PLAN_PRICE_INR.platinum)} per year, GST inclusive). We build exclusive layouts that are never shared with other agents.`,
  },
  {
    q: "What are upload auto-fill trials?",
    a: "Upload a hotel voucher or airline e-ticket PDF and we read the details to fill your form automatically. On Silver, you get 2 hotel voucher uploads and 2 air ticket uploads per day. Gold includes 200 combined uploads per year. Platinum is unlimited.",
  },
  {
    q: "Can I upgrade from Silver to Gold or Platinum later?",
    a: "Yes. Start on Silver for free and upgrade anytime. Gold and Platinum benefits run for one year from your payment date.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Pay by UPI using the QR code at checkout, then upload your payment screenshot and transaction ID. We verify it and activate your plan.",
  },
  {
    q: "How is my data kept private?",
    a: "Your account, customer details, and documents are stored securely and used only to run the service. We do not sell personal data. See our Privacy Policy.",
  },
];
