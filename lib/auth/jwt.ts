import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { AuthSession } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const COOKIE_NAME = "checkin_token";

export function signToken(payload: AuthSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): AuthSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthSession;
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
