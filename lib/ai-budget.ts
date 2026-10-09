import "server-only";
import { db } from "@/lib/db/supabase";
import { cachedAppSettings } from "@/lib/settings";

/**
 * Spend controls for AI calls (upload auto-fill). See supabase/migrations/0004_ai_cost_controls.sql.
 *
 * Before each call we reserve its worst-case cost; the database checks every limit and
 * counts the call atomically. After the call we settle the real cost from the API's
 * token usage. If the budget database can't be reached, calls are refused (fail closed)
 * so an outage can never turn into an unbounded bill.
 *
 * All limits are environment variables so they can be changed without a deploy of code.
 */

const num = (name: string, fallback: number) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
};

/** A value set by a master admin in the portal (Settings → AI), if any. */
const ov = <K extends "dailyBudgetUsd" | "monthlyBudgetUsd" | "userDailyCalls" | "freePoolDailyCalls">(k: K) => cachedAppSettings()?.ai[k] ?? null;

export const AI_LIMITS = {
  /** Kill switch: set AI_EXTRACT_ENABLED=false to turn upload auto-fill off instantly. */
  enabled: () => process.env.AI_EXTRACT_ENABLED !== "false" && cachedAppSettings()?.ai.enabled !== false,
  /** Total AI spend allowed per UTC day / calendar month, in USD. */
  dailyBudgetUsd: () => ov("dailyBudgetUsd") ?? num("AI_DAILY_BUDGET_USD", 10),
  monthlyBudgetUsd: () => ov("monthlyBudgetUsd") ?? num("AI_MONTHLY_BUDGET_USD", 150),
  /** Fair-use cap per account per day, on every plan (Platinum "unlimited" included). */
  userDailyCalls: () => ov("userDailyCalls") ?? num("AI_USER_DAILY_LIMIT", 30),
  /** Shared daily pool for all free (Silver) accounts together — stops mass sign-ups draining the budget. */
  freePoolDailyCalls: () => ov("freePoolDailyCalls") ?? num("AI_FREE_POOL_DAILY_LIMIT", 100),
  /** Largest PDF we send to the model, in pages (each page is billed). */
  maxPdfPages: () => num("AI_MAX_PDF_PAGES", 5),
};

/** Claude Opus 5 list price, USD per million tokens (see Anthropic pricing). */
export const MODEL_PRICE = { inputPerMTok: 5, outputPerMTok: 25 };

/** Output ceiling per call. Extraction returns a small JSON object; this caps the worst case. */
export const MAX_OUTPUT_TOKENS = 8000;

/** Cost in micro-dollars (USD × 1e6). $5 per 1M tokens = 5 micro-dollars per token. */
export function costMicros(inputTokens: number, outputTokens: number): number {
  return Math.ceil(inputTokens * MODEL_PRICE.inputPerMTok + outputTokens * MODEL_PRICE.outputPerMTok);
}

/**
 * Worst-case cost to reserve before a call: a generous input estimate for the file
 * (per PDF page, or one image) plus the full output ceiling.
 */
export function reserveMicros(file: { pdfPages?: number }): number {
  const PROMPT_AND_SCHEMA = 2_000;
  const PER_PDF_PAGE = 3_500;
  const PER_IMAGE = 2_500;
  const input = PROMPT_AND_SCHEMA + (file.pdfPages ? file.pdfPages * PER_PDF_PAGE : PER_IMAGE);
  return costMicros(input, MAX_OUTPUT_TOKENS);
}

export type ReserveResult = "ok" | "daily_budget" | "monthly_budget" | "free_pool" | "user_daily" | "plan_limit" | "unavailable";

export interface Reservation {
  day: string;
  userId: string;
  kind: string;
  free: boolean;
  micros: number;
}

const toMicros = (usd: number) => Math.round(usd * 1_000_000);
const utcDay = () => new Date().toISOString().slice(0, 10);

export async function reserveAiCall(opts: {
  userId: string;
  kind: "voucher" | "ticket";
  free: boolean;
  /** The plan's per-day allowance for this kind, or null when the plan has no daily limit. */
  planDailyLimit: number | null;
  micros: number;
}): Promise<{ result: ReserveResult; reservation?: Reservation }> {
  const day = utcDay();
  const { data, error } = await db().rpc("ai_reserve", {
    p_user: opts.userId,
    p_kind: opts.kind,
    p_free: opts.free,
    p_user_kind_limit: opts.planDailyLimit,
    p_user_daily_limit: AI_LIMITS.userDailyCalls(),
    p_free_daily_calls: AI_LIMITS.freePoolDailyCalls(),
    p_daily_budget_micros: toMicros(AI_LIMITS.dailyBudgetUsd()),
    p_monthly_budget_micros: toMicros(AI_LIMITS.monthlyBudgetUsd()),
    p_reserve_micros: opts.micros,
  });
  if (error) {
    console.error("[ai-budget] reserve failed — refusing the AI call:", error.message);
    return { result: "unavailable" };
  }
  const result = data as ReserveResult;
  if (result !== "ok") {
    if (result === "daily_budget" || result === "monthly_budget")
      console.warn(`[ai-budget] ${result} reached — AI calls are paused until it resets.`);
    return { result };
  }
  return { result, reservation: { day, userId: opts.userId, kind: opts.kind, free: opts.free, micros: opts.micros } };
}

/**
 * Record the real cost of a reserved call. Pass `usage` from the API response when the
 * call was billed; pass `refund: true` only when the API certainly didn't bill it.
 */
export async function settleAiCall(
  r: Reservation,
  outcome: { usage?: { input_tokens: number; output_tokens: number }; refund?: boolean }
): Promise<void> {
  const input = outcome.usage?.input_tokens ?? 0;
  const output = outcome.usage?.output_tokens ?? 0;
  // Billed but usage unknown (e.g. the response couldn't be parsed): keep the reservation as the cost.
  const actual = outcome.refund ? 0 : outcome.usage ? costMicros(input, output) : r.micros;
  const { error } = await db().rpc("ai_settle", {
    p_day: r.day,
    p_user: r.userId,
    p_kind: r.kind,
    p_free: r.free,
    p_reserved_micros: r.micros,
    p_actual_micros: actual,
    p_input_tokens: input,
    p_output_tokens: output,
    p_refund: !!outcome.refund,
  });
  if (error) console.error("[ai-budget] settle failed (reserved cost stays counted):", error.message);
}

/** A user-facing message for each limit. */
export function limitMessage(result: Exclude<ReserveResult, "ok">): { message: string; status: number; code: string } {
  switch (result) {
    case "plan_limit":
      return { message: "You have used today's free upload auto-fills. Buy Gold or Platinum for more.", status: 402, code: "SUBSCRIPTION_REQUIRED" };
    case "user_daily":
      return { message: "You've reached today's upload auto-fill limit. It resets at midnight UTC — you can still fill the form manually.", status: 429, code: "DAILY_LIMIT" };
    case "free_pool":
      return { message: "Free upload auto-fill is at capacity for today. Try again tomorrow, or upgrade for priority access.", status: 429, code: "FREE_POOL_EXHAUSTED" };
    case "daily_budget":
    case "monthly_budget":
    case "unavailable":
      return { message: "Upload auto-fill is paused right now. You can still fill the form manually.", status: 503, code: "EXTRACT_PAUSED" };
  }
}
