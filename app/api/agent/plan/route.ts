import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { findPendingPlanPayment } from "@/lib/db/repo";
import { requireAgent, ok, fail } from "@/lib/agent/server";
import { effectivePlan, isPaidPlan, PAID_PLAN_PRICE_INR } from "@/lib/agent/plans";

/**
 * Plan status, plus UPI payment details when ?plan=gold|platinum.
 * Set PLAN_PAYMENT_UPI_ID and PLAN_PAYMENT_PAYEE_NAME in the environment.
 */
export async function GET(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;

    const pending = await findPendingPlanPayment(user.id);
    const result: Record<string, unknown> = {
      plan: effectivePlan(user),
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() ?? null,
      pending: pending
        ? {
            id: pending.id,
            planId: pending.planId,
            amountInr: pending.amountInr,
            paymentTransactionId: pending.paymentTransactionId,
            proof: pending.proof,
            proofType: pending.proofType,
            createdAt: pending.createdAt.toISOString(),
          }
        : null,
    };

    const plan = req.nextUrl.searchParams.get("plan") ?? "";
    if (isPaidPlan(plan)) {
      const upiId = process.env.PLAN_PAYMENT_UPI_ID?.trim();
      const payee = process.env.PLAN_PAYMENT_PAYEE_NAME?.trim() || "Voyenta";
      const amountInr = PAID_PLAN_PRICE_INR[plan];
      let qr: string | null = null;
      if (upiId) {
        const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payee)}&am=${amountInr}&cu=INR&tn=${encodeURIComponent(`${plan} plan ${user.email}`)}`;
        qr = await QRCode.toDataURL(upiUrl, { margin: 1, width: 320 });
      }
      result.paymentConfig = { planId: plan, planName: plan === "gold" ? "Gold" : "Platinum", amountInr, upiId: upiId ?? null, payee, qr };
    }
    return ok(result);
  } catch (error) {
    console.error("[GET /api/agent/plan]", error);
    return fail("Could not load payment details", 500);
  }
}
