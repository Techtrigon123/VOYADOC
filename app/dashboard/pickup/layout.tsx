import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pickup vouchers",
  description: "Create pickup vouchers for airport and hotel transfers.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
