import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { requireAgent, ok, fail } from "@/lib/agent/server";
import { findUserWithPassword, updateUser } from "@/lib/db/repo";
import { passwordTooLong, passwordVersion, setAuthCookie, signToken } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const current = String(body?.currentPassword ?? "");
    const next = String(body?.newPassword ?? "");
    if (next.length < 8) return fail("New password must be at least 8 characters.");
    if (passwordTooLong(next)) return fail("New password is too long (maximum 72 characters).");

    const withPassword = await findUserWithPassword({ id: user.id });
    if (!withPassword) return fail("Account not found.", 404);
    if (!(await bcrypt.compare(current, withPassword.passwordHash)))
      return fail("Your current password is incorrect.", 400, "WRONG_PASSWORD");

    const passwordHash = await bcrypt.hash(next, 12);
    await updateUser(user.id, { passwordHash });

    // The new hash signs out every other device. Re-issue this device's session
    // so the person who changed the password stays signed in here.
    const res = ok(true, { message: "Your password has been updated." });
    res.cookies.set(
      setAuthCookie(
        signToken({ userId: user.id, email: user.email, name: user.name, role: user.role, pv: passwordVersion(passwordHash) })
      )
    );
    return res;
  } catch (error) {
    console.error("[POST /api/agent/change-password]", error);
    return fail("Could not update your password. Please try again.", 500);
  }
}
