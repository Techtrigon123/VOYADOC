import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Black button with a bottom-edge glow (styles: `.btn-glow` in app/globals.css).
 * Sized like the original design (180×50) unless you pass your own classes.
 */
export const GlowButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, type = "button", children, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "btn-glow inline-flex h-[50px] min-w-[180px] items-center justify-center gap-2 rounded-lg px-6 text-[15px] outline-none",
        className
      )}
      {...props}
    >
      {children ?? "Button"}
    </button>
  )
);
GlowButton.displayName = "GlowButton";

export default GlowButton;
