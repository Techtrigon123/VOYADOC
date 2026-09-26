import { Metadata } from "next";
import ToolShell from "@/components/marketing/ToolShell";

export const metadata: Metadata = {
  title: "PDF Export — TravelDoc Pro",
  description: "Generate clean, print-ready PDFs from your completed travel document entries.",
};

export default function PdfExportPage() {
  return (
    <ToolShell
      title="PDF Export"
      description="Generate a clean, print-ready PDF from your completed document entries."
      cta="Export PDF"
    />
  );
}