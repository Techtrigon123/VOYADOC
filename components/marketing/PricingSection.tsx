"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AnimatedCard from "@/components/ui/AnimatedCard";

const plans = [
  {
    name: "Starter",
    description: "For individual travel agents getting started.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    unit: "5 documents/month",
    features: [
      "5 documents per month",
      "Basic document types",
      "PDF download",
      "Email support",
    ],
    cta: "Create free account",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Professional",
    description: "For active travel agents and small agencies.",
    monthlyPrice: 499,
    yearlyPrice: 349,
    unit: "200 documents/month",
    features: [
      "200 documents per month",
      "All document types",
      "Brand customization",
      "Bulk export",
      "Priority support",
      "Document history",
    ],
    cta: "Start Pro trial",
    href: "/signup?plan=pro",
    highlighted: true,
    badge: "Most popular",
  },
  {
    name: "Business",
    description: "For travel agencies and tour operators.",
    monthlyPrice: 1499,
    yearlyPrice: 999,
    unit: "1,000 documents/month",
    features: [
      "1,000 documents per month",
      "All document types",
      "Custom branding",
      "Team access",
      "API access",
      "Dedicated support",
      "SLA",
    ],
    cta: "Start Business trial",
    href: "/signup?plan=business",
    highlighted: false,
  },
];

export default function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4">
            Simple, transparent pricing
          </h2>
          <p className="max-w-xl mx-auto text-[var(--muted-foreground)] mb-8">
            Start free. Upgrade when you need more documents and features.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 rounded-lg border border-[var(--border)] bg-slate-50 p-1">
            <button
              onClick={() => setYearly(false)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                !yearly
                  ? "bg-white text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-2",
                yearly
                  ? "bg-white text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              Yearly
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                Save ~30%
              </span>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <AnimatedCard key={plan.name} delay={index * 100}>
              <div
                className={cn(
                  "relative rounded-xl border p-6 flex flex-col h-full",
                  plan.highlighted
                    ? "border-[var(--primary)] bg-indigo-600 text-white shadow-xl shadow-indigo-200"
                    : "border-[var(--border)] bg-white"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1">
                      <Zap className="h-3 w-3" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3
                    className={cn(
                      "font-bold text-lg mb-1",
                      plan.highlighted ? "text-white" : "text-[var(--foreground)]"
                    )}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={cn(
                      "text-sm",
                      plan.highlighted ? "text-indigo-200" : "text-[var(--muted-foreground)]"
                    )}
                  >
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span
                      className={cn(
                        "text-4xl font-bold",
                        plan.highlighted ? "text-white" : "text-[var(--foreground)]"
                      )}
                    >
                      {plan.monthlyPrice === 0 ? "Free" : `₹${yearly ? plan.yearlyPrice : plan.monthlyPrice}`}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span
                        className={cn(
                          "text-sm mb-1",
                          plan.highlighted ? "text-indigo-200" : "text-[var(--muted-foreground)]"
                        )}
                      >
                        /mo
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-xs mt-1",
                      plan.highlighted ? "text-indigo-200" : "text-[var(--muted-foreground)]"
                    )}
                  >
                    {plan.unit}
                  </p>
                </div>

                <Link href={plan.href} className="mb-6">
                  <Button
                    className={cn(
                      "w-full",
                      plan.highlighted
                        ? "bg-white text-indigo-600 hover:bg-indigo-50"
                        : ""
                    )}
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0 mt-0.5",
                          plan.highlighted ? "text-indigo-200" : "text-emerald-500"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm",
                          plan.highlighted ? "text-indigo-100" : "text-[var(--muted-foreground)]"
                        )}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedCard>
          ))}
        </div>

        <p className="text-center text-sm text-[var(--muted-foreground)] mt-8">
          Free plan does not require a credit card. Paid plans include a 7-day trial.
        </p>
      </div>
    </section>
  );
}