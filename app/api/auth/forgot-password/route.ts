import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { findUserByEmail, updateUser } from "@/lib/db/repo";
import { hashToken } from "@/lib/auth/jwt";
import { ACCOUNT_RULES, accountKey, checkRateLimit } from "@/lib/rate-limit";

const forgotSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(200),
});

const GENERIC = "If an account exists for that email, a reset link has been sent.";
const RESET_TTL_MS = 1000 * 60 * 60; // 1 hour

export async function POST(req: NextRequest) {
  try {
    const parsed = forgotSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      const message = parsed.error.issues?.[0]?.message || "Invalid request.";
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    // Per-account limit: stops someone spamming one person's inbox from many IPs.
    // Over the limit we still answer generically so the response reveals nothing.
    const limit = await checkRateLimit(ACCOUNT_RULES.forgot, accountKey(parsed.data.email));
    if (!limit.allowed) return NextResponse.json({ success: true, message: GENERIC });

    const user = await findUserByEmail(parsed.data.email);
    // Same response whether or not the email exists, so accounts can't be probed.
    if (!user) return NextResponse.json({ success: true, message: GENERIC });

    // Only the hash is stored, so a database leak can't be used to reset passwords.
    const resetToken = randomBytes(32).toString("base64url");
    await updateUser(user.id, {
      resetToken: hashToken(resetToken),
      resetTokenExpiry: new Date(Date.now() + RESET_TTL_MS),
    });

    const link = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/reset-password/${resetToken}`;
    // TODO: send `link` by email with your email provider (Resend, Brevo, SES…).
    // The token is never returned in the HTTP response. For local testing it is
    // printed to the server terminal only.
    if (process.env.NODE_ENV !== "production") {
      console.info(`[forgot-password] Reset link for ${user.email}: ${link}`);
    }

    return NextResponse.json({ success: true, message: GENERIC });
  } catch (error) {
    console.error("[POST /api/auth/forgot-password]", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
