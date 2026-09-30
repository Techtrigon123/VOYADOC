"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme";

/**
 * Live chat ("Chat with us" bubble, bottom right) powered by Chatwoot.
 * Messages land in your Chatwoot inbox, where your team — or a Chatwoot bot — replies.
 *
 * Turned on by NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN (Chatwoot → Inboxes → Website → Configuration).
 * NEXT_PUBLIC_CHATWOOT_BASE_URL defaults to Chatwoot Cloud; set it if you self-host.
 */
const TOKEN = process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN?.trim();
const BASE_URL = (process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL?.trim() || "https://app.chatwoot.com").replace(/\/+$/, "");

/** Pages where the bubble is hidden: the in-app support chat already covers these. */
const HIDDEN_ON = ["/dashboard/support"];

interface ChatwootApi {
  setUser: (id: string, user: Record<string, string | undefined>) => void;
  setCustomAttributes: (attrs: Record<string, string | number | boolean>) => void;
  setColorScheme: (scheme: "light" | "dark" | "auto") => void;
  toggleBubbleVisibility: (v: "show" | "hide") => void;
  reset: () => void;
}
declare global {
  interface Window {
    $chatwoot?: ChatwootApi;
    chatwootSettings?: Record<string, unknown>;
    chatwootSDK?: { run: (o: { websiteToken: string; baseUrl: string }) => void };
  }
}

interface Identity {
  identifier: string;
  identifierHash: string | null;
  name: string;
  email: string;
  companyName: string | null;
  plan: string;
  status: string;
}

// Settings must exist before the SDK script runs.
if (typeof window !== "undefined" && TOKEN && !window.chatwootSettings) {
  window.chatwootSettings = {
    type: "expanded_bubble",
    position: "right",
    launcherTitle: "Chat with us",
    locale: "en",
    darkMode: document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  };
}

export default function ChatWidget() {
  const theme = useTheme();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const identified = useRef(false);

  useEffect(() => {
    if (!TOKEN) return;
    const onReady = () => setReady(true);
    window.addEventListener("chatwoot:ready", onReady);
    // Logging out ends the chat session too, so the next person on this browser can't read it.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href="/api/auth/logout"]');
      if (a) window.$chatwoot?.reset();
    };
    document.addEventListener("click", onClick, true);
    document.documentElement.classList.add("has-chat-widget");
    return () => {
      window.removeEventListener("chatwoot:ready", onReady);
      document.removeEventListener("click", onClick, true);
      document.documentElement.classList.remove("has-chat-widget");
    };
  }, []);

  // Follow the site's light/dark switch.
  useEffect(() => {
    if (ready) window.$chatwoot?.setColorScheme(theme === "dark" ? "dark" : "light");
  }, [ready, theme]);

  const hidden = HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  useEffect(() => {
    if (ready) window.$chatwoot?.toggleBubbleVisibility(hidden ? "hide" : "show");
  }, [ready, hidden]);

  // Signed-in agents: attach their name, email, company and plan to the conversation.
  const signedInArea = pathname.startsWith("/dashboard") || pathname.startsWith("/setup");
  useEffect(() => {
    if (!ready || !signedInArea || identified.current) return;
    identified.current = true;
    void fetch("/api/agent/chat-identity", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { data?: Identity } | null) => {
        const id = body?.data;
        if (!id || !window.$chatwoot) return;
        window.$chatwoot.setUser(id.identifier, {
          name: id.name,
          email: id.email,
          ...(id.identifierHash ? { identifier_hash: id.identifierHash } : {}),
        });
        window.$chatwoot.setCustomAttributes({
          company: id.companyName ?? "",
          plan: id.plan,
          account_status: id.status,
        });
      })
      .catch(() => {
        identified.current = false;
      });
  }, [ready, signedInArea]);

  if (!TOKEN) return null;
  return (
    <Script
      id="chatwoot-sdk"
      src={`${BASE_URL}/packs/js/sdk.js`}
      strategy="lazyOnload"
      onLoad={() => window.chatwootSDK?.run({ websiteToken: TOKEN, baseUrl: BASE_URL })}
    />
  );
}
