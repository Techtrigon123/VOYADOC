import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

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

    await connectDB();

    const user = await User.findOne({
      resetToken: parsed.data.token,
      resetTokenExpiry: { $gt: new Date() },
    }).select("+password");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
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
