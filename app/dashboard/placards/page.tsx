"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Signpost } from "lucide-react";
import { toast } from "sonner";
import { useAgent } from "@/components/agent/AgentProvider";
import { usePlacardFonts } from "@/components/agent/usePlacardFonts";
import { useDocuments } from "@/components/agent/useDocuments";
import { AccessBadge, ConfirmDialog, EmptyState, PageHeader, PageShell, RowActions, TextInput, primaryBtn, useFeatureGate } from "@/components/agent/ui";
import { api, formatDay, sharePdfOnWhatsApp } from "@/lib/agent/client";
import { placardFileName, placardPdf } from "@/lib/agent/placardCanvas";
import type { PlacardData } from "@/lib/agent/documents";
import type { DocumentSummary } from "@/lib/agent/types";
import { ListSkeleton } from "@/components/agent/skeletons";

export default function PlacardsPage() {
  usePlacardFonts();
  const enabled = useFeatureGate("welcome_placard", "Welcome placards");
  const router = useRouter();
  const { agent } = useAgent();
  const { docs, error, reload } = useDocuments("welcome_placard");
  const [q, setQ] = useState("");
  const [toDelete, setToDelete] = useState<DocumentSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (docs ?? []).filter((d) => !t || [d.title, d.subtitle].join(" ").toLowerCase().includes(t));
  }, [docs, q]);

  if (!enabled || !agent) return null;

  // Placards are drawn in the browser, so fetch the saved details and render the PDF here.
  const buildPdf = async (d: DocumentSummary) => {
    const r = await api<{ data: PlacardData }>(`/api/agent/documents/${d.id}`);
    if (!r.success || !r.data) throw new Error(r.error?.message || "This saved placard has no editable details yet.");
    return { blob: await placardPdf(r.data.data, agent), name: placardFileName(r.data.data, "pdf") };
  };

  const view = async (d: DocumentSummary) => {
    const win = window.open("", "_blank");
    try {
      const { blob } = await buildPdf(d);
      if (win) win.location.href = URL.createObjectURL(blob);
    } catch (e) {
      win?.close();
      toast.error("Could not open PDF. Try again in a moment.", { description: (e as Error).message });
    }
  };

  const share = async (d: DocumentSummary) => {
    try {
      const file = await buildPdf(d);
      const r = await sharePdfOnWhatsApp(file, `Welcome placard for ${d.title}. ${d.subtitle?.split(" · ")[0] ? `Destination: ${d.subtitle.split(" · ")[0]}` : ""}`);
      if (!r.attached) toast.message("PDF downloaded", { description: "Please attach the PDF if WhatsApp does not include the file automatically." });
    } catch {
      toast.error("Could not share on WhatsApp. Try View PDF and share from your device.");
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const r = await api(`/api/agent/documents/${toDelete.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!r.success) return toast.error("Could not delete PDF", { description: r.error?.message });
    toast.success("PDF deleted");
    setToDelete(null);
    void reload();
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Placard"
        title="Welcome Placard"
        description="Your saved welcome boards — open, edit, share, or delete anytime. Saving an edit creates a new version of the same placard."
      />
      {docs === null ? (
        <ListSkeleton label="Loading welcome placards" />
      ) : error ? (
        <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">Could not load saved welcome placards</p>
      ) : docs.length === 0 ? (
        <EmptyState
          icon={Signpost}
          title="No saved placards yet"
          description="Enter guest name and destination, then use Save & Download — your board is stored here."
          action={<Link href="/dashboard/placards/new" className={primaryBtn}><Plus className="h-4 w-4" /> Create Your First Placard</Link>}
        />
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-4">
            <div className="relative sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <TextInput aria-label="Search saved welcome placards" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guest, place, theme…" className="pl-9" />
            </div>
          </div>
          {shown.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">No placards match your search.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {shown.map((d) => (
                <li key={d.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 sm:flex">
                    <Signpost className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{d.title}</p>
                    <p className="truncate text-xs text-slate-500">{d.subtitle} · {formatDay(d.createdAt)}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">v{d.version}</span>
                      {d.hasStoredPdf ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">PDF saved</span> : null}
                      <AccessBadge access={d.access} />
                    </div>
                  </div>
                  <RowActions
                    locked={d.access.locked}
                    onView={() => view(d)}
                    onShare={() => share(d)}
                    onEdit={() => router.push(`/dashboard/placards/new?edit=${d.id}`)}
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
        title="Delete this PDF?"
        description="This removes the saved welcome placard from your account. It cannot be undone."
        confirmLabel="Delete PDF"
        busyLabel="Deleting…"
        busy={deleting}
        onConfirm={remove}
      />
    </PageShell>
  );
}
