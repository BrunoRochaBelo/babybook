import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { SolutionSection } from "./components/SolutionSection";
import { BenefitSection } from "./components/BenefitSection";
import { PrivacySection } from "./components/PrivacySection";
import { EmpathySection } from "./components/EmpathySection";
import { GiftSection } from "./components/GiftSection";
import { PricingSection } from "./components/PricingSection";
import { RoadmapSection } from "./components/RoadmapSection";
import { FAQSection } from "./components/FAQSection";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <SolutionSection />
      <BenefitSection />
      <PrivacySection />
      <EmpathySection />
      <GiftSection />
      <PricingSection />
      <RoadmapSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
