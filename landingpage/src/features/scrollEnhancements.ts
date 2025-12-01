import { logger, withElement } from "../utils/logger";

// === PREMIUM: Scroll Indicator ===
export const initScrollIndicator = () => {
  return withElement(
    ".hero-section",
    (heroSection) => {
      // Cria indicador de scroll
      const indicator = document.createElement("div");
      indicator.className = "scroll-indicator";
      indicator.setAttribute("aria-label", "Role para ver mais");
      indicator.innerHTML = `
        <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      `;

      heroSection.appendChild(indicator);

      // Esconde indicador após primeiro scroll
      let hasScrolled = false;
      const handleScroll = () => {
        if (!hasScrolled && window.pageYOffset > 100) {
          hasScrolled = true;
          indicator.classList.add("hidden");
          window.removeEventListener("scroll", handleScroll);
        }
      };

      window.addEventListener("scroll", handleScroll, { passive: true });

      logger.info("Scroll indicator initialized");

      // Return disposer
      return () => {
        try {
          indicator.remove();
          window.removeEventListener("scroll", handleScroll);
        } catch (err) {
          logger.warn("Failed to dispose scroll indicator", err);
        }
      };
    },
    "Scroll indicator: .hero-section not found",
  );
};

// === PREMIUM: Pause Animations Out of Viewport ===
export const initAnimationPauser = () => {
  // Elementos com animações pesadas que devem pausar fora do viewport
  const animatedElements = document.querySelectorAll<HTMLElement>(
    ".hero-particles, .hero-orb, .sticky-note",
  );

  if (animatedElements.length === 0) {
    logger.info("No animated elements found to pause");
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const element = entry.target as HTMLElement;

        if (entry.isIntersecting) {
          // Elemento visível - retomar animações
          element.style.animationPlayState = "running";
        } else {
          // Elemento fora do viewport - pausar animações
          element.style.animationPlayState = "paused";
        }
      });
    },
    {
      root: null,
      rootMargin: "50px", // Margem para começar a animar antes de entrar
      threshold: 0.1,
    },
  );

  animatedElements.forEach((element) => {
    observer.observe(element);
  });

  logger.info(`Animation pauser observing ${animatedElements.length} elements`);
  // Return disposer to disconnect
  return () => {
    try {
      observer.disconnect();
      animatedElements.forEach((element) => {
        element.style.animationPlayState = "running";
      });
    } catch (err) {
      logger.warn("Failed to dispose animation pauser", err);
    }
  };
};
