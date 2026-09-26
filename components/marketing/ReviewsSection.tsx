import React from "react";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Rahul Sharma",
    role: "Owner, Sunrise Travels",
    initials: "RS",
    color: "bg-indigo-100 text-indigo-700",
    quote:
      "We used to prepare hotel vouchers and invoices manually. Now we generate professional travel documents in minutes. It has streamlined our entire booking workflow.",
    rating: 5,
  },
  {
    name: "Priya Menon",
    role: "Operations Head, Kerala Holidays",
    initials: "PM",
    color: "bg-emerald-100 text-emerald-700",
    quote:
      "The proforma invoice and quotation tools save us hours every week. Our customers receive consistent, professional documents every time.",
    rating: 5,
  },
  {
    name: "Amit Patel",
    role: "Founder, Gujarat Tours",
    initials: "AP",
    color: "bg-purple-100 text-purple-700",
    quote:
      "Managing payment receipts and GST invoices used to be tedious. This platform makes it simple and keeps everything organized in one place.",
    rating: 5,
  },
  {
    name: "Sneha Kapoor",
    role: "Manager, Delhi Escapes",
    initials: "SK",
    color: "bg-blue-100 text-blue-700",
    quote:
      "The document preview is very helpful. We can review everything before sending it to customers, which reduces errors significantly.",
    rating: 5,
  },
  {
    name: "Vikram Singh",
    role: "Director, Rajasthan Heritage Tours",
    initials: "VS",
    color: "bg-amber-100 text-amber-700",
    quote:
      "We handle hundreds of bookings monthly. Having a centralized workspace for travel documents has made our team much more efficient.",
    rating: 5,
  },
  {
    name: "Anita Reddy",
    role: "Consultant, South India Travels",
    initials: "AR",
    color: "bg-rose-100 text-rose-700",
    quote:
      "Switched from manual Word templates to this platform. The PDF quality is excellent and our documents look much more professional now.",
    rating: 5,
  },
];

export default function ReviewsSection() {
  return (
    <section id="reviews" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-3">
            Reviews
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4">
            What travel professionals say
          </h2>
          <p className="max-w-xl mx-auto text-[var(--muted-foreground)]">
            Trusted by travel agents, tour operators and travel agencies.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-amber-400 fill-amber-400"
                  />
                ))}
              </div>

              <p className="text-sm text-[var(--foreground)] leading-relaxed mb-5">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold ${t.color}`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {t.name}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {t.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}