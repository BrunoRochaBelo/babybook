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

      // === Idle Scroll Indicator (global) ===
      const idleIndicator = document.createElement("div");
      idleIndicator.className = "idle-scroll-indicator";
      idleIndicator.setAttribute("aria-hidden", "true");
      // Decide message based on device (touch = mobile)
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      idleIndicator.innerHTML = isTouchDevice
        ? "Deslize para navegar <span class='arrow'>&darr;</span>"
        : "Role para navegar <span class='arrow'>&darr;</span>";
      document.body.appendChild(idleIndicator);

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

      // Idle behavior
      let idleTimer: number | null = null;
      let animationTimer: number | null = null;
      const IDLE_TIMEOUT = 6000; // ms - time before indicator appears
      const ANIMATION_TRIGGER_TIME = 10000; // ms - time before animation starts (after indicator appears)
      let activeSection: HTMLElement | null = null;

      // Observe sections to know which one is centered/active
      const sectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target as HTMLElement;
            // only consider plain sections (avoid horizontal scroll section)
            if (
              (el.classList &&
                el.classList.contains("horizontal-scroll-section")) ||
              (el.classList && el.classList.contains("hero-section"))
            ) {
              // hide idle indicator when in horizontal scroll section
              activeSection = null;
              hideIdleIndicator();
              return;
            }
            activeSection = el;
            resetIdleTimer();
          });
        },
        { threshold: 0.6 },
      );
      document
        .querySelectorAll("section")
        .forEach((s) => sectionObserver.observe(s));

      function showIdleIndicator() {
        if (!idleIndicator) return;
        // only show if activeSection exists and the document is scrollable
        if (!activeSection) return;
        const docHeight =
          document.documentElement.scrollHeight || document.body.scrollHeight;
        if (docHeight <= window.innerHeight) return; // no scrolling possible
        idleIndicator.classList.add("visible");
        idleIndicator.classList.remove("attention");
        // Schedule animation trigger after 10s of indicator being visible
        if (animationTimer) window.clearTimeout(animationTimer);
        animationTimer = window.setTimeout(() => {
          if (idleIndicator && idleIndicator.classList.contains("visible")) {
            idleIndicator.classList.add("attention");
            // Remove attention class after animation plays (one cycle only)
            setTimeout(() => {
              if (idleIndicator) {
                idleIndicator.classList.remove("attention");
              }
            }, 2400); // 3 cycles × 0.8s = 2.4s
          }
        }, ANIMATION_TRIGGER_TIME - IDLE_TIMEOUT);
      }
      function hideIdleIndicator() {
        if (!idleIndicator) return;
        idleIndicator.classList.remove("visible", "attention");
        if (animationTimer) {
          window.clearTimeout(animationTimer);
          animationTimer = null;
        }
      }
      function resetIdleTimer() {
        if (idleTimer) {
          window.clearTimeout(idleTimer);
          idleTimer = null;
        }
        hideIdleIndicator();
        idleTimer = window.setTimeout(() => {
          showIdleIndicator();
        }, IDLE_TIMEOUT);
      }

      // Reset timer on interactions
      const interactionHandler = () => {
        resetIdleTimer();
        // immediate hide on interaction
        hideIdleIndicator();
      };
      ["scroll", "wheel", "pointerdown", "touchstart", "keydown"].forEach(
        (ev) => {
          window.addEventListener(ev as any, interactionHandler, {
            passive: true,
          });
        },
      );

      // Start idle timer after init
      resetIdleTimer();

      logger.info("Scroll indicator initialized");

      // Return disposer
      return () => {
        try {
          indicator.remove();
          if (idleIndicator.parentElement) idleIndicator.remove();
          window.removeEventListener("scroll", handleScroll);
          if (idleTimer) window.clearTimeout(idleTimer);
          if (animationTimer) window.clearTimeout(animationTimer);
          sectionObserver.disconnect();
          ["scroll", "wheel", "pointerdown", "touchstart", "keydown"].forEach(
            (ev) =>
              window.removeEventListener(ev as any, interactionHandler as any),
          );
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
