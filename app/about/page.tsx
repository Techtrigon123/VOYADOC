import Link from "next/link";
import { FileText } from "lucide-react";

export const metadata = {
  title: "About",
  description: "Built to make travel documentation easier for travel agents, agencies and tour operators.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
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
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Built to Make Travel Documentation Easier</h1>

        <section className="space-y-4 text-sm leading-relaxed text-[var(--foreground)]">
          <p>
            Travel professionals spend a significant amount of time preparing customer-facing documents. 
            We built this platform to simplify that workflow by bringing commonly used travel documents into one centralized workspace.
          </p>
          <p>
            The platform focuses on simplicity, speed, professional documentation, travel-industry workflows, 
            and reducing repetitive administrative work for travel agents, agencies and tour operators.
          </p>
          <p>
            Instead of switching between Word, Excel, PDF templates and different tools, you can create 
            hotel vouchers, invoices, receipts, quotations and other travel documents from one place.
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