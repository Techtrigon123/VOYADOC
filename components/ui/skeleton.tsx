import { cn } from "@/lib/utils";

/** A shimmering placeholder block. Size and shape it with Tailwind classes. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("skeleton", className)} {...props} />;
}
