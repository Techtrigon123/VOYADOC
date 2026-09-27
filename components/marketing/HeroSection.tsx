import React from "react";
import Link from "next/link";
import { ArrowRight, FileText, Download, Printer, Share2 } from "lucide-react";
import { ShaderBackground } from "@/components/ui/rds-silk";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <ShaderBackground className="absolute inset-0 h-full w-full" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          {/* Left content */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300 mb-8">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Built for travel agents, agencies and tour operators
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
              Travel Documents, Simplified.
            </h1>

            <p className="max-w-xl mx-auto lg:mx-0 text-lg text-slate-400 leading-relaxed mb-10">
              Create professional hotel vouchers, invoices, receipts, quotations and other travel documents from one centralized workspace.
            </p>

            <div className="flex flex-col items-center gap-3 mb-10">
              <Link
                href="/signup"
                className="btn-glow inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl px-10 text-base font-semibold sm:w-auto"
              >
                Start free — create your first voucher
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-sm text-slate-400">
                Free forever plan · No card needed ·{" "}
                <Link href="/#how-it-works" className="text-slate-300 underline underline-offset-4 hover:text-white">
                  See how it works
                </Link>
              </p>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-slate-500 text-sm">
              {[
                { icon: FileText, label: "Multiple document types" },
                { icon: Download, label: "Download PDFs" },
                { icon: Printer, label: "Print ready" },
                { icon: Share2, label: "Share with customers" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-slate-500" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}