import "server-only";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import { cookies } from "next/headers";
import type { AuthSession } from "@/types";

const COOKIE_NAME = "checkin_token";
const ALGORITHM = "HS256" as const;

/**
 * The signing secret must come from the environment. A built-in fallback would
 * be public (it is in the source code) and let anyone forge a login.
 */
function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "JWT_SECRET is missing or shorter than 32 characters. Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    );
  }
  return s;
}

/**
 * Short fingerprint of the stored password hash, embedded in every session.
 * Changing or resetting the password changes the hash, so all older sessions
 * stop matching and are rejected.
 */
export function passwordVersion(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("base64url").slice(0, 16);
}

export function signToken(payload: AuthSession): string {
  return jwt.sign(payload, secret(), { expiresIn: "30d", algorithm: ALGORITHM });
}

export function verifyToken(token: string): AuthSession | null {
  try {
    return jwt.verify(token, secret(), { algorithms: [ALGORITHM] }) as AuthSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setAuthCookie(token: string): {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict";
  maxAge: number;
  path: string;
} {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  };
}

export function clearAuthCookie(): {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict";
  maxAge: number;
  path: string;
} {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  };
}

/** SHA-256 of a one-time token (password reset). Only the hash is stored. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** bcrypt ignores everything past 72 bytes; reject longer passwords instead of silently truncating. */
export function passwordTooLong(password: string): boolean {
  return Buffer.byteLength(password, "utf8") > 72;
}
