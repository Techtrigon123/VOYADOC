import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { findUserByResetToken, updateUser } from "@/lib/db/repo";

const resetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues?.[0]?.message || "Invalid request.";
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      );
    }

    const user = await findUserByResetToken(parsed.data.token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    await updateUser(user.id, {
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      resetToken: undefined,
      resetTokenExpiry: undefined,
    });

    return NextResponse.json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    console.error("[POST /api/auth/reset-password]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
