"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, Crown, Download, FileText, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAgent } from "@/components/agent/AgentProvider";
import { KIND_ICONS, type AccessSummary } from "@/components/agent/DocumentAccessWarning";
import { PageHeader, PageShell, primaryBtn, secondaryBtn } from "@/components/agent/ui";
import { api, downloadPdf, formatDay } from "@/lib/agent/client";
import { accessLabel, formatInr, PAID_PLAN_PRICE_INR } from "@/lib/agent/plans";
import { StatsListSkeleton } from "@/components/agent/skeletons";

export default function DocumentAccessPage() {
  const { agent } = useAgent();
  const router = useRouter();
  const [summary, setSummary] = useState<AccessSummary | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void api<AccessSummary>("/api/agent/document-access").then((r) => {
      if (r.success && r.data) setSummary(r.data);
      else setError(r.error?.message || "We could not load your file access status. Please try again.");
    });
  }, []);

  if (!agent) return null;
  const paid = agent.subscriptionPlan !== "silver";

  const download = async (id: string) => {
    setBusy(id);
    const err = await downloadPdf(id);
    setBusy(null);
    if (err) toast.error("Download failed", { description: err });
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow={`File access · ${agent.subscriptionPlan.charAt(0).toUpperCase()}${agent.subscriptionPlan.slice(1)}`}
        title="Your document access overview"
        description={paid ? "Your plan keeps every file open forever." : "On Silver, PDFs stay open for 30 days from creation. Your files are never deleted — they are only hidden after the access window."}
      />

      {error ? (
        <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>
      ) : !summary ? (
        <StatsListSkeleton label="Loading file access status" />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "At risk", sub: "Files closing or locked", value: summary.totalAtRiskCount, icon: AlertTriangle, tone: "text-rose-600 bg-rose-50" },
              { label: "Closing soon", sub: "Still open — download now", value: summary.expiringSoonCount, icon: Clock, tone: "text-orange-600 bg-orange-50" },
              { label: "Urgent", sub: "3 days or less", value: summary.urgentCount, icon: Lock, tone: "text-slate-600 bg-slate-100" },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", c.tone)}>
                  <c.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-slate-900">{c.value}</p>
                  <p className="text-xs text-slate-500">{c.label} · {c.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {!paid ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold text-slate-900">How Silver file access works</h2>
              <ol className="mt-3 grid gap-3 sm:grid-cols-3">
                {[
                  ["Step 1", "You create a PDF", "Voucher, invoice, air ticket, receipt, and more."],
                  ["Step 2", `${summary.retentionDays} days open`, "View and download freely during this period."],
                  ["Step 3", "Access pauses", "File stays saved. Upgrade to Gold or Platinum to open it again."],
                ].map(([k, t, d]) => (
                  <li key={k} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-600">{k}</p>
                    <p className="mt-1 font-semibold text-slate-900">{t}</p>
                    <p className="text-sm text-slate-500">{d}</p>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {summary.samples.length === 0 ? (
            <div className="flex flex-col items-center rounded-3xl border border-emerald-200 bg-emerald-50/50 px-6 py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="mt-3 text-lg font-semibold text-slate-900">All your files are accessible</p>
              <p className="mt-1 max-w-md text-sm text-slate-500">Nothing is closing soon or locked right now. You can keep creating and downloading from your document library.</p>
              <Link href="/dashboard#agent-activation-documents" className={`${secondaryBtn} mt-4`}>Go to documents</Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-semibold text-slate-900">Files closing or locked</h2>
                <p className="text-sm text-slate-500">These files are still open until the date shown. Locked files passed the Silver access window.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">File</th>
                      <th className="px-3 py-3 font-semibold">Created</th>
                      <th className="px-3 py-3 font-semibold">Access until</th>
                      <th className="px-3 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary.samples.map((s) => {
                      const Icon = KIND_ICONS[s.documentType] ?? FileText;
                      return (
                        <tr key={s.id}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><Icon className="h-4 w-4" /></span>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-900">{s.title}</p>
                                <p className="text-xs text-slate-500">{s.documentTypeLabel}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-600">{formatDay(s.createdAt)}</td>
                          <td className="px-3 py-3 text-slate-600">{formatDay(s.accessUntil ?? undefined)}</td>
                          <td className="px-3 py-3">
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", s.locked ? "bg-slate-100 text-slate-500" : (s.remainingDays ?? 9) <= 3 ? "bg-rose-50 text-rose-600" : "bg-orange-50 text-orange-700")}>
                              {s.locked ? "Locked" : accessLabel({ locked: false, remainingDays: s.remainingDays, accessUntil: s.accessUntil })}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            {s.locked ? (
                              <button type="button" onClick={() => router.push("/dashboard/pricing")} className="text-xs font-semibold text-orange-600 hover:underline">Upgrade to reopen</button>
                            ) : s.documentType === "welcome_placard" ? (
                              <Link href={`/dashboard/placards/new?edit=${s.id}`} className="text-xs font-semibold text-orange-600 hover:underline">Open</Link>
                            ) : (
                              <button type="button" disabled={busy === s.id} onClick={() => download(s.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline disabled:opacity-50">
                                <Download className="h-3.5 w-3.5" /> {busy === s.id ? "Downloading…" : "Download now"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!paid ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5">
                <Sparkles className="h-6 w-6 text-orange-500" />
                <p className="mt-2 text-lg font-bold text-slate-900">Gold · {formatInr(PAID_PLAN_PRICE_INR.gold)}/yr</p>
                <p className="text-sm text-slate-600">Keep every file forever. Unlimited file access — no {summary.retentionDays}-day limit. Reopen locked vouchers, invoices &amp; tickets.</p>
                <Link href="/dashboard/pricing?plan=gold" className={`${primaryBtn} mt-4`}>Choose Gold</Link>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <Crown className="h-6 w-6 text-slate-700" />
                <p className="mt-2 text-lg font-bold text-slate-900">Platinum · {formatInr(PAID_PLAN_PRICE_INR.platinum)}/yr</p>
                <p className="text-sm text-slate-600">Everything in Gold, plus unlimited PDF uploads. Best for high-volume agencies.</p>
                <Link href="/dashboard/pricing?plan=platinum" className={`${secondaryBtn} mt-4`}>Choose Platinum</Link>
              </div>
              <p className="text-sm text-slate-500 md:col-span-2">
                <span className="font-semibold text-slate-700">Need help?</span> Your files are never deleted — they are only hidden on Silver after the access window. Upgrade anytime to view and download them again.{" "}
                <Link href="/dashboard/pricing" className="font-semibold text-orange-600 hover:underline">Compare all plans</Link>
              </p>
            </div>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}
