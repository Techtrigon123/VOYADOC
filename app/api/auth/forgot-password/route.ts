import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findUserByEmail, updateUser } from "@/lib/db/repo";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const GENERIC = "If an account exists, a reset link has been sent.";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues?.[0]?.message || "Invalid request.";
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(parsed.data.email);
    // Same response whether or not the email exists, so accounts can't be probed.
    if (!user) return NextResponse.json({ success: true, message: GENERIC });

    const resetToken = crypto.randomUUID();
    await updateUser(user.id, {
      resetToken,
      resetTokenExpiry: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
    });

    // TODO: send reset email via your email provider
    // For now, return the token in development only
    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json({
      success: true,
      message: isDev ? `Reset link: /reset-password/${resetToken}` : GENERIC,
      ...(isDev ? { resetToken } : {}),
    });
  } catch (error) {
    console.error("[POST /api/auth/forgot-password]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
