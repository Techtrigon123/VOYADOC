import { NextRequest } from "next/server";
import { updateUser, type UserRecord } from "@/lib/db/repo";
import { requireAgent, ok, fail } from "@/lib/agent/server";
import { effectivePlan, EXTRACT_LIMITS } from "@/lib/agent/plans";
import { extractAvailable, extractFromFile, ExtractError } from "@/lib/agent/extract";
import { AI_LIMITS, limitMessage, reserveAiCall, reserveMicros, settleAiCall } from "@/lib/ai-budget";
import { contentMatchesType, pdfPageCount } from "@/lib/agent/upload-check";
import { serviceBlock } from "@/lib/agent/entitlements";
import { getAppSettings } from "@/lib/settings";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MEDIA = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"] as const;
type Kind = "voucher" | "ticket";

const todayKey = () => new Date().toISOString().slice(0, 10);


function usage(user: UserRecord, kind: Kind) {
  const plan = effectivePlan(user);
  const u = user.extractUsage ?? { day: "", voucher: 0, airTicket: 0, yearTotal: 0 };
  const sameDay = u.day === todayKey();
  if (plan === "platinum") return { plan, used: 0, limit: null as number | null, remaining: null as number | null, period: "unlimited" };
  if (plan === "gold") {
    const yearOld = !u.yearStart || Date.now() - new Date(u.yearStart).getTime() > 365 * 86400000;
    const used = yearOld ? 0 : u.yearTotal ?? 0;
    return { plan, used, limit: EXTRACT_LIMITS.goldPerYear, remaining: Math.max(0, EXTRACT_LIMITS.goldPerYear - used), period: "year" };
  }
  const used = sameDay ? (kind === "voucher" ? u.voucher : u.airTicket) ?? 0 : 0;
  const limit = kind === "voucher" ? EXTRACT_LIMITS.silverVoucherPerDay : EXTRACT_LIMITS.silverAirTicketPerDay;
  return { plan, used, limit, remaining: Math.max(0, limit - used), period: "day" };
}

async function recordUse(user: UserRecord, kind: Kind): Promise<UserRecord> {
  const u = { ...(user.extractUsage ?? { day: "", voucher: 0, airTicket: 0, yearTotal: 0 }) };
  if (u.day !== todayKey()) {
    u.day = todayKey();
    u.voucher = 0;
    u.airTicket = 0;
  }
  if (kind === "voucher") u.voucher += 1;
  else u.airTicket += 1;
  if (!u.yearStart || Date.now() - new Date(u.yearStart).getTime() > 365 * 86400000) {
    u.yearStart = new Date().toISOString();
    u.yearTotal = 0;
  }
  u.yearTotal = (u.yearTotal ?? 0) + 1;
  return updateUser(user.id, { extractUsage: u });
}

/** ?type=voucher|ticket → { available, used, limit, remaining, period, plan } */
export async function GET(req: NextRequest) {
  const { user, response } = await requireAgent();
  if (response) return response;
  const kind: Kind = req.nextUrl.searchParams.get("type") === "ticket" ? "ticket" : "voucher";
  await getAppSettings();
  return ok({ available: extractAvailable() && AI_LIMITS.enabled(), ...usage(user, kind) });
}

/** multipart/form-data: file, type=voucher|ticket */
export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;

    await getAppSettings(); // load admin AI limits before checking them
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    const kind: Kind = form?.get("type") === "ticket" ? "ticket" : "voucher";
    const planBlock = serviceBlock(user, kind === "ticket" ? "air_ticket" : "hotel_voucher");
    if (planBlock) return fail(planBlock.message, planBlock.status, planBlock.code);
    if (!(file instanceof File)) return fail("Choose a file first.", 400, "MISSING_FILE");
    if (!(MEDIA as readonly string[]).includes(file.type) || file.size > MAX_FILE_BYTES)
      return fail("Upload a PDF or image (PNG, JPG, WebP) under 10 MB.", 400, "INVALID_FILE");
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!contentMatchesType(bytes, file.type))
      return fail("This file doesn't look like a real PDF or image. Upload the original file.", 400, "INVALID_FILE");
    let pdfPages: number | undefined;
    if (file.type === "application/pdf") {
      const pages = await pdfPageCount(bytes);
      if (pages === null) return fail("This PDF can't be opened. Upload a different copy or a photo of it.", 400, "INVALID_FILE");
      if (pages > AI_LIMITS.maxPdfPages())
        return fail(`Upload the voucher or ticket pages only — PDFs can have at most ${AI_LIMITS.maxPdfPages()} pages.`, 400, "TOO_MANY_PAGES");
      pdfPages = pages;
    }

    if (!extractAvailable() || !AI_LIMITS.enabled())
      return fail("Upload auto-fill is not available right now. You can still fill the form manually.", 503, "EXTRACT_UNAVAILABLE");

    const u = usage(user, kind);
    if (u.remaining !== null && u.remaining <= 0) {
      return fail(
        kind === "voucher"
          ? "You have used all free voucher uploads. Buy Gold or Platinum for more upload auto-fills."
          : "You have used all free air ticket uploads. Buy Gold or Platinum for more upload auto-fills.",
        402,
        "SUBSCRIPTION_REQUIRED"
      );
    }

    // Reserve the worst-case cost. The database enforces every limit atomically: the plan's
    // daily allowance, the per-account fair-use cap, the free-plan pool and the spend budgets.
    const { result, reservation } = await reserveAiCall({
      userId: user.id,
      kind,
      free: u.plan === "silver",
      planDailyLimit: u.period === "day" ? u.limit : null,
      micros: reserveMicros({ pdfPages }),
    });
    if (result !== "ok" || !reservation) {
      const m = limitMessage(result === "ok" ? "unavailable" : result);
      return fail(m.message, m.status, m.code);
    }

    try {
      const base64 = Buffer.from(bytes).toString("base64");
      const extracted = await extractFromFile(kind, { base64, mediaType: file.type as (typeof MEDIA)[number] });
      await settleAiCall(reservation, { usage: extracted.usage });
      const updated = await recordUse(user, kind);
      return ok({ fields: extracted.fields, usage: usage(updated, kind) });
    } catch (error) {
      if (error instanceof ExtractError) await settleAiCall(reservation, { usage: error.usage, refund: error.notBilled });
      else await settleAiCall(reservation, {}); // unknown failure: keep the reserved cost counted
      throw error;
    }
  } catch (error) {
    if (error instanceof ExtractError) {
      const status = error.code === "EXTRACT_TEMPORARY" ? 429 : error.code === "EXTRACT_UNAVAILABLE" ? 503 : 422;
      return fail(error.message, status, error.code);
    }
    console.error("[POST /api/agent/extract]", error);
    return fail("Could not read this file. Please try again.", 500, "EXTRACT_FAILED");
  }
}
