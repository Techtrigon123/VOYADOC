"use client";

import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { ArrowUp } from "lucide-react";

/**
 * Smooth, inertia-style wheel scrolling for the marketing pages (Lenis) plus a back-to-top button.
 * Touch devices keep native scrolling, and it stays off for people who prefer reduced motion.
 * In-page links (#pricing, #faq …) glide to their section and stop below the navbar (html scroll-padding-top).
 */
export default function SmoothScroll() {
  const [showTop, setShowTop] = useState(false);
  const lenis = useRef<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Native smooth scrolling would fight Lenis; it takes over while mounted.
    const root = document.documentElement;
    const before = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";

    const l = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4), anchors: true, autoRaf: true });
    lenis.current = l;
    return () => {
      l.destroy();
      lenis.current = null;
      root.style.scrollBehavior = before;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => (lenis.current ? lenis.current.scrollTo(0, { duration: 1.2 }) : window.scrollTo({ top: 0, behavior: "smooth" }));

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Back to top"
      tabIndex={showTop ? 0 : -1}
      className={`chat-aware glass-nav fixed bottom-5 right-5 z-[60] flex h-11 w-11 items-center justify-center rounded-full border text-black shadow-lg transition-all duration-300 hover:-translate-y-0.5 ${
        showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
