"use client";

import React from "react";
import { Hotel } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";

export default function AttendeesPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-3">
          <BackButton fallback="/dashboard" />
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Saved Documents</h1>
        </div>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5 pl-12">Quick access to your recent travel documents.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Documents</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--muted-foreground)]">
          You don&apos;t have any saved documents yet. Create your first document to access it quickly.
        </CardContent>
      </Card>
    </div>
  );
}