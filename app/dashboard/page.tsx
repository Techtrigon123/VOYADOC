"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Car,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Hotel,
  Loader2,
  MessageCircle,
  Plane,
  Plus,
  Printer,
  Receipt,
  Signpost,
  Trophy,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAgent } from "@/components/agent/AgentProvider";
import { useActivation, focusAnchor } from "@/components/agent/ActivationGuide";
import { useDocumentAccess } from "@/components/agent/DocumentAccessWarning";
import { AgentAvatar } from "@/components/agent/AgentNavbar";
import { PageShell } from "@/components/agent/ui";
import { api } from "@/lib/agent/client";
import {
  agencyLine,
  displayName,
  isActive,
  isSuspended,
  missingActivationFields,
  statusLabel,
  statusTooltip,
  verifyTooltip,
} from "@/lib/agent/profile";
import { planLabel } from "@/lib/agent/plans";
import { isFeatureEnabled } from "@/lib/agent/features";
import type { Agent, DocumentKind } from "@/lib/agent/types";

interface Summary {
  documentCounts: { key: DocumentKind; count: number }[];
  totalDocuments: number;
  customers: number;
  planPaymentPending: boolean;
  ranking: { activityScore: number; rank: number | null; topTier: "top_10" | "top_20" | "top_30" | null };
}

interface Tile {
  key: DocumentKind;
  label: string;
  href: string;
  icon: LucideIcon;
}

const TILES: Tile[] = [
  { key: "hotel_voucher", label: "Hotel vouchers", href: "/dashboard/vouchers/new", icon: Hotel },
  { key: "air_ticket", label: "Air tickets", href: "/dashboard/flights/new", icon: Plane },
  { key: "pickup_voucher", label: "Pickup vouchers", href: "/dashboard/pickup/new", icon: Car },
  { key: "welcome_placard", label: "Welcome placards", href: "/dashboard/placards", icon: Signpost },
  { key: "invoice", label: "Invoices", href: "/dashboard/invoices?type=invoice&new=1", icon: FileSpreadsheet },
  { key: "proforma", label: "Proforma", href: "/dashboard/invoices?type=proforma&new=1", icon: FileText },
  { key: "receipt", label: "Receipts", href: "/dashboard/invoices?type=receipt&new=1", icon: Receipt },
];

const TIER_LABEL = { top_10: "Top 10", top_20: "Top 20", top_30: "Top 30" } as const;

function rankCopy(r?: Summary["ranking"]) {
  if (!r || r.activityScore <= 0) return { title: "Not ranked yet", detail: "Create your first document to join the activity board." };
  if (r.topTier) return { title: TIER_LABEL[r.topTier], detail: `You're in the ${TIER_LABEL[r.topTier]} among active agents on TravelDoc Pro` };
  if (r.rank != null) return { title: "On the activity board", detail: "Keep creating documents to reach Top 30 among active agents." };
  return { title: "Activity tracked", detail: "Save more documents to climb the activity board." };
}

const titleWords = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

function setupProgress(agent: Agent, totalDocs: number) {
  const missing = missingActivationFields(agent);
  const profileDone = 4 - missing.length;
  const hasDocs = totalDocs > 0;
  const percent = Math.round(((profileDone + (hasDocs ? 1 : 0)) / 5) * 100);
  let detail =
    missing.length === 0
      ? "All required fields added"
      : `Still needed: ${missing.length === 1 ? titleWords(missing[0]) : `${missing.slice(0, -1).map(titleWords).join(", ")}, and ${titleWords(missing[missing.length - 1])}`}`;
  if (missing.length && hasDocs) detail += ` · ${totalDocs.toLocaleString("en-IN")} document${totalDocs === 1 ? "" : "s"} already saved`;
  return { percent, detail, profileComplete: missing.length === 0, hasDocs };
}

function planStatus(agent: Agent, pending: boolean) {
  const label = planLabel(agent.subscriptionPlan);
  const until = agent.subscriptionExpiresAt
    ? new Date(agent.subscriptionExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;
  if (pending) return { detail: `We are reviewing your payment. You can keep using your account meanwhile.`, badge: "In review" };
  if (agent.subscriptionPlan !== "silver") return { detail: until ? `Your ${label} is active until ${until}.` : `Your ${label} is active.`, badge: "Active" };
  return { detail: "Core document tools are included.", badge: "Active" };
}

function NewDocumentMenu({ tiles, children }: { tiles: Tile[]; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-2xl p-1.5 shadow-xl">
        {tiles.length === 0 ? (
          <DropdownMenuItem disabled>No document tools are enabled yet</DropdownMenuItem>
        ) : (
          tiles.map((t) => (
            <DropdownMenuItem key={t.key} onSelect={() => router.push(t.href)} className="cursor-pointer gap-3 rounded-xl py-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <t.icon className="h-4 w-4" />
              </span>
              {t.label}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function DashboardPage() {
  const { agent } = useAgent();
  const activation = useActivation();
  const access = useDocumentAccess();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void api<Summary>("/api/agent/dashboard/summary").then((r) => {
      if (cancelled) return;
      if (r.success && r.data) setSummary(r.data);
      else setError(r.error?.message ?? "We could not load your stats. Please try again.");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [agent?.status]);

  // Deep links such as /dashboard#agent-activation-documents.
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) window.setTimeout(() => focusAnchor(hash), 250);
  }, []);

  const tiles = useMemo(() => (agent ? TILES.filter((t) => isFeatureEnabled(agent, t.key)) : []), [agent]);
  if (!agent) return null;

  const counts = new Map(summary?.documentCounts.map((c) => [c.key, c.count]) ?? []);
  const total = summary?.totalDocuments ?? 0;
  const setup = setupProgress(agent, total);
  const active = isActive(agent.status);
  const suspended = isSuspended(agent.status);
  const plan = planStatus(agent, !!summary?.planPaymentPending);
  const rank = rankCopy(summary?.ranking);
  const verifiedLabel = agent.isVerified ? "Verified" : agent.partnerType === "other" ? "In review" : "Not verified";
  const profileLink = !active && !setup.profileComplete ? { href: "/dashboard/profile/edit", label: "Continue in profile" } : { href: "/dashboard/profile", label: "View full profile" };

  let docAction: { detail: string; label: string } | null = null;
  if (loading) docAction = { detail: "Checking documents…", label: "Create now" };
  else if (active) docAction = { detail: `${total.toLocaleString("en-IN")} documents created`, label: "View documents" };
  else if (setup.profileComplete)
    docAction = setup.hasDocs
      ? { detail: `${total.toLocaleString("en-IN")} on file — your account should go Active soon`, label: "View documents" }
      : { detail: "Create a voucher, invoice, or other document", label: "Create a document" };

  return (
    <PageShell wide>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Overview */}
          <section aria-labelledby="dashboard-heading" className="anim-rise overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="relative bg-gradient-to-r from-orange-50 via-amber-50/40 to-white px-5 py-5 sm:px-6">
              <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-orange-200/30 blur-3xl" aria-hidden />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <AgentAvatar agent={agent} size={60} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-600">Dashboard overview</p>
                    <h1 id="dashboard-heading" className="truncate text-2xl font-bold tracking-tight text-slate-900">{displayName(agent)}</h1>
                    <p className="truncate text-sm text-slate-500">{agencyLine(agent, "Your travel agency")}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span title={statusTooltip(agent)} className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold", active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-500" : "bg-slate-400")} />
                        {statusLabel(agent.status)}
                      </span>
                      <span title={verifyTooltip(agent)} className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold", agent.isVerified ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700")}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", agent.isVerified ? "bg-sky-500" : "bg-amber-500")} />
                        {verifiedLabel}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href={profileLink.href} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-orange-200">
                    {profileLink.label} <ChevronRight className="h-4 w-4" />
                  </Link>
                  <NewDocumentMenu tiles={tiles}>
                    <button type="button" className="inline-flex h-10 items-center justify-center gap-1.5 btn-glow rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-sm shadow-orange-500/30 hover:bg-orange-600">
                      <Plus className="h-4 w-4" /> New document
                    </button>
                  </NewDocumentMenu>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
              {suspended ? (
                <div>
                  <p className="font-semibold text-rose-700">Your account is suspended</p>
                  <p className="text-sm text-slate-500">Please contact support if you need help getting back in.</p>
                </div>
              ) : active ? (
                <p className="text-sm text-slate-600">
                  Your account is <span className="font-semibold text-emerald-700">Active</span>. Create and share documents from here.
                </p>
              ) : (
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-slate-900">Finish setting up your account</h2>
                    <span className="text-sm font-bold tabular-nums text-orange-600">{setup.percent}% to Active</span>
                  </div>
                  <div role="progressbar" aria-valuenow={setup.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Account setup progress" className="mt-2 h-2 overflow-hidden rounded-full bg-orange-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-[var(--primary)] transition-all" style={{ width: `${setup.percent}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{setup.detail}</p>
                  {docAction ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {docAction.detail}{" "}
                      <button type="button" onClick={() => focusAnchor("agent-activation-documents")} className="font-semibold text-orange-600 hover:underline">
                        {docAction.label}
                      </button>
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activation.needsPrompt ? (
                      <button type="button" onClick={activation.openDialog} className="rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-200">
                        Show me where
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Document activity */}
          <section id="agent-activation-documents" aria-labelledby="doc-stats-heading" className="scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="doc-stats-heading" className="text-base font-semibold text-slate-900">Document activity</h2>
                <p className="text-sm text-slate-500">Documents you&apos;ve created, by type</p>
              </div>
              {!loading && !error ? (
                <p className="text-xs font-medium text-slate-500">
                  <span className="font-bold text-slate-900">{total.toLocaleString("en-IN")}</span> total · {tiles.length} categories
                </p>
              ) : null}
            </div>
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-[112px] animate-pulse rounded-2xl bg-slate-100" />
                ))}
                <p className="col-span-full flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading your numbers…
                </p>
              </div>
            ) : error ? (
              <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>
            ) : tiles.length === 0 ? (
              <p className="text-sm text-slate-500">No document tools are enabled for your account yet. Contact support if you need access.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {tiles.map((t, i) => (
                  <article key={t.key} className="anim-rise group flex flex-col rounded-2xl border border-slate-200 bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md hover:shadow-orange-500/5" style={{ animationDelay: `${i * 35}ms` }}>
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition group-hover:bg-[var(--primary)] group-hover:text-white">
                        <t.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                      </span>
                      <span className="text-2xl font-bold tabular-nums text-slate-900">{(counts.get(t.key) ?? 0).toLocaleString("en-IN")}</span>
                    </div>
                    <p className="mt-2 text-[13px] font-medium text-slate-600">{t.label}</p>
                    <Link href={t.href} aria-label={`Create ${t.label.toLowerCase()}`} className="mt-1 text-xs font-semibold text-orange-600 hover:text-orange-700">
                      + Create
                    </Link>
                  </article>
                ))}
                <NewDocumentMenu tiles={tiles}>
                  <button type="button" className="flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-orange-200 bg-orange-50/40 p-3 text-[13px] font-semibold text-orange-700 hover:bg-orange-50">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-orange-200">
                      <Plus className="h-4 w-4" />
                    </span>
                    New document
                  </button>
                </NewDocumentMenu>
              </div>
            )}
          </section>
        </div>

        {/* Aside */}
        <aside className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1f1208] via-[#2a1709] to-[#3b1d06] p-5 text-white">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-orange-500/30 blur-3xl" aria-hidden />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-200/80">Your plan</p>
                <span className="rounded-full bg-gradient-to-b from-white to-slate-300 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-800">{agent.subscriptionPlan}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-lg font-bold">{planLabel(agent.subscriptionPlan)}</p>
                <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", plan.badge === "Active" ? "text-emerald-300" : "text-amber-300")}>
                  <span className={cn("h-2 w-2 rounded-full", plan.badge === "Active" ? "bg-emerald-400" : "bg-amber-400")} />
                  {plan.badge}
                </span>
              </div>
              <p className="mt-1 text-sm text-orange-100/80">{plan.detail}</p>
              <Link href="/dashboard/pricing" className="mt-4 inline-flex h-9 items-center gap-1 rounded-xl bg-white/10 px-3 text-[13px] font-semibold text-white ring-1 ring-white/15 hover:bg-white/20">
                Compare plans <ArrowRight className="h-4 w-4" />
              </Link>
              {access.summary?.showWarning ? (
                <button type="button" onClick={access.openDialog} className="mt-2 block text-xs text-amber-300 hover:underline">
                  {access.summary.totalAtRiskCount} file(s) losing access →
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-white p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Trophy className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Usage rank</p>
              {loading ? (
                <div className="mt-1 h-10 animate-pulse rounded-lg bg-slate-100" />
              ) : error ? (
                <p className="text-sm text-rose-600">{error}</p>
              ) : (
                <>
                  <p className="text-base font-semibold text-slate-900">{rank.title}</p>
                  <p className="text-sm text-slate-500">{rank.detail}</p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">Need a hand?</p>
              <p className="text-xs text-slate-500">Chat with our support team</p>
            </div>
            <Link href="/dashboard/support" className="inline-flex h-9 items-center rounded-xl border border-slate-200 px-3 text-[13px] font-semibold hover:border-orange-200 hover:text-orange-600">
              Chat
            </Link>
          </div>
        </aside>
      </div>

      {!suspended && tiles.some((t) => t.key === "hotel_voucher") ? <QuickStartPopup /> : null}
    </PageShell>
  );
}

/* ─── Quick start: "Create a hotel voucher" corner popup ────────────────── */

const QS_KEY = "agent_dashboard_quick_start_snooze_until";
const QS_SNOOZE = 20 * 60 * 1000;

function QuickStartPopup() {
  const activation = useActivation();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"fill" | "print" | "ready">("fill");
  const blocked = activation.isOpen;

  const close = () => {
    try {
      sessionStorage.setItem(QS_KEY, String(Date.now() + QS_SNOOZE));
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  useEffect(() => {
    if (blocked) {
      setOpen(false);
      return;
    }
    let until = 0;
    try {
      until = Number(sessionStorage.getItem(QS_KEY)) || 0;
    } catch {
      /* ignore */
    }
    // Wait for the activation guide's own timing before showing a second nudge.
    const base = activation.needsPrompt ? 15_000 + 8_000 : 5_000;
    const t = window.setTimeout(() => setOpen(true), Math.max(base, until - Date.now()));
    return () => window.clearTimeout(t);
  }, [blocked, activation.needsPrompt]);

  useEffect(() => {
    if (!open) return;
    const order = ["fill", "print", "ready"] as const;
    const dur = { fill: 3600, print: 3000, ready: 2800 };
    let current: (typeof order)[number] = "fill";
    let t = 0;
    const tick = () => {
      t = window.setTimeout(() => {
        current = order[(order.indexOf(current) + 1) % order.length];
        setPhase(current);
        tick();
      }, dur[current]);
    };
    tick();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;
  const caption = phase === "fill" ? "Fill guest and hotel details" : phase === "print" ? "Generating hotel voucher…" : "Hotel voucher ready";
  return (
    <div role="dialog" aria-modal="false" aria-labelledby="qs-title" className="anim-rise fixed bottom-4 left-4 z-[45] w-[min(100vw-2rem,20rem)] rounded-3xl border border-orange-200 bg-white p-4 shadow-2xl shadow-orange-500/10">
      <button type="button" aria-label="Close quick start" onClick={close} className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100">
        <X className="h-4 w-4" />
      </button>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-600">Quick start</p>
      <p id="qs-title" className="text-base font-semibold text-slate-900">Create a hotel voucher</p>
      <p className="mt-0.5 min-h-8 text-xs text-slate-500" aria-live="polite">{caption}</p>
      <div className="mt-2 rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-3" role="img" aria-label={`Voucher workflow: ${caption}`}>
        <div className={cn("rounded-xl border border-slate-200 bg-white p-2 transition-opacity", phase !== "fill" && "opacity-40")}>
          <p className="flex items-center gap-1 text-[10px] font-semibold text-slate-500"><Hotel className="h-3 w-3" /> Hotel voucher details</p>
          <div className="mt-1.5 space-y-1">
            <div className="h-1.5 w-4/5 rounded bg-orange-200" />
            <div className="h-1.5 w-3/5 rounded bg-slate-200" />
            <div className="h-1.5 w-2/3 rounded bg-slate-200" />
          </div>
        </div>
        <div className="relative mx-auto mt-2 flex h-7 w-4/5 items-center justify-center gap-1 rounded-lg bg-slate-800 text-[9px] font-semibold text-slate-300">
          <Printer className="h-3 w-3" /> Printer
          <span className={cn("absolute right-2 h-1.5 w-1.5 rounded-full", phase === "print" ? "animate-pulse bg-orange-400" : phase === "ready" ? "bg-emerald-400" : "bg-slate-500")} />
        </div>
        <div className="mx-auto h-14 w-3/4 overflow-hidden">
          {phase !== "fill" ? (
            <div key={phase} className={cn("rounded-b-lg border border-t-0 border-slate-200 bg-white p-1.5 shadow-sm", phase === "print" && "printer-sheet")}>
              <p className="flex items-center gap-1 text-[9px] font-bold text-orange-600"><Hotel className="h-2.5 w-2.5" /> Hotel voucher</p>
              <div className="mt-1 h-1 w-full rounded bg-slate-200" />
              <div className="mt-0.5 h-1 w-2/3 rounded bg-slate-200" />
              {phase === "ready" ? <p className="mt-1 text-right text-[8px] font-semibold text-emerald-600">Generated</p> : null}
            </div>
          ) : null}
        </div>
      </div>
      <Link href="/dashboard/vouchers/new" onClick={close} className="mt-3 flex h-10 w-full items-center justify-center btn-glow rounded-lg bg-[var(--primary)] text-[13px] font-semibold text-white hover:bg-orange-600">
        Create hotel voucher
      </Link>
    </div>
  );
}
