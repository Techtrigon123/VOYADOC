import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { checkRateLimit, clientIp, findRule, retryMessage } from "@/lib/rate-limit";

const PROTECTED_PATHS = ["/dashboard", "/setup"];
const AUTH_PATHS = ["/login", "/signup"];
const COOKIE = "checkin_token";

/** Rate-limit every API request; see lib/rate-limit.ts for the rules. */
async function limitApi(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const rule = findRule(pathname, request.method);
  if (!rule) return NextResponse.next();

  const ip = clientIp(request.headers);
  let identity = `ip:${ip}`;
  if (rule.scope === "user") {
    const token = request.cookies.get(COOKIE)?.value;
    const session = token ? verifyToken(token) : null;
    if (session?.userId) identity = `user:${session.userId}`;
  }

  const result = await checkRateLimit(rule, identity);
  const headers = {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(result.resetIn),
  };

  if (!result.allowed) {
    const message = retryMessage(result.resetIn);
    // Auth pages read `error` as a string; the agent panel reads `error.message`.
    const error = pathname.startsWith("/api/auth/") ? message : { message, code: "RATE_LIMITED" };
    return NextResponse.json(
      { success: false, error },
      { status: 429, headers: { ...headers, "Retry-After": String(result.resetIn) } }
    );
  }

  const response = NextResponse.next();
  for (const [k, v] of Object.entries(headers)) response.headers.set(k, v);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) return limitApi(request);

  const token = request.cookies.get(COOKIE)?.value;
  const session = token ? verifyToken(token) : null;

  // Redirect to login if accessing protected path without session
  const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if already authenticated and hitting auth pages
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
