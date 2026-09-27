import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Air tickets",
  description: "Create and share branded air tickets from your bookings.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
