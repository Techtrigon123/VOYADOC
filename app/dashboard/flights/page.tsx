"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plane, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocuments } from "@/components/agent/useDocuments";
import { AccessBadge, EmptyState, NativeSelect, PageHeader, PageShell, TextInput, primaryBtn, useFeatureGate } from "@/components/agent/ui";
import { formatDay } from "@/lib/agent/client";
import { ListSkeleton } from "@/components/agent/skeletons";

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-600",
  PENDING: "bg-amber-50 text-amber-700",
};
const STATUS_LABEL: Record<string, string> = { CONFIRMED: "Confirmed", CANCELLED: "Cancelled", PENDING: "Pending" };

export default function FlightsPage() {
  const enabled = useFeatureGate("air_ticket", "Air ticketing");
  const router = useRouter();
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  const [status, setStatus] = useState("");
  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (applied) p.set("q", applied);
    if (status) p.set("status", status);
    return p.toString();
  }, [applied, status]);
  const { docs, error } = useDocuments("air_ticket", query);

  if (!enabled) return null;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Flights"
        title="Airline tickets"
        description="Offline e-tickets with manual PNR and airline ticket numbers"
        actions={
          <Link href="/dashboard/flights/new" className={primaryBtn}>
            <Plus className="h-4 w-4" /> New ticket
          </Link>
        }
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setApplied(q.trim());
        }}
        className="mb-4 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_180px_auto]"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ref, PNR, passenger, ticket #" className="pl-9" aria-label="Search tickets" />
        </div>
        <NativeSelect
          value={status}
          onChange={setStatus}
          placeholder="All statuses"
          options={[
            { value: "PENDING", label: "Pending" },
            { value: "CONFIRMED", label: "Confirmed" },
            { value: "CANCELLED", label: "Cancelled" },
          ]}
        />
        <button type="submit" className={primaryBtn}>Search</button>
      </form>

      {docs === null ? (
        <ListSkeleton label="Loading tickets" />
      ) : error ? (
        <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>
      ) : docs.length === 0 ? (
        applied || status ? (
          <EmptyState icon={Search} title="No tickets match" description="Try a different search or status." />
        ) : (
          <EmptyState
            icon={Plane}
            title="No airline tickets yet"
            description="Create a booking with the airline PNR and each passenger’s e-ticket number, then generate a PDF."
            action={<Link href="/dashboard/flights/new" className={primaryBtn}><Plus className="h-4 w-4" /> Create airline ticket</Link>}
          />
        )
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Booking</th>
                <th className="px-3 py-3 font-semibold">Airline PNR</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">PDF</th>
                <th className="px-5 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => (d.access.locked ? router.push("/dashboard/pricing") : router.push(`/dashboard/flights/${d.id}`))}
                  className="cursor-pointer hover:bg-brand-50/40"
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{d.title}</p>
                    <p className="text-xs text-slate-500">{d.subtitle}</p>
                  </td>
                  <td className="px-3 py-3 font-mono font-semibold text-slate-800">{d.number || "—"}</td>
                  <td className="px-3 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", STATUS_STYLE[d.status ?? ""] ?? "bg-slate-100 text-slate-600")}>{STATUS_LABEL[d.status ?? ""] ?? d.status}</span>
                  </td>
                  <td className="px-3 py-3">
                    {d.access.locked ? <AccessBadge access={d.access} /> : d.hasStoredPdf ? <AccessBadge access={d.access} /> : <span className="text-xs text-slate-400">Not generated</span>}
                    {!d.access.locked && d.hasStoredPdf && d.access.remainingDays == null ? <span className="text-xs font-medium text-emerald-600">Generated</span> : null}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{formatDay(d.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
