import Link from "next/link";
import { FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for TravelDoc Pro",
};

export default function TermsPage() {
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
        <h1 className="text-2xl font-bold">Terms of Service</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Last updated: September 2026
        </p>

        <section className="space-y-3 text-sm leading-relaxed text-[var(--foreground)]">
          <p>
            By using TravelDoc Pro, you agree to these terms. Our service is provided as-is for travel
            professionals to manage documents and related operations.
          </p>
          <p>
            You are responsible for maintaining the confidentiality of your account and for all
            activities that occur under your account. Do not use the service for unlawful purposes
            or in ways that could damage, disable, or impair the service.
          </p>
          <p>
            Payments processed through our payment partners are subject to their respective terms.
            Refunds, when applicable, are handled on a case-by-case basis.
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