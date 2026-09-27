/**
 * Cookie consent — stored in the `cookie_consent` cookie for 12 months.
 * Essential cookies are always on; analytics and marketing only run when allowed.
 * Load any future analytics/marketing script only after `hasConsent("analytics")` is true,
 * and listen for CONSENT_CHANGED_EVENT to react when the choice changes.
 */
export const CONSENT_COOKIE = "cookie_consent";
export const CONSENT_VERSION = 1;
export const OPEN_CONSENT_EVENT = "cookie-consent:open";
export const CONSENT_CHANGED_EVENT = "cookie-consent:changed";

export type ConsentCategory = "analytics" | "marketing";

export interface Consent {
  v: number;
  analytics: boolean;
  marketing: boolean;
  date: string;
}

export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
    ?.slice(CONSENT_COOKIE.length + 1);
  if (!raw) return null;
  try {
    const c = JSON.parse(decodeURIComponent(raw)) as Partial<Consent>;
    if (c.v !== CONSENT_VERSION) return null;
    return { v: c.v, analytics: c.analytics === true, marketing: c.marketing === true, date: String(c.date ?? "") };
  } catch {
    return null;
  }
}

export function saveConsent(choice: { analytics: boolean; marketing: boolean }): Consent {
  const consent: Consent = { v: CONSENT_VERSION, ...choice, date: new Date().toISOString() };
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(consent))}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: consent }));
  return consent;
}

export function hasConsent(category: ConsentCategory): boolean {
  return readConsent()?.[category] === true;
}

export function openConsentSettings() {
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
}
