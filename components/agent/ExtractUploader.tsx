"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Loader2, Lock, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/agent/client";
import { FileDrop } from "./ui";

interface Status {
  available: boolean;
  plan: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  period: "day" | "year" | "unlimited";
}

const COPY = {
  voucher: {
    noun: "voucher",
    title: "Fill from your voucher",
    description: "PDF or photo from any hotel. We fill the form, then you pick a template.",
    button: "Choose voucher file",
    check: "Check this is the right hotel voucher, then fill the form.",
    reading: "Reading your voucher and filling the form…",
    done: "Form filled. Pick a PDF template next.",
    locked: "Upload voucher locked",
    manual: "You can still create vouchers by filling the form manually.",
  },
  ticket: {
    noun: "ticket",
    title: "Fill from your ticket",
    description: "PDF or photo of an airline e-ticket. We fill flight, passenger, PNR, and fare details for you.",
    button: "Choose ticket file",
    check: "Check this is the right ticket, then fill the form.",
    reading: "Reading your ticket and filling the form…",
    done: "Form filled. Review each step before saving.",
    locked: "Upload ticket locked",
    manual: "You can still create airline tickets by filling the form manually.",
  },
};

const ACCEPT = "application/pdf,image/png,image/jpeg,image/webp";

export function ExtractUploader<T>({ type, onFields }: { type: "voucher" | "ticket"; onFields: (fields: T) => number }) {
  const copy = COPY[type];
  const [status, setStatus] = useState<Status | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "ready" | "filling" | "done">("idle");

  const loadStatus = useCallback(async () => {
    const r = await api<Status>(`/api/agent/extract?type=${type}`);
    if (r.success && r.data) setStatus(r.data);
  }, [type]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const choose = (f: File) => {
    if (!ACCEPT.split(",").includes(f.type)) {
      toast.error("Wrong file type", { description: "Upload a PDF or a PNG, JPG or WebP image." });
      return;
    }
    setFile(f);
    setPhase("ready");
  };

  const fill = async () => {
    if (!file) return;
    setPhase("filling");
    const body = new FormData();
    body.append("file", file);
    body.append("type", type);
    const r = await api<{ fields: T; usage: Status }>("/api/agent/extract", { method: "POST", body });
    if (!r.success || !r.data) {
      setPhase("ready");
      const code = r.error?.code;
      if (code === "SUBSCRIPTION_REQUIRED") toast.error("Paid subscription needed", { description: r.error?.message });
      else if (code === "EXTRACT_TEMPORARY") toast.error(type === "ticket" ? "Ticket reader busy" : "Reader busy", { description: r.error?.message });
      else toast.error(`Could not read ${type === "ticket" ? "ticket" : "voucher"}`, { description: "Try a clearer PDF or image, or fill the form manually." });
      void loadStatus();
      return;
    }
    const n = onFields(r.data.fields);
    setStatus((s) => (s ? { ...s, ...r.data!.usage } : s));
    setPhase("done");
    if (n > 0)
      toast.success(`${type === "ticket" ? "Ticket" : "Voucher"} details filled in`, {
        description: `We filled ${n} ${type === "ticket" ? "section" : "field"}${n === 1 ? "" : "s"}. Please check everything before saving.`,
      });
    else toast.message("We could not find much on this file. Please check and complete the form.");
  };

  const exhausted = status && status.remaining !== null && status.remaining <= 0;
  const usageLine =
    status && status.limit !== null
      ? `${status.remaining} of ${status.limit} upload${status.limit === 1 ? "" : "s"} left ${status.period === "day" ? "today" : "this year"}`
      : status?.period === "unlimited"
        ? "Unlimited uploads on Platinum"
        : null;

  return (
    <div className="rounded-3xl border border-brand-200 bg-white p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
            <Sparkles className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{copy.title}</p>
            <p className="text-xs text-slate-500">{copy.description}</p>
          </div>
        </div>
        {usageLine && !exhausted ? <span className="hidden shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200 sm:inline">{usageLine}</span> : null}
      </div>

      {status && !status.available ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Upload auto-fill is not available right now. {copy.manual}
        </div>
      ) : exhausted ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Lock className="h-4 w-4 text-slate-400" /> {copy.locked}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Free limit used ({status!.used}/{status!.limit} {status!.period === "day" ? "today" : "this year"}). {copy.manual}
          </p>
          <Link href="/dashboard/pricing" className="mt-3 inline-flex text-sm font-semibold text-brand-600 hover:underline">
            View paid plans →
          </Link>
        </div>
      ) : phase === "idle" ? (
        <FileDrop accept={ACCEPT} onFile={choose} title={copy.title} description="PDF, PNG, JPG or WebP · up to 10 MB" buttonLabel={copy.button} compact />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-14 w-14 rounded-lg object-cover ring-1 ring-slate-200" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <FileText className="h-6 w-6" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{file?.name}</p>
              <p className={cn("text-xs", phase === "done" ? "text-emerald-600" : "text-slate-500")}>
                {phase === "filling" ? copy.reading : phase === "done" ? copy.done : copy.check}
              </p>
            </div>
            <button type="button" aria-label="Choose another" disabled={phase === "filling"} onClick={() => { setFile(null); setPhase("idle"); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={fill} disabled={phase === "filling"} className="inline-flex h-9 items-center gap-2 btn-glow rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
              {phase === "filling" ? <Loader2 className="h-4 w-4 animate-spin" /> : phase === "done" ? <CheckCircle2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              {phase === "filling" ? "Filling form…" : phase === "done" ? "Fill again" : "Fill form from this file"}
            </button>
            <button type="button" disabled={phase === "filling"} onClick={() => { setFile(null); setPhase("idle"); }} className="h-9 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Choose another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
