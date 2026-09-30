import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service-role key.
 * Never import this from a "use client" file — the key bypasses Row Level Security.
 */
let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("lib/db/supabase must only be used on the server.");
  }
  if (client) return client;
  // Accept the URL even if it was copied with the REST path (…/rest/v1/) or a trailing slash.
  const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)
    ?.trim()
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (Supabase → Project Settings → API).");
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
