import React from "react";
import Link from "next/link";
import { ArrowRight, FileText, Download, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <Link href="/signup">
                <Button
                  size="xl"
                  className="btn-glow bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-900/30 w-full sm:w-auto"
                >
                  Create Your First Document
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/#how-it-works">
                <Button
                  size="xl"
                  variant="ghost"
                  className="text-slate-300 hover:text-white hover:bg-white/10 w-full sm:w-auto"
                >
                  Explore Documents
                </Button>
              </Link>
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