"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Card shell with the same hover motion as ImageInfoCard: tilts toward the cursor and a soft
 * spotlight follows it. Tilt styles live in globals.css (.doc-card).
 */
export default function TiltCard({
  children,
  className,
  glow = "rgba(0,0,0,0.04)",
}: {
  children: React.ReactNode;
  className?: string;
  /** Spotlight colour. */
  glow?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
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

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={cn("doc-card group relative h-full overflow-hidden", className)}>
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(360px circle at var(--mx, 50%) var(--my, 50%), ${glow}, transparent 60%)` }}
        aria-hidden
      />
      {children}
    </div>
  );
}
