"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewEventPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/events">
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">New Document</h1>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">Create a new travel document.</p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--muted-foreground)]">
        Select a document type from the sidebar or quick actions to begin creating a new travel document.
      </div>
    </div>
  );
}