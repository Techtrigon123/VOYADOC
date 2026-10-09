import { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import ToolShell from "@/components/marketing/ToolShell";

export const metadata: Metadata = pageMeta({
  title: "GST Invoice Generator for Travel Agencies",
  description: "Generate GST-compliant tax invoices for travel bookings with GSTIN, SAC codes, CGST/SGST/IGST split and your agency branding. Download as PDF instantly.",
  path: "/tools/gst-invoice",
});

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