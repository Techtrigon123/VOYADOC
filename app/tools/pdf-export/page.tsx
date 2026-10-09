import { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import ToolShell from "@/components/marketing/ToolShell";

export const metadata: Metadata = pageMeta({
  title: "Travel Document PDF Export",
  description: "Turn completed travel documents into clean, print-ready PDFs with your agency branding, ready to email, print or share on WhatsApp.",
  path: "/tools/pdf-export",
});

export default function PdfExportPage() {
  return (
    <ToolShell
      title="PDF Export"
      description="Generate a clean, print-ready PDF from your completed document entries."
      cta="Export PDF"
    />
  );
}