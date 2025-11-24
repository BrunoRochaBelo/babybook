import purgecssPkg from "@fullhuman/postcss-purgecss";
const purgecss = purgecssPkg.default || purgecssPkg;
import cssnano from "cssnano";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
const isProd = process.env.NODE_ENV === "production";

export default {
  plugins: [
    tailwindcss(),
    autoprefixer(),
    ...(isProd
      ? [
          cssnano({ preset: "default" }),
          purgecss({
            content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
            safelist: [
              /^hero-/,
              /^fade-in/,
              /^stagger-/,
              /^magnetic/,
              /^cta-/,
              /^blur-up-/,
              /heroStage/,
              /heroLock/,
              /heroSection/,
              /pricingParallax/,
              /pricingLayer/,
              /pricingGrid/,
              /pricingOrb/,
              /pricingOrbOne/,
              /pricingOrbTwo/,
              /pricingShell/,
              /pricingCardPanel/,
              /futureParallax/,
              /futureParallaxLayer/,
              /futureParallaxGradient/,
              /futureParallaxGrid/,
              /futureParallaxRibbon/,
              /futureParallaxOrb/,
              /futureParallaxOrbLeft/,
              /futureParallaxOrbRight/,
              /faqSection/,
              /faqSectionSectionSurface/,
              /maxW3xl/,
              /surfaceActive/,
              /sectionShell/,
              /bookCard/,
              /bookCardGroupHover/,
              /bookCardWillChange/,
              /carouselSlide/,
              /carouselSlideNotActive/,
              /carouselSlideActive/,
              /carouselDot/,
              /carouselDotHover/,
              /carouselDotSelected/,
              /carouselNavBtn/,
              /boardNotice/,
              /boardNoticeShell/,
              /stickyNote/,
              /stickyNotePin/,
            ],
            defaultExtractor: (content) =>
              content.match(/[A-Za-z0-9-_:/]+/g) || [],
          }),
        ]
      : []),
  ],
};
