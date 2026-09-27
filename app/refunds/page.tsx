import Link from "next/link";
import { FileText } from "lucide-react";

export const metadata = {
  title: "Refund Policy",
  description: "Refund Policy for TravelDoc Pro subscriptions",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 flex items-center px-6 border-b border-[var(--border)] bg-white">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)]">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-base text-[var(--foreground)]">
            TravelDoc<span className="text-[var(--primary)]">Pro</span>
          </span>
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 space-y-6">
        <h1 className="text-2xl font-bold">Refund Policy</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Last updated: September 2026
        </p>

        <section className="space-y-3 text-sm leading-relaxed text-[var(--foreground)]">
          <h2 className="text-base font-semibold">Silver plan</h2>
          <p>
            The Silver plan is free. No payment is taken, so there is nothing to refund.
          </p>

          <h2 className="text-base font-semibold pt-2">Gold and Platinum plans</h2>
          <p>
            Gold and Platinum are yearly subscriptions paid in advance. Your plan is activated once we
            verify your payment, and its benefits run for one year from that date.
          </p>
          <p>
            If your payment could not be verified, or you were charged more than once for the same
            plan, we will refund the extra or unverified amount to the original payment method.
          </p>
          <p>
            Other refund requests are reviewed on a case-by-case basis, as described in our{" "}
            <Link href="/terms" className="text-[var(--primary)] hover:underline">Terms of Service</Link>.
            Documents you have already created and downloaded cannot be returned, so partial-year
            refunds are not guaranteed.
          </p>

          <h2 className="text-base font-semibold pt-2">How to request a refund</h2>
          <p>
            Send us your registered email, the plan you paid for and your UPI or bank transaction ID
            through our <Link href="/contact" className="text-[var(--primary)] hover:underline">contact page</Link>.
            We aim to reply within 3 working days. Approved refunds are usually credited within 7–10
            working days, depending on your bank.
          </p>
        </section>

        <Link href="/" className="inline-block text-sm text-[var(--primary)] hover:underline">
          ← Back to homepage
        </Link>
      </main>

      <footer className="py-4 text-center text-xs text-[var(--muted-foreground)]">
        © {new Date().getFullYear()} TravelDoc Pro
      </footer>
    </div>
  );
}
