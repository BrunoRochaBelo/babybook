// === IMPORTS ===
import "./styles/main.css";
import "./styles/animations.css";
import "./styles/book-3d.css";
// Note: book-flip behaviour moved to a mountable component to allow safe cleanup
// import "./book-flip"; // legacy - removed

// PREMIUM: Anti-FOUC mais robusto
// Garante que o body fique oculto até os estilos carregarem
if (!document.documentElement.classList.contains("styles-loaded")) {
  document.body.style.visibility = "hidden";
  document.body.style.opacity = "0";
}

// Marca que os estilos foram carregados (anti-FOUC)
// Isso é executado APÓS o CSS ser importado e processado pelo Vite
document.documentElement.classList.add("styles-loaded");

// Revela o body com transição suave
setTimeout(() => {
  document.body.style.visibility = "visible";
  document.body.style.opacity = "1";
  document.body.style.transition = "opacity 0.3s ease-out";
}, 50);

// Core
import { initSmoothScrolling, initScrollProgress } from "./core/scroll";
import { initNavigation } from "./core/navigation";
import { registerServiceWorker, setupPWAInstall } from "./core/pwa";

// Error Handling & Performance
import { setupGlobalErrorHandling, measureInit } from "./utils/errorBoundary";
import { safeInit, unmountAll } from "./utils/logger";
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
import { setupSurfaceObserver } from "./features/animations/sections";
import { mountSectionScale } from "./components/sectionScaleComponent";
import { mountTimelineAnimation } from "./components/timelineComponent";
import {
  mountPricingListAnimation,
  mountPricingHold,
} from "./components/pricingComponent";
import { mountParallaxSections } from "./components/parallaxComponent";
import { mountCtaFinal } from "./components/ctaFinalComponent";
import { mountSiteFooter } from "./components/siteFooterComponent";
import { mountHero } from "./components/heroComponent";
import { mountChaosToOrder } from "./components/chaosToOrderComponent";
import { mountHorizontalScroll } from "./components/horizontalScrollComponent";
import { mountTimelineDraw } from "./components/timelineDrawComponent";
import { mountScrollAnimations } from "./components/scrollAnimationsComponent";
import { mountBookFlip } from "./components/bookFlipComponent";

// Features - Interactive
import {
  setupButtonLoading,
  setupLazyLoading,
} from "./features/interactive/buttons";
import { setupCarousel } from "./features/interactive/carousel";
import { setupAccordion } from "./features/interactive/accordion";
import { initCtaFinalBehavior } from "./features/ctaFinalBehavior";
import { initFooterBehavior } from "./features/footerBehavior";

// Features - Checkout
import { mountCheckout } from "./features/checkout";
import { injectCheckoutStyles } from "./features/checkout/styles";

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
  safeInit("Performance Monitoring", () => setupPerformanceMonitoring());
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
    safeInit("Smooth Scrolling", () => initSmoothScrolling());
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

  // PREMIUM: Advanced Optimizations (executar cedo)
  safeInit("Advanced Optimizations", async () => {
    const {
      preloadCriticalFonts,
      optimizeHeroVideo,
      setupSkeletonScreens,
      // setupSectionTransitions, // DESABILITADO
      setupMouseParallax,
    } = await import("./features/advancedOptimizations");

    // Preload de fontes (imediato)
    preloadCriticalFonts();

    // Otimização de vídeo (após DOM ready)
    optimizeHeroVideo();

    // Skeleton screens (imediato)
    setupSkeletonScreens();

    // Transições entre seções (DESABILITADO - estava atrapalhando)
    // setTimeout(() => {
    //   setupSectionTransitions();
    // }, 500);

    // Mouse parallax (desktop apenas) — capture disposer if present
    const d1 = optimizeHeroVideo && optimizeHeroVideo();
    const d2 =
      window.innerWidth > 768
        ? setupMouseParallax && setupMouseParallax()
        : undefined;

    return () => {
      try {
        d1 && typeof d1 === "function" && d1();
        d2 && typeof d2 === "function" && d2();
      } catch (err) {
        console.warn("Failed to cleanup advanced optimizations", err);
      }
    };
  });

  // Hero styles module binding (lazy load CSS module)
  safeInit("Hero Styles", () => {
    import("./core/styles/heroStyles")
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
    safeInit("Section Scale", () => mountSectionScale());
  }
  safeInit("Timeline Animation", () => mountTimelineAnimation());
  safeInit("Pricing List Animation", () => mountPricingListAnimation());
  safeInit("Pricing Hold Effect", () => mountPricingHold());
  safeInit("Surface Observer", () => setupSurfaceObserver());
  safeInit("CTA Final", () => mountCtaFinal());

  safeInit("Site Footer", () => mountSiteFooter());

  // CTA Final Scroll Behavior (escala e pinagem)
  safeInit("CTA Final Behavior", () => initCtaFinalBehavior());

  // Footer Drawer Behavior (aparece após CTA Final pinado)
  safeInit("Footer Behavior", () => initFooterBehavior());

  if (isFeatureEnabled("parallax")) {
    safeInit("Parallax Sections", () => mountParallaxSections());
  }

  // Animations - Hero
  if (isFeatureEnabled("heroAnimations")) {
    safeInit("Hero", () => mountHero());
    // PREMIUM: Hero Particles
    safeInit("Hero Particles", async () => {
      const { initHeroParticles } = await import("./features/heroParticles");
      return initHeroParticles();
    });
    // PREMIUM: Scroll Enhancements
    safeInit("Scroll Indicator & Animation Pauser", async () => {
      const { initScrollIndicator, initAnimationPauser } = await import(
        "./features/scrollEnhancements"
      );
      const r1 = initScrollIndicator();
      const r2 = initAnimationPauser();
      return () => {
        try {
          r1 && typeof r1 === "function" && r1();
          r2 && typeof r2 === "function" && r2();
        } catch (err) {
          console.warn(
            "Error disposing Scroll Indicator & Animation Pauser",
            err,
          );
        }
      };
    });
  }

  // Animations - Scroll Effects
  if (isFeatureEnabled("chaosToOrder")) {
    safeInit("Chaos to Order", () => mountChaosToOrder());
  }
  if (isFeatureEnabled("horizontalScroll")) {
    safeInit("Horizontal Scroll", () => mountHorizontalScroll());
  }
  // Book Flip: convert old top-level script to componentized mount
  safeInit("Book Flip", () => mountBookFlip());
  safeInit("Timeline Draw", () => mountTimelineDraw());
  safeInit("Scroll Animations", () => mountScrollAnimations());

  // Interactive Components
  safeInit("Button Loading", () => setupButtonLoading());
  safeInit("Lazy Loading", () => setupLazyLoading());

  if (isFeatureEnabled("carousel")) {
    safeInit("Carousel", () => setupCarousel());
  }

  safeInit("Accordion", () => setupAccordion());

  // Checkout Modal - Fluxo de compra
  safeInit("Checkout", () => {
    injectCheckoutStyles();
    return mountCheckout();
  });

  // Access Modal - Filtro de acesso para usuários/fotógrafos
  safeInit("Access Modal", async () => {
    const { setupAccessModal } = await import("./features/access");
    return setupAccessModal();
  });


  // PREMIUM: Smart Interactions
  safeInit("Smart Prefetch & Haptic", async () => {
    const { setupSmartPrefetch, setupHapticFeedback } = await import(
      "./features/smartInteractions"
    );
    const prefetchDisposer = setupSmartPrefetch();
    const hapticDisposer = setupHapticFeedback();
    const cleanupFns = [prefetchDisposer, hapticDisposer].filter(
      (fn): fn is () => void => typeof fn === "function",
    );
    if (!cleanupFns.length) {
      return null;
    }
    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  });

  // Exit Intent - Lazy load após delay
  if (isFeatureEnabled("exitIntent")) {
    lazyLoader.register("exitIntent", async () => {
      const { setupExitIntent } = await import("./features/interactive/modals");
      return setupExitIntent();
    });

    setTimeout(async () => {
      const disposer = await lazyLoader.load("exitIntent");
      if (typeof disposer === "function") {
        safeInit("Exit Intent (lazy)", () => disposer as () => void);
      }
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

  // Register automatic cleanup on page hide/unload
  window.addEventListener("pagehide", unmountAll, { once: true });
  window.addEventListener("beforeunload", unmountAll);

  // Pricing & Future-Parallax styles: register lazy loaders and lazy-init when visible
  lazyLoader.register("pricingStyles", async () => {
    const mod = await import("./core/styles/pricingStyles");
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
      const mod = await import("./core/styles/futureParallaxStyles");
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
    const mod = await import("./core/styles/faqStyles");
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
    const mod = await import("./core/styles/bookStyles");
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
    const mod = await import("./core/styles/carouselStyles");
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
    const mod = await import("./core/styles/boardStyles");
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
