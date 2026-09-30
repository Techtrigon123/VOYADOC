import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { GRACE_DAYS, PLAN_PRICES_INR, formatInr } from "@/lib/agent/plans";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "When and how Voyenta refunds Gold and Platinum plan payments, and how to request a refund for a duplicate or unverified UPI payment.",
  alternates: { canonical: "/refunds" },
};

const sections: LegalSection[] = [
  {
    id: "silver",
    title: "Silver plan",
    body: <p>The Silver plan is free. No payment is taken, so there is nothing to refund.</p>,
  },
  {
    id: "paid-plans",
    title: "Gold and Platinum plans",
    body: (
      <>
        <p>
          Gold ({formatInr(PLAN_PRICES_INR.gold.monthly)}/month or {formatInr(PLAN_PRICES_INR.gold.yearly)}/year) and Platinum
          ({formatInr(PLAN_PRICES_INR.platinum.monthly)}/month or {formatInr(PLAN_PRICES_INR.platinum.yearly)}/year) are paid in
          advance. Your plan is activated once we verify your payment, and its benefits run for one month or one year from that
          date, depending on the billing you chose. Plans do not renew automatically, so you are never charged again without
          choosing to. After a plan ends it keeps working for a grace period ({GRACE_DAYS.monthly} days for monthly,{" "}
          {GRACE_DAYS.yearly} days for yearly) so you can renew without interruption.
        </p>
        <ul>
          <li>
            <strong>Unverified payment:</strong> if we cannot verify your payment and do not activate your plan, we refund the
            full amount.
          </li>
          <li>
            <strong>Duplicate payment:</strong> if you were charged more than once for the same plan, we refund the extra
            amount.
          </li>
          <li>
            <strong>Other requests</strong> are reviewed case by case. Because documents you create and download can&apos;t be
            returned, refunds for part of a month or year are not guaranteed.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "how-to-request",
    title: "How to request a refund",
    body: (
      <p>
        Send us your registered email, the plan you paid for and your UPI or bank transaction ID through our{" "}
        <Link href="/contact">contact page</Link>. We aim to reply within 3 working days. Approved refunds are credited to the
        original payment method, usually within 7–10 working days depending on your bank.
      </p>
    ),
  },
  {
    id: "more",
    title: "More information",
    body: (
      <p>
        This policy forms part of our <Link href="/terms">Terms and Conditions</Link>.
      </p>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund Policy"
      intro={<p>How refunds work for Voyenta plans, and how to ask for one.</p>}
      sections={sections}
    />
  );
}
