import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to Voyenta to create and manage your hotel vouchers, air tickets, placards and invoices.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
