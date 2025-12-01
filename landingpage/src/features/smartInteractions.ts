import { logger } from "../utils/logger";

// === PREMIUM: Prefetch de Próxima Página ===
export const setupSmartPrefetch = () => {
  const ctaButtons = document.querySelectorAll<HTMLAnchorElement>(
    'a[href*="pricing"], a[href*="signup"], .cta-primary',
  );
  if (!ctaButtons.length) {
    logger.info("Smart prefetch: no CTA buttons found");
    return null;
  }

  const cleanupFns: Array<() => void> = [];
  const injectedLinks: HTMLLinkElement[] = [];

  ctaButtons.forEach((button) => {
    let prefetched = false;

    const prefetchHandler = () => {
      if (prefetched) return;

      const href = button.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = href;
      link.as = "document";
      document.head.appendChild(link);
      injectedLinks.push(link);
      prefetched = true;

      logger.info(`Prefetched: ${href}`);
    };

    button.addEventListener("mouseenter", prefetchHandler, { once: true });
    cleanupFns.push(() =>
      button.removeEventListener("mouseenter", prefetchHandler),
    );
    button.addEventListener("touchstart", prefetchHandler, {
      once: true,
      passive: true,
    });
    cleanupFns.push(() =>
      button.removeEventListener("touchstart", prefetchHandler),
    );
  });

  logger.info("Smart prefetch initialized");

  return () => {
    cleanupFns.forEach((fn) => fn());
    injectedLinks.forEach((link) => link.remove());
    logger.info("Smart prefetch disposed");
  };
};

// === PREMIUM: Haptic Feedback (Mobile) ===
export const setupHapticFeedback = () => {
  if (!("vibrate" in navigator)) {
    logger.info("Haptic feedback not supported");
    return null;
  }

  const interactiveElements = document.querySelectorAll<HTMLElement>(
    "button, .cta-primary, .cta-secondary, .nav-link, .accordion-btn",
  );
  if (!interactiveElements.length) {
    logger.info("Haptic feedback: no interactive elements found");
    return null;
  }

  const handlers: Array<() => void> = [];

  interactiveElements.forEach((element) => {
    const listener = () => {
      navigator.vibrate(10);
    };
    element.addEventListener("click", listener, { passive: true });
    handlers.push(() => element.removeEventListener("click", listener));
  });

  logger.info(
    `Haptic feedback enabled for ${interactiveElements.length} elements`,
  );

  return () => {
    handlers.forEach((fn) => fn());
    logger.info("Haptic feedback disposed");
  };
};
