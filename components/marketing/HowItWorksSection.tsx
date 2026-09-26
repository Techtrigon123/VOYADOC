import React from "react";
import AnimatedCard from "@/components/ui/AnimatedCard";
import { FileText, Pencil, Eye, Download, Share2 } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Choose a document",
    description:
      "Select the travel document you need from available document types.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80",
  },
  {
    number: "02",
    icon: Pencil,
    title: "Enter your details",
    description:
      "Add customer, booking, hotel, pricing and business information into the document form.",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&q=80",
  },
  {
    number: "03",
    icon: Eye,
    title: "Review your document",
    description:
      "Preview the document and check the information before generating the final PDF.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
  },
  {
    number: "04",
    icon: Download,
    title: "Generate and share",
    description:
      "Generate a professional PDF and download, print or share it with your customer.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&q=80",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-3">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4">
            Create, Download, Share.
          </h2>
          <p className="max-w-xl mx-auto text-[var(--muted-foreground)]">
            From selecting a document type to sharing a professional PDF — the workflow is simple and fast.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-14 left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-0.5 bg-[var(--border)]" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <AnimatedCard key={step.number} delay={index * 100}>
                  <div className="relative flex flex-col items-center text-center">
                    {/* Image */}
                    <div className="relative z-10 mb-6 w-full max-w-xs rounded-xl overflow-hidden border border-[var(--border)] shadow-sm">
                      <img
                        src={step.image}
                        alt={step.title}
                        className="w-full h-40 object-cover"
                      />
                    </div>

                    {/* Icon circle */}
                    <div
                      className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border-2 ${step.border} ${step.bg} -mt-8 mb-6 shadow-sm`}
                    >
                      <Icon className={`h-6 w-6 ${step.color}`} />
                    </div>

                    {/* Step number */}
                    <span className="text-xs font-bold text-slate-400 tracking-widest mb-2">
                      STEP {step.number}
                    </span>
                    <h3 className="font-semibold text-[var(--foreground)] mb-2 text-lg">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </AnimatedCard>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}