import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { checkRateLimit, clientIp, findRule, retryMessage } from "@/lib/rate-limit";

const PROTECTED_PATHS = ["/dashboard", "/setup"];
const AUTH_PATHS = ["/login", "/signup"];
const COOKIE = "checkin_token";

const MB = 1024 * 1024;
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Largest request body each API route needs (uploads are base64, ~1.37× the file). */
function maxBodyBytes(pathname: string): number {
  if (pathname === "/api/agent/extract") return 11 * MB; // 10 MB file upload
  if (pathname === "/api/agent/plan/submit") return 5 * MB; // 3 MB payment proof
  if (pathname === "/api/agent/profile") return 5 * MB; // logo + stamp images
  if (pathname.startsWith("/api/agent/documents")) return 1 * MB;
  return 256 * 1024;
}

function apiError(pathname: string, status: number, message: string, code: string) {
  // Auth pages read `error` as a string; the agent panel reads `error.message`.
  const error = pathname.startsWith("/api/auth/") ? message : { message, code };
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * Reject cross-site writes. The SameSite=strict cookie already stops most CSRF;
 * this is a second layer that also covers requests carrying no cookie.
 */
function crossSite(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false; // same-origin fetches from older browsers, curl, server-to-server
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

/** Rate-limit every API request; see lib/rate-limit.ts for the rules. */
async function limitApi(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (WRITE_METHODS.has(request.method)) {
    if (crossSite(request)) return apiError(pathname, 403, "Cross-site request blocked.", "CROSS_SITE");
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > maxBodyBytes(pathname))
      return apiError(pathname, 413, "That request is too large. Try a smaller file.", "TOO_LARGE");
  }

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
    const res = apiError(pathname, 429, retryMessage(result.resetIn), "RATE_LIMITED");
    for (const [k, v] of Object.entries({ ...headers, "Retry-After": String(result.resetIn) })) res.headers.set(k, v);
    return res;
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
