import { Metadata } from "next";
import ToolShell from "@/components/marketing/ToolShell";

export const metadata: Metadata = {
  title: "Travel Quotation — TravelDoc Pro",
  description: "Prepare professional travel quotations for packages, accommodations, transfers and services.",
};

export default function TravelQuotationPage() {
  return (
    <ToolShell
      title="Travel Quotation"
      description="Prepare a professional quotation for travel packages, accommodations and transfers."
      cta="Generate quotation"
      showAdvanced
    />
  );
}