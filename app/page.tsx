// Root page — renders the marketing home page.
// It sits outside the (marketing) route group, so it adds its own navbar here
// (kept out of the root layout so it doesn't cover the dashboard and auth pages).
import HomePage from "@/app/(marketing)/page";
import { NavBarDemo } from "@/components/ui/navbar-demo";

export default function RootPage() {
  return (
    <>
      <NavBarDemo />
      <HomePage />
    </>
  );
}
