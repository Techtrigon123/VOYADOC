import { NextRequest } from "next/server";
import type { IUser } from "@/models/User";
import { requireAgent, ok, fail } from "@/lib/agent/server";
import { effectivePlan, EXTRACT_LIMITS } from "@/lib/agent/plans";
import { extractAvailable, extractFromFile, ExtractError } from "@/lib/agent/extract";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MEDIA = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"] as const;
type Kind = "voucher" | "ticket";

const todayKey = () => new Date().toISOString().slice(0, 10);

function usage(user: IUser, kind: Kind) {
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

async function recordUse(user: IUser, kind: Kind) {
  const u = user.extractUsage ?? { day: "", voucher: 0, airTicket: 0, yearTotal: 0 };
  if (u.day !== todayKey()) {
    u.day = todayKey();
    u.voucher = 0;
    u.airTicket = 0;
  }
  if (kind === "voucher") u.voucher += 1;
  else u.airTicket += 1;
  if (!u.yearStart || Date.now() - new Date(u.yearStart).getTime() > 365 * 86400000) {
    u.yearStart = new Date();
    u.yearTotal = 0;
  }
  u.yearTotal = (u.yearTotal ?? 0) + 1;
  user.extractUsage = u;
  user.markModified("extractUsage");
  await user.save();
}

/** ?type=voucher|ticket → { available, used, limit, remaining, period, plan } */
export async function GET(req: NextRequest) {
  const { user, response } = await requireAgent();
  if (response) return response;
  const kind: Kind = req.nextUrl.searchParams.get("type") === "ticket" ? "ticket" : "voucher";
  return ok({ available: extractAvailable(), ...usage(user, kind) });
}

/** multipart/form-data: file, type=voucher|ticket */
export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    const kind: Kind = form?.get("type") === "ticket" ? "ticket" : "voucher";
    if (!(file instanceof File)) return fail("Choose a file first.", 400, "MISSING_FILE");
    if (!(MEDIA as readonly string[]).includes(file.type) || file.size > MAX_FILE_BYTES)
      return fail("Upload a PDF or image (PNG, JPG, WebP) under 10 MB.", 400, "INVALID_FILE");
    if (!extractAvailable())
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

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const fields = await extractFromFile(kind, { base64, mediaType: file.type as (typeof MEDIA)[number] });
    await recordUse(user, kind);
    return ok({ fields, usage: usage(user, kind) });
  } catch (error) {
    if (error instanceof ExtractError) {
      const status = error.code === "EXTRACT_TEMPORARY" ? 429 : error.code === "EXTRACT_UNAVAILABLE" ? 503 : 422;
      return fail(error.message, status, error.code);
    }
    console.error("[POST /api/agent/extract]", error);
    return fail("Could not read this file. Please try again.", 500, "EXTRACT_FAILED");
  }
}
