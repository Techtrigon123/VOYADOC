import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { findUserByResetToken, updateUser } from "@/lib/db/repo";
import { hashToken, passwordTooLong } from "@/lib/auth/jwt";

const resetSchema = z.object({
  token: z.string().min(20, "Invalid or expired reset token.").max(200),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = resetSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      const message = parsed.error.issues?.[0]?.message || "Invalid request.";
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
    if (passwordTooLong(parsed.data.password)) {
      return NextResponse.json(
        { success: false, error: "Password is too long (maximum 72 characters)." },
        { status: 400 }
      );
    }

    // Tokens are stored hashed; look up by the hash of what the user presented.
    const user = await findUserByResetToken(hashToken(parsed.data.token));
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    // New hash → new password version → every existing session is signed out.
    // The token is cleared so it can only be used once.
    await updateUser(user.id, {
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      resetToken: undefined,
      resetTokenExpiry: undefined,
    });

    return NextResponse.json({ success: true, message: "Password reset successfully. Please sign in." });
  } catch (error) {
    console.error("[POST /api/auth/reset-password]", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
