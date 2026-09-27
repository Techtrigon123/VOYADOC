// Root page — renders the marketing home page.
// It sits outside the (marketing) route group, so it adds its own navbar and footer here
// (kept out of the root layout so they don't cover the dashboard and auth pages).
import type { Metadata } from "next";
import HomePage from "@/app/(marketing)/page";
import { NavBarDemo } from "@/components/ui/navbar-demo";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function RootPage() {
  return (
    <>
      <NavBarDemo />
      <HomePage />
      <Footer />
    </>
  );
}
