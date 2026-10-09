import React from "react";
import { Star } from "lucide-react";
import TestimonialMarquee, { type MarqueeReview } from "@/components/ui/marquee-01";

const testimonials: MarqueeReview[] = [
  {
    name: "Rahul Sharma",
    username: "Owner, Sunrise Travels",
    avatarClassName: "bg-brand-100 text-brand-700",
    body: "“We used to prepare hotel vouchers and invoices manually. Now we generate professional travel documents in minutes. It has streamlined our entire booking workflow.”",
  },
  {
    name: "Priya Menon",
    username: "Operations Head, Kerala Holidays",
    avatarClassName: "bg-emerald-100 text-emerald-700",
    body: "“The proforma invoice and quotation tools save us hours every week. Our customers receive consistent, professional documents every time.”",
  },
  {
    name: "Amit Patel",
    username: "Founder, Gujarat Tours",
    avatarClassName: "bg-amber-100 text-amber-700",
    body: "“Managing payment receipts and GST invoices used to be tedious. This platform makes it simple and keeps everything organized in one place.”",
  },
  {
    name: "Sneha Kapoor",
    username: "Manager, Delhi Escapes",
    avatarClassName: "bg-sky-100 text-sky-700",
    body: "“The document preview is very helpful. We can review everything before sending it to customers, which reduces errors significantly.”",
  },
  {
    name: "Vikram Singh",
    username: "Director, Rajasthan Heritage Tours",
    avatarClassName: "bg-brand-100 text-brand-700",
    body: "“We handle hundreds of bookings monthly. Having a centralized workspace for travel documents has made our team much more efficient.”",
  },
  {
    name: "Anita Reddy",
    username: "Consultant, South India Travels",
    avatarClassName: "bg-violet-100 text-violet-700",
    body: "“Switched from manual Word templates to this platform. The PDF quality is excellent and our documents look much more professional now.”",
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-3">
            Testimonials
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4">
            Trusted by travel professionals
          </h2>
          <p className="max-w-xl mx-auto text-[var(--muted-foreground)]">
            Used by travel agents, tour operators and travel agencies across India.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-1.5 text-sm shadow-sm">
            <span className="flex items-center gap-0.5" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
            </span>
            <span className="font-semibold text-slate-800">5.0</span>
            <span className="text-slate-500">from agencies across India</span>
          </div>
        </div>
      </div>

      {/* Full-bleed scrolling rows; the edge fades match the section background. */}
      <TestimonialMarquee
        reviews={testimonials}
        duration="40s"
        cardClassName="w-80 rounded-2xl border-slate-200 bg-white transition-colors hover:border-brand-200"
        bodyClassName="line-clamp-5 leading-relaxed text-slate-700"
        fadeClassName="from-slate-50"
      />
    </section>
  );
}
