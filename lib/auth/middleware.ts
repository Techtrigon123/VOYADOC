import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./jwt";
import type { AuthSession } from "@/types";

/**
 * Next 16 passes route params as a Promise. Resolve them here so wrapped
 * handlers keep receiving a plain `params` object.
 */
export function withAuth<P extends Record<string, string> = Record<string, string>>(
  handler: (
    req: NextRequest,
    context: { session: AuthSession; params?: P }
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: { params: Promise<P> }) => {
    const token = req.cookies.get("checkin_token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = verifyToken(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session expired. Please log in again." },
        { status: 401 }
      );
    }

    const params = context?.params ? await context.params : undefined;
    return handler(req, { session, params });
  };
}
