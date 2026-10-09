import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description: "Chat with the Vouchlio support team.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
