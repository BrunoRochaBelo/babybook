import { prefersReducedMotion } from "../../utils/helpers";
import { createScrollThrottle } from "../../utils/helpers";
import { CONFIG } from "../../utils/config";
import { logger } from "../../utils/logger";

// === SCALE PROGRESSIVO NAS SEÇÕES ===
export const setupSectionScale = () => {
  if (prefersReducedMotion()) {
    logger.info("setupSectionScale", "Skipped (prefers-reduced-motion)");
    return;
  }

  const allSections = Array.from(
    document.querySelectorAll<HTMLElement>("section"),
  ).filter((section) => {
    const isHero =
      section.id === "hero-stage" || section.classList.contains("hero-stage");
    const isSpecial = section.classList.contains("horizontal-scroll-section");
    return !isHero && !isSpecial;
  });

  if (!allSections.length) {
    logger.warn("setupSectionScale", "No sections found");
    return;
  }

  logger.info(
    "setupSectionScale",
    `Initialized for ${allSections.length} sections`,
  );

  const updateSectionScale = () => {
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY;

    allSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top + scrollY;
      const sectionHeight = rect.height;
      const sectionCenter = sectionTop + sectionHeight / 2;
      const viewportCenter = scrollY + windowHeight / 2;

      const distance = Math.abs(sectionCenter - viewportCenter);
      const { plateauZone, maxDistanceMultiplier } =
        CONFIG.animations.sectionScale;
      const maxDistance = windowHeight * maxDistanceMultiplier;

      let normalizedDistance: number;
      if (distance < plateauZone) {
        normalizedDistance = 0;
      } else {
        normalizedDistance = Math.min(
          (distance - plateauZone) / (maxDistance - plateauZone),
          1,
        );
      }

      const { easingPower, scaleReduction, opacityReduction } =
        CONFIG.animations.sectionScale;
      const easedDistance = Math.pow(normalizedDistance, easingPower);
      const scale = 1 - easedDistance * scaleReduction;
      const opacity = 1 - easedDistance * opacityReduction;

      section.style.transform = `scale(${scale.toFixed(3)})`;
      section.style.opacity = opacity.toFixed(2);
      section.style.transformOrigin = "center center";
      section.style.transition = CONFIG.animations.sectionScale.transition;

      if (scale >= 0.98) {
        section.classList.add("section-ready");
        section.classList.add("scale-sticky");
      } else {
        section.classList.remove("section-ready");
        section.classList.remove("scale-sticky");
      }
    });
  };

  const throttledUpdate = createScrollThrottle(updateSectionScale);

  updateSectionScale();
  window.addEventListener("scroll", throttledUpdate, { passive: true });
  window.addEventListener("resize", updateSectionScale);
};

// === ANIMAÇÃO DA TIMELINE ===
export const setupTimelineAnimation = () => {
  if (prefersReducedMotion()) {
    logger.info("setupTimelineAnimation", "Skipped (prefers-reduced-motion)");
    return;
  }

  const timelineSection = document.querySelector(
    "#how-it-works-section",
  ) as HTMLElement;
  if (!timelineSection) {
    logger.warn("setupTimelineAnimation", "Timeline section not found");
    return;
  }

  const steps = Array.from(
    timelineSection.querySelectorAll(".step-item"),
  ) as HTMLElement[];
  if (!steps.length) {
    logger.warn("setupTimelineAnimation", "No step items found");
    return;
  }

  logger.info(
    "setupTimelineAnimation",
    `Initialized for ${steps.length} steps`,
  );

  let animationStarted = false;
  let currentStep = 0;

  const activateStep = (index: number) => {
    if (index >= steps.length) return;

    const step = steps[index];
    step.classList.add("active");
    logger.debug("setupTimelineAnimation", `Activated step ${index + 1}`);

    setTimeout(() => {
      currentStep++;
      if (currentStep < steps.length) {
        activateStep(currentStep);
      }
    }, CONFIG.animations.timeline.stepDelay);
  };

  const checkSectionReady = () => {
    if (animationStarted) return;

    if (timelineSection.classList.contains("section-ready")) {
      animationStarted = true;
      setTimeout(() => {
        activateStep(0);
      }, CONFIG.animations.timeline.initialDelay);
    }
  };

  const intervalId = setInterval(() => {
    checkSectionReady();
    if (animationStarted) {
      clearInterval(intervalId);
    }
  }, CONFIG.animations.timeline.checkInterval);

  setTimeout(
    () => clearInterval(intervalId),
    CONFIG.animations.timeline.maxWait,
  );
};

// === SURFACE OBSERVER ===
export const setupSurfaceObserver = () => {
  const surfaces = document.querySelectorAll<HTMLElement>(
    ".section-surface, .hero-section",
  );
  if (!surfaces.length) {
    logger.warn("setupSurfaceObserver", "No surfaces found");
    return;
  }

  logger.info("setupSurfaceObserver", `Observing ${surfaces.length} surfaces`);

  const surfaceObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("surface-active", entry.isIntersecting);
      });
    },
    { threshold: CONFIG.animations.surfaceObserver.threshold },
  );

  surfaces.forEach((surface) => surfaceObserver.observe(surface));
};

// === PARALLAX SECTIONS ===
export const setupParallaxSections = () => {
  if (prefersReducedMotion()) {
    logger.info("setupParallaxSections", "Skipped (prefers-reduced-motion)");
    return;
  }

  const sections = document.querySelectorAll<HTMLElement>(
    "[data-parallax-section]",
  );
  if (!sections.length) {
    logger.warn("setupParallaxSections", "No parallax sections found");
    return;
  }

  logger.info(
    "setupParallaxSections",
    `Initialized for ${sections.length} sections`,
  );

  const updateLayers = () => {
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const sectionCenter = rect.top + rect.height / 2;
      const delta = sectionCenter - window.innerHeight / 2;
      const layers = section.querySelectorAll<HTMLElement>(
        "[data-parallax-depth]",
      );

      layers.forEach((layer) => {
        const depth = parseFloat(
          layer.dataset.parallaxDepth ||
            String(CONFIG.animations.parallax.defaultDepth),
        );
        const movement =
          -(delta / window.innerHeight) *
          depth *
          CONFIG.animations.parallax.movementMultiplier;
        layer.style.transform = `translate3d(0, ${movement}px, 0)`;
      });
    });
  };

  const throttledUpdate = createScrollThrottle(updateLayers);

  updateLayers();
  window.addEventListener("scroll", throttledUpdate, { passive: true });
  window.addEventListener("resize", updateLayers);
};
