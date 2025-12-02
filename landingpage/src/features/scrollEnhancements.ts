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
      // Inline SVGs for arrows (accessible, decorative)
      const downArrowSvg = `
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
          <path d="M12 5v14"></path>
          <path d="M19 13l-7 7-7-7"></path>
        </svg>
      `;
      const labelText = isTouchDevice
        ? "Deslize para navegar"
        : "Role para navegar";
      idleIndicator.innerHTML = `<span class="idle-label">${labelText}</span><span class="arrow" aria-hidden="true">${downArrowSvg}</span>`;
      // Append to body initially (fixed) and we'll move it into the active section's sticky wrapper when appropriate
      idleIndicator.style.position = "fixed";
      document.body.appendChild(idleIndicator);

      // Helper: move indicator to the active section's sticky-wrapper if present, otherwise keep on body
      function positionIndicatorForSection(section: HTMLElement | null) {
        const currentParent = idleIndicator.parentElement;
        const wrapper = section?.querySelector(".sticky-wrapper") || null;
        if (wrapper) {
          // attach to wrapper and use absolute positioning so it travels with the section
          if (currentParent !== wrapper) {
            idleIndicator.style.position = "absolute";
            wrapper.appendChild(idleIndicator);
          }
        } else {
          // fallback to body (fixed)
          if (currentParent !== document.body) {
            idleIndicator.style.position = "fixed";
            document.body.appendChild(idleIndicator);
          }
        }
      }

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
      let removalTimer: number | null = null;
      const IDLE_TIMEOUT = 6000; // ms - time before indicator appears
      const ANIMATION_TRIGGER_TIME = 10000; // ms - time before animation starts (after indicator appears)
      const ANIMATION_CYCLES = 3; // how many cycles to play for the attention animation
      const ANIMATION_DURATION = 800; // ms - single cycle duration in milliseconds
      let activeSection: HTMLElement | null = null;

      // Observe sections and footer to know which one is centered/active
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
              positionIndicatorForSection(null);
              hideIdleIndicator();
              return;
            }
            // If the footer is visible, do not set an activeSection
            if (el.classList && el.classList.contains("site-footer")) {
              activeSection = null;
              positionIndicatorForSection(null);
              hideIdleIndicator();
              return;
            }
            activeSection = el;
            // Re-position indicator to this section (if it has a sticky wrapper)
            positionIndicatorForSection(activeSection);
            resetIdleTimer();
          });
        },
        { threshold: 0.6 },
      );
      document
        .querySelectorAll("section")
        .forEach((s) => sectionObserver.observe(s));
      // Also observe footer (not a <section> element) so we can hide the indicator there
      const siteFooter = document.querySelector(".site-footer");
      if (siteFooter) sectionObserver.observe(siteFooter);
      // Observe footer with a low threshold to hide indicator as soon as footer appears
      let footerObserver: IntersectionObserver | null = null;
      if (siteFooter) {
        footerObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                // hide indicator immediately when footer becomes visible at all
                activeSection = null;
                positionIndicatorForSection(null);
                hideIdleIndicator();
              }
            });
          },
          { threshold: 0.01 },
        );
        footerObserver.observe(siteFooter);
      }

      function isFooterVisible() {
        const sfoot = document.querySelector<HTMLElement>(".site-footer");
        if (!sfoot) return false;
        const rect = sfoot.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      }

      function showIdleIndicator() {
        if (!idleIndicator) return;
        // only show if activeSection exists and the document is scrollable
        if (!activeSection) return;
        const docHeight =
          document.documentElement.scrollHeight || document.body.scrollHeight;
        if (docHeight <= window.innerHeight) return; // no scrolling possible
        // don't show if footer is visible (even partially)
        if (isFooterVisible()) return;
        idleIndicator.classList.add("visible");
        idleIndicator.classList.remove("attention");
        // Schedule animation trigger after 10s of indicator being visible
        if (animationTimer) window.clearTimeout(animationTimer);
        // Prepare inline animation with configured cycles and duration (CSS var)
        idleIndicator.style.setProperty(
          "--idle-animation",
          `indicator-pulse ${ANIMATION_DURATION / 1000}s ease-in-out ${ANIMATION_CYCLES}`,
        );
        animationTimer = window.setTimeout(() => {
          if (idleIndicator && idleIndicator.classList.contains("visible")) {
            idleIndicator.classList.add("attention");
            // Remove attention class after the configured animation cycles have played
            if (removalTimer) window.clearTimeout(removalTimer);
            removalTimer = window.setTimeout(() => {
              if (idleIndicator) {
                idleIndicator.classList.remove("attention");
                removalTimer = null;
              }
            }, ANIMATION_CYCLES * ANIMATION_DURATION);
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
        if (removalTimer) {
          window.clearTimeout(removalTimer);
          removalTimer = null;
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
          if (removalTimer) window.clearTimeout(removalTimer);
          sectionObserver.disconnect();
          if (footerObserver) footerObserver.disconnect();
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
