import { trackEvent } from "../../utils/analytics";
import { CONFIG } from "../../utils/config";
import { logger, withElement } from "../../utils/logger";

// === EXIT INTENT POPUP ===
export const setupExitIntent = () => {
  withElement(
    "#exit-popup",
    (exitPopup) => {
      let exitIntentShown = false;
      let hasScrolledPast50 = false;
      let hasViewedPricing = false;
      let timeOnSite = 0;
      let intervalId: number | null = null;
      let showTimeoutId: number | null = null;
      let pricingObserver: IntersectionObserver | null = null;
      const exitPopupClose = exitPopup.querySelector(".exit-popup-close");
      const exitPopupOverlay = exitPopup.querySelector(".exit-popup-overlay");
      const exitPopupForm = document.getElementById(
        "exit-popup-form",
      ) as HTMLFormElement;

      intervalId = window.setInterval(() => {
        timeOnSite += 1;
      }, 1000);

      const handleScroll = () => {
        const scrollPercent =
          (window.pageYOffset /
            (document.documentElement.scrollHeight - window.innerHeight)) *
          100;
        if (scrollPercent > CONFIG.exitIntent.scrollThreshold) {
          hasScrolledPast50 = true;
        }
      };
      window.addEventListener("scroll", handleScroll, { passive: true });

      const pricingSection = document.getElementById("pricing");
      if (pricingSection) {
        pricingObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                hasViewedPricing = true;
              }
            });
          },
          { threshold: 0.5 },
        );
        pricingObserver.observe(pricingSection);
      }

      const shouldShowPopup = () => {
        return (
          (hasScrolledPast50 || hasViewedPricing) &&
          timeOnSite >= CONFIG.exitIntent.timeThreshold &&
          !exitIntentShown
        );
      };

      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0 && shouldShowPopup() && exitPopup) {
          showExitPopup();
        }
      };
      document.addEventListener("mouseleave", handleMouseLeave);

      showTimeoutId = window.setTimeout(() => {
        if (shouldShowPopup() && exitPopup) {
          showExitPopup();
        }
      }, 300000);

      function showExitPopup() {
        if (!exitPopup) return;

        exitIntentShown = true;
        exitPopup.classList.remove("hidden");
        document.body.style.overflow = "hidden";

        trackEvent({ category: "Exit Intent", action: "popup_shown" });
      }

      function hideExitPopup() {
        if (!exitPopup) return;

        exitPopup.classList.add("hidden");
        document.body.style.overflow = "";
      }

      const handlePopupClose = () => {
        hideExitPopup();
        trackEvent({ category: "Exit Intent", action: "popup_closed" });
      };
      exitPopupClose?.addEventListener("click", handlePopupClose);

      const handleOverlayClick = () => {
        hideExitPopup();
        trackEvent({ category: "Exit Intent", action: "popup_closed_overlay" });
      };
      exitPopupOverlay?.addEventListener("click", handleOverlayClick);

      exitPopupForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById(
          "exit-email",
        ) as HTMLInputElement;
        const email = emailInput?.value;

        if (email) {
          console.log("Email capturado:", email);

          trackEvent({
            category: "Exit Intent",
            action: "email_submitted",
            label: email,
          });

          const successMessage = `
        <div style="text-align: center; padding: 2rem;">
          <svg class="w-16 h-16 mx-auto text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Perfeito! 🎉</h3>
          <p class="text-gray-600">Enviamos seu cupom de 20% de desconto para <strong>${email}</strong></p>
          <p class="text-sm text-gray-500 mt-4">Verifique sua caixa de entrada (e spam também!)</p>
        </div>
      `;

          if (exitPopup) {
            const exitPopupContent = exitPopup.querySelector(
              ".exit-popup-content",
            );
            if (exitPopupContent) {
              exitPopupContent.innerHTML = successMessage;
            }
          }

          setTimeout(() => {
            hideExitPopup();
          }, 3000);
        }
      });

      const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !exitPopup.classList.contains("hidden")) {
          hideExitPopup();
          trackEvent({ category: "Exit Intent", action: "popup_closed_esc" });
        }
      };
      document.addEventListener("keydown", handleKeydown);

      logger.info("Exit Intent initialized");

      // Return disposer function to allow cleanup
      return () => {
        try {
          if (intervalId !== null) clearInterval(intervalId);
          if (showTimeoutId !== null) clearTimeout(showTimeoutId);
          if (pricingObserver) pricingObserver.disconnect();
          window.removeEventListener("scroll", handleScroll);
          document.removeEventListener("mouseleave", handleMouseLeave);
          exitPopupClose?.removeEventListener("click", handlePopupClose);
          exitPopupOverlay?.removeEventListener("click", handleOverlayClick);
          document.removeEventListener("keydown", handleKeydown);
        } catch (err) {
          logger.warn("Exit Intent cleanup failed", err);
        }
      };
    },
    "Exit Intent: #exit-popup not found",
  );
};
