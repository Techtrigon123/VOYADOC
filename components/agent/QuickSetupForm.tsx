"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Briefcase, Building2, Check, Compass, Globe2, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/agent/client";
import {
  INDIAN_STATES,
  PARTNER_TYPES,
  PARTNER_TYPE_LABELS,
  isPartnerType,
  normalizeMobile,
} from "@/lib/agent/profile";
import type { Agent, PartnerType } from "@/lib/agent/types";

const STEPS = [
  { id: "role", title: "Who you are", subtitle: "Choose the option that best matches your business." },
  { id: "profile", title: "Your profile", subtitle: "Details we use on vouchers, invoices, and your account." },
];

const ICONS: Record<PartnerType, React.ComponentType<{ className?: string }>> = {
  travel_agent: Briefcase,
  tour_operator: Compass,
  dmc: Globe2,
  hotel: Building2,
  other: HelpCircle,
};

const inputCls = "h-11 rounded-xl";
const Req = () => <span className="text-orange-500"> *</span>;
/** Capitalise the first letter of each word as the user types. */
const titleCase = (v: string) => v.replace(/(^|\s)(\p{L})/gu, (_m, s: string, c: string) => s + c.toUpperCase());

export function QuickSetupForm({ initial, onSuccess }: { initial: Agent; onSuccess: (a: Agent) => void }) {
  const [step, setStep] = useState(0);
  const [partnerType, setPartnerType] = useState<PartnerType | "">("");
  const [partnerTypeOther, setPartnerTypeOther] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [mobile, setMobile] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = (v?: string) => String(v ?? "").trim();
    if (t(initial.name).length >= 2) setName(t(initial.name));
    if (t(initial.companyName).length >= 2) setCompanyName(t(initial.companyName));
    if (t(initial.brandName).length >= 2) setBrandName(t(initial.brandName));
    if (isPartnerType(initial.partnerType)) setPartnerType(initial.partnerType);
    if (t(initial.partnerTypeOther).length >= 2) setPartnerTypeOther(t(initial.partnerTypeOther));
    if (normalizeMobile(initial.mobile ?? "").length === 10) setMobile(normalizeMobile(initial.mobile ?? ""));
    if (t(initial.state)) setState(t(initial.state));
    if (t(initial.city).length >= 2) setCity(t(initial.city));
  }, [initial]);

  const isOther = partnerType === "other";
  const roleOk = isPartnerType(partnerType) && (!isOther || partnerTypeOther.trim().length >= 2);
  const profileOk =
    name.trim().length >= 2 && companyName.trim().length >= 2 && normalizeMobile(mobile).length === 10 && !!state && city.trim().length >= 2;

  const next = () => {
    setError("");
    if (!isPartnerType(partnerType)) return setError("Please tell us who you are");
    if (isOther && partnerTypeOther.trim().length < 2) return setError("Please tell us what best describes you");
    setStep(1);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (step === 0) return next();
    if (name.trim().length < 2) return setError("Please enter your name");
    if (companyName.trim().length < 2) return setError("Please enter your company name");
    if (normalizeMobile(mobile).length !== 10) return setError("Please enter a valid 10-digit phone number");
    if (!state) return setError("Please select your state");
    if (city.trim().length < 2) return setError("Please enter your city");
    setSaving(true);
    const r = await api<Agent>("/api/agent/setup", {
      method: "POST",
      json: { partnerType, partnerTypeOther: isOther ? partnerTypeOther.trim() : null, name, companyName, brandName, mobile, state, city },
    });
    setSaving(false);
    if (r.success && r.data) onSuccess(r.data);
    else setError(r.error?.message || "Could not save your details. Please try again.");
  };

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]">Quick setup</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{STEPS[step].title}</h1>
      <p className="mt-1 text-sm text-slate-500">{STEPS[step].subtitle}</p>

      <div className="mt-5" aria-label={`Step ${step + 1} of 2`}>
        <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-400">
          <span className={cn(step === 0 && "text-slate-900")}>Role</span>
          <span className={cn(step === 1 && "text-slate-900")}>Profile</span>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s.id} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-[var(--primary)]" : "bg-slate-200")} />
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-400">Step {step + 1} of 2</p>
      </div>

      {error ? <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

      <form onSubmit={submit} className="mt-5 space-y-4" autoComplete="on" name="agent-quick-setup">
        {step === 0 ? (
          <fieldset disabled={saving} className="space-y-2">
            <legend className="sr-only">Who you are</legend>
            <div role="radiogroup" aria-label="Who you are" className="grid gap-2">
              {PARTNER_TYPES.map((t) => {
                const Icon = ICONS[t];
                const selected = partnerType === t;
                return (
                  <label
                    key={t}
                    className={cn(
                      "group flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-3 transition-all",
                      selected ? "border-orange-400 bg-orange-50 shadow-sm ring-4 ring-orange-100" : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                    )}
                  >
                    <input
                      type="radio"
                      name="partnerType"
                      value={t}
                      checked={selected}
                      onChange={() => {
                        setPartnerType(t);
                        if (t !== "other") setPartnerTypeOther("");
                      }}
                      className="sr-only"
                    />
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", selected ? "bg-[var(--primary)] text-white" : "bg-slate-100 text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600")}>
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="flex-1 text-sm font-semibold text-slate-900">{PARTNER_TYPE_LABELS[t]}</span>
                    <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border", selected ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-slate-300 text-transparent")}>
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  </label>
                );
              })}
            </div>
            {isOther ? (
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="setup-partner-other">
                  Tell us who you are
                  <Req />
                </Label>
                <Input id="setup-partner-other" value={partnerTypeOther} onChange={(e) => setPartnerTypeOther(e.target.value)} placeholder="e.g. Corporate travel desk" className={inputCls} />
                <p className="text-xs text-slate-500">Other accounts are reviewed by our team before full verification.</p>
              </div>
            ) : null}
          </fieldset>
        ) : (
          <fieldset disabled={saving} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="setup-name">Name<Req /></Label>
                <Input id="setup-name" autoComplete="name" value={name} onChange={(e) => setName(titleCase(e.target.value))} placeholder="Full name" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="setup-company">Company name<Req /></Label>
                <Input id="setup-company" autoComplete="organization-title" value={companyName} onChange={(e) => setCompanyName(titleCase(e.target.value))} placeholder="Registered legal company name" className={inputCls} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="setup-brand">Brand name</Label>
              <Input id="setup-brand" autoComplete="organization" value={brandName} onChange={(e) => setBrandName(titleCase(e.target.value))} placeholder="Shown on vouchers and invoices" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="setup-mobile">Phone<Req /></Label>
              <Input
                id="setup-mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/[^\d+\s-]/g, ""))}
                onBlur={(e) => setMobile(normalizeMobile(e.target.value))}
                placeholder="10-digit mobile number"
                maxLength={16}
                className={inputCls}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="setup-state">State<Req /></Label>
                <Select value={state || undefined} onValueChange={setState}>
                  <SelectTrigger id="setup-state" className={inputCls}>
                    <SelectValue placeholder="Select state / UT" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {INDIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="setup-city">City<Req /></Label>
                <Input id="setup-city" autoComplete="address-level2" value={city} onChange={(e) => setCity(titleCase(e.target.value))} placeholder="Mumbai" className={inputCls} />
              </div>
            </div>
          </fieldset>
        )}

        <div className={cn("flex gap-2 pt-1", step === 0 && "flex-col")}>
          {step > 0 ? (
            <button type="button" onClick={() => { setError(""); setStep(0); }} disabled={saving} className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : null}
          <button
            type="submit"
            disabled={saving || (step === 0 ? !roleOk : !profileOk)}
            className={cn("inline-flex h-11 items-center justify-center gap-1.5 btn-flame rounded-full bg-[var(--primary)] text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:opacity-50", step > 0 ? "flex-[1.4]" : "w-full")}
          >
            {saving ? "Saving…" : step === 0 ? "Continue" : "Continue to dashboard"}
            {!saving ? <ArrowRight className="h-4 w-4" /> : null}
          </button>
        </div>
      </form>
    </div>
  );
}
