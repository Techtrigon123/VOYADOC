import { db } from "@/lib/db/supabase";

/**
 * API rate limiting, applied to every /api request from proxy.ts.
 *
 * - "db" rules (auth & password endpoints) keep counters in Supabase so the
 *   limit holds across restarts and across multiple server instances.
 * - "memory" rules (general traffic) count in this server process only —
 *   fast, no extra database round trip, good enough for abuse throttling.
 * If Supabase is unreachable, db rules fall back to the in-memory counter
 * with the same limits rather than letting requests through unlimited.
 */

export interface RateRule {
  id: string;
  /** Matches the request path (and method, when given). */
  test: (path: string, method: string) => boolean;
  limit: number;
  windowSeconds: number;
  store: "db" | "memory";
  /** Count per signed-in user when possible, otherwise per client IP. */
  scope: "ip" | "user";
}

const FIFTEEN_MIN = 15 * 60;
const AUTH_ROUTES = ["login", "signup", "forgot-password", "reset-password"];

export const RATE_RULES: RateRule[] = [
  // Max 5 attempts per 15 minutes on each auth route, per IP address.
  ...AUTH_ROUTES.map<RateRule>((name) => ({
    id: `auth:${name}`,
    test: (p, m) => p === `/api/auth/${name}` && m !== "GET",
    limit: 5,
    windowSeconds: FIFTEEN_MIN,
    store: "db",
    scope: "ip",
  })),
  {
    id: "auth:change-password",
    test: (p, m) => p === "/api/agent/change-password" && m !== "GET",
    limit: 5,
    windowSeconds: FIFTEEN_MIN,
    store: "db",
    scope: "user",
  },
  // Public contact form — stops spam floods.
  { id: "contact", test: (p, m) => p === "/api/contact" && m === "POST", limit: 5, windowSeconds: FIFTEEN_MIN, store: "db", scope: "ip" },
  // Expensive endpoints.
  { id: "extract", test: (p, m) => p === "/api/agent/extract" && m === "POST", limit: 10, windowSeconds: 60, store: "memory", scope: "user" },
  { id: "export", test: (p) => p === "/api/agent/invoices/export", limit: 10, windowSeconds: 60, store: "memory", scope: "user" },
  { id: "pdf", test: (p) => /^\/api\/agent\/documents\/[^/]+\/pdf$/.test(p), limit: 60, windowSeconds: 60, store: "memory", scope: "user" },
  { id: "tools", test: (p) => p.startsWith("/api/tools/"), limit: 20, windowSeconds: 60, store: "memory", scope: "ip" },
  // Everything else under /api.
  { id: "api", test: (p) => p.startsWith("/api/"), limit: 120, windowSeconds: 60, store: "memory", scope: "user" },
];

export function findRule(path: string, method: string): RateRule | null {
  if (method === "OPTIONS") return null;
  return RATE_RULES.find((r) => r.test(path, method)) ?? null;
}

export interface RateResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the window resets. */
  resetIn: number;
}

/* ─── in-memory store (survives dev hot reloads via globalThis) ──────────── */

type Bucket = { count: number; resetAt: number };
const g = globalThis as unknown as { __rateBuckets?: Map<string, Bucket> };
const buckets = (g.__rateBuckets ??= new Map<string, Bucket>());

function hitMemory(key: string, limit: number, windowSeconds: number): RateResult {
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowSeconds * 1000 };
    buckets.set(key, b);
  }
  b.count += 1;
  return {
    allowed: b.count <= limit,
    limit,
    remaining: Math.max(0, limit - b.count),
    resetIn: Math.max(1, Math.ceil((b.resetAt - now) / 1000)),
  };
}

async function hitDb(key: string, limit: number, windowSeconds: number): Promise<RateResult> {
  const { data, error } = await db().rpc("rate_limit_hit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw new Error(error.message);
  const row = (data as { allowed: boolean; remaining: number; reset_at: string }[] | null)?.[0];
  if (!row) throw new Error("rate_limit_hit returned no row");
  return {
    allowed: row.allowed,
    limit,
    remaining: row.remaining,
    resetIn: Math.max(1, Math.ceil((new Date(row.reset_at).getTime() - Date.now()) / 1000)),
  };
}

export async function checkRateLimit(rule: RateRule, identity: string): Promise<RateResult> {
  const key = `${rule.id}:${identity}`;
  if (rule.store === "db") {
    try {
      return await hitDb(key, rule.limit, rule.windowSeconds);
    } catch (e) {
      console.warn("[rate-limit] Supabase unavailable, using in-memory counter:", (e as Error).message);
    }
  }
  return hitMemory(key, rule.limit, rule.windowSeconds);
}

/** Client IP from the proxy headers set by the hosting platform. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}

export function retryMessage(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  return seconds < 90
    ? `Too many attempts. Please wait ${seconds} seconds and try again.`
    : `Too many attempts. Please wait ${minutes} minutes and try again.`;
}
