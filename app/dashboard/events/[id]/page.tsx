"use client";

import React from "react";
import { BackButton } from "@/components/ui/back-button";

export default function EventDetailPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <BackButton fallback="/dashboard/events" />
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Document Detail</h1>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] pl-12">Review and manage this travel document.</p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--muted-foreground)]">
        Document detail view will appear here once document records are connected to persistent storage.
      </div>
    </div>
  );
}