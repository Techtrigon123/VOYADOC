import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your business profile, logo and billing details.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
