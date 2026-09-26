import { NextRequest } from "next/server";
import PlanPayment from "@/models/PlanPayment";
import { requireAgent, ok, fail } from "@/lib/agent/server";
import { isPaidPlan, PAID_PLAN_PRICE_INR } from "@/lib/agent/plans";

const MAX_PROOF_BYTES = 3 * 1024 * 1024;

/** Submit (or edit) payment proof for a paid plan. Our team verifies it and activates the plan. */
export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const planId = String(body?.planId ?? "");
    const txn = String(body?.paymentTransactionId ?? "").trim();
    const proof = body?.proof;

    if (!isPaidPlan(planId)) return fail("Choose Gold or Platinum.");
    if (!txn) return fail("Please enter the transaction ID from your payment app.");

    const existing = await PlanPayment.findOne({ agentId: user._id, status: "pending", planId });
    const hasNewProof = typeof proof === "string" && proof.length > 0;
    if (!existing && !hasNewProof) return fail("Please upload a screenshot of your payment.");
    if (hasNewProof) {
      const okType = /^data:(image\/(png|jpe?g|webp|gif)|application\/pdf);base64,/.test(proof as string);
      if (!okType || (proof as string).length > MAX_PROOF_BYTES * 1.4)
        return fail("Upload a PNG, JPG, WebP image or PDF under 3 MB.");
    }

    const proofType = hasNewProof ? (proof as string).slice(5, (proof as string).indexOf(";")) : undefined;
    let payment;
    if (existing) {
      existing.paymentTransactionId = txn;
      if (hasNewProof) {
        existing.proof = proof as string;
        existing.proofType = proofType!;
      }
      payment = await existing.save();
    } else {
      payment = await PlanPayment.create({
        agentId: user._id,
        planId,
        amountInr: PAID_PLAN_PRICE_INR[planId],
        paymentTransactionId: txn,
        proof: proof as string,
        proofType,
      });
    }

    return ok(
      {
        id: payment._id.toString(),
        planId: payment.planId,
        amountInr: payment.amountInr,
        paymentTransactionId: payment.paymentTransactionId,
        proof: payment.proof,
        proofType: payment.proofType,
        createdAt: payment.createdAt.toISOString(),
      },
      { message: existing ? "Payment details updated." : "Payment proof received. We will verify it and activate your plan on your account shortly." }
    );
  } catch (error) {
    console.error("[POST /api/agent/plan/submit]", error);
    return fail("Upload failed. Please try again.", 500);
  }
}
