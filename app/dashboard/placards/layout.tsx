import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome placards",
  description: "Design and print welcome placards for guest arrivals.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
