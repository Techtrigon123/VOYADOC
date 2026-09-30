import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { findPendingPlanPayment, hasColumn } from "@/lib/db/repo";
import { requireAgent, ok, fail } from "@/lib/agent/server";
import { freeUsage } from "@/lib/agent/entitlements";
import { isPaidPlan, normalizeCycle, PLAN_PRICES_INR, PLAN_SERVICES, planName, subscriptionState } from "@/lib/agent/plans";

/**
 * Plan status (subscription state, grace period, free allowance, open services),
 * plus UPI payment details when ?plan=gold|platinum&cycle=monthly|yearly.
 * Set PLAN_PAYMENT_UPI_ID and PLAN_PAYMENT_PAYEE_NAME in the environment.
 */
export async function GET(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;

    const [pending, usage, monthlyAvailable] = await Promise.all([
      findPendingPlanPayment(user.id),
      freeUsage(user),
      hasColumn("plan_payments", "billing_cycle"),
    ]);
    const subscription = subscriptionState(user);
    const result: Record<string, unknown> = {
      plan: subscription.plan,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() ?? null,
      subscription,
      freeUsage: usage,
      services: PLAN_SERVICES[subscription.plan],
      monthlyAvailable,
      pending: pending
        ? {
            id: pending.id,
            planId: pending.planId,
            billingCycle: normalizeCycle(pending.billingCycle),
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
      const cycle = monthlyAvailable ? normalizeCycle(req.nextUrl.searchParams.get("cycle")) : "yearly";
      const upiId = process.env.PLAN_PAYMENT_UPI_ID?.trim();
      const payee = process.env.PLAN_PAYMENT_PAYEE_NAME?.trim() || "Voyenta";
      const amountInr = PLAN_PRICES_INR[plan][cycle];
      let qr: string | null = null;
      if (upiId) {
        const note = `${plan} ${cycle} plan ${user.email}`;
        const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payee)}&am=${amountInr}&cu=INR&tn=${encodeURIComponent(note)}`;
        qr = await QRCode.toDataURL(upiUrl, { margin: 1, width: 320 });
      }
      result.paymentConfig = { planId: plan, planName: planName(plan), cycle, amountInr, upiId: upiId ?? null, payee, qr };
    }
    return ok(result);
  } catch (error) {
    console.error("[GET /api/agent/plan]", error);
    return fail("Could not load payment details", 500);
  }
}
