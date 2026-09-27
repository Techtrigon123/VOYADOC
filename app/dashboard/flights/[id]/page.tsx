"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Download, Loader2, Mail, MessageCircle, Pencil, Plane, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Field, Modal, PageShell, Segmented, TextArea, TextInput, primaryBtn, secondaryBtn, useFeatureGate } from "@/components/agent/ui";
import { api, downloadPdf, pdfUrl, sharePdfOnWhatsApp } from "@/lib/agent/client";
import { TICKET_LAYOUTS, type AirTicketData, type FareMode, type TicketLayout } from "@/lib/agent/documents";
import type { DocumentSummary } from "@/lib/agent/types";
import { DetailSkeleton } from "@/components/agent/skeletons";

const STATUS: Record<string, [string, string]> = {
  CONFIRMED: ["Confirmed", "bg-emerald-50 text-emerald-700"],
  CANCELLED: ["Cancelled", "bg-rose-50 text-rose-600"],
  PENDING: ["Pending", "bg-amber-50 text-amber-700"],
};

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-brand-500" />
    </label>
  );
}

export default function AirTicketDetailPage() {
  const enabled = useFeatureGate("air_ticket", "Air ticketing");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentSummary | null>(null);
  const [data, setData] = useState<AirTicketData | null>(null);
  const [version, setVersion] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [busy, setBusy] = useState<"download" | "whatsapp" | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);

  useEffect(() => {
    void api<{ document: DocumentSummary; data: AirTicketData }>(`/api/agent/documents/${id}`).then((r) => {
      if (!r.success || !r.data) {
        toast.error("Failed to load ticket", { description: r.error?.message });
        router.replace("/dashboard/flights");
        return;
      }
      setDoc(r.data.document);
      setData(r.data.data);
    });
  }, [id, router]);

  if (!enabled) return null;
  if (!doc || !data) return <DetailSkeleton label="Loading ticket" />;

  // Layout switches save straight to the ticket and refresh the preview.
  const update = async (p: Partial<AirTicketData>) => {
    const next = { ...data, ...p };
    setData(next);
    setUpdating(true);
    const r = await api<{ document: DocumentSummary }>(`/api/agent/documents/${id}`, { method: "PATCH", json: { data: next } });
    setUpdating(false);
    if (!r.success) return toast.error("Could not update preview", { description: r.error?.message });
    setPreviewLoading(true);
    setVersion((v) => v + 1);
  };

  const share = async () => {
    setBusy("whatsapp");
    const r = await sharePdfOnWhatsApp({ id }, `Airline e-ticket ${doc.number} · CRS PNR ${data.crsPnr || doc.number} · Airline PNR ${data.airlinePnr}`);
    setBusy(null);
    if (r.error) toast.error("WhatsApp share failed", { description: r.error });
    else if (!r.attached) toast.message("PDF downloaded", { description: "Please attach the PDF if WhatsApp does not include the file automatically." });
  };

  const download = async () => {
    setBusy("download");
    const err = await downloadPdf(id);
    setBusy(null);
    if (err) toast.error("Download failed", { description: err });
  };

  const [statusLabel, statusCls] = STATUS[data.status] ?? [data.status, "bg-slate-100 text-slate-600"];

  return (
    <PageShell wide>
      <Link href="/dashboard/flights" className="mb-3 inline-flex text-sm font-medium text-slate-500 hover:text-brand-600">← Airline tickets</Link>
      <div className="mb-5 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Plane className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-bold text-slate-900">{doc.title}</p>
            <p className="text-sm text-slate-500">
              {data.crsPnr ? <>CRS PNR <span className="font-mono font-semibold text-slate-700">{data.crsPnr}</span> · </> : null}
              Airline PNR <span className="font-mono font-semibold text-slate-700">{data.airlinePnr}</span>
            </p>
          </div>
          <span className={cn("ml-2 rounded-full px-2.5 py-1 text-xs font-semibold", statusCls)}>{statusLabel}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={download} disabled={!!busy} className={primaryBtn}>
            {busy === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download PDF
          </button>
          <button type="button" onClick={() => setEmailOpen(true)} className={secondaryBtn}>
            <Mail className="h-4 w-4" /> Email
          </button>
          <button type="button" onClick={share} disabled={!!busy} className={secondaryBtn}>
            {busy === "whatsapp" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4 text-emerald-600" />} WhatsApp
          </button>
          <Link href={`/dashboard/flights/${id}/edit`} className={secondaryBtn}>
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-900">Ticket layout</p>
            <div className="mt-3 grid gap-2">
              {TICKET_LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => update({ layout: l.id as TicketLayout })}
                  className={cn("rounded-2xl border px-3 py-2.5 text-left", data.layout === l.id ? "border-brand-300 bg-brand-50" : "border-slate-200 hover:border-brand-200")}
                >
                  <p className="text-sm font-semibold text-slate-900">{l.label}</p>
                  <p className="text-xs text-slate-500">{l.description}</p>
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              <Toggle label="Barcode" checked={data.showBarcode} onChange={(v) => update({ showBarcode: v })} />
              <Toggle label="GST No." checked={data.showGst} onChange={(v) => update({ showGst: v })} />
              <Toggle label="IATA No." checked={data.showIata} onChange={(v) => update({ showIata: v })} />
            </div>
            <p className="mb-2 mt-4 text-sm font-semibold text-slate-900">Fare on PDF</p>
            <Segmented<FareMode>
              size="sm"
              value={data.fareMode}
              onChange={(v) => update({ fareMode: v })}
              options={[
                { value: "breakdown", label: "Fare breakdown" },
                { value: "total", label: "Total only" },
                { value: "hide", label: "Hide fare" },
              ]}
            />
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-900">Passengers</p>
            <ul className="mt-2 divide-y divide-slate-100">
              {data.passengers.map((p, i) => (
                <li key={i} className="py-2 text-sm">
                  <p className="font-medium text-slate-900">{`${p.title} ${p.firstName} ${p.lastName}`.trim()}</p>
                  <p className="font-mono text-xs text-slate-500">{p.ticketNumber || "Ticket number pending"}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <p className="text-sm font-semibold text-slate-900">Ticket preview</p>
            {updating || previewLoading ? (
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Updating preview…</span>
            ) : null}
          </div>
          <iframe
            key={version}
            title="E-ticket layout preview"
            src={`${pdfUrl(id)}?v=${version}`}
            onLoad={() => setPreviewLoading(false)}
            className="h-[78vh] w-full bg-slate-100"
          />
        </div>
      </div>

      <EmailDialog open={emailOpen} onOpenChange={setEmailOpen} id={id} subject={`Airline e-ticket · PNR ${data.airlinePnr}`} />
    </PageShell>
  );
}

function EmailDialog({ open, onOpenChange, id, subject }: { open: boolean; onOpenChange: (v: boolean) => void; id: string; subject: string }) {
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const send = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) return toast.error("Enter a valid recipient email");
    setSending(true);
    // No mail server is configured: download the PDF and open the agent's email app, pre-addressed.
    const err = await downloadPdf(id);
    setSending(false);
    if (err) return toast.error("Email failed", { description: err });
    window.location.href = `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message || "Please find your e-ticket attached.")}`;
    toast.message("Your email app is opening", { description: "Attach the downloaded PDF before sending." });
    onOpenChange(false);
  };
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Email e-ticket" description="We download the PDF and open your email app addressed to the recipient — attach the file and send.">
      <div className="mt-4 space-y-3">
        <Field label="Recipient email" required>
          <TextInput type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="guest@example.com" />
        </Field>
        <Field label="Message (optional)">
          <TextArea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className={secondaryBtn}>Cancel</button>
          <button type="button" onClick={send} disabled={sending} className={primaryBtn}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
