import type { Metadata } from "next";
import SignupForm from "./SignupForm";

export const metadata: Metadata = {
  title: "Start free — create your account",
  description: "Create a free Voyenta account in under a minute and make your first branded hotel voucher, air ticket or invoice. No card needed.",
  alternates: { canonical: "/signup" },
};

export default function SignupPage() {
  return <SignupForm />;
}
