"use client";

import { openConsentSettings } from "@/lib/consent";

/** Reopens the cookie consent banner so the visitor can change their choice. */
export default function CookieSettingsButton({
  className,
  children = "Cookie settings",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button type="button" onClick={openConsentSettings} className={className}>
      {children}
    </button>
  );
}
