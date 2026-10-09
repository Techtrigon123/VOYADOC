"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field, PageShell, TextInput, primaryBtn } from "@/components/agent/ui";
import { api } from "@/lib/agent/client";

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (next.length < 8) return setError("New password must be at least 8 characters.");
    if (next !== confirm) return setError("New passwords do not match.");
    setSaving(true);
    const r = await api("/api/agent/change-password", { method: "POST", json: { currentPassword: current, newPassword: next } });
    setSaving(false);
    if (!r.success) return setError(r.error?.message || "Could not update your password. Please try again.");
    setDone(true);
    toast.success("Your password has been updated.");
  };

  return (
    <PageShell className="max-w-md">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <KeyRound className="h-5 w-5" />
          </span>
          <BackButton fallback="/dashboard/profile" label="Back to profile" />
        </div>
        <h1 className="mt-3 text-xl font-bold text-slate-900">Change password</h1>
        <p className="mt-1 text-sm text-slate-500">Choose a new password. You will stay signed in on this device.</p>

        {done ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="flex items-center gap-2 font-semibold text-emerald-800">
              <CheckCircle2 className="h-5 w-5" /> Password updated
            </p>
            <Link href="/dashboard/profile" className="mt-2 inline-block text-sm font-semibold text-emerald-700 hover:underline">
              Back to profile
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <Field label="Current password" htmlFor="cur">
              <TextInput id="cur" type={show ? "text" : "password"} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </Field>
            <Field label="New password" htmlFor="new">
              <TextInput id="new" type={show ? "text" : "password"} autoComplete="new-password" placeholder="At least 8 characters" value={next} onChange={(e) => setNext(e.target.value)} />
            </Field>
            <Field label="Confirm new password" htmlFor="conf">
              <TextInput id="conf" type={show ? "text" : "password"} autoComplete="new-password" placeholder="Re-enter new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
            <button type="button" onClick={() => setShow((v) => !v)} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900">
              {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {show ? "Hide passwords" : "Show passwords"}
            </button>
            {error ? <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            <button type="submit" disabled={saving} className={`${primaryBtn} w-full`}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Updating…" : "Update password"}
            </button>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <Link href="/dashboard/profile" className="hover:text-brand-600">Back to profile</Link>
              <Link href="/forgot-password" className="hover:text-brand-600">Signed out? Reset with email instead</Link>
            </div>
          </form>
        )}
      </div>
    </PageShell>
  );
}
