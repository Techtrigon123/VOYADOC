import React from "react";
import AnimatedCard from "@/components/ui/AnimatedCard";
import {
  FileText,
  Receipt,
  FileCheck,
  CreditCard,
  Quote,
  FolderOpen,
  Download,
  Settings2,
} from "lucide-react";

const services = [
  {
    icon: FileText,
    title: "Hotel Vouchers",
    description:
      "Create professional hotel vouchers with guest, hotel, booking, room, stay and agency details.",
    color: "bg-indigo-50 text-indigo-600",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
  },
  {
    icon: Receipt,
    title: "Proforma Invoices",
    description:
      "Prepare clear preliminary invoices and quotations for customers before final billing.",
    color: "bg-emerald-50 text-emerald-600",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80",
  },
  {
    icon: FileCheck,
    title: "GST / Tax Invoices",
    description:
      "Generate professional invoices with customer, business, pricing, tax and transaction details.",
    color: "bg-blue-50 text-blue-600",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80",
  },
  {
    icon: CreditCard,
    title: "Payment Receipts",
    description:
      "Create clear payment receipts for advances, full payments and other customer transactions.",
    color: "bg-purple-50 text-purple-600",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&q=80",
  },
  {
    icon: Quote,
    title: "Travel Quotations",
    description:
      "Prepare professional quotations for travel packages, accommodations, transfers and other services.",
    color: "bg-amber-50 text-amber-600",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80",
  },
  {
    icon: FolderOpen,
    title: "Document Management",
    description:
      "Keep your travel documents organized in one centralized workspace instead of scattered files.",
    color: "bg-rose-50 text-rose-600",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&q=80",
  },
  {
    icon: Download,
    title: "PDF Generation",
    description:
      "Turn your completed document information into clean, professional PDFs ready for download, printing or sharing.",
    color: "bg-teal-50 text-teal-600",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
  },
  {
    icon: Settings2,
    title: "Custom Documents",
    description:
      "Create additional business documents required by your travel workflow using reusable document structures.",
    color: "bg-orange-50 text-orange-600",
    image: "https://images.unsplash.com/photo-1523240794352-6a386f20230a?w=600&q=80",
  },
];

export default function FeaturesSection() {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-3">
            Services
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4">
            Everything You Need for Travel Documentation
          </h2>
          <p className="max-w-xl mx-auto text-[var(--muted-foreground)]">
            From hotel vouchers to invoices and quotations — create the documents your travel business needs from one place.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <AnimatedCard key={service.title} delay={index * 80}>
                <div
                  className="group rounded-xl border border-[var(--border)] overflow-hidden hover:border-indigo-200 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl bg-white h-full"
                >
                  <div className="aspect-video w-full overflow-hidden bg-slate-100">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </div>
                  <div className="p-6">
                    <div
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${service.color} mb-4`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-[var(--foreground)] mb-2">
                      {service.title}
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}