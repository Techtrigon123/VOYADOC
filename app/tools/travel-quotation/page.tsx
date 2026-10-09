import { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import ToolShell from "@/components/marketing/ToolShell";

export const metadata: Metadata = pageMeta({
  title: "Travel Quotation Maker for Tour Packages",
  description: "Prepare professional travel quotations for packages, hotels, transfers and sightseeing. Share a branded quote your customers can accept quickly.",
  path: "/tools/travel-quotation",
});

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