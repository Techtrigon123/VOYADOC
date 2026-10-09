"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Bug, CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/agent/client";
import { ConfirmDialog, PageHeader, PageShell, TextArea, primaryBtn, secondaryBtn } from "@/components/agent/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_META, timeAgo, type TicketStatus } from "@/components/agent/support/ticket-meta";

interface Thread {
  ticket: { id: string; number: number; kind: "ticket" | "bug"; subject: string; category: string; priority: string; status: TicketStatus; createdAt: string };
  messages: { id: string; from: "agent" | "support"; authorName: string | null; body: string; attachment: string | null; createdAt: string }[];
}

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  const [thread, setThread] = useState<Thread | null>(null);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void api<Thread>(`/api/agent/support/tickets/${id}`).then((r) => {
      if (r.success && r.data) setThread(r.data);
      else setError(r.error?.message ?? "Could not load the ticket.");
    });
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread?.messages.length]);

  const send = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    const r = await api<Thread["messages"][number]>(`/api/agent/support/tickets/${id}`, { method: "POST", json: { body: reply } });
    setBusy(false);
    if (!r.success || !r.data) return toast.error(r.error?.message ?? "Could not send your reply.");
    setReply("");
    setThread((t) =>
      t ? { ...t, ticket: { ...t.ticket, status: t.ticket.status === "resolved" || t.ticket.status === "waiting" ? "open" : t.ticket.status }, messages: [...t.messages, r.data!] } : t
    );
  };

  const close = async () => {
    const r = await api(`/api/agent/support/tickets/${id}`, { method: "POST", json: { action: "close" } });
    if (!r.success) return toast.error(r.error?.message ?? "Could not close the ticket.");
    toast.success("Ticket closed.");
    setThread((t) => (t ? { ...t, ticket: { ...t.ticket, status: "closed" } } : t));
  };

  if (error) return <PageShell><p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p></PageShell>;
  if (!thread)
    return (
      <PageShell className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </PageShell>
    );

  const t = thread.ticket;
  const meta = STATUS_META[t.status];
  const closed = t.status === "closed";

  return (
    <PageShell>
      <PageHeader
        back={{ href: "/dashboard/support/tickets", label: "Support tickets" }}
        eyebrow={`${t.kind === "bug" ? "Bug report" : "Ticket"} #${t.number}`}
        title={t.subject}
        description={`${CATEGORY_LABELS[t.category] ?? t.category} · ${PRIORITY_LABELS[t.priority] ?? t.priority} priority · opened ${timeAgo(t.createdAt)}`}
        actions={
          <>
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", meta.tone)}>{meta.label}</span>
            {!closed ? (
              <button type="button" onClick={() => setConfirmClose(true)} className={secondaryBtn}>
                <CheckCircle2 className="h-4 w-4" /> Close ticket
              </button>
            ) : null}
          </>
        }
      />

      <ol className="space-y-4">
        {thread.messages.map((m) => {
          const mine = m.from === "agent";
          return (
            <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] rounded-2xl border p-4 sm:max-w-[75%]", mine ? "border-brand-100 bg-brand-50" : "border-slate-200 bg-white")}>
                <p className="mb-1 text-xs font-semibold text-slate-500">
                  {mine ? "You" : m.authorName ? `${m.authorName} · Vouchlio support` : "Vouchlio support"} · {timeAgo(m.createdAt)}
                </p>
                <p className="whitespace-pre-wrap text-sm text-black">{m.body}</p>
                {m.attachment ? (
                  <a href={m.attachment} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-xl border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.attachment} alt="Attached screenshot" className="max-h-72 w-full object-contain bg-white" />
                    <span className="flex items-center gap-1.5 border-t border-slate-200 px-3 py-1.5 text-xs text-slate-500">
                      <Bug className="h-3.5 w-3.5" /> Screenshot · open full size
                    </span>
                  </a>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      <div ref={endRef} />

      {closed ? (
        <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">This ticket is closed. Need more help? Open a new ticket from the Support menu.</p>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-3">
          <TextArea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            maxLength={5000}
            rows={3}
            placeholder={t.status === "resolved" ? "Still need help? Reply to reopen this ticket…" : "Write a reply…"}
            className="border-0 shadow-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void send();
            }}
          />
          <div className="flex items-center justify-between gap-2 pt-2">
            <span className="text-xs text-slate-400">Ctrl + Enter to send</span>
            <button type="button" onClick={send} disabled={busy || !reply.trim()} className={primaryBtn}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send reply
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Close this ticket?"
        description="Close it if your issue is solved. You can always open a new ticket later."
        confirmLabel="Close ticket"
        destructive={false}
        onConfirm={() => {
          setConfirmClose(false);
          void close();
        }}
      />
    </PageShell>
  );
}
