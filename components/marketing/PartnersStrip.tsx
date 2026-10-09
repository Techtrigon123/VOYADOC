import Image from "next/image";
import AnimatedCard from "@/components/ui/AnimatedCard";

/**
 * Logo strip under the hero, in two labelled groups so each logo's relationship is clear:
 * travel businesses that use Vouchlio, and the payment provider.
 * Keep this honest — only list real customers, and only show a provider you actually use.
 */
const GROUPS = [
  {
    label: "Trusted by",
    logos: [{ name: "FH — travel agency", src: "/partners/fh.png", width: 320, height: 320, className: "h-16 w-auto rounded-full sm:h-20" }],
  },
  {
    label: "Secure payments with",
    logos: [{ name: "Razorpay", src: "/partners/razorpay.png", width: 754, height: 160, className: "h-8 w-auto sm:h-9" }],
  },
];

export default function PartnersStrip() {
  return (
    <section aria-label="Customers and payment partner" className="bg-white py-14 sm:py-16">
      <div className="mx-auto grid max-w-4xl gap-10 px-4 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-slate-200">
        {GROUPS.map((g, gi) => (
          <AnimatedCard key={g.label} delay={gi * 150}>
            <div className="flex flex-col items-center gap-5 sm:px-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{g.label}</p>
              <div className="flex min-h-20 flex-wrap items-center justify-center gap-10">
                {g.logos.map((p) => (
                  <div key={p.name} className="flex items-center justify-center rounded-2xl transition duration-300 hover:scale-105 dark:bg-[#ffffff] dark:px-5 dark:py-3">
                    <Image src={p.src} alt={p.name} width={p.width} height={p.height} className={p.className} />
                  </div>
                ))}
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>
    </section>
  );
}
