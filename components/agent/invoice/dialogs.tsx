"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search, UserRound } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Field, Modal, NativeSelect, TextArea, TextInput, primaryBtn, secondaryBtn } from "@/components/agent/ui";
import { api, saveBlob } from "@/lib/agent/client";
import {
  GST_TREATMENTS,
  INVOICE_LABELS,
  PAYMENT_MODES,
  PLACES_OF_SUPPLY,
  emptyBillTo,
  paymentReferenceRule,
  today,
  type BillTo,
  type InvoiceKind,
} from "@/lib/agent/documents";
import type { DocumentSummary } from "@/lib/agent/types";
import { RowsSkeleton } from "@/components/agent/skeletons";

export interface SavedCustomer extends BillTo {
  id: string;
  updatedAt: string;
}

export interface NumberInfo {
  settings: { invoicePrefix: string; proformaPrefix: string; receiptPrefix: string; digits: number };
  invoice: { next: string; saved: string[] };
  proforma: { next: string; saved: string[] };
  receipt: { next: string; saved: string[] };
}

/* ─── Customer picker ─────────────────────────────────────────────────── */

export function CustomerPickerDialog({
  open,
  onOpenChange,
  onPick,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (c: SavedCustomer) => void;
  onAdd: () => void;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SavedCustomer[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(async () => {
      const r = await api<SavedCustomer[]>(`/api/agent/customers${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
      if (r.success && r.data) {
        setItems(r.data);
        setError("");
      } else setError("Could not load your saved customers.");
    }, 250);
    return () => window.clearTimeout(t);
  }, [open, q]);

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Pick a saved customer" description="Search by name on the invoice, email, mobile, company, or how you saved them last time.">
      <div className="mt-4 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <TextInput autoFocus aria-label="Search saved customers" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type to search…" className="pl-9" />
        </div>
        <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200">
          {error ? (
            <p className="p-4 text-sm text-rose-600">{error}</p>
          ) : items === null ? (
            <RowsSkeleton rows={4} label="Loading saved customers" />
          ) : items.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">{q ? "Nothing matches — try fewer letters or scroll when you clear the search." : "No saved customers yet. Use Add customer below."}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => onPick(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-orange-50/60">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-orange-600"><UserRound className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">{c.name}{c.company && c.company !== c.name ? ` · ${c.company}` : ""}</span>
                      <span className="block truncate text-xs text-slate-500">{[c.email, c.phone, c.placeOfSupply].filter(Boolean).join(" · ") || "—"}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" onClick={onAdd} className={cn(secondaryBtn, "w-full")}>
          <Plus className="h-4 w-4" /> Add customer
        </button>
        <p className="text-center text-xs text-slate-500">Saves them to your list so you can search and reuse next time.</p>
      </div>
    </Modal>
  );
}

/* ─── Customer details (add / edit) ───────────────────────────────────── */

export function CustomerDetailsDialog({
  open,
  onOpenChange,
  initial,
  customerId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: BillTo;
  customerId: string;
  onSaved: (c: SavedCustomer) => void;
}) {
  const [f, setF] = useState<BillTo>(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) setF(customerId ? initial : { ...emptyBillTo(), name: initial.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const set = (k: keyof BillTo) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const treatment = GST_TREATMENTS.find((g) => g.id === f.gstTreatment);
  const needsGstin = f.gstTreatment === "registered_regular" || f.gstTreatment === "registered_composition";

  const save = async () => {
    if (!f.name.trim() && !f.company.trim()) return toast.error("Add a company or person name before saving this customer.");
    setSaving(true);
    const r = customerId
      ? await api<SavedCustomer>(`/api/agent/customers/${customerId}`, { method: "PATCH", json: f })
      : await api<SavedCustomer>("/api/agent/customers", { method: "POST", json: f });
    setSaving(false);
    if (!r.success || !r.data) return toast.error(r.error?.message || "Could not save this customer. Try again.");
    toast.success(customerId ? "Customer updated" : "Customer saved");
    onSaved(r.data);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title="Customer details"
      description={customerId ? "Updates your saved customer record with all fields below and syncs Bill to on this invoice." : "Everything you enter is saved to your customer list and used on this invoice."}
    >
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Customer name" required>
          <TextInput value={f.name} onChange={set("name")} placeholder="Customer or company name" />
        </Field>
        <Field label="Company">
          <TextInput value={f.company} onChange={set("company")} />
        </Field>
        <Field label="Email">
          <TextInput type="email" value={f.email} onChange={set("email")} />
        </Field>
        <Field label="Phone">
          <TextInput value={f.phone} onChange={set("phone")} />
        </Field>
        <Field label="GST treatment" hint={treatment ? `${treatment.hint} → ${treatment.doc}` : undefined} className="md:col-span-2">
          <NativeSelect value={f.gstTreatment} onChange={(v) => setF((x) => ({ ...x, gstTreatment: v }))} options={GST_TREATMENTS.map((g) => ({ value: g.id, label: g.label }))} />
        </Field>
        <Field label="GSTIN" hint={needsGstin ? "Required for registered businesses." : undefined}>
          <TextInput value={f.gstin} onChange={(e) => setF((x) => ({ ...x, gstin: e.target.value.toUpperCase() }))} placeholder="Customer GSTIN" />
        </Field>
        <Field label="Place of supply">
          <NativeSelect value={f.placeOfSupply} onChange={(v) => setF((x) => ({ ...x, placeOfSupply: v }))} options={PLACES_OF_SUPPLY} placeholder="Select state" />
        </Field>
        <Field label="PAN">
          <TextInput value={f.pan} onChange={(e) => setF((x) => ({ ...x, pan: e.target.value.toUpperCase() }))} placeholder="Customer PAN" />
        </Field>
        <Field label="Address" className="md:col-span-2">
          <TextArea rows={2} value={f.address} onChange={set("address")} placeholder="Building, street, city, PIN, state…" />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={() => onOpenChange(false)} className={secondaryBtn}>Cancel</button>
        <button type="button" onClick={save} disabled={saving} className={primaryBtn}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {customerId ? "Save customer" : "Save new customer"}
        </button>
      </div>
    </Modal>
  );
}

/* ─── Document number settings ────────────────────────────────────────── */

export function NumberSettingsDialog({
  open,
  onOpenChange,
  info,
  onSaved,
  kind,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  info: NumberInfo | null;
  onSaved: (i: NumberInfo) => void;
  kind: InvoiceKind;
}) {
  const [s, setS] = useState(info?.settings ?? { invoicePrefix: "INV-", proformaPrefix: "PI-", receiptPrefix: "RCPT-", digits: 4 });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open && info) setS(info.settings);
  }, [open, info]);
  const preview = (p: string) => `${p}${"1".padStart(s.digits, "0")}`;
  const save = async () => {
    setSaving(true);
    const r = await api<NumberInfo>("/api/agent/invoice-numbers", { method: "PUT", json: s });
    setSaving(false);
    if (!r.success || !r.data) return toast.error(r.error?.message || "Could not save number format. Check your connection and try again.");
    toast.success('Number format saved to your account. Use "Use next suggested number" or type any custom reference you prefer.');
    onSaved(r.data);
  };
  const saved = info?.[kind].saved ?? [];
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title="Automatic document numbers"
      description="Choose how we build the next number for each document type. We look at your saved documents — including custom references you typed — and pick one higher than the largest matching number."
    >
      {info ? (
        <div className="mt-3 rounded-2xl bg-orange-50/70 p-3 text-sm">
          <p className="font-semibold text-slate-900">Next suggested numbers</p>
          <p className="mt-1 text-slate-600">
            Tax invoice: <span className="font-mono font-semibold">{info.invoice.next}</span> · Proforma: <span className="font-mono font-semibold">{info.proforma.next}</span> · Receipt:{" "}
            <span className="font-mono font-semibold">{info.receipt.next}</span>
          </p>
        </div>
      ) : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Tax invoice prefix" hint={`e.g. ${preview(s.invoicePrefix)}`}>
          <TextInput value={s.invoicePrefix} onChange={(e) => setS({ ...s, invoicePrefix: e.target.value })} />
        </Field>
        <Field label="Proforma prefix" hint={`e.g. ${preview(s.proformaPrefix)}`}>
          <TextInput value={s.proformaPrefix} onChange={(e) => setS({ ...s, proformaPrefix: e.target.value })} />
        </Field>
        <Field label="Receipt prefix" hint={`e.g. ${preview(s.receiptPrefix)}`}>
          <TextInput value={s.receiptPrefix} onChange={(e) => setS({ ...s, receiptPrefix: e.target.value })} />
        </Field>
        <Field label="Number width (digits)">
          <NativeSelect value={String(s.digits)} onChange={(v) => setS({ ...s, digits: Number(v) })} options={["1", "2", "3", "4", "5", "6", "7", "8"]} />
        </Field>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-slate-700">Saved on your account ({INVOICE_LABELS[kind].plural})</p>
        <p className="text-xs text-slate-500">Custom IDs (not the automatic pattern) are included when we suggest the next number if they share your prefix.</p>
        <div className="mt-2 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
          {saved.length ? saved.map((n) => <span key={n} className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">{n}</span>) : <p className="text-xs text-slate-400">No saved document numbers for this type yet. After you save invoices, they appear here so you can reuse or compare them.</p>}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap justify-between gap-2">
        <button type="button" onClick={() => setS({ invoicePrefix: "INV-", proformaPrefix: "PI-", receiptPrefix: "RCPT-", digits: 4 })} className="text-sm font-medium text-slate-500 hover:text-orange-600">Reset to defaults</button>
        <div className="flex gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className={secondaryBtn}>Cancel</button>
          <button type="button" onClick={save} disabled={saving} className={primaryBtn}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save</button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Record payment ──────────────────────────────────────────────────── */

interface PaymentsInfo {
  document: DocumentSummary;
  total: number;
  paid: number;
  balanceDue: number;
  payments: DocumentSummary[];
}

export function RecordPaymentDialog({
  doc,
  onOpenChange,
  suggestedNumber,
  onSaved,
}: {
  doc: DocumentSummary | null;
  onOpenChange: (v: boolean) => void;
  suggestedNumber: string;
  onSaved: () => void;
}) {
  const [info, setInfo] = useState<PaymentsInfo | null>(null);
  const [date, setDate] = useState(today());
  const [mode, setMode] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [number, setNumber] = useState(suggestedNumber);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!doc) return;
    setInfo(null);
    setError("");
    setDate(today());
    setMode("");
    setReference("");
    setNote("");
    setNumber(suggestedNumber);
    void api<PaymentsInfo>(`/api/agent/documents/${doc.id}/payments`).then((r) => {
      if (r.success && r.data) {
        setInfo(r.data);
        setAmount(r.data.balanceDue > 0 ? r.data.balanceDue.toFixed(2) : "");
      } else setError(r.error?.message || "Could not open this document. Try again.");
    });
  }, [doc, suggestedNumber]);

  const rule = paymentReferenceRule(mode);
  const cur = doc?.currency ?? "INR";
  const amt = parseFloat(amount) || 0;
  const after = useMemo(() => {
    if (!info) return null;
    const paid = Math.min(info.total, info.paid + amt);
    return { paid, balance: Math.max(0, info.total - paid) };
  }, [info, amt]);
  const paidPct = info && info.total ? Math.round((info.paid / info.total) * 100) : 0;

  const save = async () => {
    setError("");
    if (!date) return setError("Choose a payment date.");
    if (!mode) return setError("Choose a payment mode.");
    if (amt <= 0) return setError("Enter an amount greater than zero.");
    if (info && amt > info.balanceDue + 0.001) return setError(`Enter up to ${cur} ${info.balanceDue.toFixed(2)} (balance due).`);
    if (rule?.required && !reference.trim()) return setError(rule.error);
    if (!number.trim()) return setError("Enter a receipt number.");
    setSaving(true);
    const r = await api(`/api/agent/documents/${doc!.id}/payments`, { method: "POST", json: { date, mode, amount: amt, reference, note, receiptNumber: number.trim() } });
    setSaving(false);
    if (!r.success) return setError(r.error?.message || "Could not save this payment. Try again.");
    toast.success("Payment saved. Your receipt is in the Receipts list.");
    onSaved();
  };

  return (
    <Modal open={!!doc} onOpenChange={onOpenChange} size="lg" title="Record payment" description={doc ? `${doc.title} · ${doc.subtitle ?? ""}` : undefined}>
      {!info && !error ? (
        <RowsSkeleton rows={3} label="Loading payment details" className="mt-4 rounded-2xl border border-slate-200" />
      ) : info ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div><p className="text-xs text-slate-500">Total</p><p className="font-bold">{cur} {info.total.toFixed(2)}</p></div>
              <div><p className="text-xs text-slate-500">Paid</p><p className="font-bold text-emerald-600">{cur} {info.paid.toFixed(2)}</p></div>
              <div><p className="text-xs text-slate-500">{info.balanceDue > 0 ? "Still due" : "Balance"}</p><p className="font-bold text-orange-600">{cur} {info.balanceDue.toFixed(2)}</p></div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-orange-100" aria-label={`Paid ${paidPct} percent, ${100 - paidPct} percent still due`}>
              <div className="h-full bg-emerald-500" style={{ width: `${paidPct}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-500">{info.balanceDue <= 0 ? "Fully received" : `${paidPct}% paid · ${100 - paidPct}% still due`}</p>
            {info.balanceDue > 0 && after && amt > 0 ? (
              <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                If you save this payment: paid {cur} {after.paid.toFixed(2)} · balance {after.balance <= 0 ? "Fully paid" : `${cur} ${after.balance.toFixed(2)}`}
              </p>
            ) : null}
          </div>

          {info.payments.length ? (
            <div>
              <p className="text-sm font-medium text-slate-700">Earlier payments ({info.payments.length})</p>
              <ul className="mt-1 divide-y divide-slate-100 rounded-2xl border border-slate-200 text-sm">
                {info.payments.map((p) => (
                  <li key={p.id} className="flex justify-between px-3 py-2">
                    <span className="font-mono">{p.number}</span>
                    <span>{cur} {(p.total ?? 0).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {info.balanceDue <= 0 ? (
            <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700">Fully paid — nothing more to collect on this document.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Receipt number" required hint={`Saved under Receipts · suggested ${suggestedNumber}`}>
                <TextInput value={number} onChange={(e) => setNumber(e.target.value)} className="font-mono" />
              </Field>
              <Field label="Date" required>
                <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label="Mode" required>
                <NativeSelect value={mode} onChange={setMode} options={PAYMENT_MODES} placeholder="Choose mode" />
              </Field>
              <Field label="Amount" required hint={`Max ${cur} ${info.balanceDue.toFixed(2)}`}>
                <TextInput inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </Field>
              {rule ? (
                <Field label={rule.label} required={rule.required} hint={rule.hint} className="sm:col-span-2">
                  <TextInput value={reference} onChange={(e) => setReference(e.target.value)} />
                </Field>
              ) : null}
              <Field label="Note" hint="Optional" className="sm:col-span-2">
                <TextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
            </div>
          )}
          {error ? <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => onOpenChange(false)} className={secondaryBtn}>Back</button>
            {info.balanceDue > 0 ? (
              <button type="button" onClick={save} disabled={saving} className={primaryBtn}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {saving ? "Saving…" : "Save receipt"}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}
    </Modal>
  );
}

/* ─── Export ──────────────────────────────────────────────────────────── */

export function ExportDialog({ open, onOpenChange, kind }: { open: boolean; onOpenChange: (v: boolean) => void; kind: InvoiceKind }) {
  const [mod, setMod] = useState<InvoiceKind>(kind);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [template, setTemplate] = useState("default");
  const [decimals, setDecimals] = useState("2");
  const [format, setFormat] = useState("csv");
  const [pii, setPii] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setMod(kind);
  }, [open, kind]);

  const run = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/agent/invoices/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: mod, from, to, template, decimals: Number(decimals), format, includePii: pii }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error?.message);
      const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? `export.${format}`;
      saveBlob(await res.blob(), name);
      toast.success("Export downloaded");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || "Could not export invoices. Check your connection and try again.");
    }
    setBusy(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="lg" title="Export invoices" description="Export your saved documents in CSV, XLS, or XLSX format.">
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Module" className="sm:col-span-2">
          <NativeSelect value={mod} onChange={(v) => setMod(v as InvoiceKind)} options={[{ value: "invoice", label: "Invoices" }, { value: "proforma", label: "Proforma Invoices" }, { value: "receipt", label: "Receipts" }]} />
        </Field>
        <Field label="Date range from">
          <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="Date range to">
          <TextInput type="date" min={from || undefined} value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Field label="Export template" hint="Accounting includes GST columns (CGST, SGST, IGST). Default includes contact and booking fields.">
          <NativeSelect value={template} onChange={setTemplate} options={[{ value: "default", label: "Default (all columns)" }, { value: "summary", label: "Summary" }, { value: "accounting", label: "Accounting (GST columns)" }]} />
        </Field>
        <Field label="Decimal format">
          <NativeSelect value={decimals} onChange={setDecimals} options={[{ value: "2", label: "1234567.89" }, { value: "0", label: "1234568" }]} />
        </Field>
        <Field label="Export file format" className="sm:col-span-2">
          <div className="grid gap-2">
            {[
              ["csv", "CSV (Comma Separated Value)"],
              ["xls", "XLS (Microsoft Excel 1997-2004 Compatible)"],
              ["xlsx", "XLSX (Microsoft Excel)"],
            ].map(([v, l]) => (
              <label key={v} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm", format === v ? "border-orange-300 bg-orange-50" : "border-slate-200")}>
                <input type="radio" name="format" checked={format === v} onChange={() => setFormat(v)} className="accent-orange-500" /> {l}
              </label>
            ))}
          </div>
        </Field>
        <label className="flex cursor-pointer items-start gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={pii} onChange={(e) => setPii(e.target.checked)} className="mt-0.5 h-4 w-4 accent-orange-500" />
          <span>
            Include sensitive personally identifiable information (PII) while exporting.
            <span className="block text-xs text-slate-500">When off, customer GSTIN, email, phone, and address are left blank in the file.</span>
          </span>
        </label>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={() => onOpenChange(false)} className={secondaryBtn}>Cancel</button>
        <button type="button" onClick={run} disabled={busy} className={primaryBtn}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {busy ? "Exporting…" : "Export"}</button>
      </div>
    </Modal>
  );
}
