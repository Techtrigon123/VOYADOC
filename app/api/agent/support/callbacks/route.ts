import { NextRequest } from "next/server";
import { requireAgent, ok, fail } from "@/lib/agent/server";
import { channelOff, clean, cleanBody, notReady } from "@/lib/agent/support-guard";
import { activeCallbackCount, CALLBACK_SLOTS, createCallback, listCallbacks, type CallbackSlot } from "@/lib/db/support-repo";

/** Calls can be booked from today up to this many days ahead (India time). */
const MAX_DAYS_AHEAD = 14;
/** Open (requested or scheduled) callbacks one agent may have at a time. */
const MAX_ACTIVE = 2;

export async function GET() {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    return ok(await listCallbacks(user.id));
  } catch (error) {
    const pending = notReady(error);
    if (pending) return pending;
    console.error("[GET /api/agent/support/callbacks]", error);
    return fail("Could not load your callback requests.", 500);
  }
}

/** Body: { phone, preferredDate: YYYY-MM-DD, preferredSlot, topic, note? } */
export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    const off = await channelOff("callbacks");
    if (off) return off;
    const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
    const phone = clean(b.phone, 20).replace(/[^\d+\s-]/g, "");
    const digits = phone.replace(/\D/g, "");
    const topic = clean(b.topic, 120);
    const note = cleanBody(b.note, 1000);
    const slot = (CALLBACK_SLOTS as readonly string[]).includes(String(b.preferredSlot)) ? (b.preferredSlot as CallbackSlot) : null;
    const date = String(b.preferredDate ?? "");
    if (digits.length < 10 || digits.length > 13) return fail("Enter a valid phone number, with the country code if it's outside India.");
    if (!slot) return fail("Pick a time slot.");
    if (topic.length < 2) return fail("Tell us what the call is about.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("Pick a date.");
    // Compare calendar days in India time.
    const todayIst = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const days = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${todayIst}T00:00:00Z`)) / 86400000);
    if (Number.isNaN(days) || days < 0 || days > MAX_DAYS_AHEAD) return fail("Pick a date within the next two weeks.");
    if ((await activeCallbackCount(user.id)) >= MAX_ACTIVE)
      return fail("You already have callbacks waiting. We'll call you soon — or cancel one to book another.", 409);
    return ok(await createCallback(user.id, { phone, preferredDate: date, preferredSlot: slot, topic, note }), {
      status: 201,
      message: "Callback requested. We'll confirm the time.",
    });
  } catch (error) {
    const pending = notReady(error);
    if (pending) return pending;
    console.error("[POST /api/agent/support/callbacks]", error);
    return fail("Could not request a callback. Please try again.", 500);
  }
}
