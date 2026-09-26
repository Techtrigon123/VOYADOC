"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Hotel,
  Receipt,
  FileCheck,
  CreditCard,
  Quote,
  Settings2,
  LogOut,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Bot },
  { href: "/tools/hotel-voucher", label: "Hotel Voucher", icon: Hotel },
  { href: "/tools/proforma-invoice", label: "Proforma Invoice", icon: Receipt },
  { href: "/tools/gst-invoice", label: "GST Invoice", icon: FileCheck },
  { href: "/tools/payment-receipt", label: "Payment Receipt", icon: CreditCard },
  { href: "/tools/travel-quotation", label: "Travel Quotation", icon: Quote },
  { href: "/dashboard/settings", label: "Settings", icon: Settings2 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col bg-[var(--sidebar-bg)] text-slate-300">
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-2 px-6 h-16 border-b border-white/5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white">
            TravelDoc<span className="text-indigo-400">Pro</span>
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-500/15 text-indigo-300"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/5">
          <Link href="/api/auth/logout" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" />
            Log out
          </Link>
        </div>
      </div>
    </aside>
  );
}