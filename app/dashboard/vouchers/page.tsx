"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Hotel, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDocuments } from "@/components/agent/useDocuments";
import { AccessBadge, EmptyState, NativeSelect, PageHeader, PageShell, RowActions, TextInput, primaryBtn } from "@/components/agent/ui";
import { formatDay, openPdf, sharePdfOnWhatsApp } from "@/lib/agent/client";
import type { DocumentSummary } from "@/lib/agent/types";
import { ListSkeleton } from "@/components/agent/skeletons";

const SEARCH_FIELDS = [
  { value: "all", label: "All fields", placeholder: "Guest, HCN, booking ref…" },
  { value: "title", label: "Guest / title", placeholder: "Guest or hotel in title…" },
  { value: "number", label: "HCN / voucher no.", placeholder: "HCN or voucher number…" },
  { value: "ref", label: "Booking ref", placeholder: "Booking reference…" },
  { value: "preparedBy", label: "Prepared by", placeholder: "Agent name…" },
];

export default function VouchersPage() {
  const router = useRouter();
  const [field, setField] = useState("all");
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (applied) {
      p.set("q", applied);
      p.set("field", field);
    }
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    return p.toString();
  }, [applied, field, from, to]);
  const { docs, error } = useDocuments("hotel_voucher", query);
  const { docs: all } = useDocuments("hotel_voucher");

  // Latest PDF per voucher (HCN group), earlier versions tucked underneath.
  const groups = useMemo(() => {
    const map = new Map<string, DocumentSummary[]>();
    for (const d of docs ?? []) {
      const k = d.groupKey || d.id;
      map.set(k, [...(map.get(k) ?? []), d]);
    }
    return [...map.values()].map((list) => list.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)));
  }, [docs]);

  const totalGroups = useMemo(() => new Set((all ?? []).map((d) => d.groupKey || d.id)).size, [all]);
  const filtering = !!applied || !!from || !!to;

  const view = async (d: DocumentSummary) => {
    const err = await openPdf(d.id);
    if (err) toast.error("Could not open PDF", { description: err });
  };
  const share = async (d: DocumentSummary) => {
    const r = await sharePdfOnWhatsApp({ id: d.id }, `Hotel booking voucher ${d.number ?? ""} — ${d.title}`);
    if (r.error) toast.error("Could not share on WhatsApp", { description: "Try Open PDF and share from your device instead." });
    else if (!r.attached) toast.message("PDF downloaded", { description: "Please attach the PDF if WhatsApp does not include the file automatically." });
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Hotel vouchers"
        title="Your voucher PDFs"
        description="Latest PDF for each voucher. Open earlier PDFs from the same HCN when needed."
        actions={
          <Link href="/dashboard/vouchers/new" className={primaryBtn}>
            <Plus className="h-4 w-4" /> Create voucher
          </Link>
        }
      />

      {totalGroups > 0 || filtering ? (
        <form
          aria-label="Filter your vouchers"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied(q.trim());
          }}
          className="mb-4 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-[170px_1fr_150px_150px_auto]"
        >
          <NativeSelect value={field} onChange={setField} options={SEARCH_FIELDS} />
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <TextInput aria-label="Search vouchers" value={q} onChange={(e) => setQ(e.target.value)} placeholder={SEARCH_FIELDS.find((f) => f.value === field)?.placeholder} className="pl-9" />
          </div>
          <TextInput type="date" aria-label="Created from" title="Created from" value={from} onChange={(e) => setFrom(e.target.value)} />
          <TextInput type="date" aria-label="Created to" title="Created to" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          <div className="flex gap-2">
            <button type="submit" className={cn(primaryBtn, "flex-1")}>Search</button>
            {filtering ? (
              <button type="button" onClick={() => { setQ(""); setApplied(""); setFrom(""); setTo(""); }} className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-medium text-slate-500 hover:bg-slate-100" title="Clear filters">
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {docs === null ? (
        <ListSkeleton label="Loading vouchers" />
      ) : error ? (
        <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>
      ) : groups.length === 0 ? (
        filtering ? (
          <EmptyState icon={Search} title="No vouchers match" description="Try a different search or date range, or clear filters to see all vouchers." />
        ) : (
          <EmptyState
            icon={Hotel}
            title="No custom vouchers yet"
            description="Create a voucher, fill the form, save a draft, then generate a PDF — it will appear here."
            action={<Link href="/dashboard/vouchers/new" className={primaryBtn}><Plus className="h-4 w-4" /> Create voucher</Link>}
          />
        )
      ) : (
        <>
          <p className="mb-2 text-xs text-slate-500">
            Showing {groups.length} of {totalGroups} voucher{totalGroups === 1 ? "" : "s"}
          </p>
          <ul className="space-y-2">
            {groups.map((list) => {
              const [latest, ...earlier] = list;
              const key = latest.groupKey || latest.id;
              return (
                <li key={key} className="rounded-2xl border border-slate-200 bg-white">
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 sm:flex">
                      <Hotel className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{latest.title}</p>
                      <p className="truncate text-xs text-slate-500">
                        HCN {latest.number || "—"} · {latest.subtitle} · {formatDay(latest.createdAt)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {!latest.hasStoredPdf ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Draft</span> : null}
                        <AccessBadge access={latest.access} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <RowActions
                        locked={latest.access.locked}
                        onView={() => view(latest)}
                        onShare={() => share(latest)}
                        onEdit={() => router.push(`/dashboard/vouchers/new?id=${latest.id}`)}
                      />
                      {earlier.length ? (
                        <button type="button" onClick={() => setExpanded((e) => ({ ...e, [key]: !e[key] }))} className="ml-1 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100">
                          {expanded[key] ? "Hide" : "Show"} {earlier.length} earlier
                          <ChevronDown className={cn("h-3.5 w-3.5 transition", expanded[key] && "rotate-180")} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {expanded[key] && earlier.length ? (
                    <ul className="divide-y divide-slate-100 border-t border-slate-100 bg-slate-50/60">
                      {earlier.map((d) => (
                        <li key={d.id} className="flex items-center gap-3 px-4 py-2.5 pl-6 text-sm sm:pl-[72px]">
                          <span className="flex-1 truncate text-slate-600">{d.title} · {formatDay(d.updatedAt)}</span>
                          <AccessBadge access={d.access} />
                          <RowActions locked={d.access.locked} onView={() => view(d)} />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </PageShell>
  );
}
