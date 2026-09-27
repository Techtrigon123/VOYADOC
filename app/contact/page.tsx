import Link from "next/link";
import { Clock, LifeBuoy, MessageSquare } from "lucide-react";
import ContactForm from "./ContactForm";
import BrandMark from "@/components/brand/BrandMark";

export const metadata = {
  title: "Contact us",
  description: "Talk to the Voyenta team about plans, onboarding, or help with your account.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--border)] bg-white">
        <Link href="/" className="flex items-center gap-2">
          <BrandMark className="h-7" />
          <span className="font-bold text-base text-[var(--foreground)]">Voyenta</span>
        </Link>
        <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-[var(--primary)]">Log in</Link>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider">Talk to us</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">We&apos;d love to hear from you</h1>
            <p className="mt-3 text-slate-600">
              Questions about plans, help setting up your agency, or a document that isn&apos;t coming out right —
              send us a message and a real person will get back to you.
            </p>
            <ul className="mt-8 space-y-5">
              {[
                { icon: Clock, title: "Replies within one working day", body: "Monday to Saturday, 10 am – 7 pm IST." },
                { icon: MessageSquare, title: "Already a customer?", body: "Sign in and use Support in your dashboard to chat with us about a specific voucher or invoice." },
                { icon: LifeBuoy, title: "Refunds & payments", body: "Include your transaction ID so we can find your payment quickly." },
              ].map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{title}</p>
                    <p className="text-sm text-slate-600">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-slate-500">
              See also our <Link href="/refunds" className="text-[var(--primary)] hover:underline">Refund Policy</Link> and{" "}
              <Link href="/terms" className="text-[var(--primary)] hover:underline">Terms</Link>.
            </p>
          </div>
          <ContactForm />
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-[var(--muted-foreground)]">
        © {new Date().getFullYear()} Voyenta
      </footer>
    </div>
  );
}
