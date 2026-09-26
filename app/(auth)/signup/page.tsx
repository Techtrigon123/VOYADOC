import type { Metadata } from "next";
import SignupForm from "./SignupForm";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your free TravelDoc Pro account",
};

export default function SignupPage() {
  return <SignupForm />;
}
