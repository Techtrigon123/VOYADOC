"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is this platform?",
    answer:
      "It is a travel-business document platform that helps travel agents, agencies and tour operators create professional travel documents from one centralized workspace.",
  },
  {
    question: "Who is this platform for?",
    answer:
      "It is designed primarily for travel agents, travel agencies, tour operators and travel professionals who regularly prepare customer and booking documents.",
  },
  {
    question: "What documents can I create?",
    answer:
      "You can create documents such as hotel vouchers, proforma invoices, GST/tax invoices, payment receipts and travel quotations using the available document modules.",
  },
  {
    question: "Can I download my documents?",
    answer:
      "Yes. Completed documents can be downloaded as PDF files for printing, emailing or record keeping.",
  },
  {
    question: "Can I print my documents?",
    answer:
      "Yes. Generated PDFs are formatted for standard printing and can be printed directly from your browser or PDF viewer.",
  },
  {
    question: "Can I share documents with customers?",
    answer:
      "Yes. You can download the PDF and share it with customers through email or messaging platforms.",
  },
  {
    question: "Can I customize my documents?",
    answer:
      "You can enter your business details, customer information and document-specific fields. The output is generated in a consistent professional format.",
  },
  {
    question: "Do I need technical knowledge?",
    answer:
      "No. The platform is designed for travel professionals and does not require programming knowledge.",
  },
  {
    question: "Can travel agencies use it?",
    answer:
      "Yes. The workflow is designed around the document requirements of travel businesses.",
  },
  {
    question: "Is it suitable for tour operators?",
    answer:
      "Yes. The supported document workflows match common tour operator and travel agency requirements.",
  },
  {
    question: "Can I manage multiple documents?",
    answer:
      "Yes. Your dashboard provides a centralized workspace to access and manage your generated documents.",
  },
  {
    question: "How do I get started?",
    answer:
      "Choose the document you need, enter the required details, review the information and generate your document.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-3">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4">
            Common questions
          </h2>
          <p className="max-w-xl mx-auto text-[var(--muted-foreground)]">
            Everything you need to know about TravelDoc Pro.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-[var(--border)] bg-white overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span className="font-medium text-[var(--foreground)]">{faq.question}</span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-500 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-sm text-[var(--muted-foreground)] leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}