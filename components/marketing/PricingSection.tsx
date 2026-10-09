import React from "react";
import Link from "next/link";
import { Check, Lock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedCard from "@/components/ui/AnimatedCard";
import { ALL_SERVICES, GRACE_DAYS, PLANS, SERVICE_LABELS, formatInr } from "@/lib/agent/plans";
import { getAppSettings } from "@/lib/settings";

export default async function PricingSection() {
  const { pricing } = await getAppSettings();
  const plans = PLANS.map((p) => (p.id === "silver" ? p : { ...p, prices: pricing[p.id] }));
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4">Simple pricing, monthly or yearly</h2>
          <p className="max-w-xl mx-auto text-[var(--muted-foreground)]">
            Start free on Silver. Upgrade to Gold or Platinum from your dashboard whenever you&apos;re ready.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const featured = !!plan.featured;
            return (
              <AnimatedCard key={plan.id} delay={index * 100}>
                <div
                  className={cn(
                    "relative rounded-xl border p-6 flex flex-col h-full",
                    featured
                      ? "border-ink bg-white shadow-2xl shadow-brand-300/30 ring-1 ring-ink"
                      : "border-[var(--border)] bg-white",
                  )}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-ink text-brand-neon text-xs font-bold px-3 py-1">
                        <Zap className="h-3 w-3" />
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="mb-5">
                    <h3 className="font-bold text-lg mb-1 text-[var(--foreground)]">{plan.name}</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">{plan.headline}</p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold text-[var(--foreground)]">
                        {plan.prices == null ? "Free" : formatInr(plan.prices.yearly)}
                      </span>
                      {plan.prices != null && (
                        <span className="text-sm mb-1 text-[var(--muted-foreground)]">/year</span>
                      )}
                    </div>
                    <p className="text-xs mt-1 text-[var(--muted-foreground)]">
                      {plan.prices == null ? "Free forever · no card needed" : `or ${formatInr(plan.prices.monthly)}/month · incl. GST · no auto-renew`}
                    </p>
                  </div>

                  <Link
                    href="/signup"
                    className={cn(
                      "mb-6 inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                      plan.prices == null || featured
                        ? "btn-glow"
                        : "border border-slate-300 bg-white text-slate-800 hover:border-brand-400 hover:text-brand-700",
                    )}
                  >
                    {plan.prices == null ? "Start free" : `Start free, upgrade to ${plan.name}`}
                  </Link>

                  <ul className="mb-5 space-y-1.5" aria-label={`Services on ${plan.name}`}>
                    {ALL_SERVICES.map((k) => {
                      const open = plan.services.includes(k);
                      return (
                        <li key={k} className={cn("flex items-center gap-2.5 text-sm", open ? "text-[var(--foreground)]" : "text-slate-400")}>
                          {open ? <Check className="h-4 w-4 shrink-0 text-brand-500" /> : <Lock className="h-3.5 w-3.5 shrink-0" />}
                          {SERVICE_LABELS[k]}
                        </li>
                      );
                    })}
                  </ul>

                  <ul className="space-y-2.5 flex-1 border-t border-[var(--border)] pt-4">
                    {[...plan.highlights.filter((h) => h.label !== "Services").map((h) => `${h.value} ${h.label.toLowerCase()}`), ...plan.features].map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 shrink-0 mt-0.5 text-brand-500" />
                        <span className="text-sm text-[var(--muted-foreground)]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedCard>
            );
          })}
        </div>

        <p className="text-center text-sm text-[var(--muted-foreground)] mt-8">
          Paid plans are paid by UPI and activated once we verify your payment. When a plan ends you get a {GRACE_DAYS.monthly}-day (monthly) or {GRACE_DAYS.yearly}-day (yearly) grace period to renew. See our{" "}
          <Link href="/refunds" className="underline underline-offset-2 hover:text-[var(--foreground)]">
            Refund Policy
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
