import type { Metadata } from "next";
import DashboardShell from "@/components/agent/DashboardShell";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Dashboard | Voyenta" },
  description: "Create, manage and share your hotel vouchers, air tickets, pickups, placards and invoices.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
