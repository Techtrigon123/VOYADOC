import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button
              size="xl"
              className="btn-glow bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-900/30 w-full sm:w-auto"
            >
              Create Your First Document
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="xl"
              variant="ghost"
              className="text-slate-300 hover:text-white hover:bg-white/10 w-full sm:w-auto"
            >
              Log in
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}