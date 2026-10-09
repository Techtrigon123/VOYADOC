"use client";

import React, { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageInfo {
  title: string;
  description: string;
  includes: string[];
  icon: LucideIcon;
  image: string;
  /** Larger type and a taller card, for a featured tile in a bento grid. */
  feature?: boolean;
}

/**
 * Informational card (no link): full-bleed photo with the text over a dark fade.
 * On hover it tilts toward the cursor, a soft neon spotlight follows it, the photo slowly zooms
 * and "what's inside" chips slide up. Tilt styles live in globals.css (.doc-card).
 */
export default function ImageInfoCard({ item, className }: { item: ImageInfo; className?: string }) {
  const ref = useRef<HTMLElement>(null);

  // Cursor position → spotlight position and a gentle 3D tilt (max ~5°).
  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--rx", `${(0.5 - y) * 6}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 8}deg`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  const Icon = item.icon;
  return (
    <article
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        "doc-card group relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-black/5",
        item.feature ? "min-h-[360px] lg:min-h-[520px]" : "min-h-[260px]",
        className
      )}
    >
      {/* Photo — slow zoom on hover */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image}
        alt={item.title}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      {/* Readability fade: full-colour photo, darkened only enough for white text */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/85 via-[#000000]/45 to-[#000000]/5" aria-hidden />
      {/* Cursor spotlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.14), transparent 60%)" }}
        aria-hidden
      />
      {/* Accent edge on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-transparent transition duration-300 group-hover:ring-brand-500/50" aria-hidden />

      <div className="relative flex h-full flex-col justify-end p-6 sm:p-7">
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ffffff]/25 bg-[#ffffff]/90 text-brand-600 backdrop-blur-md transition duration-300 group-hover:-translate-y-1 group-hover:bg-brand-500 group-hover:text-[#ffffff]">
          <Icon className="h-5 w-5" />
        </span>
        <h3 className={cn("font-bold tracking-tight text-[#ffffff]", item.feature ? "text-2xl sm:text-3xl" : "text-xl")}>{item.title}</h3>
        <p className={cn("mt-2 leading-relaxed text-[#ffffff]/85", item.feature ? "max-w-md text-base" : "text-sm")}>{item.description}</p>

        {/* "What's inside" chips — always visible on touch screens, slide up on hover elsewhere */}
        <ul className="mt-4 flex flex-wrap gap-2 transition duration-500 ease-out [@media(hover:hover)]:translate-y-3 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100">
          {item.includes.map((text, i) => (
            <li
              key={text}
              className="rounded-full border border-[#ffffff]/25 bg-[#ffffff]/15 px-3 py-1 text-xs font-medium text-[#ffffff] backdrop-blur-md"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              {text}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
