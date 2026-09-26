import React from "react";

export default function ProblemSection() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-3">
              The Problem
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-6">
              Stop Creating Travel Documents Manually.
            </h2>
            <p className="text-[var(--muted-foreground)] leading-relaxed mb-6">
              Your travel business already has enough to manage. Document preparation shouldn&apos;t slow you down.
            </p>
            <ul className="space-y-3 text-sm text-[var(--muted-foreground)]">
              {[
                "Recreating the same documents repeatedly for every booking",
                "Switching between Word, Excel and PDF tools",
                "Maintaining multiple templates across different formats",
                "Manually entering customer and booking information each time",
                "Spending unnecessary time formatting and adjusting layouts",
                "Sending inconsistent-looking documents to customers",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative rounded-xl border border-[var(--border)] bg-slate-50 p-6">
            <img
              src="https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&q=80"
              alt="Manual document work"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}