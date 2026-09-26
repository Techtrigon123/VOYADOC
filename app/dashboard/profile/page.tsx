"use client";

import React from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CreditCard,
  Globe,
  Hash,
  Landmark,
  LayoutDashboard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Tag,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgent } from "@/components/agent/AgentProvider";
import { useActivation } from "@/components/agent/ActivationGuide";
import { AgentAvatar } from "@/components/agent/AgentNavbar";
import { PageHeader, PageShell, SectionCard, primaryBtn, secondaryBtn } from "@/components/agent/ui";
import {
  activationAction,
  activationMessage,
  activationProgress,
  agencyLine,
  agentHasPaymentInfo,
  displayName,
  isActive,
  partnerTypeLabel,
  profileStrength,
  statusLabel,
  statusTooltip,
  verifyMessage,
  verifyTooltip,
} from "@/lib/agent/profile";
import { formatDay } from "@/lib/agent/client";

function Row({ label, value, icon: Icon }: { label: string; value?: string; icon: LucideIcon }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="break-words text-sm font-medium text-slate-900">{value?.trim() || "—"}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { agent } = useAgent();
  const activation = useActivation();
  if (!agent) return null;

  const strength = profileStrength(agent);
  const actMsg = activationMessage(agent);
  const actAction = activationAction(agent);
  const actProgress = activationProgress(agent);
  const verify = verifyMessage(agent);
  const partner = partnerTypeLabel(agent.partnerType, agent.partnerTypeOther);
  const fullAddress = [agent.address, agent.city, agent.state, agent.pincode, agent.country].map((v) => v?.trim()).filter(Boolean).join(", ");

  return (
    <PageShell>
      <PageHeader
        eyebrow="Your account"
        title="Agent Profile"
        description="Your agency profile, contact details, and business information at a glance."
        actions={
          <>
            <Link href="/dashboard" className={secondaryBtn}>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/dashboard/profile/edit" className={primaryBtn}>
              <Pencil className="h-4 w-4" /> Edit profile
            </Link>
          </>
        }
      />

      <div className="space-y-5">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="h-20 bg-gradient-to-r from-orange-400 via-[var(--primary)] to-amber-400" />
          <div className="flex flex-col gap-5 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
            <div className="-mt-10 flex items-end gap-4">
              <span className="rounded-full bg-white p-1 shadow-md">
                <AgentAvatar agent={agent} size={84} />
              </span>
              <div className="min-w-0 pb-1">
                <p className="text-xs font-medium text-slate-500">Welcome back</p>
                <h2 className="text-xl font-bold text-slate-900">{displayName(agent)}</h2>
                <p className="text-sm text-slate-500">{agencyLine(agent, "Complete your profile to build trust with hotels and clients")}</p>
              </div>
            </div>
            <div className="w-full max-w-xs">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Profile strength</span>
                <span className="text-base font-bold tabular-nums text-orange-600">{strength}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-orange-100" aria-label="Profile completeness" role="progressbar" aria-valuenow={strength}>
                <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${strength}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {strength < 100 ? "Add missing details in profile settings to look more professional on vouchers and invoices." : "Your profile is complete."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-5 py-3 sm:px-6">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
              <CalendarDays className="h-3.5 w-3.5" /> Registered {formatDay(agent.createdAt)}
            </span>
            <span title={statusTooltip(agent)} className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", isActive(agent.status) ? "bg-emerald-600 text-white" : "border border-slate-200 text-slate-600")}>
              {statusLabel(agent.status)}
            </span>
            {partner ? <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600">{partner}</span> : null}
            <span title={verifyTooltip(agent)} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", agent.isVerified ? "bg-sky-600 text-white" : "border border-amber-200 bg-amber-50 text-amber-700")}>
              {agent.isVerified ? <BadgeCheck className="h-3.5 w-3.5" /> : null}
              {agent.isVerified ? "Verified" : agent.partnerType === "other" ? "Under review" : "Pending verification"}
            </span>
            {agent.isVerified && agent.agentLevel ? <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600">{agent.agentLevel}</span> : null}
          </div>
        </div>

        {actMsg ? (
          <div className="flex flex-col gap-3 rounded-3xl border border-orange-200 bg-orange-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">Activate your account</p>
              <p className="text-sm text-slate-600">{actMsg}</p>
              <p className="mt-1 text-xs text-slate-500">
                {actProgress.completed} of {actProgress.total} steps done · {actProgress.percent}% ready
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={activation.openDialog} className={primaryBtn}>Show me where</button>
              {actAction ? <Link href={actAction.href} className={secondaryBtn}>{actAction.label}</Link> : null}
            </div>
          </div>
        ) : null}

        {verify ? (
          <div className="rounded-3xl border border-sky-200 bg-sky-50/60 p-5">
            <p className="font-semibold text-slate-900">Get your Verified badge</p>
            <p className="text-sm text-slate-600">{verify}</p>
            <Link href="/dashboard/profile/edit" className="mt-1 inline-block text-sm font-semibold text-sky-700 hover:underline">Edit profile</Link>
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <SectionCard title="Account & contact" description="How hotels and clients can reach you" icon={UserRound}>
            <div className="divide-y divide-slate-100">
              <Row label="Mobile" value={agent.mobile} icon={Phone} />
              <Row label="Full name" value={agent.name} icon={UserRound} />
              <Row label="Company email" value={agent.email} icon={Mail} />
              <Row label="Landline" value={agent.landlineNumber} icon={Phone} />
              <Row label="City" value={agent.city} icon={MapPin} />
            </div>
          </SectionCard>
          <SectionCard title="Business" description="Registered agency and tax details" icon={Building2}>
            <div className="divide-y divide-slate-100">
              <Row label="Company name" value={agent.companyName} icon={Building2} />
              <Row label="Brand name" value={agent.brandName} icon={Tag} />
              <Row label="GST number" value={agent.gstNumber} icon={Hash} />
              <Row label="IATA number" value={agent.iataNumber} icon={Hash} />
            </div>
          </SectionCard>
          <SectionCard title="Address" description="Your registered business location" icon={MapPin}>
            <Row label="Full address" value={fullAddress} icon={MapPin} />
            <div className="grid grid-cols-3 gap-2 border-t border-slate-100">
              <Row label="Country" value={agent.country} icon={Globe} />
              <Row label="State" value={agent.state} icon={MapPin} />
              <Row label="Pincode" value={agent.pincode} icon={MapPin} />
            </div>
          </SectionCard>
          {agentHasPaymentInfo(agent) ? (
            <SectionCard title="Payment details" description="Shown on invoices and proforma PDFs" icon={CreditCard}>
              <div className="grid grid-cols-2 gap-x-4">
                <Row label="Account holder" value={agent.bankAccountHolder} icon={UserRound} />
                <Row label="Bank name" value={agent.bankName} icon={Landmark} />
                <Row label="Account number" value={agent.bankAccountNumber} icon={CreditCard} />
                <Row label="IFSC" value={agent.bankIfscCode} icon={Hash} />
                <Row label="Branch" value={agent.bankBranchAddress} icon={MapPin} />
                <Row label="UPI ID" value={agent.paymentUpi} icon={CreditCard} />
              </div>
            </SectionCard>
          ) : (
            <div className="flex flex-col justify-between gap-3 rounded-3xl border border-dashed border-slate-300 bg-white p-6">
              <div>
                <p className="font-semibold text-slate-900">Payment details not added</p>
                <p className="mt-1 text-sm text-slate-500">Add bank or UPI details in your profile so they appear on invoices and proforma PDFs for your clients.</p>
              </div>
              <Link href="/dashboard/profile/edit#profile-payment" className={cn(secondaryBtn, "w-fit")}>Add payment info</Link>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
