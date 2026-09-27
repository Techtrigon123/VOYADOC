import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-24 bg-[var(--sidebar-bg)]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to simplify your travel documents?
        </h2>
        <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
          Create a free account and start generating professional travel documents in minutes.
        </p>
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/signup"
            className="btn-glow inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl px-10 text-base font-semibold sm:w-auto"
          >
            Start free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-slate-300 underline underline-offset-4 hover:text-white">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}