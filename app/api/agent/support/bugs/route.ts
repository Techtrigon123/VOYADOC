import { NextRequest } from "next/server";
import { requireAgent, ok, fail } from "@/lib/agent/server";
import { channelOff, clean, cleanBody, notReady } from "@/lib/agent/support-guard";
import { contentMatchesType } from "@/lib/agent/upload-check";
import { createTicket } from "@/lib/db/support-repo";

const MAX_SCREENSHOT_BYTES = 2.5 * 1024 * 1024;

/** Body: { title, description, screenshot?: data URL (png/jpeg/webp), context?: { url, viewport, userAgent } } */
export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    const off = await channelOff("bugReports");
    if (off) return off;
    const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
    const title = clean(b.title, 140);
    const description = cleanBody(b.description, 5000);
    if (title.length < 3) return fail("Give the bug a short title.");
    if (description.length < 10) return fail("Tell us what went wrong (at least 10 characters).");

    let attachment: string | undefined;
    let attachmentType: string | undefined;
    if (typeof b.screenshot === "string" && b.screenshot) {
      const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(b.screenshot);
      if (!m) return fail("The screenshot must be a PNG, JPEG or WebP image.");
      const bytes = Buffer.from(m[2], "base64");
      if (bytes.length > MAX_SCREENSHOT_BYTES) return fail("The screenshot is too large. Try marking a smaller area.");
      if (!contentMatchesType(new Uint8Array(bytes), m[1])) return fail("That file doesn't look like a real image.");
      attachment = b.screenshot;
      attachmentType = m[1];
    }

    const ctx = (b.context ?? {}) as Record<string, unknown>;
    const context = { url: clean(ctx.url, 300), viewport: clean(ctx.viewport, 40), userAgent: clean(ctx.userAgent, 300) };
    const ticket = await createTicket(user.id, { kind: "bug", subject: title, category: "bug", priority: "normal", body: description, attachment, attachmentType, context });
    return ok(ticket, { status: 201, message: `Thanks — bug report #${ticket.number} sent. Follow it in Support tickets.` });
  } catch (error) {
    const pending = notReady(error);
    if (pending) return pending;
    console.error("[POST /api/agent/support/bugs]", error);
    return fail("Could not send the bug report. Please try again.", 500);
  }
}
