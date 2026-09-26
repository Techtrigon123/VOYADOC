import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const documents = [
  {
    title: "Hotel Voucher",
    description:
      "Confirmation document for hotel bookings with guest, hotel, stay and booking reference details.",
    href: "/tools/hotel-voucher",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
  },
  {
    title: "Proforma Invoice",
    description:
      "Preliminary billing document or quotation for customers before final invoice.",
    href: "/tools/proforma-invoice",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80",
  },
  {
    title: "GST / Tax Invoice",
    description:
      "Formal transaction invoice with business, customer, tax and payment details.",
    href: "/tools/gst-invoice",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80",
  },
  {
    title: "Payment Receipt",
    description:
      "Confirmation of received payment with amount, date, mode and transaction reference.",
    href: "/tools/payment-receipt",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&q=80",
  },
  {
    title: "Travel Quotation",
    description:
      "Estimated travel cost document with destination, dates, services and pricing breakdown.",
    href: "/tools/travel-quotation",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80",
  },
];

export default function DocumentsSection() {
  return (
    <section id="documents" className="py-24 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-3">
            Documents
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4">
            Travel Documents Built for Your Workflow
          </h2>
          <p className="max-w-2xl mx-auto text-[var(--muted-foreground)]">
            Choose the document type, enter the details, and generate a professional PDF in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <Link
              key={doc.title}
              href={doc.href}
              className="group rounded-xl border border-[var(--border)] overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all duration-200"
            >
              <div className="aspect-video w-full overflow-hidden bg-slate-100">
                <img
                  src={doc.image}
                  alt={doc.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-[var(--foreground)] mb-2 group-hover:text-[var(--primary)] transition-colors">
                  {doc.title}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-4">
                  {doc.description}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)]">
                  Create document <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}