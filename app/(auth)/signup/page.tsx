import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import SignupForm from "./SignupForm";

export const metadata: Metadata = pageMeta({
  title: "Start Free — Create Your Account",
  description: "Create a free Vouchlio account in under a minute and make your first branded hotel voucher, air ticket or GST invoice. No credit card needed.",
  path: "/signup",
});

export default function SignupPage() {
  return <SignupForm />;
}
