import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { findUserWithPassword } from "@/lib/db/repo";
import { signToken, setAuthCookie, passwordVersion } from "@/lib/auth/jwt";
import { ACCOUNT_RULES, accountKey, checkRateLimit, retryMessage } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

// Compared against when the email doesn't exist, so response time doesn't reveal
// which emails are registered.
let dummyHash: string | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync("not-a-real-password", 12));

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Per-account limit (on top of the per-IP limit in proxy.ts).
    const limit = await checkRateLimit(ACCOUNT_RULES.login, accountKey(email));
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: retryMessage(limit.resetIn) },
        { status: 429, headers: { "Retry-After": String(limit.resetIn) } }
      );
    }

    const user = await findUserWithPassword({ email });
    const valid = await bcrypt.compare(password, user?.passwordHash ?? getDummyHash());

    // Same message for unknown email and wrong password to avoid user enumeration.
    if (!user || !valid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }
    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { success: false, error: "Your account is suspended. Please contact support." },
        { status: 403 }
      );
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      pv: passwordVersion(user.passwordHash),
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
    response.cookies.set(setAuthCookie(token));
    return response;
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
