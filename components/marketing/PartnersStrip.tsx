import Image from "next/image";
import AnimatedCard from "@/components/ui/AnimatedCard";

/** Partner logos in a plain row under the hero — no heading, each fades in as it scrolls into view. */
const PARTNERS = [
  { name: "Razorpay", src: "/partners/razorpay.png", width: 754, height: 160, className: "h-9 sm:h-10 w-auto" },
  { name: "FH", src: "/partners/fh.png", width: 320, height: 320, className: "h-16 sm:h-20 w-auto rounded-full" },
];

export default function PartnersStrip() {
  return (
    <section aria-label="Partners" className="bg-white py-14 dark:bg-transparent sm:py-16">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-20 gap-y-10 px-4 sm:gap-x-32">
        {PARTNERS.map((p, i) => (
          <AnimatedCard key={p.name} delay={i * 150}>
            <div className="flex items-center justify-center transition duration-300 hover:scale-105 dark:rounded-2xl dark:bg-[#ffffff] dark:px-5 dark:py-3">
              <Image src={p.src} alt={p.name} width={p.width} height={p.height} className={p.className} />
            </div>
          </AnimatedCard>
        ))}
      </div>
    </section>
  );
}
