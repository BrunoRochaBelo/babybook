import { CONFIG } from "../utils/config";
import { logger, withElement } from "../utils/logger";
import { createScrollThrottle } from "../utils/helpers";

// === NAV - Scroll behavior com hide/show ===
export const initNavigation = () => {
  withElement(
    ".nav-header",
    (nav) => {
      let lastScroll = 0;

      const handleScroll = () => {
        const currentScroll = window.pageYOffset;

        // Adiciona classe scrolled após threshold configurável
        if (currentScroll > CONFIG.scroll.navScrolledThreshold) {
          nav.classList.add("scrolled");
        } else {
          nav.classList.remove("scrolled");
        }

        // Hide/Show baseado APENAS na direção do scroll
        if (
          currentScroll > lastScroll &&
          currentScroll > CONFIG.scroll.navHideThreshold
        ) {
          // Scrollando para baixo - esconder
          nav.classList.add("nav-hidden");
        } else if (currentScroll < lastScroll) {
          // Scrollando para cima - mostrar
          nav.classList.remove("nav-hidden");
        }

        lastScroll = currentScroll;
      };

      const throttledScroll = createScrollThrottle(handleScroll);
      window.addEventListener("scroll", throttledScroll, { passive: true });

      logger.info("Navigation initialized");
    },
    "Navigation: .nav-header not found",
  );
};
