"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, Copy, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useDocuments } from "@/components/agent/useDocuments";
import { AccessBadge, ConfirmDialog, EmptyState, PageHeader, PageShell, RowActions, TextInput, primaryBtn, useFeatureGate } from "@/components/agent/ui";
import { api, formatDay, openPdf } from "@/lib/agent/client";
import type { DocumentSummary } from "@/lib/agent/types";
import { ListSkeleton } from "@/components/agent/skeletons";

export default function PickupListPage() {
  const enabled = useFeatureGate("pickup_voucher", "Pickup vouchers");
  const router = useRouter();
  const { docs, error, reload } = useDocuments("pickup_voucher");
  const [q, setQ] = useState("");
  const [toDelete, setToDelete] = useState<DocumentSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return docs ?? [];
    return (docs ?? []).filter((d) => [d.title, d.subtitle, d.number].join(" ").toLowerCase().includes(t));
  }, [docs, q]);

  if (!enabled) return null;

  const remove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const r = await api(`/api/agent/documents/${toDelete.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!r.success) return toast.error("Delete failed", { description: r.error?.message });
    toast.success("Pickup voucher deleted");
    setToDelete(null);
    void reload();
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Transport Voucher"
        title="Pickup Voucher"
        description="Create a pickup slip, then Save & Generate PDF. Saved PDFs appear below for view, edit, or delete."
      />

      {docs === null ? (
        <ListSkeleton label="Loading pickup vouchers" />
      ) : error ? (
        <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>
      ) : docs.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No pickup voucher PDFs yet"
          description="Fill a short form — guest name, pickup point, driver and vehicle — then download a PDF. Saved PDFs appear here."
          action={<Link href="/dashboard/pickup/new" className={primaryBtn}><Plus className="h-4 w-4" /> Create Your First Voucher</Link>}
        />
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-slate-900">Saved Vouchers <span className="ml-1 rounded-full bg-slate-100 px-2 text-xs">{docs.length}</span></p>
            <div className="relative sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <TextInput aria-label="Search Saved Vouchers" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guest, city, voucher #…" className="pl-9" />
            </div>
          </div>
          {shown.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">No vouchers match your search.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {shown.map((d) => (
                <li key={d.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 sm:flex">
                    <Car className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{d.title}</p>
                    <p className="truncate text-xs text-slate-500">{d.subtitle} · Created {formatDay(d.createdAt)}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
                        {d.number}
                        <button
                          type="button"
                          aria-label="Copy Voucher Number"
                          onClick={() => {
                            void navigator.clipboard.writeText(d.number ?? "");
                            toast.success("Copied");
                          }}
                          className="text-slate-400 hover:text-brand-600"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </span>
                      {d.hasStoredPdf ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">PDF saved</span> : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Draft</span>}
                      <AccessBadge access={d.access} />
                    </div>
                  </div>
                  <RowActions
                    locked={d.access.locked}
                    onView={async () => {
                      const err = await openPdf(d.id);
                      if (err) toast.error("Could not open this voucher", { description: err });
                    }}
                    onEdit={() => router.push(`/dashboard/pickup/new?id=${d.id}`)}
                    onDelete={() => setToDelete(d)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete this voucher?"
        description="This removes the saved pickup voucher from your account. It cannot be undone."
        confirmLabel="Delete"
        busyLabel="Deleting…"
        busy={deleting}
        onConfirm={remove}
      />
    </PageShell>
  );
}
