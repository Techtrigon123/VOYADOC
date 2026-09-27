export interface User {
  _id: string;
  name: string;
  email: string;
  organization?: string;
  role: "owner" | "admin" | "staff";
  createdAt: string;
  updatedAt: string;
}

export type EventStatus = "draft" | "published" | "ongoing" | "completed" | "cancelled";
export type EventCategory = "conference" | "workshop" | "meetup" | "sports" | "concert" | "exhibition" | "corporate" | "other";

export interface EventTicketTier {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  description?: string;
}

export interface Event {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: EventCategory;
  status: EventStatus;
  startDate: string;
  endDate: string;
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode?: string;
  };
  coverImage?: string;
  organizerId: string;
  ticketTiers: EventTicketTier[];
  totalCapacity: number;
  totalRegistrations: number;
  totalCheckedIn: number;
  requiresPayment: boolean;
  certificateEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AttendeeStatus = "registered" | "confirmed" | "checked_in" | "cancelled";

export interface Attendee {
  _id: string;
  eventId: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  ticketTierId?: string;
  ticketTierName?: string;
  registrationId: string;
  qrCode: string;
  status: AttendeeStatus;
  checkedInAt?: string;
  checkedInBy?: string;
  paymentId?: string;
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  amountPaid?: number;
  certificateUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInRecord {
  _id: string;
  eventId: string;
  attendeeId: string;
  attendeeName: string;
  attendeeEmail: string;
  checkedInAt: string;
  checkedInBy: string;
  method: "qr" | "manual";
  deviceId?: string;
  synced: boolean;
}

export interface Payment {
  _id: string;
  eventId: string;
  attendeeId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  currency: string;
  status: "created" | "paid" | "failed" | "refunded";
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalEvents: number;
  totalAttendees: number;
  totalCheckedIn: number;
  totalRevenue: number;
  recentEvents: Event[];
  checkInActivity: { date: string; count: number }[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "staff";
  /** Password version — see passwordVersion() in lib/auth/jwt.ts. */
  pv?: string;
  iat?: number;
  exp?: number;
}
