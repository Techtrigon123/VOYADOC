import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoices & receipts",
  description: "Create GST invoices, proforma invoices and payment receipts.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
