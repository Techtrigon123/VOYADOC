"use client";

import React from "react";
import { Globe2, Bell, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BrandMonitoringPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Document Management</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
          Organize and manage your travel documents in one centralized workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Documents created", value: "128", icon: Globe2, color: "text-indigo-600", bg: "bg-indigo-50" },
          { title: "This month", value: "14", icon: Bell, color: "text-amber-600", bg: "bg-amber-50" },
          { title: "Templates available", value: "5", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${item.bg}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">{item.value}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{item.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--muted-foreground)]">
          Use the sidebar to create new documents. Your generated documents will appear here once saved.
        </CardContent>
      </Card>
    </div>
  );
}