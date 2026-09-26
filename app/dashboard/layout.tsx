"use client";

import React, { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AgentProvider, useAgent } from "@/components/agent/AgentProvider";
import { ActivationProvider } from "@/components/agent/ActivationGuide";
import { DocumentAccessProvider } from "@/components/agent/DocumentAccessWarning";
import AgentNavbar from "@/components/agent/AgentNavbar";
import { needsQuickSetup } from "@/lib/agent/profile";

function FullPageSpinner() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50">
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-orange-500 border-t-transparent" />
    </div>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  const { agent, loading } = useAgent();
  const router = useRouter();
  const pathname = usePathname();
  const mustSetup = !!agent && needsQuickSetup(agent);

  useEffect(() => {
    if (loading) return;
    if (!agent) router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    else if (mustSetup) router.replace(`/setup?returnTo=${encodeURIComponent(pathname)}`);
  }, [agent, loading, mustSetup, pathname, router]);

  if (loading || !agent || mustSetup) return <FullPageSpinner />;

  return (
    <ActivationProvider>
      <DocumentAccessProvider>
        <div className="min-h-screen bg-[#fafaf9]">
          <Suspense fallback={<div className="h-[75px] border-b border-slate-200 bg-white" />}>
            <AgentNavbar />
          </Suspense>
          <main className="pb-28">
            <Suspense fallback={<FullPageSpinner />}>{children}</Suspense>
          </main>
        </div>
      </DocumentAccessProvider>
    </ActivationProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AgentProvider>
      <Gate>{children}</Gate>
    </AgentProvider>
  );
}
