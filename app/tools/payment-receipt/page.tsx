import { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import ToolShell from "@/components/marketing/ToolShell";

export const metadata: Metadata = pageMeta({
  title: "Payment Receipt Generator for Travel Agents",
  description: "Issue professional payment receipts for advances, part payments and full payments from travel customers. Branded, numbered and ready to share as PDF.",
  path: "/tools/payment-receipt",
});

export default function PaymentReceiptPage() {
  return (
    <ToolShell
      title="Payment Receipt"
      description="Create a clear payment receipt for a customer transaction."
      cta="Generate receipt"
    />
  );
}