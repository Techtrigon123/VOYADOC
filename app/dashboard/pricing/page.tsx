"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Crown, FileUp, Gem, Loader2, Pencil, ShieldCheck, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAgent } from "@/components/agent/AgentProvider";
import { Field, Modal, PageShell, TextInput, primaryBtn, secondaryBtn } from "@/components/agent/ui";
import { api, fileToDataUrl } from "@/lib/agent/client";
import { formatInr, PLAN_COMPARISON, PLANS, PRICING_FAQ, isPaidPlan, type PaidPlanId } from "@/lib/agent/plans";
import type { PlanId } from "@/lib/agent/types";
import { PaymentDetailsSkeleton } from "@/components/agent/skeletons";

interface PendingPayment {
  id: string;
  planId: PaidPlanId;
  amountInr: number;
  paymentTransactionId: string;
  proof: string;
  proofType: string;
  createdAt: string;
}

interface PlanInfo {
  plan: PlanId;
  subscriptionExpiresAt: string | null;
  pending: PendingPayment | null;
  paymentConfig?: { planId: PaidPlanId; planName: string; amountInr: number; upiId: string | null; payee: string; qr: string | null };
}

const PLAN_ICONS = { silver: ShieldCheck, gold: Sparkles, platinum: Gem };

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === "string") return <span className="text-xs font-medium text-slate-700">{value}</span>;
  return value ? (
    <span aria-label="Included" className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-600"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
  ) : (
    <span aria-label="Not included" className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400"><X className="h-3.5 w-3.5" /></span>
  );
}

export default function PricingPage() {
  const { agent } = useAgent();
  const router = useRouter();
  const params = useSearchParams();
  const [info, setInfo] = useState<PlanInfo | null>(null);
  const [checkout, setCheckout] = useState<PaidPlanId | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  useEffect(() => {
    void api<PlanInfo>("/api/agent/plan").then((r) => r.success && r.data && setInfo(r.data));
  }, []);

  useEffect(() => {
    const p = params.get("plan") ?? "";
    if (isPaidPlan(p)) setCheckout(p);
  }, [params]);

  if (!agent) return null;
  const current = agent.subscriptionPlan;

  return (
    <PageShell wide>
      <section className="relative overflow-hidden rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-amber-50/60 px-6 py-10 text-center sm:px-10">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand-200/40 blur-3xl" aria-hidden />
        <p className="relative text-[11px] font-semibold uppercase tracking-widest text-brand-600">Built for travel agents who mean business</p>
        <h1 className="relative mx-auto mt-2 max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Send vouchers &amp; tickets your clients actually trust</h1>
        <p className="relative mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
          Hotel vouchers, invoices, air tickets, pickup PDFs &amp; welcome placards — create in minutes, not hours. Start free on Silver. Upgrade when your agency is ready to grow.
        </p>
        {info?.pending ? (
          <p className="relative mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800">
            <Loader2 className="h-4 w-4 animate-spin" /> Your {info.pending.planId} payment is under review.
          </p>
        ) : null}
      </section>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {PLANS.map((p) => {
          const Icon = PLAN_ICONS[p.id];
          const isCurrent = p.id === current;
          return (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-3xl border bg-white p-6",
                p.featured ? "border-brand-300 shadow-xl shadow-brand-500/10 ring-4 ring-brand-100" : "border-slate-200"
              )}
            >
              {p.badge ? (
                <span className={cn("absolute -top-3 left-6 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide", p.featured ? "bg-[var(--primary)] text-white" : "bg-slate-900 text-white")}>
                  {p.badge}
                </span>
              ) : null}
              <div className="flex items-center justify-between">
                <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", p.featured ? "bg-[var(--primary)] text-white" : "bg-brand-50 text-brand-600")}>
                  <Icon className="h-5 w-5" />
                </span>
                {isCurrent ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Current plan</span> : null}
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">{p.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{p.headline}</p>
              <div className="mt-4">
                {p.yearlyPrice === null ? (
                  <p className="text-3xl font-bold text-slate-900">Free</p>
                ) : (
                  <p className="text-3xl font-bold text-slate-900">
                    {formatInr(p.yearlyPrice)} <span className="text-sm font-medium text-slate-500">per year · GST inclusive</span>
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">{p.yearlyPrice === null ? "No subscription · no credit card" : p.subscriptionNote ?? "Billed yearly"}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2" aria-label="Plan highlights">
                {p.highlights.map((h) => (
                  <div key={h.label} className="rounded-2xl bg-slate-50 px-3 py-2">
                    <p className="text-sm font-bold text-slate-900">{h.value}</p>
                    <p className="text-[11px] text-slate-500">{h.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">What&apos;s included</p>
              <ul className="mt-2 flex-1 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" strokeWidth={3} /> {f}
                  </li>
                ))}
              </ul>
              {p.id === "silver" ? (
                <button type="button" disabled className={cn(secondaryBtn, "mt-6 w-full")}>{isCurrent ? "Your current plan" : "Included"}</button>
              ) : (
                <button type="button" onClick={() => setCheckout(p.id as PaidPlanId)} className={cn(p.featured ? primaryBtn : secondaryBtn, "mt-6 w-full")}>
                  {isCurrent ? "Renew" : info?.pending?.planId === p.id ? "View payment" : p.cta}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">Paid plans billed yearly · All prices in INR · GST inclusive</p>

      <section className="mt-12">
        <h2 className="text-center text-2xl font-bold text-slate-900">Compare plans</h2>
        <p className="mt-1 text-center text-sm text-slate-500">See exactly what you get at every tier.</p>
        <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-5 py-4 font-semibold text-slate-500">Feature</th>
                {PLANS.map((p) => (
                  <th key={p.id} className={cn("px-3 py-4 text-center font-bold", p.featured ? "text-brand-600" : "text-slate-900")}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PLAN_COMPARISON.map((row) => (
                <tr key={row.label}>
                  <td className="px-5 py-3 text-slate-700">{row.label}</td>
                  <td className="px-3 py-3 text-center"><Cell value={row.silver} /></td>
                  <td className="bg-brand-50/40 px-3 py-3 text-center"><Cell value={row.gold} /></td>
                  <td className="px-3 py-3 text-center"><Cell value={row.platinum} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-3xl">
        <h2 className="text-center text-2xl font-bold text-slate-900">Pricing questions</h2>
        <div className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-white">
          {PRICING_FAQ.map((f, i) => (
            <div key={f.q}>
              <button type="button" onClick={() => setFaqOpen(faqOpen === i ? null : i)} aria-expanded={faqOpen === i} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-medium text-slate-900 hover:bg-slate-50">
                {f.q}
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition", faqOpen === i && "rotate-180")} />
              </button>
              {faqOpen === i ? <p className="px-5 pb-4 text-sm text-slate-600">{f.a}</p> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl bg-gradient-to-r from-[var(--primary)] to-amber-500 px-6 py-8 text-center text-white">
        <h2 className="text-2xl font-bold">Ready to look more professional?</h2>
        <p className="mt-1 text-brand-50">Start free on Silver. Upgrade to Gold or Platinum when your business is ready.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link href="/dashboard" className="inline-flex h-10 items-center rounded-xl bg-white px-5 text-sm font-semibold text-brand-600">Go to workspace</Link>
          <Link href="/dashboard/support" className="inline-flex h-10 items-center rounded-xl bg-white/15 px-5 text-sm font-semibold text-white ring-1 ring-white/40">Talk to sales</Link>
        </div>
      </section>

      {checkout ? (
        <CheckoutDialog
          planId={checkout}
          pending={info?.pending?.planId === checkout ? info.pending : null}
          onClose={() => {
            setCheckout(null);
            if (params.get("plan")) router.replace("/dashboard/pricing");
          }}
          onSubmitted={(p) => setInfo((i) => (i ? { ...i, pending: p } : i))}
        />
      ) : null}
    </PageShell>
  );
}

function CheckoutDialog({
  planId,
  pending,
  onClose,
  onSubmitted,
}: {
  planId: PaidPlanId;
  pending: PendingPayment | null;
  onClose: () => void;
  onSubmitted: (p: PendingPayment) => void;
}) {
  const [config, setConfig] = useState<PlanInfo["paymentConfig"] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [mode, setMode] = useState<"checkout" | "submitted" | "edit">(pending ? "submitted" : "checkout");
  const [saved, setSaved] = useState<PendingPayment | null>(pending);
  const [txn, setTxn] = useState(pending?.paymentTransactionId ?? "");
  const [proof, setProof] = useState<{ dataUrl: string; name: string; type: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api<PlanInfo>(`/api/agent/plan?plan=${planId}`).then((r) => {
      if (r.success && r.data?.paymentConfig) setConfig(r.data.paymentConfig);
      else setLoadError(r.error?.message || "Could not load payment details");
    });
  }, [planId]);

  const name = config?.planName ?? (planId === "gold" ? "Gold" : "Platinum");
  const editing = mode === "edit";

  const pickProof = async (f: File) => {
    if (!/^(image\/|application\/pdf)/.test(f.type)) return setError("Upload an image or PDF of your payment.");
    if (f.size > 3 * 1024 * 1024) return setError("File is larger than 3 MB.");
    setError("");
    setProof({ dataUrl: await fileToDataUrl(f), name: f.name, type: f.type });
  };

  const submit = async () => {
    setError("");
    if (!txn.trim()) return setError("Please enter the transaction ID from your payment app.");
    if (!editing && !proof) return setError("Please upload a screenshot of your payment.");
    setBusy(true);
    const r = await api<PendingPayment>("/api/agent/plan/submit", {
      method: "POST",
      json: { planId, paymentTransactionId: txn.trim(), proof: proof?.dataUrl },
    });
    setBusy(false);
    if (!r.success || !r.data) return setError(r.error?.message || "Upload failed. Please try again.");
    setSaved(r.data);
    onSubmitted(r.data);
    setProof(null);
    setMode("submitted");
    toast.success(editing ? "Payment details updated." : "Payment proof received", {
      description: "We will verify it and activate your plan on your account shortly.",
    });
  };

  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      size="md"
      title={mode === "submitted" ? "Payment proof received" : editing ? `Edit ${name} payment` : `Choose ${name}`}
      description={
        mode === "submitted"
          ? "Your payment is under review. You can view your details below or edit them if needed."
          : editing
            ? "Update your transaction ID or upload a new payment screenshot."
            : "Pay using the details below, enter your transaction ID, and upload a screenshot of your payment."
      }
    >
      {mode === "submitted" && saved ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800"><Crown className="h-4 w-4" /> {name} · {formatInr(saved.amountInr)}</p>
            <p className="mt-1 text-xs text-emerald-700">Submitted {new Date(saved.createdAt).toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Transaction ID</p>
            <p className="font-mono text-sm font-semibold text-slate-900">{saved.paymentTransactionId || "—"}</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-500">Payment screenshot</p>
            {saved.proofType === "application/pdf" ? (
              <a href={saved.proof} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand-600 hover:underline">View uploaded proof</a>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={saved.proof} alt="Uploaded payment proof" className="max-h-56 rounded-xl border border-slate-200" />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setMode("edit")} className={secondaryBtn}><Pencil className="h-4 w-4" /> Edit</button>
            <button type="button" onClick={onClose} className={primaryBtn}>Done</button>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {!editing ? (
            loadError ? (
              <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{loadError}</p>
            ) : !config ? (
              <PaymentDetailsSkeleton />
            ) : (
              <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4">
                <p className="text-xs text-slate-500">Amount due (1 year · GST inclusive)</p>
                <p className="text-2xl font-bold text-slate-900">{formatInr(config.amountInr)}</p>
                {config.qr ? (
                  <div className="mt-3 flex flex-col items-center gap-2 rounded-xl bg-white p-3 ring-1 ring-brand-100 sm:flex-row sm:items-start">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={config.qr} alt={`Payment QR for ${name} plan`} className="h-40 w-40" />
                    <div className="text-sm text-slate-600">
                      <p className="font-medium text-slate-900">Scan with any UPI app (GPay, PhonePe, Paytm, etc.)</p>
                      <p className="mt-1">UPI ID: <span className="font-mono font-semibold text-slate-900">{config.upiId}</span></p>
                      <p>Payee: {config.payee}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">Online payment details are not configured yet. Please contact support to complete your upgrade.</p>
                )}
              </div>
            )
          ) : null}

          <Field label="Transaction ID" htmlFor="txn" hint="Copy this from your payment app after you pay (UTR or transaction reference).">
            <TextInput id="txn" value={txn} onChange={(e) => setTxn(e.target.value)} placeholder="UPI / bank transaction reference" />
          </Field>

          <div>
            <p className="text-sm font-medium text-slate-700">{editing ? "Payment screenshot" : "Upload payment proof"}</p>
            <p className="mb-2 text-xs text-slate-500">{editing ? "Upload a new screenshot only if you want to replace the current one." : "After paying, upload a screenshot or photo of the successful payment."}</p>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 hover:border-brand-300">
              <FileUp className="h-5 w-5 text-brand-500" />
              <span className="text-sm font-medium text-slate-700">{proof ? "Change file" : editing ? "Upload new image or PDF" : "Choose image or PDF"}</span>
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void pickProof(f); }} />
            </label>
            {proof ? (
              <div className="mt-2 text-xs text-slate-500">
                Selected: {proof.name}
                {proof.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={proof.dataUrl} alt="Payment proof preview" className="mt-2 max-h-40 rounded-xl border border-slate-200" />
                ) : null}
              </div>
            ) : editing && saved ? (
              <p className="mt-2 text-xs text-slate-500">Current screenshot kept unless you upload a new one.</p>
            ) : null}
          </div>

          {error ? <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => (editing ? setMode("submitted") : onClose())} className={secondaryBtn}>Cancel</button>
            <button type="button" disabled={busy} onClick={submit} className={primaryBtn}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? (editing ? "Saving…" : "Uploading…") : editing ? "Save changes" : "Submit payment proof"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
