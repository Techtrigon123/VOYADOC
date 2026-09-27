import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createUser, findUserByEmail } from "@/lib/db/repo";
import { signToken, setAuthCookie, passwordVersion, passwordTooLong } from "@/lib/auth/jwt";

const signupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  password: z.string().min(8, "Password must be at least 8 characters."),
  organization: z.string().trim().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, organization } = parsed.data;
    if (passwordTooLong(password)) {
      return NextResponse.json(
        { success: false, error: "Password is too long (maximum 72 characters)." },
        { status: 400 }
      );
    }

    // Check if email already exists
    if (await findUserByEmail(email)) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({
      name,
      email,
      passwordHash,
      organization: organization || undefined,
      companyName: organization || undefined,
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      pv: passwordVersion(passwordHash),
    });

    const response = NextResponse.json(
      {
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
      { status: 201 }
    );
    response.cookies.set(setAuthCookie(token));
    return response;
  } catch (error) {
    console.error("[POST /api/auth/signup]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
