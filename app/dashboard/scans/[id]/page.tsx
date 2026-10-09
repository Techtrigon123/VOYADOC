"use client";

import React from "react";
import { Download, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";

export default function ScanDetailPage() {
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--muted-foreground)]">
        Document detail view will appear here once document records are connected to persistent storage.
      </div>
    </div>
  );
}