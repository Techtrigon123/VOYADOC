import { NextRequest } from "next/server";
import {
  requireAgent,
  serializeAgent,
  refreshAgentState,
  ok,
  fail,
  validImageDataUrl,
} from "@/lib/agent/server";

const TEXT_FIELDS = [
  "name", "landlineNumber", "brandName", "companyName", "address", "city", "state", "country",
  "pincode", "gstNumber", "iataNumber", "bankAccountHolder", "bankName", "bankAccountNumber",
  "bankIfscCode", "bankBranchAddress", "paymentUpi",
] as const;

/**
 * Edit profile. Only keys present in the body change. `brandLogo` / `companyStamp`
 * accept an image data URL, or null to remove. Mobile is fixed after quick setup.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return fail("Invalid request body.");

    for (const key of TEXT_FIELDS) {
      if (key in body) {
        const v = String(body[key] ?? "").trim();
        if (v.length > 500) return fail(`${key} is too long.`);
        (user as unknown as Record<string, unknown>)[key] = v || undefined;
      }
    }
    if ("name" in body && String(body.name ?? "").trim().length < 2)
      return fail("Name must be at least 2 characters.");
    if ("gstNumber" in body && user.gstNumber) user.gstNumber = user.gstNumber.toUpperCase();
    if ("bankIfscCode" in body && user.bankIfscCode) user.bankIfscCode = user.bankIfscCode.toUpperCase();

    for (const key of ["brandLogo", "companyStamp"] as const) {
      if (!(key in body)) continue;
      const v = body[key];
      if (v === null || v === "") {
        user[key] = undefined;
      } else if (validImageDataUrl(v)) {
        user[key] = v;
      } else {
        return fail(
          key === "brandLogo"
            ? "Could not save your brand logo. Please try a clear PNG or JPG under 5 MB."
            : "Could not save your company stamp. Please try again."
        );
      }
    }

    await user.save();
    await refreshAgentState(user);
    return ok(serializeAgent(user));
  } catch (error) {
    console.error("[PATCH /api/agent/profile]", error);
    return fail("Failed to update profile. Please try again.", 500);
  }
}
