import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createUser, findUserByEmail } from "@/lib/db/repo";
import { signToken, setAuthCookie } from "@/lib/auth/jwt";

const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  organization: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, organization } = parsed.data;

    // Check if email already exists
    if (await findUserByEmail(email)) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const user = await createUser({
      name: name.trim(),
      email,
      passwordHash: await bcrypt.hash(password, 12),
      organization: organization?.trim() || undefined,
      companyName: organization?.trim() || undefined,
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
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
