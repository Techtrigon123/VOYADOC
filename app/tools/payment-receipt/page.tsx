import { Metadata } from "next";
import ToolShell from "@/components/marketing/ToolShell";

export const metadata: Metadata = {
  title: "Payment Receipt — TravelDoc Pro",
  description: "Create clear payment receipts for advances, full payments and customer transactions.",
};

export default function PaymentReceiptPage() {
  return (
    <ToolShell
      title="Payment Receipt"
      description="Create a clear payment receipt for a customer transaction."
      cta="Generate receipt"
    />
  );
}