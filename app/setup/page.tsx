"use client";

import React, { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AgentProvider, useAgent } from "@/components/agent/AgentProvider";
import { QuickSetupForm } from "@/components/agent/QuickSetupForm";
import { needsQuickSetup } from "@/lib/agent/profile";
import { CardFormSkeleton } from "@/components/agent/skeletons";
import BrandMark from "@/components/brand/BrandMark";

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
      <CardFormSkeleton label="Loading your account" className="min-h-[60vh] w-full" />
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-brand-500/5 anim-rise sm:p-7">
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
      <div className="relative flex min-h-screen flex-col bg-white">
        <header className="flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark className="h-8" />
            <span className="font-bold text-slate-900">Vouchlio</span>
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
