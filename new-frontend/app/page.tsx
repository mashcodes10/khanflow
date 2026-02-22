import Navbar from "@/components/landing/layout/Navbar";
import Footer from "@/components/landing/layout/Footer";
import HeroSection from "@/components/landing/sections/HeroSection";
import ConvergenceAnimation from "@/components/landing/sections/ConvergenceAnimation";
import ProblemSection from "@/components/landing/sections/ProblemSection";
import FeaturesSection from "@/components/landing/sections/FeaturesSection";
import PricingSection from "@/components/landing/sections/PricingSection";
import FAQSectionA from "@/components/landing/sections/FAQSectionA";
import CTASection from "@/components/landing/sections/CTASection";

export default function Home() {
  return (
    <div className="landing-theme min-h-screen bg-background text-foreground font-sans antialiased dark">
      <Navbar />
      <main className="relative z-[1]">
        <HeroSection />
        <ConvergenceAnimation />
        <ProblemSection />
        <FeaturesSection />
        <PricingSection />
        <FAQSectionA />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
