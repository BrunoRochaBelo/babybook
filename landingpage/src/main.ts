// === IMPORTS ===
import "./styles/main.css";

// Core
import { initSmoothScrolling, initScrollProgress } from "./core/scroll";
import { initNavigation } from "./core/navigation";
import { registerServiceWorker, setupPWAInstall } from "./core/pwa";

// Error Handling & Performance
import { setupGlobalErrorHandling, measureInit } from "./utils/errorBoundary";
import { safeInit } from "./utils/logger";
import {
  setupPerformanceMonitoring,
  performanceMonitor,
} from "./utils/performance";
import { featureFlags, isFeatureEnabled } from "./utils/featureFlags";
import { lazyLoader, setupLazyImages } from "./utils/lazyLoader";
import { lazyInitComponent } from "./utils/lazyLoader";
import { setupResourceHints } from "./utils/resourceHints";
import { setupSmartPrefetch } from "./utils/prefetch";
import {
  setupResponsiveImages,
  setupBlurUpPlaceholders,
  setupPriorityImages,
} from "./utils/imageOptimizer";
import { deferCSS, extractAndInlineCriticalCSS } from "./utils/criticalCSS";
import { setupPerformanceBudget } from "./utils/performanceBudget";

// Features - Animations
import {
  setupSectionScale,
  setupTimelineAnimation,
  setupSurfaceObserver,
  setupParallaxSections,
} from "./features/animations/sections";
import {
  setupHeroCollapseProgress,
  initHoverAnimations,
} from "./features/animations/hero";
import {
  setupChaosToOrder,
  setupHorizontalScroll,
  setupTimelineDraw,
  setupScrollAnimations,
} from "./features/animations/scroll-effects";

// Features - Interactive
import {
  setupButtonLoading,
  setupLazyLoading,
} from "./features/interactive/buttons";
import { setupCarousel } from "./features/interactive/carousel";
import { setupAccordion } from "./features/interactive/accordion";

// Utils
import {
  setupScrollDepthTracking,
  setupSectionViewTracking,
} from "./utils/analytics";

// === INICIALIZAÇÃO ===

// Resource Hints - Muito cedo (DNS prefetch, preconnect)
setupResourceHints();

// Defer CSS - Logo após resource hints
if (isFeatureEnabled("performanceMonitoring")) {
  deferCSS();
}

// Performance Monitoring - Primeira coisa (marca app-start)
if (isFeatureEnabled("performanceMonitoring")) {
  setupPerformanceMonitoring();
}

// Error Boundary
if (isFeatureEnabled("errorTracking")) {
  setupGlobalErrorHandling();
}

// Feature Flags - Log em dev
if (isFeatureEnabled("debugMode")) {
  featureFlags.logStatus();
}

// Smooth Scrolling
if (isFeatureEnabled("smoothScrolling")) {
  measureInit("Smooth Scrolling", () => {
    initSmoothScrolling();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Inline critical CSS for above-the-fold elements (production only)
  // In development or in environments without server-side critical inlining,
  // fall back to client-side extraction. In production where we run a
  // server-side critical inlining step, skip this to avoid double inlining.
  const _isProdEnv = (import.meta as any)?.env?.PROD === true;
  if (isFeatureEnabled("criticalCSS") && !_isProdEnv) {
    extractAndInlineCriticalCSS();
  }
  performanceMonitor.mark("features-init-start");

  // Core Features
  safeInit("Scroll Progress", () => initScrollProgress());
  if (isFeatureEnabled("navigation")) {
    safeInit("Navigation", () => initNavigation());
  }

  // Lazy Images (sempre antes de outras features)
  if (isFeatureEnabled("lazyImages")) {
    safeInit("Lazy Images", () => setupLazyImages());
  }

  // Hero styles module binding (lazy load CSS module)
  safeInit("Hero Styles", () => {
    import("./core/heroStyles")
      .then(({ setupHeroStyles }) => setupHeroStyles())
      .catch((err) => {
        // Non-fatal: hero styles are optional
        console.warn("Could not load hero styles module", err);
      });
  });

  // Image Optimization
  safeInit("Priority Images", () => setupPriorityImages());
  safeInit("Responsive Images", () => setupResponsiveImages());
  safeInit("Blur-Up Placeholders", () => setupBlurUpPlaceholders());

  // Animations - Sections
  if (isFeatureEnabled("sectionScale")) {
    safeInit("Section Scale", () => setupSectionScale());
  }
  safeInit("Timeline Animation", () => setupTimelineAnimation());
  safeInit("Surface Observer", () => setupSurfaceObserver());

  if (isFeatureEnabled("parallax")) {
    safeInit("Parallax Sections", () => setupParallaxSections());
  }

  // Animations - Hero
  if (isFeatureEnabled("heroAnimations")) {
    safeInit("Hero Collapse", () => setupHeroCollapseProgress());
    safeInit("Hover Animations", () => initHoverAnimations());
  }

  // Animations - Scroll Effects
  if (isFeatureEnabled("chaosToOrder")) {
    safeInit("Chaos to Order", () => setupChaosToOrder());
  }
  if (isFeatureEnabled("horizontalScroll")) {
    safeInit("Horizontal Scroll", () => setupHorizontalScroll());
  }
  safeInit("Timeline Draw", () => setupTimelineDraw());
  safeInit("Scroll Animations", () => setupScrollAnimations());

  // Interactive Components
  safeInit("Button Loading", () => setupButtonLoading());
  safeInit("Lazy Loading", () => setupLazyLoading());

  if (isFeatureEnabled("carousel")) {
    safeInit("Carousel", () => setupCarousel());
  }

  safeInit("Accordion", () => setupAccordion());

  // Exit Intent - Lazy load após delay
  if (isFeatureEnabled("exitIntent")) {
    lazyLoader.register("exitIntent", async () => {
      const { setupExitIntent } = await import("./features/interactive/modals");
      setupExitIntent();
      return { setupExitIntent };
    });

    setTimeout(() => {
      lazyLoader.load("exitIntent");
    }, 5000); // Carrega após 5s
  }

  // Analytics & Tracking
  if (isFeatureEnabled("analytics")) {
    safeInit("Scroll Depth Tracking", () => setupScrollDepthTracking());
    safeInit("Section View Tracking", () => setupSectionViewTracking());
  }

  // PWA - Lazy load
  if (isFeatureEnabled("pwa") && isFeatureEnabled("serviceWorker")) {
    lazyLoader.register("pwa", async () => {
      registerServiceWorker();
      setupPWAInstall();
      return { registerServiceWorker, setupPWAInstall };
    });

    setTimeout(() => {
      lazyLoader.load("pwa");
    }, 3000); // Carrega após 3s
  }

  // Smart Prefetch - Lazy load após idle
  lazyLoader.register("prefetch", async () => {
    setupSmartPrefetch();
    return { setupSmartPrefetch };
  });

  if ("requestIdleCallback" in window) {
    requestIdleCallback(
      () => {
        lazyLoader.load("prefetch");
      },
      { timeout: 5000 },
    );
  } else {
    setTimeout(() => {
      lazyLoader.load("prefetch");
    }, 5000);
  }

  // Performance Budget - Após tudo carregar
  if (
    isFeatureEnabled("performanceMonitoring") &&
    isFeatureEnabled("debugMode")
  ) {
    setTimeout(() => {
      setupPerformanceBudget();
    }, 5000);
  }

  // Mede tempo de inicialização de todas as features
  const initDuration = performanceMonitor.measure(
    "features-initialization",
    "features-init-start",
  );
  performanceMonitor.report("Features Init Time", initDuration);

  // Pricing & Future-Parallax styles: register lazy loaders and lazy-init when visible
  lazyLoader.register("pricingStyles", async () => {
    const mod = await import("./core/pricingStyles");
    try {
      await mod.setupPricingStyles();
    } catch (err) {
      // ignore
    }
    return mod;
  });

  // Load pricing styles when pricing shell enters viewport
  lazyInitComponent(".pricing-shell", async () => {
    await lazyLoader.load("pricingStyles");
  });

  if (isFeatureEnabled("parallax")) {
    lazyLoader.register("futureParallaxStyles", async () => {
      const mod = await import("./core/futureParallaxStyles");
      try {
        await mod.setupFutureParallaxStyles();
      } catch (err) {
        // ignore
      }
      return mod;
    });

    lazyInitComponent(".future-parallax", async () => {
      await lazyLoader.load("futureParallaxStyles");
    });
  }

  // FAQ styles: lazy load when the FAQ section is in viewport
  lazyLoader.register("faqStyles", async () => {
    const mod = await import("./core/faqStyles");
    try {
      await mod.setupFaqStyles();
    } catch (err) {
      // ignore
    }
    return mod;
  });

  lazyInitComponent(".faq-section", async () => {
    await lazyLoader.load("faqStyles");
  });

  // Book card styles: lazy load when book cards are present
  lazyLoader.register("bookStyles", async () => {
    const mod = await import("./core/bookStyles");
    try {
      await mod.setupBookStyles();
    } catch (err) {
      // ignore
    }
    return mod;
  });
  lazyInitComponent(".book-card", async () => {
    await lazyLoader.load("bookStyles");
  });

  // Carousel styles: lazy load for carousel slides
  lazyLoader.register("carouselStyles", async () => {
    const mod = await import("./core/carouselStyles");
    try {
      await mod.setupCarouselStyles();
    } catch (err) {
      // ignore
    }
    return mod;
  });
  lazyInitComponent(".carousel-slide", async () => {
    await lazyLoader.load("carouselStyles");
  });

  // Board/Sticky-note styles
  lazyLoader.register("boardStyles", async () => {
    const mod = await import("./core/boardStyles");
    try {
      await mod.setupBoardStyles();
    } catch (err) {
      // ignore
    }
    return mod;
  });
  lazyInitComponent(".board-notice", async () => {
    await lazyLoader.load("boardStyles");
  });
});
