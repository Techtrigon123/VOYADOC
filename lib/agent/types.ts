export type PartnerType = "travel_agent" | "tour_operator" | "dmc" | "hotel" | "other";
export type AgentStatus = "INACTIVE" | "ACTIVE" | "SUSPENDED";
export type PlanId = "silver" | "gold" | "platinum";

export type DocumentKind =
  | "hotel_voucher"
  | "air_ticket"
  | "pickup_voucher"
  | "welcome_placard"
  | "invoice"
  | "proforma"
  | "receipt";

/** The signed-in agent as the client sees it (`GET /api/auth/me`). */
export interface Agent {
  id: string;
  name: string;
  email: string;
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
  status: AgentStatus;
  isVerified: boolean;
  agentLevel?: string;
  subscriptionPlan: PlanId;
  subscriptionExpiresAt?: string;
  airTicketingEnabled: boolean;
  travelServiceVoucherEnabled: boolean;
  welcomePlacardEnabled: boolean;
  documentNumberSettings?: {
    invoicePrefix: string;
    proformaPrefix: string;
    receiptPrefix: string;
    digits: number;
  };
  createdAt: string;
}

/** A saved document row as returned by list endpoints. */
export interface DocumentSummary {
  id: string;
  kind: DocumentKind;
  title: string;
  subtitle?: string;
  number?: string;
  groupKey?: string;
  version: number;
  status?: string;
  hasStoredPdf: boolean;
  currency?: string;
  total?: number;
  paidAmount?: number;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  access: DocumentAccess;
}

export interface DocumentAccess {
  locked: boolean;
  /** null when access never closes (Gold / Platinum). */
  remainingDays: number | null;
  accessUntil: string | null;
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: { code?: string; message: string };
}
