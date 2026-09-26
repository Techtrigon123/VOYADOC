import { Metadata } from "next";
import ToolShell from "@/components/marketing/ToolShell";

export const metadata: Metadata = {
  title: "Hotel Voucher Generator — TravelDoc Pro",
  description: "Create professional hotel vouchers with guest, hotel, booking, room and agency details.",
};

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