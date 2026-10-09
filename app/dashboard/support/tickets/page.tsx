"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bug, ChevronRight, Loader2, Plus, Ticket } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/agent/client";
import { EmptyState, Field, Modal, NativeSelect, PageHeader, PageShell, Segmented, TextArea, TextInput, primaryBtn, secondaryBtn } from "@/components/agent/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_LABELS, STATUS_META, timeAgo, type TicketStatus } from "@/components/agent/support/ticket-meta";

interface TicketRow {
  id: string;
  number: number;
  kind: "ticket" | "bug";
  subject: string;
  category: string;
  status: TicketStatus;
  lastReplyFrom: "agent" | "support";
  lastReplyAt: string;
}

const CATEGORIES = ["general", "documents", "billing", "account", "technical"].map((v) => ({ value: v, label: CATEGORY_LABELS[v] }));
const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as { value: "low" | "normal" | "high" | "urgent"; label: string }[];

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketRow[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api<TicketRow[]>("/api/agent/support/tickets").then((r) => {
      if (r.success && r.data) setTickets(r.data);
      else {
        setTickets([]);
        setError(r.error?.message ?? "Could not load your tickets.");
      }
    });
  }, []);

  const create = async () => {
    setBusy(true);
    const r = await api<TicketRow>("/api/agent/support/tickets", { method: "POST", json: { subject, category, priority, body } });
    setBusy(false);
    if (!r.success || !r.data) return toast.error(r.error?.message ?? "Could not create the ticket.");
    toast.success(r.message ?? "Ticket created.");
    router.push(`/dashboard/support/tickets/${r.data.id}`);
  };

  return (
    <PageShell>
      <PageHeader
        back={{ href: "/dashboard", label: "Dashboard" }}
        eyebrow="Support"
        title="Support tickets"
        description="Written help for detailed issues. Every reply from our team appears here."
      />

      {tickets === null ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>
      ) : tickets.length === 0 ? (
        <EmptyState icon={Ticket} title="No tickets yet" description="Raise a ticket when you need a detailed, written answer." action={<button type="button" onClick={() => setOpen(true)} className={primaryBtn}><Plus className="h-4 w-4" /> New ticket</button>} />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {tickets.map((t) => {
            const meta = STATUS_META[t.status];
            const unread = t.lastReplyFrom === "support" && t.status !== "closed";
            return (
              <li key={t.id}>
                <Link href={`/dashboard/support/tickets/${t.id}`} className="flex items-center gap-3 p-4 transition hover:bg-slate-50">
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", t.kind === "bug" ? "bg-rose-50 text-rose-600" : "bg-sky-50 text-sky-600")}>
                    {t.kind === "bug" ? <Bug className="h-5 w-5" /> : <Ticket className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-black">
                      <span className="text-slate-400">#{t.number}</span> {t.subject}
                      {unread ? <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-black">New reply</span> : null}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {CATEGORY_LABELS[t.category] ?? t.category} · updated {timeAgo(t.lastReplyAt)}
                    </p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold", meta.tone)}>{meta.label}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {tickets && tickets.length > 0 && !error ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 p-3 text-sm font-medium text-slate-500 transition hover:border-brand-300 hover:text-brand-600"
        >
          <Plus className="h-4 w-4" /> Open a new ticket
        </button>
      ) : null}

      <Modal open={open} onOpenChange={setOpen} title="New support ticket" description="Tell us what you need — we usually reply within one working day.">
        <div className="mt-4 space-y-4">
          <Field label="Subject" htmlFor="t-subject" required>
            <TextInput id="t-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={140} placeholder="e.g. GST missing on my last invoice" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Topic" htmlFor="t-cat">
              <NativeSelect id="t-cat" value={category} onChange={setCategory} options={CATEGORIES} />
            </Field>
            <Field label="Priority">
              <Segmented value={priority} onChange={setPriority} options={PRIORITIES} size="sm" />
            </Field>
          </div>
          <Field label="Details" htmlFor="t-body" required hint="Document numbers, what you tried, and what you expected help us answer faster.">
            <TextArea id="t-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} rows={5} />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className={secondaryBtn}>
              Cancel
            </button>
            <button type="button" onClick={create} disabled={busy} className={primaryBtn}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Create ticket
            </button>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
