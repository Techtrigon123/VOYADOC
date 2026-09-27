import Link from "next/link";
import { Compass, FileText } from "lucide-react";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
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

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
          <Compass className="h-8 w-8" />
        </span>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-[var(--primary)]">404</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">This page took a wrong turn</h1>
        <p className="mt-2 max-w-md text-slate-600">
          The link may be old or mistyped. Head back home, or jump straight to your dashboard.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-glow inline-flex h-11 items-center rounded-lg px-6 text-sm">
            Back to home
          </Link>
          <Link href="/dashboard" className="inline-flex h-11 items-center rounded-lg border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 hover:border-orange-200">
            Go to dashboard
          </Link>
          <Link href="/contact" className="inline-flex h-11 items-center px-3 text-sm font-medium text-slate-500 hover:text-[var(--primary)]">
            Contact us
          </Link>
        </div>
      </main>
    </div>
  );
}
