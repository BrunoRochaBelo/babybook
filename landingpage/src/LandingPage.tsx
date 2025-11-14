import { NewHeroSection } from "./landing/NewHeroSection";
import { ProblemSection } from "./landing/ProblemSection";
import { SolutionSection } from "./landing/SolutionSection";
import { HowItWorksSection } from "./landing/HowItWorksSection";
import { FeaturesShowcaseSection } from "./landing/FeaturesShowcaseSection";
import { FamilySection } from "./landing/FamilySection";
import { PricingSection } from "./landing/PricingSection";
import { FinalCTASection } from "./landing/FinalCTASection";
import { Footer } from "./landing/Footer";
import { ThemeToggle } from "./components/ThemeToggle";
import { useScrollReveal } from "./hooks/useScrollReveal";

interface LandingPageProps {
  /**
   * Callback triggered when the user clicks on the main call to action button.
   */
  onGetStarted: () => void;
}

/**
 * The completely redesigned landing page for Baby Book.
 * It tells a story, focusing on the user's emotional journey and the core value proposition.
 */
export function LandingPage({ onGetStarted }: LandingPageProps) {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 flex justify-end px-4 py-3 bg-background/80 backdrop-blur-sm">
        <ThemeToggle />
      </header>
      <main>
        <NewHeroSection onGetStarted={onGetStarted} />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <FeaturesShowcaseSection />
        <FamilySection />
        <PricingSection onGetStarted={onGetStarted} />
        <FinalCTASection onGetStarted={onGetStarted} />
      </main>
      <Footer />
    </div>
  );
}
