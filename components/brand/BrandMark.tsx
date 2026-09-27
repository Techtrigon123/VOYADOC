import Image from "next/image";
import { cn } from "@/lib/utils";

/** The Voyenta "V" mark in its original colours. Size it by height (e.g. `h-8`); width follows the aspect ratio. */
export default function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/voyenta-logo-mark.png"
      alt=""
      aria-hidden="true"
      width={234}
      height={160}
      priority
      className={cn("brand-mark h-8 w-auto shrink-0", className)}
    />
  );
}
