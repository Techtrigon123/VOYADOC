import { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import ToolShell from "@/components/marketing/ToolShell";

export const metadata: Metadata = pageMeta({
  title: "Proforma Invoice Generator for Travel",
  description: "Send clear proforma invoices for tour packages, hotels and transfers before final billing. Add your logo, bank and UPI details and download a PDF.",
  path: "/tools/proforma-invoice",
});

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