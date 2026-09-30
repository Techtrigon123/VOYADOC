import React from "react";
import { AlignLeft, ArrowLeftRight, FileStack, Keyboard, Layers, Repeat, Shuffle, type LucideIcon } from "lucide-react";
import AnimatedCard from "@/components/ui/AnimatedCard";
import TiltCard from "@/components/marketing/TiltCard";

/**
 * "The problem": a large photo card in the centre as the focal point, with the six pain points
 * as cards on either side. Same hover motion as the other home-page cards (tilt + spotlight).
 */
const PAINS: { text: string; icon: LucideIcon }[] = [
  { text: "Recreating the same documents repeatedly for every booking", icon: Repeat },
  { text: "Switching between Word, Excel and PDF tools", icon: ArrowLeftRight },
  { text: "Maintaining multiple templates across different formats", icon: Layers },
  { text: "Manually entering customer and booking information each time", icon: Keyboard },
  { text: "Spending unnecessary time formatting and adjusting layouts", icon: AlignLeft },
  { text: "Sending inconsistent-looking documents to customers", icon: Shuffle },
];

function PainCard({ text, icon: Icon, index }: { text: string; icon: LucideIcon; index: number }) {
  return (
    <TiltCard
      glow="rgba(251,113,133,0.16)"
      className="rounded-3xl border border-white/10 bg-ink p-5 shadow-lg shadow-black/10 transition-colors hover:border-rose-400/40"
    >
      <div className="relative z-[2] flex h-full flex-col justify-between gap-5">
        <div className="flex items-center justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-rose-400 transition duration-300 group-hover:-translate-y-1 group-hover:bg-rose-500 group-hover:text-white">
            <Icon className="h-5 w-5" />
          </span>
          <span className="text-xs font-bold tabular-nums text-white/25 transition group-hover:text-rose-300">0{index + 1}</span>
        </div>
        <p className="text-[15px] font-medium leading-snug text-neutral-100">{text}</p>
      </div>
    </TiltCard>
  );
}

export default function ProblemSection() {
  const left = PAINS.slice(0, 3);
  const right = PAINS.slice(3);
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-3">The Problem</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)]">Stop Creating Travel Documents Manually.</h2>
        </div>

        <div className="grid gap-5 [perspective:1200px] lg:grid-cols-[1fr_1.35fr_1fr]">
          {/* Left pain points */}
          <div className="grid gap-5 sm:grid-cols-2 lg:order-1 lg:grid-cols-1">
            {left.map((p, i) => (
              <AnimatedCard key={p.text} delay={i * 90}>
                <PainCard text={p.text} icon={p.icon} index={i} />
              </AnimatedCard>
            ))}
          </div>

          {/* Centre of attention */}
          <AnimatedCard delay={120} className="lg:order-2">
            <TiltCard className="min-h-[380px] rounded-[2rem] border border-white/10 bg-ink shadow-2xl shadow-black/20 transition-colors hover:border-brand-neon/40 lg:min-h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80"
                alt="Travel planning with maps, notes and guidebooks"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-[1200ms] ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" aria-hidden />
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-transparent transition duration-300 group-hover:ring-brand-neon/40" aria-hidden />
              <div className="relative z-[2] flex h-full min-h-[380px] flex-col justify-end p-7 sm:p-9">
                <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-brand-neon backdrop-blur-md transition duration-300 group-hover:-translate-y-1 group-hover:bg-brand-neon group-hover:text-ink">
                  <FileStack className="h-6 w-6" />
                </span>
                <p className="max-w-md text-xl font-semibold leading-snug text-white sm:text-2xl">
                  Your travel business already has enough to manage. Document preparation shouldn&apos;t slow you down.
                </p>
              </div>
            </TiltCard>
          </AnimatedCard>

          {/* Right pain points */}
          <div className="grid gap-5 sm:grid-cols-2 lg:order-3 lg:grid-cols-1">
            {right.map((p, i) => (
              <AnimatedCard key={p.text} delay={200 + i * 90}>
                <PainCard text={p.text} icon={p.icon} index={i + 3} />
              </AnimatedCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
