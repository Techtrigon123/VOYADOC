import { cn } from "@/lib/utils";

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Scroll right-to-left by default; `reverse` flips it. */
  reverse?: boolean;
  pauseOnHover?: boolean;
  vertical?: boolean;
  /** How many copies of the children to render so the loop never shows a gap. */
  repeat?: number;
  children: React.ReactNode;
}

/**
 * Infinite scrolling row. Speed via `[--duration:40s]`, spacing via `[--gap:1rem]`.
 * Keyframes `marquee` / `marquee-vertical` live in app/globals.css.
 */
export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  vertical = false,
  repeat = 4,
  children,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        "group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
        vertical ? "flex-col" : "flex-row",
        className
      )}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          aria-hidden={i > 0 ? true : undefined}
          className={cn(
            "flex shrink-0 justify-around [gap:var(--gap)]",
            vertical ? "animate-marquee-vertical flex-col" : "animate-marquee flex-row",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
            reverse && "[animation-direction:reverse]"
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
