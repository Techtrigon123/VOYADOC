import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="h-16 flex items-center px-6 border-b border-[var(--border)] bg-white">
        <Link href="/" className="flex items-center gap-2">
          <BrandMark className="h-7" />
          <span className="font-bold text-base text-[var(--foreground)]">Voyenta</span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[var(--muted-foreground)]">
        © {new Date().getFullYear()} Voyenta &nbsp;·&nbsp;{" "}
        <Link href="/privacy" className="hover:underline">Privacy</Link>
        &nbsp;·&nbsp;
        <Link href="/terms" className="hover:underline">Terms</Link>
      </footer>
    </div>
  );
}
