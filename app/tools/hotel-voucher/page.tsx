import { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import ToolShell from "@/components/marketing/ToolShell";

export const metadata: Metadata = pageMeta({
  title: "Hotel Voucher Generator for Travel Agents",
  description: "Create branded hotel vouchers with guest, hotel, room, meal plan and booking details, then download a print-ready PDF. Free hotel voucher maker for agents.",
  path: "/tools/hotel-voucher",
});

export default function HotelVoucherPage() {
  return (
    <ToolShell
      title="Hotel Voucher"
      description="Create a professional hotel voucher with guest, hotel, booking and stay details."
      cta="Generate voucher"
      showAdvanced
    />
  );
}