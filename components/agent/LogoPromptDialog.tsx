"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAgent } from "./AgentProvider";
import { FileDrop, Modal, primaryBtn, secondaryBtn } from "./ui";
import { api, imageFileToDataUrl } from "@/lib/agent/client";
import type { Agent } from "@/lib/agent/types";

/**
 * "Add your logo" prompt. `mode="entry"` on opening a new voucher,
 * `mode="generate"` right before generating a PDF without a logo.
 */
export function LogoPromptDialog({
  open,
  mode,
  onClose,
  onSkip,
  onSaved,
}: {
  open: boolean;
  mode: "entry" | "generate";
  onClose: () => void;
  onSkip: () => void;
  onSaved: () => void;
}) {
  const { setAgent } = useAgent();
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pick = async (f: File) => {
    try {
      setPreview(await imageFileToDataUrl(f, 700));
    } catch {
      toast.error("Wrong file type");
    }
  };

  const save = async () => {
    if (!preview) return;
    setSaving(true);
    const r = await api<Agent>("/api/agent/profile", { method: "PATCH", json: { brandLogo: preview } });
    setSaving(false);
    if (!r.success || !r.data) {
      toast.error("Could not save logo", { description: "Please try a clear PNG or JPG under 5 MB." });
      return;
    }
    setAgent(r.data);
    toast.success("Logo saved", { description: "Your brand now appears on every hotel voucher you create." });
    setPreview(null);
    onSaved();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={mode === "generate" ? "Add your logo before generating?" : "Make your voucher look complete"}
      description={
        mode === "generate"
          ? "Your logo appears on the PDF guests receive. Upload it now, or generate without a logo if you prefer."
          : "Without your brand logo, the hotel voucher feels incomplete. Add your logo so guests see your brand on every voucher — or skip for now and fill the form first."
      }
    >
      <div className="mt-5 space-y-4">
        {preview ? (
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Brand logo" className="h-20 w-28 rounded-xl bg-white object-contain ring-1 ring-slate-200" />
            <button type="button" onClick={() => setPreview(null)} className="text-sm font-medium text-slate-600 hover:text-brand-600">
              Choose another
            </button>
          </div>
        ) : (
          <FileDrop accept="image/png,image/jpeg,image/webp,image/gif" onFile={pick} title="Drop your brand logo here" description="PNG, JPG, or WebP works best" buttonLabel="Choose brand logo" />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onSkip} className={secondaryBtn}>
            {mode === "generate" ? "Generate without logo" : "Skip for now"}
          </button>
          <button type="button" disabled={!preview || saving} onClick={save} className={primaryBtn}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save logo
          </button>
        </div>
      </div>
    </Modal>
  );
}
