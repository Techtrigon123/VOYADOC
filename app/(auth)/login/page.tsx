import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = pageMeta({
  title: "Log In",
  description: "Log in to Vouchlio to create and manage your hotel vouchers, air tickets, pickup vouchers, welcome placards and GST invoices.",
  path: "/login",
});

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
