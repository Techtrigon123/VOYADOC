"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Agent } from "@/lib/agent/types";
import { api } from "@/lib/agent/client";

interface AgentContextValue {
  agent: Agent | null;
  loading: boolean;
  /** Re-fetch from the server (after a document save flips status, etc.). */
  refresh: () => Promise<Agent | null>;
  setAgent: (a: Agent) => void;
}

const AgentContext = createContext<AgentContextValue | null>(null);

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const r = await api<Agent>("/api/auth/me");
    const next = r.success && r.data ? r.data : null;
    setAgent(next);
    setLoading(false);
    return next;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AgentContext.Provider value={{ agent, loading, refresh, setAgent }}>{children}</AgentContext.Provider>
  );
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be used inside <AgentProvider>");
  return ctx;
}

/** For pages that only render once the agent is loaded (the dashboard layout guarantees it). */
export function useRequiredAgent(): Agent & { refresh: () => Promise<Agent | null>; setAgent: (a: Agent) => void } {
  const { agent, refresh, setAgent } = useAgent();
  if (!agent) throw new Error("Agent not loaded");
  return Object.assign({}, agent, { refresh, setAgent });
}
