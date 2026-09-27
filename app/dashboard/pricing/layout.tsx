import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plans & billing",
  description: "Compare Silver, Gold and Platinum and upgrade your plan.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
