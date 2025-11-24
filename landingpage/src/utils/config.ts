// === CONFIGURATION ===
// Centralize magic numbers e configurações

export const CONFIG = {
  // Scroll
  scroll: {
    navHideThreshold: 150,
    navScrolledThreshold: 100,
    progressUpdateThrottle: 16, // ~60fps
  },

  // Animations
  animations: {
    sectionScale: {
      plateauZone: 400,
      maxDistanceMultiplier: 1.2, // multiplicador de window.innerHeight
      easingPower: 2, // para Math.pow
      scaleReduction: 0.15,
      opacityReduction: 0.3,
      transition:
        "transform 1.2s cubic-bezier(0.19, 1, 0.22, 1), opacity 1.2s ease",
    },
    timeline: {
      stepDelay: 800, // ms entre steps
      initialDelay: 300, // ms antes de começar
      checkInterval: 100, // ms
      maxWait: 30000, // ms
    },
    hero: {
      collapseEasing: "cubic-bezier(0.22, 1, 0.36, 1)",
    },
    parallax: {
      defaultDepth: 0.15,
      movementMultiplier: 120,
    },
    surfaceObserver: {
      threshold: 0.35,
    },
  },

  // Carousel
  carousel: {
    autoplayDelay: 5000, // ms
    slideGap: 16, // px
    scrollBehavior: "smooth" as ScrollBehavior,
  },

  // Exit Intent
  exitIntent: {
    scrollThreshold: 50, // %
    timeThreshold: 30, // seconds
    showDelay: 300000, // 5 minutes in ms
  },

  // PWA
  pwa: {
    promptDelay: 10000, // ms
  },

  // Analytics
  analytics: {
    scrollDepthMilestones: [25, 50, 75, 100],
    sectionViewThreshold: 0.5,
  },

  // Intersection Observer
  observers: {
    surface: {
      threshold: 0.35,
    },
    fadeIn: {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px",
    },
    lazyImage: {
      rootMargin: "50px",
      threshold: 0.01,
    },
  },
} as const;

// Type para configuração (útil para testes)
export type AppConfig = typeof CONFIG;
