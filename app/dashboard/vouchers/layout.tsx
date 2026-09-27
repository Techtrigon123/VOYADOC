import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hotel vouchers",
  description: "Create, search and download branded hotel vouchers for your guests.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
