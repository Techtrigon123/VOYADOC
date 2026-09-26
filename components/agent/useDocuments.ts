"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/agent/client";
import type { DocumentSummary } from "@/lib/agent/types";

/** Load saved documents for a list page, with a reload function. */
export function useDocuments(kind: string, query = "") {
  const [docs, setDocs] = useState<DocumentSummary[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const r = await api<DocumentSummary[]>(`/api/agent/documents?kind=${kind}${query ? `&${query}` : ""}`);
    if (r.success && r.data) {
      setDocs(r.data);
      setError("");
    } else {
      setDocs([]);
      setError(r.error?.message || "Could not load your documents.");
    }
  }, [kind, query]);

  useEffect(() => {
    void load();
  }, [load]);

  return { docs, error, reload: load, setDocs };
}
