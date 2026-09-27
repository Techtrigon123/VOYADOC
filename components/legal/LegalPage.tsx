import Link from "next/link";
import { FileText } from "lucide-react";
import Footer from "@/components/layout/Footer";
import { SITE } from "@/lib/site";

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

/** Shared layout for Privacy, Terms and Refund pages: header, contents list, sections, footer. */
export default function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: React.ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 border-b border-[var(--border)] bg-white/90 backdrop-blur">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)]">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-base text-[var(--foreground)]">
            TravelDoc<span className="text-[var(--primary)]">Pro</span>
          </span>
        </Link>
        <Link href="/signup" className="btn-glow inline-flex h-9 items-center rounded-lg px-4 text-sm">
          Start free
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--primary)]">Legal</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {SITE.legal.lastUpdated}</p>
          <div className="mt-4 text-[15px] leading-relaxed text-slate-700">{intro}</div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">On this page</p>
              <ol className="space-y-1.5 text-sm">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="block rounded-md px-2 py-1 text-slate-600 hover:bg-orange-50 hover:text-orange-700">
                      {i + 1}. {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <article className="max-w-3xl space-y-10 rounded-3xl border border-slate-200 bg-white p-6 sm:p-10">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-xl font-semibold text-slate-900">
                  {i + 1}. {s.title}
                </h2>
                <div className="legal-prose mt-3 space-y-3 text-[15px] leading-relaxed text-slate-700">{s.body}</div>
              </section>
            ))}
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
