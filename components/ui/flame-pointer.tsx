"use client";

import { useEffect } from "react";

/**
 * Drives the FlameButton hover effect for every element with `.btn-flame`
 * (Links, submit buttons, dropdown triggers…) through CSS variables:
 *   --mx    cursor x inside the button (px)
 *   --glow  1 while hovered
 *   --edge  0 → 1 as the cursor nears either end (outer halo strength)
 *   --side  -1 left half, 1 right half (halo direction)
 * One delegated listener for the whole page. Mount once in the root layout.
 */
export function FlamePointer() {
  useEffect(() => {
    let active: HTMLElement | null = null;

    const reset = (el: HTMLElement) => {
      el.style.setProperty("--glow", "0");
      el.style.setProperty("--edge", "0");
    };

    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.<HTMLElement>(".btn-flame") ?? null;
      if (active && active !== el) reset(active);
      active = el;
      if (!el || (el as HTMLButtonElement).disabled) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const norm = rect.width ? x / rect.width : 0.5;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--glow", "1");
      el.style.setProperty("--side", norm >= 0.5 ? "1" : "-1");
      el.style.setProperty("--edge", Math.pow(Math.min(1, Math.abs(norm - 0.5) * 2), 1.6).toFixed(3));
    };

    const onLeave = () => {
      if (active) reset(active);
      active = null;
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  return null;
}
