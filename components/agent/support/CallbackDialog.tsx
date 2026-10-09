"use client";

import React, { useEffect, useState } from "react";
import { CalendarClock, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/agent/client";
import { useAgent } from "@/components/agent/AgentProvider";
import { Field, Modal, NativeSelect, Segmented, TextArea, TextInput, primaryBtn, secondaryBtn } from "@/components/agent/ui";

type Slot = "morning" | "afternoon" | "evening";
interface Callback {
  id: string;
  phone: string;
  preferredDate: string;
  preferredSlot: Slot;
  topic: string;
  status: "requested" | "scheduled" | "completed" | "cancelled" | "missed";
  scheduledAt: string | null;
  adminNote: string | null;
}

const SLOTS: { value: Slot; label: string }[] = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];
const SLOT_HINT: Record<Slot, string> = { morning: "10 am – 1 pm", afternoon: "1 pm – 4 pm", evening: "4 pm – 7 pm" };
const TOPICS = ["Getting started", "Creating documents", "Plans & billing", "Account or profile", "Something else"];
const STATUS: Record<Callback["status"], [string, string]> = {
  requested: ["Requested", "bg-amber-50 text-amber-700"],
  scheduled: ["Scheduled", "bg-sky-50 text-sky-700"],
  completed: ["Completed", "bg-emerald-50 text-emerald-700"],
  cancelled: ["Cancelled", "bg-slate-100 text-slate-500"],
  missed: ["Missed", "bg-rose-50 text-rose-700"],
};

/** Today and the next 14 days in India time, as YYYY-MM-DD. */
function dateOptions() {
  const out: { value: string; label: string }[] = [];
  for (let i = 0; i <= 14; i++) {
    const d = new Date(Date.now() + i * 86400000);
    const value = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
    out.push({ value, label });
  }
  return out;
}

export default function CallbackDialog({ open, onOpenChange, hours }: { open: boolean; onOpenChange: (v: boolean) => void; hours: string }) {
  const { agent } = useAgent();
  const [list, setList] = useState<Callback[] | null>(null);
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(() => dateOptions()[1].value);
  const [slot, setSlot] = useState<Slot>("morning");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [dates] = useState(dateOptions);

  useEffect(() => {
    if (!open) return;
    let live = true;
    void api<Callback[]>("/api/agent/support/callbacks").then((r) => live && setList(r.success && r.data ? r.data : []));
    return () => {
      live = false;
    };
  }, [open]);

  // Pre-fill the agent's own number the first time the dialog opens.
  const [prefilled, setPrefilled] = useState(false);
  if (open && !prefilled && agent?.mobile) {
    setPrefilled(true);
    setPhone(agent.mobile);
  }

  const active = (list ?? []).filter((c) => c.status === "requested" || c.status === "scheduled");

  const submit = async () => {
    setBusy(true);
    const r = await api<Callback>("/api/agent/support/callbacks", { method: "POST", json: { phone, preferredDate: date, preferredSlot: slot, topic, note } });
    setBusy(false);
    if (!r.success || !r.data) return toast.error(r.error?.message ?? "Could not request a callback.");
    toast.success(r.message ?? "Callback requested.");
    setList((l) => [r.data!, ...(l ?? [])]);
    setNote("");
  };

  const cancel = async (id: string) => {
    const r = await api(`/api/agent/support/callbacks/${id}`, { method: "POST", json: { action: "cancel" } });
    if (!r.success) return toast.error(r.error?.message ?? "Could not cancel.");
    setList((l) => (l ?? []).map((c) => (c.id === id ? { ...c, status: "cancelled" } : c)));
    toast.success("Callback cancelled.");
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Request a callback" description={`We'll call you at your preferred time · ${hours}`}>
      <div className="mt-4 space-y-4">
        {active.length ? (
          <ul className="space-y-2">
            {active.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex min-w-0 gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <CalendarClock className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-black">{c.topic}</p>
                    <p className="text-xs text-slate-500">
                      {c.scheduledAt
                        ? `Booked for ${new Date(c.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}`
                        : `${new Date(`${c.preferredDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${SLOT_HINT[c.preferredSlot]}`}{" "}
                      · {c.phone}
                    </p>
                    {c.adminNote ? <p className="mt-1 text-xs text-slate-600">“{c.adminNote}”</p> : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS[c.status][1])}>{STATUS[c.status][0]}</span>
                  <button type="button" onClick={() => void cancel(c.id)} className="text-xs font-semibold text-slate-500 hover:text-rose-600">
                    Cancel
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone number" htmlFor="cb-phone" required>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <TextInput id="cb-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" placeholder="+91 98765 43210" />
            </div>
          </Field>
          <Field label="Preferred day" htmlFor="cb-date" required>
            <NativeSelect id="cb-date" value={date} onChange={setDate} options={dates} />
          </Field>
        </div>
        <Field label="Time slot" required hint={SLOT_HINT[slot] + " IST"}>
          <Segmented value={slot} onChange={setSlot} options={SLOTS} />
        </Field>
        <Field label="What's it about?" htmlFor="cb-topic" required>
          <NativeSelect id="cb-topic" value={topic} onChange={setTopic} options={TOPICS} />
        </Field>
        <Field label="Anything we should know?" htmlFor="cb-note" hint="Optional">
          <TextArea id="cb-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={3} />
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className={secondaryBtn}>
            Close
          </button>
          <button type="button" onClick={submit} disabled={busy} className={primaryBtn}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />} Request callback
          </button>
        </div>
      </div>
    </Modal>
  );
}
