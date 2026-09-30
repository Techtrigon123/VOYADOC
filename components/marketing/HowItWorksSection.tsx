import React from "react";
import { Download, Eye, FileText, Pencil, type LucideIcon } from "lucide-react";
import AnimatedCard from "@/components/ui/AnimatedCard";
import BrandMark from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils";

/**
 * The workflow as a spider diagram: Voyenta in the centre, the four steps branching out
 * clockwise with flowing neon connectors. Stacks into a vertical timeline on small screens.
 */
interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
  /** Grid placement around the hub on large screens. */
  area: string;
  /** Which side faces the hub — the connector dot sits on that edge. */
  side: "left" | "right";
}

const steps: Step[] = [
  {
    number: "01",
    icon: FileText,
    title: "Choose a document",
    description: "Pick the travel document you need — voucher, ticket, transfer, placard or invoice.",
    area: "lg:col-start-1 lg:row-start-1",
    side: "right",
  },
  {
    number: "02",
    icon: Pencil,
    title: "Enter your details",
    description: "Add booking, customer and pricing details — or upload a voucher or e-ticket to fill the form for you.",
    area: "lg:col-start-3 lg:row-start-1",
    side: "left",
  },
  {
    number: "03",
    icon: Eye,
    title: "Review your document",
    description: "Check everything in the preview before you create the final PDF.",
    area: "lg:col-start-3 lg:row-start-2",
    side: "left",
  },
  {
    number: "04",
    icon: Download,
    title: "Generate and share",
    description: "Download a professional PDF, print it, or share it with your customer.",
    area: "lg:col-start-1 lg:row-start-2",
    side: "right",
  },
];

/* Connector end points in the diagram's 0–100 space: hub centre → inner edge of each step card. */
const HUB = { x: 50, y: 50 };
const ENDS = [
  { x: 37.5, y: 25 },
  { x: 62.5, y: 25 },
  { x: 62.5, y: 75 },
  { x: 37.5, y: 75 },
];

function StepCard({ step }: { step: Step }) {
  const Icon = step.icon;
  return (
    <div className="group relative h-full rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-400 hover:shadow-xl hover:shadow-brand-500/10 motion-reduce:hover:translate-y-0">
      {/* Connector dot on the edge facing the hub (large screens) */}
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-brand-neon bg-ink shadow-[0_0_12px_rgba(163,255,71,0.7)] lg:block",
          step.side === "right" ? "-right-[7px]" : "-left-[7px]"
        )}
      />
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-brand-neon transition duration-300 group-hover:bg-brand-neon group-hover:text-ink">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Step {step.number}</p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--foreground)]">{step.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">{step.description}</p>
        </div>
      </div>
    </div>
  );
}

function Hub() {
  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      {/* Orbit rings */}
      <span aria-hidden className="absolute inset-0 rounded-full border border-dashed border-brand-500/40 spider-orbit" />
      <span aria-hidden className="absolute inset-5 rounded-full bg-brand-neon/10 motion-safe:animate-ping [animation-duration:2.8s]" />
      <div className="relative flex h-36 w-36 flex-col items-center justify-center gap-2 rounded-full bg-ink text-center shadow-2xl shadow-brand-500/30 ring-4 ring-brand-neon/30">
        <span className="rounded-xl bg-[#ffffff] px-2 py-1.5">
          <BrandMark className="h-7" />
        </span>
        <span className="text-sm font-bold tracking-tight text-white">Voyenta</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-neon">Workflow</span>
      </div>
    </div>
  );
}

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-3">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4">Create, Download, Share.</h2>
          <p className="max-w-xl mx-auto text-[var(--muted-foreground)]">
            From selecting a document type to sharing a professional PDF — the workflow is simple and fast.
          </p>
        </div>

        {/* Spider diagram (large screens) / timeline (small screens) */}
        <div className="relative mx-auto max-w-6xl">
          {/* Connectors, drawn behind the cards */}
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {ENDS.map((end, i) => (
              <g key={i}>
                <line x1={HUB.x} y1={HUB.y} x2={end.x} y2={end.y} className="stroke-brand-500/25" strokeWidth={6} vectorEffect="non-scaling-stroke" />
                <line
                  x1={HUB.x}
                  y1={HUB.y}
                  x2={end.x}
                  y2={end.y}
                  className="spider-line stroke-brand-neon"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  style={{ animationDelay: `${i * 0.3}s` }}
                />
              </g>
            ))}
          </svg>

          {/* Vertical spine (small screens) */}
          <span aria-hidden className="absolute bottom-6 left-1/2 top-24 w-px -translate-x-1/2 bg-gradient-to-b from-brand-neon/70 via-brand-500/40 to-transparent lg:hidden" />

          <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[1fr_16rem_1fr] lg:grid-rows-2 lg:gap-x-4 lg:gap-y-16">
            <div className="flex justify-center lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:items-center">
              <AnimatedCard>
                <Hub />
              </AnimatedCard>
            </div>
            {steps.map((step, i) => (
              <AnimatedCard key={step.number} delay={150 + i * 120} className={cn("relative lg:self-center", step.area)}>
                <StepCard step={step} />
              </AnimatedCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
