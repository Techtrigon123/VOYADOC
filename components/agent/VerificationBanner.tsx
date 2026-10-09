"use client";

import Link from "next/link";
import { BadgeCheck, Clock, PencilLine, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgent } from "./AgentProvider";
import { VERIFIED_FIELDS, type VerifiedField } from "@/lib/agent/verification-shared";

/**
 * Where the agent's profile review stands. Shows nothing for approved agents with no changes in
 * review, or before the review feature is switched on (migration 0007).
 */
export default function VerificationBanner({ className }: { className?: string }) {
  const { agent } = useAgent();
  const v = agent?.verification;
  if (!v || v.status === "approved") return null;

  const changed = v.changes.map((f) => VERIFIED_FIELDS[f as VerifiedField] ?? f).join(", ");
  const box = {
    not_submitted: {
      tone: "border-slate-200 bg-slate-50 text-slate-800",
      icon: PencilLine,
      title: "Complete your profile to get verified",
      text: "Add your company name, brand logo, address and mobile number. Our team then reviews your details — PDF downloads unlock once you're approved.",
      action: { href: "/dashboard/profile/edit", label: "Complete profile" },
    },
    pending: {
      tone: "border-sky-200 bg-sky-50 text-sky-900",
      icon: Clock,
      title: "Your profile is being reviewed",
      text: "Our team is checking your business and bank details. You can keep creating and saving documents — downloads unlock as soon as you're approved.",
      action: null,
    },
    checked: {
      tone: "border-sky-200 bg-sky-50 text-sky-900",
      icon: Clock,
      title: "Almost there — final approval pending",
      text: "Your details have been checked and are waiting for final approval. Downloads unlock as soon as you're approved.",
      action: null,
    },
    changes_pending: {
      tone: "border-sky-200 bg-sky-50 text-sky-900",
      icon: BadgeCheck,
      title: "Your profile changes are being reviewed",
      text: `You're still verified and can download as usual. Our team is reviewing your new ${changed || "details"}.`,
      action: null,
    },
    changes_checked: {
      tone: "border-sky-200 bg-sky-50 text-sky-900",
      icon: BadgeCheck,
      title: "Your profile changes are being reviewed",
      text: `You're still verified and can download as usual. Your new ${changed || "details"} are waiting for final approval.`,
      action: null,
    },
    denied: {
      tone: "border-rose-200 bg-rose-50 text-rose-900",
      icon: ShieldAlert,
      title: "We couldn't approve your profile yet",
      text: v.note ? `Reason: ${v.note} — update your profile and it goes back for review automatically.` : "Please check your details and update your profile — it goes back for review automatically.",
      action: { href: "/dashboard/profile/edit", label: "Update profile" },
    },
  }[v.status];
  if (!box) return null;
  const Icon = box.icon;

  return (
    <div role="status" className={cn("flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center", box.tone, className)}>
      <Icon className="h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{box.title}</p>
        <p className="mt-0.5 text-sm opacity-90">{box.text}</p>
      </div>
      {box.action ? (
        <Link href={box.action.href} className="inline-flex h-9 shrink-0 items-center rounded-lg bg-[var(--primary)] px-3 text-sm font-semibold text-white">
          {box.action.label}
        </Link>
      ) : null}
    </div>
  );
}
