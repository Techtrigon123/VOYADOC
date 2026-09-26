import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedCard from "@/components/ui/AnimatedCard";

const tools = [
  {
    title: "Hotel Voucher Generator",
    description: "Create professional hotel vouchers with guest, hotel, booking and stay details.",
    href: "/tools/hotel-voucher",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
  },
  {
    title: "Proforma Invoice",
    description: "Prepare preliminary invoices and quotations for customers before final billing.",
    href: "/tools/proforma-invoice",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80",
  },
  {
    title: "GST Invoice Generator",
    description: "Generate formal invoices with tax, pricing, customer and business details.",
    href: "/tools/gst-invoice",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80",
  },
  {
    title: "Payment Receipt",
    description: "Create clear payment receipts for advances, full payments and transactions.",
    href: "/tools/payment-receipt",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&q=80",
  },
  {
    title: "Travel Quotation",
    description: "Prepare professional quotations for travel packages, accommodations and transfers.",
    href: "/tools/travel-quotation",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80",
  },
  {
    title: "Document Polish",
    description: "Improve document wording and clarity while keeping travel terminology accurate.",
    href: "/tools/document-polish",
    image: "https://images.unsplash.com/photo-1523240794352-6a386f20230a?w=600&q=80",
  },
  {
    title: "PDF Export",
    description: "Generate clean, print-ready PDFs from your completed travel document entries.",
    href: "/tools/pdf-export",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
  },
  {
    title: "Document Organizer",
    description: "Keep your travel documents organized and accessible from one dashboard.",
    href: "/dashboard",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&q=80",
  },
];

export default function ToolsSection() {
  return (
    <section id="tools" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-3">
            Documents
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4">
            Travel Documents Built for Your Workflow
          </h2>
          <p className="max-w-2xl mx-auto text-[var(--muted-foreground)]">
            Choose the document you need, enter the details, and generate a professional PDF in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool, index) => (
            <AnimatedCard key={tool.title} delay={index * 80}>
              <Link
                href={tool.href}
                className="group rounded-xl border border-[var(--border)] overflow-hidden hover:border-indigo-200 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl bg-white h-full flex flex-col"
              >
                <div className="aspect-video w-full overflow-hidden bg-slate-100">
                  <img
                    src={tool.image}
                    alt={tool.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-semibold text-[var(--foreground)] mb-2 group-hover:text-[var(--primary)] transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-4 flex-1">
                    {tool.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)]">
                    Open tool <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
}