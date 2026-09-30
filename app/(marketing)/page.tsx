import HeroSection from "@/components/marketing/HeroSection";
import ProblemSection from "@/components/marketing/ProblemSection";
import PartnersStrip from "@/components/marketing/PartnersStrip";
import DocumentsSection from "@/components/marketing/DocumentsSection";
import FeaturesSection from "@/components/marketing/FeaturesSection";
import HowItWorksSection from "@/components/marketing/HowItWorksSection";
import PricingSection from "@/components/marketing/PricingSection";
import TestimonialsSection from "@/components/marketing/TestimonialsSection";
import FAQSection from "@/components/marketing/FAQSection";
import CTASection from "@/components/marketing/CTASection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <DocumentsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <PartnersStrip />
      <FAQSection />
      <CTASection />
    </>
  );
}