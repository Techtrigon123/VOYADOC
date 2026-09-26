import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth/jwt";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(clearAuthCookie());
  return response;
}

// Plain links (`<a href="/api/auth/logout">`) issue a GET — sign out and land on login.
export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", req.url));
  response.cookies.set(clearAuthCookie());
  return response;
}
