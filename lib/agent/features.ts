import type { Agent, DocumentKind } from "./types";

/** Admin-controlled feature switches, same defaults as the reference panel. */
export function isFeatureEnabled(a: Pick<Agent, "airTicketingEnabled" | "travelServiceVoucherEnabled" | "welcomePlacardEnabled">, kind: DocumentKind): boolean {
  switch (kind) {
    case "air_ticket":
      return a.airTicketingEnabled !== false;
    case "pickup_voucher":
      return a.travelServiceVoucherEnabled !== false;
    case "welcome_placard":
      return a.welcomePlacardEnabled !== false;
    default:
      return true;
  }
}
