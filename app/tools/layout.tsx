import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/layout/Footer";

/** Every tool page, linked from each one so visitors (and search engines) can move between them. */
const TOOLS = [
  { href: "/tools/hotel-voucher", label: "Hotel voucher generator", text: "Guest, hotel, room and meal plan details on a branded voucher." },
  { href: "/tools/gst-invoice", label: "GST invoice generator", text: "Tax invoices with GSTIN, SAC codes and the CGST/SGST/IGST split." },
  { href: "/tools/proforma-invoice", label: "Proforma invoice", text: "Quote packages and bookings before the final bill." },
  { href: "/tools/payment-receipt", label: "Payment receipt", text: "Receipts for advances, part payments and full payments." },
  { href: "/tools/travel-quotation", label: "Travel quotation maker", text: "Professional quotes for packages, hotels and transfers." },
  { href: "/tools/pdf-export", label: "PDF export", text: "Print-ready PDFs to email, print or share." },
  { href: "/tools/document-polish", label: "Document polish", text: "Clearer wording that keeps travel terms accurate." },
];

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}

      <section aria-labelledby="tools-more" className="bg-slate-50 px-4 pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-black shadow-sm sm:p-8">
            <h2 className="text-xl font-bold sm:text-2xl">Create every travel document in one place</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Vouchlio makes branded hotel vouchers, air tickets, pickup vouchers, welcome placards, GST invoices and receipts for
              travel agents, tour operators and DMCs.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-glow inline-flex h-11 items-center gap-2 rounded-lg px-6 text-sm">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/#pricing" className="inline-flex h-11 items-center rounded-lg border border-slate-200 px-6 text-sm font-medium hover:border-brand-300">
                See pricing
              </Link>
            </div>
          </div>

          <h2 id="tools-more" className="mt-12 text-lg font-bold text-[var(--foreground)]">More free tools for travel agents</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((t) => (
              <li key={t.href}>
                <Link href={t.href} className="block h-full rounded-xl border border-[var(--border)] bg-white p-4 transition hover:border-brand-400 dark:bg-[var(--card)]">
                  <span className="font-semibold text-[var(--foreground)]">{t.label}</span>
                  <span className="mt-1 block text-sm text-[var(--muted-foreground)]">{t.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Footer />
    </>
  );
}
