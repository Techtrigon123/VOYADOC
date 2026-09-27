"use client";

import React, { useEffect, useRef, useState } from "react";
import { Headphones, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader, PageShell } from "@/components/agent/ui";
import { api } from "@/lib/agent/client";

interface Msg {
  id: string;
  from: "agent" | "support";
  body: string;
  createdAt: string;
}

export default function SupportPage() {
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void api<Msg[]>("/api/agent/support").then((r) => setMsgs(r.success && r.data ? r.data : []));
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const r = await api<Msg>("/api/agent/support", { method: "POST", json: { body: text } });
    setSending(false);
    if (!r.success || !r.data) return toast.error(r.error?.message || "Could not send your message. Try again.");
    setMsgs((m) => [...(m ?? []), r.data!]);
    setText("");
  };

  return (
    <PageShell className="max-w-3xl">
      <PageHeader eyebrow="Help" title="Support" description="Chat with our support team about vouchers, invoices, plans, or your account." />
      <div className="flex h-[min(70vh,640px)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Headphones className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">TravelDoc Pro support</p>
            <p className="text-xs text-slate-500">We usually reply within a few hours on working days.</p>
          </div>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-5 py-4">
          {msgs === null ? (
            <div className="flex justify-center py-10 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : msgs.length === 0 ? (
            <div className="mx-auto max-w-sm py-10 text-center text-sm text-slate-500">
              <p className="font-medium text-slate-700">Start a conversation</p>
              <p className="mt-1">Tell us what you need help with — include a voucher number or PNR if it is about a document.</p>
            </div>
          ) : (
            msgs.map((m) => (
              <div key={m.id} className={cn("flex", m.from === "agent" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm", m.from === "agent" ? "rounded-br-md bg-[var(--primary)] text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800")}>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className={cn("mt-1 text-[10px]", m.from === "agent" ? "text-orange-100" : "text-slate-400")}>
                    {new Date(m.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={end} />
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message…"
            aria-label="Message"
            className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          />
          <button type="submit" disabled={sending || !text.trim()} className="inline-flex h-11 w-11 items-center justify-center btn-glow rounded-lg bg-[var(--primary)] text-white hover:bg-orange-600 disabled:opacity-50" aria-label="Send">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
