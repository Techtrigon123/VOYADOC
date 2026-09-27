"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Download, ImageDown, Loader2, Printer, RotateCcw, Signpost } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAgent } from "@/components/agent/AgentProvider";
import { Field, NativeSelect, PageHeader, PageShell, SectionCard, TextInput, primaryBtn, secondaryBtn, useFeatureGate } from "@/components/agent/ui";
import { api, saveBlob } from "@/lib/agent/client";
import { usePlacardFonts } from "@/components/agent/usePlacardFonts";
import { drawPlacard, isLandscape, placardFileName, placardPdf, placardPng, resolveStyle } from "@/lib/agent/placardCanvas";
import { PLACARD_FONTS, PLACARD_THEMES, defaultPlacard, validatePlacard, type PlacardCustom, type PlacardData } from "@/lib/agent/documents";
import type { DocumentSummary } from "@/lib/agent/types";
import { FormSkeleton } from "@/components/agent/skeletons";

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
      <span className="text-slate-700">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-xs text-slate-500">{value}</span>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-slate-200 bg-white" />
      </span>
    </label>
  );
}

export default function PlacardEditorPage() {
  usePlacardFonts();
  const enabled = useFeatureGate("welcome_placard", "Welcome placards");
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit");
  const { agent, refresh } = useAgent();
  const [data, setData] = useState<PlacardData>(defaultPlacard);
  const [version, setVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(!!editId);
  const [busy, setBusy] = useState<"png" | "pdf" | "print" | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const patch = (p: Partial<PlacardData>) => setData((d) => ({ ...d, ...p }));
  const setCustom = (p: Partial<PlacardCustom>) => setData((d) => ({ ...d, custom: { ...d.custom, ...p } }));

  useEffect(() => {
    if (!editId) return;
    void api<{ document: DocumentSummary; data: PlacardData }>(`/api/agent/documents/${editId}`).then((r) => {
      if (!r.success || !r.data) {
        toast.error("Could not open this placard for edit.", { description: r.error?.message });
        router.replace("/dashboard/placards");
        return;
      }
      setData({ ...defaultPlacard(), ...r.data.data });
      setVersion(r.data.document.version);
      setLoading(false);
    });
  }, [editId, router]);

  // Live preview (debounced so typing stays smooth).
  useEffect(() => {
    if (!agent || !canvasRef.current) return;
    const t = window.setTimeout(() => void drawPlacard(canvasRef.current!, data, agent), 120);
    return () => window.clearTimeout(t);
  }, [data, agent, loading]);

  if (!enabled) return null;
  if (loading || !agent) return <FormSkeleton label="Loading placard editor" />;

  const agencyName = agent.brandName?.trim() || agent.companyName?.trim() || "";
  const style = resolveStyle(data);

  const save = async (): Promise<boolean> => {
    if (!agencyName) {
      toast.error("Add your brand or company name in Agent profile before generating a welcome placard.");
      return false;
    }
    const invalid = validatePlacard(data, agencyName);
    if (invalid) {
      toast.error(invalid);
      return false;
    }
    const r = editId
      ? await api<{ document: DocumentSummary }>(`/api/agent/documents/${editId}`, { method: "PATCH", json: { data, generatePdf: true, asNewVersion: true } })
      : await api<{ document: DocumentSummary; becameActive: boolean }>("/api/agent/documents", { method: "POST", json: { kind: "welcome_placard", data, generatePdf: true } });
    if (!r.success || !r.data) {
      toast.error("PDF export failed", { description: r.error?.message });
      return false;
    }
    if ("becameActive" in r.data && r.data.becameActive) toast.success("Your account is now Active 🎉");
    void refresh();
    if (editId) {
      setVersion(r.data.document.version);
      router.replace(`/dashboard/placards/new?edit=${r.data.document.id}`, { scroll: false });
    } else router.replace(`/dashboard/placards/new?edit=${r.data.document.id}`, { scroll: false });
    return true;
  };

  const exportPng = async () => {
    setBusy("png");
    try {
      saveBlob(await placardPng(data, agent), placardFileName(data, "png"));
      toast.success("PNG downloaded");
    } catch {
      toast.error("PNG export failed");
    }
    setBusy(null);
  };

  const saveAndDownload = async () => {
    setBusy("pdf");
    const wasEdit = !!editId;
    if (await save()) {
      try {
        saveBlob(await placardPdf(data, agent), placardFileName(data, "pdf"));
        toast.success(wasEdit ? "New version saved and downloaded" : "PDF saved and downloaded");
      } catch {
        toast.error("PDF export failed");
      }
    }
    setBusy(null);
  };

  const print = async () => {
    const win = window.open("", "_blank");
    setBusy("print");
    const wasEdit = !!editId;
    if (await save()) {
      try {
        const url = URL.createObjectURL(await placardPdf(data, agent));
        if (win) win.location.href = url;
        toast.success(wasEdit ? "New version saved — opened for print" : "PDF saved — opened for print");
      } catch {
        win?.close();
        toast.error("Print preview failed");
      }
    } else win?.close();
    setBusy(null);
  };

  const landscape = isLandscape(data.theme);

  return (
    <PageShell wide>
      <PageHeader
        back={{ href: "/dashboard/placards", label: "Back to saved welcome placards" }}
        eyebrow="Welcome placard"
        title={editId ? "Edit Welcome Placard" : "New Welcome Placard"}
        description={
          editId
            ? `Update this board and save to create version ${(version ?? 1) + 1}. Your earlier PDF stays in the list.`
            : "Create a hotel reception or airport pickup board. Save & Download stores the PDF in your account."
        }
        actions={
          <>
            <button type="button" onClick={exportPng} disabled={!!busy} className={secondaryBtn}>
              {busy === "png" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageDown className="h-4 w-4" />} PNG
            </button>
            <button type="button" onClick={print} disabled={!!busy} className={secondaryBtn}>
              {busy === "print" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />} Print
            </button>
            <button type="button" onClick={saveAndDownload} disabled={!!busy} className={primaryBtn}>
              {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Save &amp; Download
            </button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <div className="space-y-5">
          <SectionCard title="Board details" icon={Signpost}>
            <div className="grid gap-4">
              <div className="grid grid-cols-[130px_1fr] gap-3">
                <Field label="Salutation">
                  <TextInput value={data.guestSalutation} onChange={(e) => patch({ guestSalutation: e.target.value })} placeholder="Mr. & Mrs." list="placard-salutations" />
                  <datalist id="placard-salutations">
                    {["Mr.", "Mrs.", "Ms.", "Miss", "Dr.", "Mr. & Mrs.", "Mstr."].map((s) => <option key={s} value={s} />)}
                  </datalist>
                </Field>
                <Field label="Guest name" required>
                  <TextInput value={data.guestName} onChange={(e) => patch({ guestName: e.target.value })} placeholder="Enter guest name" />
                </Field>
              </div>
              <p className="-mt-2 text-xs text-slate-500">Salutations stay as typed (e.g. Mr. &amp; Mrs.). The guest name appears in capitals on the placard.</p>
              <Field label="Destination / place" required>
                <TextInput value={data.place} onChange={(e) => patch({ place: e.target.value })} placeholder="Enter destination" />
              </Field>
              <Field label="Welcome title" hint="Shown at the top of the board. Leave blank to use Welcome.">
                <TextInput value={data.welcomeTitle} onChange={(e) => patch({ welcomeTitle: e.target.value })} placeholder="Welcome" />
              </Field>
              <Field label="Agency tagline" hint="Optional short line under your brand name">
                <TextInput value={data.tagline} onChange={(e) => patch({ tagline: e.target.value })} />
              </Field>
              <Field label="Flight number" hint="Shown under the destination on airport pickup boards.">
                <TextInput value={data.flightNumber} onChange={(e) => patch({ flightNumber: e.target.value.toUpperCase() })} placeholder="Enter flight number" />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Premium theme">
            <div className="grid grid-cols-2 gap-2">
              {PLACARD_THEMES.map((t) => (
                <button key={t.id} type="button" onClick={() => patch({ theme: t.id, custom: {} })} className={cn("rounded-2xl border px-3 py-2.5 text-left transition", data.theme === t.id ? "border-brand-300 bg-brand-50 ring-4 ring-brand-50" : "border-slate-200 hover:border-brand-200")}>
                  <p className="text-sm font-semibold text-slate-900">{t.label}</p>
                  <p className="text-[11px] leading-snug text-slate-500">{t.description}</p>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="flex items-center justify-between text-sm font-medium text-slate-700">
                Logo size: <span className="tabular-nums text-slate-500">{data.logoSize}%</span>
              </label>
              <input type="range" min={60} max={160} step={10} value={data.logoSize} onChange={(e) => patch({ logoSize: Number(e.target.value) })} className="mt-2 w-full accent-brand-500" />
            </div>

            <button type="button" onClick={() => setCustomOpen((v) => !v)} className="mt-4 flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700">
              Customize colors, fonts &amp; layout
              <ChevronDown className={cn("h-4 w-4 transition", customOpen && "rotate-180")} />
            </button>
            {customOpen ? (
              <div className="mt-3 space-y-3">
                <div className="grid gap-2">
                  <ColorField label="Background color" value={style.background} onChange={(v) => setCustom({ background: v })} />
                  <ColorField label="Border color" value={style.border} onChange={(v) => setCustom({ border: v })} />
                  <ColorField label="Guest name color" value={style.guestColor} onChange={(v) => setCustom({ guestColor: v })} />
                  <ColorField label="Welcome text color" value={style.welcomeColor} onChange={(v) => setCustom({ welcomeColor: v })} />
                  <ColorField label="Agency name color" value={style.agencyColor} onChange={(v) => setCustom({ agencyColor: v })} />
                </div>
                <Field label="Background image URL (optional)" hint="Public image URL; it appears faded behind the text.">
                  <TextInput value={data.custom.backgroundImage ?? ""} onChange={(e) => setCustom({ backgroundImage: e.target.value })} placeholder="https://…" />
                </Field>
                {(["guestFont", "welcomeFont", "agencyFont"] as const).map((k) => (
                  <Field key={k} label={k === "guestFont" ? "Guest name font" : k === "welcomeFont" ? "Welcome font" : "Agency font"}>
                    <NativeSelect value={data.custom[k] ?? ""} onChange={(v) => setCustom({ [k]: v })} options={PLACARD_FONTS.map((f) => ({ value: f.id, label: f.label }))} />
                  </Field>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Spacing">
                    <NativeSelect value={data.custom.spacing ?? ""} onChange={(v) => setCustom({ spacing: (v || undefined) as PlacardCustom["spacing"] })} placeholder="Theme default" options={[{ value: "compact", label: "Compact" }, { value: "normal", label: "Normal" }, { value: "relaxed", label: "Relaxed" }]} />
                  </Field>
                  <Field label="Border / frame">
                    <NativeSelect value={data.custom.frame ?? ""} onChange={(v) => setCustom({ frame: (v || undefined) as PlacardCustom["frame"] })} placeholder="Theme default" options={[{ value: "none", label: "None" }, { value: "thin", label: "Thin" }, { value: "double", label: "Double" }, { value: "ornate", label: "Ornate" }]} />
                  </Field>
                </div>
                <button type="button" onClick={() => patch({ custom: {} })} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
                  <RotateCcw className="h-4 w-4" /> Reset customization
                </button>
              </div>
            ) : null}
          </SectionCard>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-900">Your agency (from profile)</p>
            <div className="mt-3 flex items-center gap-3">
              {agent.brandLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={agent.brandLogo} alt="" className="h-12 w-16 rounded-lg object-contain ring-1 ring-slate-200" />
              ) : null}
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{agencyName || "—"}</p>
                {!agent.brandLogo ? (
                  <Link href="/dashboard/profile/edit#agent-activation-brandLogo" className="text-xs text-brand-600 hover:underline">No logo uploaded — add one in Agent profile settings</Link>
                ) : null}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">Logo and company name always come from your agent profile and appear on every PDF.</p>
          </div>
        </div>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Live preview</p>
              <p className="text-xs text-slate-500">{landscape ? "A4 landscape · print-ready" : "A4 portrait · print-ready"}</p>
            </div>
            <div className={cn("mx-auto overflow-hidden rounded-xl bg-slate-100 shadow-inner ring-1 ring-slate-200", landscape ? "max-w-full" : "max-w-[520px]")}>
              <canvas ref={canvasRef} aria-label="Welcome placard preview" role="img" className="block h-auto w-full" />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
