import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { HeroSection } from "./landing/HeroSection";
import { HowItWorksSection } from "./landing/HowItWorksSection";
import { FeaturesSection } from "./landing/FeaturesSection";
import { SecuritySection } from "./landing/SecuritySection";
import { GiftSection } from "./landing/GiftSection";
import { CTASection } from "./landing/CTASection";
import { Footer } from "./landing/Footer";
export function LandingPage({ onGetStarted }) {
    return (_jsxs("div", { className: "min-h-screen", children: [_jsx(HeroSection, { onGetStarted: onGetStarted }), _jsx(HowItWorksSection, {}), _jsx(FeaturesSection, {}), _jsx(SecuritySection, {}), _jsx(GiftSection, {}), _jsx(CTASection, { onGetStarted: onGetStarted }), _jsx(Footer, {})] }));
}
