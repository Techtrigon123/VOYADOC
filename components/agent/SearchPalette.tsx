"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { FileText, Search, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/agent/client";
import { KIND_LABELS } from "@/lib/agent/documents";
import type { DocumentKind } from "@/lib/agent/types";
import { KIND_ICONS } from "./DocumentAccessWarning";
import { documentHref } from "./nav-config";
import { RowsSkeleton } from "@/components/agent/skeletons";

interface Hit {
  id: string;
  kind: DocumentKind;
  title: string;
  subtitle?: string;
  number?: string;
  hasStoredPdf: boolean;
}

const DEBOUNCE_MS = 400;
const MIN_CHARS = 2;

export function SearchPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState(0);
  const seq = useRef(0);

  useEffect(() => {
    if (!open) {
      setQ("");
      setHits([]);
      setError("");
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < MIN_CHARS) {
      setHits([]);
      setError("");
      setLoading(false);
      return;
    }
    const id = ++seq.current;
    setLoading(true);
    setError("");
    const t = window.setTimeout(async () => {
      const r = await api<{ items: Hit[] }>(`/api/agent/documents/search?q=${encodeURIComponent(term)}`);
      if (seq.current !== id) return;
      setLoading(false);
      if (!r.success || !r.data) {
        setHits([]);
        setError(r.error?.message || "Could not search. Try again.");
        return;
      }
      setHits(r.data.items);
      setActive(0);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [q, open]);

  const choose = useCallback(
    (h: Hit) => {
      onOpenChange(false);
      router.push(documentHref(h.kind, h.id));
    },
    [onOpenChange, router]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!hits.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + hits.length) % hits.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(hits[active]);
    }
  };

  const term = q.trim();
  let body: React.ReactNode;
  if (loading) body = <RowsSkeleton rows={4} label="Searching" className="py-2" />;
  else if (error) body = <Empty icon={<SearchX className="h-5 w-5" />} title={error} tone="error" />;
  else if (term.length < MIN_CHARS)
    body = (
      <Empty
        icon={<Search className="h-5 w-5" />}
        title="Search your documents"
        description="Find vouchers, tickets, invoices and receipts by number, PNR, guest or hotel name."
      />
    );
  else if (!hits.length) body = <Empty icon={<SearchX className="h-5 w-5" />} title="No matches" description={`Nothing found for “${term}”. Try a voucher number, PNR, or guest name.`} />;
  else
    body = (
      <div>
        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {hits.length} result{hits.length === 1 ? "" : "s"}
        </p>
        <ul role="listbox" aria-label="Search results">
          {hits.map((h, i) => {
            const Icon = KIND_ICONS[h.kind] ?? FileText;
            return (
              <li key={`${h.kind}-${h.id}`} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(h)}
                  className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left", i === active ? "bg-orange-50" : "hover:bg-slate-50")}
                >
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", i === active ? "border-orange-200 bg-white text-orange-600" : "border-slate-200 bg-slate-50 text-slate-500")}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">{h.title}</span>
                    {h.subtitle ? <span className="block truncate text-xs text-slate-500">{h.subtitle}</span> : null}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{KIND_LABELS[h.kind]}</span>
                    {h.hasStoredPdf ? null : <span className="text-[10px] font-medium text-slate-400">Draft</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-[2px] anim-fade" />
        <DialogPrimitive.Content className="fixed left-1/2 top-[12vh] z-[80] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl anim-pop">
          <DialogPrimitive.Title className="sr-only">Search documents</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Search saved vouchers, tickets and invoices.</DialogPrimitive.Description>
          <div className="flex items-center gap-2 border-b border-slate-100 px-4">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Voucher no., PNR, guest or hotel name…"
              aria-label="Search documents"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500">Esc</kbd>
          </div>
          <div className="max-h-[55vh] overflow-y-auto p-2">{body}</div>
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] text-slate-500">
            <span>{hits.length && !loading ? `${hits.length} shown` : " "}</span>
            <span className="hidden sm:inline">
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5">↑↓</kbd> move ·{" "}
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5">Enter</kbd> open ·{" "}
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5">Esc</kbd> close
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Empty({ icon, title, description, tone }: { icon: React.ReactNode; title: string; description?: string; tone?: "error" }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className={cn("mb-3 flex h-12 w-12 items-center justify-center rounded-xl border", tone === "error" ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 bg-slate-50 text-slate-400")}>
        {icon}
      </div>
      <p className={cn("text-sm font-medium", tone === "error" ? "text-rose-600" : "text-slate-900")}>{title}</p>
      {description ? <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p> : null}
    </div>
  );
}
