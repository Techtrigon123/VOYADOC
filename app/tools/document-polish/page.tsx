import { Metadata } from "next";
import ToolShell from "@/components/marketing/ToolShell";

export const metadata: Metadata = {
  title: "Document Polish — TravelDoc Pro",
  description: "Improve document wording and clarity while keeping travel terminology accurate.",
};

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