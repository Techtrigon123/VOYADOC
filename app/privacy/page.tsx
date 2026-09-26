import Link from "next/link";
import { FileText } from "lucide-react";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for TravelDoc Pro",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 flex items-center px-6 border-b border-[var(--border)] bg-white">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)]">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-base text-[var(--foreground)]">
            TravelDoc<span className="text-[var(--primary)]">Pro</span>
          </span>
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 space-y-6">
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Last updated: September 2026
        </p>

        <section className="space-y-3 text-sm leading-relaxed text-[var(--foreground)]">
          <p>
            We collect only the information necessary to provide and improve TravelDoc Pro, including
            account details and document data you choose to enter.
          </p>
          <p>
            We do not sell personal data. Access to your data is restricted to authorized
            personnel and third-party processors required to operate the service, such as hosting
            and payment providers.
          </p>
          <p>
            You may request deletion of your account and associated data by contacting support.
            We retain certain records only as long as required for legal, tax, and operational
            obligations.
          </p>
        </section>

        <Link href="/" className="inline-block text-sm text-[var(--primary)] hover:underline">
          ← Back to homepage
        </Link>
      </main>

      <footer className="py-4 text-center text-xs text-[var(--muted-foreground)]">
        © {new Date().getFullYear()} TravelDoc Pro
      </footer>
    </div>
  );
}