import { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import ToolShell from "@/components/marketing/ToolShell";

export const metadata: Metadata = pageMeta({
  title: "Travel Document Wording Polisher",
  description: "Polish the wording of travel documents and customer notes for clarity and tone while keeping hotel, flight and booking terminology accurate.",
  path: "/tools/document-polish",
});

export default function DocumentPolishPage() {
  return (
    <ToolShell
      title="Document Polish"
      description="Improve wording and clarity of your travel document content."
      cta="Polish document"
      showAdvanced
    />
  );
}