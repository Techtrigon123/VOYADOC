import { Metadata } from "next";
import ToolShell from "@/components/marketing/ToolShell";

export const metadata: Metadata = {
  title: "GST Invoice Generator — TravelDoc Pro",
  description: "Generate professional GST/tax invoices with customer, business, pricing and tax details.",
};

export default function GstInvoicePage() {
  return (
    <ToolShell
      title="GST Invoice"
      description="Generate a formal GST invoice with customer, business, tax and transaction details."
      cta="Generate invoice"
      showAdvanced
    />
  );
}