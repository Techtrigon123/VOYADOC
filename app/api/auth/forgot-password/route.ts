import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/models/User";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

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

    await connectDB();

    const user = await User.findOne({ email: parsed.data.email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "No account found with that email." },
        { status: 404 }
      );
    }

    const resetToken = crypto.randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await User.findByIdAndUpdate(user._id, {
      resetToken,
      resetTokenExpiry,
    });

    // TODO: send reset email via your email provider
    // For now, return the token in development only
    const isDev = process.env.NODE_ENV !== "production";
    const message = isDev
      ? `Reset link: /reset-password/${resetToken}`
      : "If an account exists, a reset link has been sent.";

    return NextResponse.json({
      success: true,
      message,
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
