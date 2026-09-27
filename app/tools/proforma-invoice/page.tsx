import { Metadata } from "next";
import ToolShell from "@/components/marketing/ToolShell";

export const metadata: Metadata = {
  title: "Proforma Invoice",
  description: "Prepare clear preliminary invoices and quotations for customers before final billing.",
};

export default function ProformaInvoicePage() {
  return (
    <ToolShell
      title="Proforma Invoice"
      description="Prepare a preliminary invoice or quotation for your customer."
      cta="Generate proforma"
      showAdvanced
    />
  );
}