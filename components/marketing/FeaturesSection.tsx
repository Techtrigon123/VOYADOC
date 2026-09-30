"use client";

import React from "react";
import { BedDouble, Car, FileText, Landmark, Plane, ReceiptText, Signpost, UploadCloud } from "lucide-react";
import AnimatedCard from "@/components/ui/AnimatedCard";
import ImageInfoCard, { type ImageInfo } from "@/components/marketing/ImageInfoCard";

/** The core services Voyenta provides — the 7 document types plus upload auto-fill. Informational only. */
const services: ImageInfo[] = [
  {
    title: "Hotel Vouchers",
    description: "Check-in confirmations with guest, hotel, stay and booking details.",
    includes: ["Guest & stay", "Rooms & meal plan", "Booking reference"],
    icon: BedDouble,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  },
  {
    title: "Air Tickets",
    description: "Offline e-tickets with flights, passengers and fare.",
    includes: ["PNR & ticket no.", "Baggage", "Fare breakup"],
    icon: Plane,
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
  },
  {
    title: "Pickup Vouchers",
    description: "Transfer details your driver and guest can both follow.",
    includes: ["Driver & vehicle", "Pickup time", "Drop location"],
    icon: Car,
    image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80",
  },
  {
    title: "Welcome Placards",
    description: "Airport and hotel welcome boards with your guest's name.",
    includes: ["Guest name", "Your branding", "Print ready"],
    icon: Signpost,
    image: "https://images.unsplash.com/photo-1517400508447-f8dd518b86db?w=800&q=80",
  },
  {
    title: "GST / Tax Invoices",
    description: "Tax invoices with GST worked out for you.",
    includes: ["CGST · SGST · IGST", "Place of supply", "Payments tracked"],
    icon: Landmark,
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
  },
  {
    title: "Proforma Invoices",
    description: "Priced quotations your customer approves before paying.",
    includes: ["Line items", "Taxes shown", "Before payment"],
    icon: FileText,
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80",
  },
  {
    title: "Payment Receipts",
    description: "Proof of each payment, linked to its invoice.",
    includes: ["Amount & mode", "Transaction ref", "Balance due"],
    icon: ReceiptText,
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80",
  },
  {
    title: "Upload Auto-fill",
    description: "Upload a hotel voucher or airline e-ticket and the form fills itself.",
    includes: ["PDF or photo", "Hotel vouchers", "Air tickets"],
    icon: UploadCloud,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
  },
];

export default function FeaturesSection() {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-3">Services</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4">Everything You Need for Travel Documentation</h2>
          <p className="max-w-xl mx-auto text-[var(--muted-foreground)]">
            Hotel vouchers, air tickets, transfers, welcome boards and GST billing — every document your travel business sends, from one place.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 [perspective:1200px]">
          {services.map((service, index) => (
            <AnimatedCard key={service.title} delay={index * 80}>
              <ImageInfoCard item={service} className="min-h-[300px]" />
            </AnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
}
