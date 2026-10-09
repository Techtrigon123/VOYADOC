"use client";

import React from "react";
import { BarChart3, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <BackButton fallback="/dashboard" />
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Exports</h1>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5 pl-12">Export document summaries and PDFs.</p>
        </div>
        <Button size="sm" variant="outline">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: "Document Summary", desc: "Overview of generated travel documents." },
          { title: "Monthly Usage", desc: "Documents created this month." },
          { title: "Invoice Summary", desc: "Invoices and receipts generated." },
          { title: "Quotation History", desc: "Travel quotations sent to customers." },
        ].map((report) => (
          <Card key={report.title}>
            <CardHeader>
              <CardTitle className="text-base">{report.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[var(--muted-foreground)]">
              <p className="mb-3">{report.desc}</p>
              <Button size="sm" variant="outline">
                <BarChart3 className="h-4 w-4" />
                Open report
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}