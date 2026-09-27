import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Document access",
  description: "See which documents are closing soon or locked on your plan.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
