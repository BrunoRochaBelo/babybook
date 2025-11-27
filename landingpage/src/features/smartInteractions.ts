import { logger } from "../utils/logger";

// === PREMIUM: Prefetch de Próxima Página ===
export const setupSmartPrefetch = () => {
  const ctaButtons = document.querySelectorAll<HTMLAnchorElement>(
    'a[href*="pricing"], a[href*="signup"], .cta-primary'
  );

  ctaButtons.forEach((button) => {
    let prefetched = false;

    // Prefetch no hover (desktop) ou no primeiro toque (mobile)
    const prefetchHandler = () => {
      if (prefetched) return;

      const href = button.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      // Cria link de prefetch
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = href;
      link.as = "document";

      document.head.appendChild(link);
      prefetched = true;

      logger.info(`Prefetched: ${href}`);
    };

    // Desktop: hover
    button.addEventListener("mouseenter", prefetchHandler, { once: true });

    // Mobile: touchstart
    button.addEventListener("touchstart", prefetchHandler, {
      once: true,
      passive: true,
    });
  });

  logger.info("Smart prefetch initialized");
};

// === PREMIUM: Haptic Feedback (Mobile) ===
export const setupHapticFeedback = () => {
  if (!("vibrate" in navigator)) {
    logger.info("Haptic feedback not supported");
    return;
  }

  const interactiveElements = document.querySelectorAll<HTMLElement>(
    "button, .cta-primary, .cta-secondary, .nav-link, .accordion-btn"
  );

  interactiveElements.forEach((element) => {
    element.addEventListener(
      "click",
      () => {
        // Vibração sutil de 10ms
        navigator.vibrate(10);
      },
      { passive: true }
    );
  });

  logger.info(`Haptic feedback enabled for ${interactiveElements.length} elements`);
};
