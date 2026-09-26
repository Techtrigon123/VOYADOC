"use client";

import React from "react";
import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PaymentsPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Billing</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Plan usage and billing history.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Current Plan", value: "Free", hint: "5 documents/month" },
          { label: "Usage This Month", value: "3 documents", hint: "2 remaining" },
          { label: "Next Billing", value: "—", hint: "Upgrade to Pro" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-5">
              <p className="text-xs text-[var(--muted-foreground)] mb-1">{item.label}</p>
              <p className="text-xl font-bold text-[var(--foreground)]">{item.value}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">{item.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoices</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--muted-foreground)]">
          No invoices yet. Upgrade to a paid plan to enable billing history.
        </CardContent>
      </Card>
    </div>
  );
}