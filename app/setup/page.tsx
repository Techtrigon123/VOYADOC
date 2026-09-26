"use client";

import React, { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { AgentProvider, useAgent } from "@/components/agent/AgentProvider";
import { QuickSetupForm } from "@/components/agent/QuickSetupForm";
import { needsQuickSetup } from "@/lib/agent/profile";

function safeReturn(v: string | null) {
  return v && v.startsWith("/dashboard") ? v : "/dashboard";
}

function SetupInner() {
  const { agent, loading, setAgent } = useAgent();
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = safeReturn(params.get("returnTo"));

  useEffect(() => {
    if (loading) return;
    if (!agent) router.replace("/login?callbackUrl=/setup");
    else if (!needsQuickSetup(agent)) router.replace(returnTo);
  }, [agent, loading, returnTo, router]);

  if (loading || !agent || !needsQuickSetup(agent)) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-orange-500/5 anim-rise sm:p-7">
      <QuickSetupForm
        initial={agent}
        onSuccess={(a) => {
          setAgent(a);
          toast.success("You're all set", { description: "Your workspace is ready." });
          router.replace(returnTo);
        }}
      />
    </div>
  );
}

export default function SetupPage() {
  return (
    <AgentProvider>
      <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-orange-50/80 via-white to-white">
        <header className="flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]">
              <FileText className="h-4 w-4 text-white" />
            </span>
            <span className="font-bold text-slate-900">
              TravelDoc<span className="text-[var(--primary)]">Pro</span>
            </span>
          </Link>
          <a href="/api/auth/logout" className="text-sm font-medium text-slate-500 hover:text-slate-900">Log out</a>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-8">
          <Suspense>
            <SetupInner />
          </Suspense>
        </main>
      </div>
    </AgentProvider>
  );
}
