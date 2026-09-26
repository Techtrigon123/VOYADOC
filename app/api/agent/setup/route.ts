import { NextRequest } from "next/server";
import { requireAgent, serializeAgent, refreshAgentState, ok, fail } from "@/lib/agent/server";
import { isPartnerType, normalizeMobile } from "@/lib/agent/profile";

/** Quick setup (Role → Profile). */
export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return fail("Invalid request body.");

    const str = (k: string) => String(body[k] ?? "").trim();
    const partnerType = str("partnerType");
    const partnerTypeOther = str("partnerTypeOther");
    const mobile = normalizeMobile(str("mobile"));

    if (!isPartnerType(partnerType)) return fail("Please tell us who you are");
    if (partnerType === "other" && partnerTypeOther.length < 2) return fail("Please tell us what best describes you");
    if (str("name").length < 2) return fail("Please enter your name");
    if (str("companyName").length < 2) return fail("Please enter your company name");
    if (mobile.length !== 10) return fail("Please enter a valid 10-digit phone number");
    if (!str("state")) return fail("Please select your state");
    if (str("city").length < 2) return fail("Please enter your city");

    user.name = str("name");
    user.companyName = str("companyName");
    user.brandName = str("brandName") || undefined;
    user.partnerType = partnerType;
    user.partnerTypeOther = partnerType === "other" ? partnerTypeOther : undefined;
    user.mobile = mobile;
    user.state = str("state");
    user.city = str("city");
    await user.save();
    await refreshAgentState(user);

    return ok(serializeAgent(user));
  } catch (error) {
    console.error("[POST /api/agent/setup]", error);
    return fail("Could not save your details. Please try again.", 500);
  }
}
