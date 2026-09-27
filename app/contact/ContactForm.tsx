"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Field, NativeSelect, TextArea, TextInput, primaryBtn } from "@/components/agent/ui";
import { api } from "@/lib/agent/client";
import { cn } from "@/lib/utils";

const TOPICS = [
  { value: "general", label: "General question" },
  { value: "sales", label: "Plans & pricing" },
  { value: "support", label: "Help with my account" },
  { value: "billing", label: "Payments & refunds" },
  { value: "partnership", label: "Partnership" },
];

export default function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", phone: "", company: "", topic: "general", message: "", website: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (f.name.trim().length < 2) return setError("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return setError("Please enter a valid email address.");
    if (f.message.trim().length < 10) return setError("Please write a few more words (at least 10 characters).");
    setSending(true);
    const r = await api("/api/contact", { method: "POST", json: f });
    setSending(false);
    if (!r.success) return setError(r.error?.message || "Could not send your message. Please try again in a moment.");
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
        <p className="mt-3 text-lg font-semibold text-slate-900">Message sent</p>
        <p className="mt-1 text-sm text-slate-600">Thanks, {f.name.split(" ")[0]}! We&apos;ll reply to {f.email} within one working day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="c-name" required>
          <TextInput id="c-name" autoComplete="name" value={f.name} onChange={set("name")} placeholder="Priya Sharma" />
        </Field>
        <Field label="Email" htmlFor="c-email" required>
          <TextInput id="c-email" type="email" autoComplete="email" value={f.email} onChange={set("email")} placeholder="you@agency.com" />
        </Field>
        <Field label="Phone" htmlFor="c-phone" hint="Optional — for a quicker call back">
          <TextInput id="c-phone" type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} placeholder="98XXXXXXXX" />
        </Field>
        <Field label="Agency / company" htmlFor="c-company">
          <TextInput id="c-company" autoComplete="organization" value={f.company} onChange={set("company")} placeholder="Optional" />
        </Field>
      </div>
      <Field label="What is this about?" htmlFor="c-topic">
        <NativeSelect id="c-topic" value={f.topic} onChange={(v) => setF((x) => ({ ...x, topic: v }))} options={TOPICS} />
      </Field>
      <Field label="Message" htmlFor="c-message" required>
        <TextArea id="c-message" rows={5} value={f.message} onChange={set("message")} placeholder="Tell us how we can help…" />
      </Field>
      {/* Honeypot for bots — hidden from people and screen readers. */}
      <input type="text" name="website" value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {error ? <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <button type="submit" disabled={sending} className={cn(primaryBtn, "h-11 w-full")}>
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {sending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
