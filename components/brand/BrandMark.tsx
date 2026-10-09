/* eslint-disable @next/next/no-img-element -- small static SVG marks; next/image adds nothing here */
import { cn } from "@/lib/utils";

/**
 * The Vouchlio "V" ticket mark. Size it by height (e.g. `h-8`); it is square.
 * `auto` follows the site theme: black ticket in light mode, neon ticket in dark mode
 * (switched in globals.css so there is no flash before hydration).
 * `neon` always shows the neon ticket — use it on surfaces that are dark in both themes.
 */
export default function BrandMark({ className, variant = "auto" }: { className?: string; variant?: "auto" | "neon" }) {
  const base = cn("h-8 w-auto shrink-0", className);
  if (variant === "neon") {
    return <img src="/brand/vouchlio-mark-light.svg" alt="" aria-hidden="true" className={base} />;
  }
  return (
    <>
      <img src="/brand/vouchlio-mark.svg" alt="" aria-hidden="true" className={cn("brand-mark-light", base)} />
      <img src="/brand/vouchlio-mark-light.svg" alt="" aria-hidden="true" className={cn("brand-mark-dark", base)} />
    </>
  );
}
