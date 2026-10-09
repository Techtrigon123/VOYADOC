import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";

/** Round logo badge at the top of the sign-in / sign-up glass card. */
export default function AuthLogo() {
  return (
    <Link href="/" aria-label="Vouchlio home" className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-white/40">
      <BrandMark className="h-8" />
    </Link>
  );
}
