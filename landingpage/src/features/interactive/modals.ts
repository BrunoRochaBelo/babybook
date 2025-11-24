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
      const exitPopupClose = exitPopup.querySelector(".exit-popup-close");
      const exitPopupOverlay = exitPopup.querySelector(".exit-popup-overlay");
      const exitPopupForm = document.getElementById(
        "exit-popup-form",
      ) as HTMLFormElement;

      setInterval(() => {
        timeOnSite += 1;
      }, 1000);

      window.addEventListener("scroll", () => {
        const scrollPercent =
          (window.pageYOffset /
            (document.documentElement.scrollHeight - window.innerHeight)) *
          100;
        if (scrollPercent > CONFIG.exitIntent.scrollThreshold) {
          hasScrolledPast50 = true;
        }
      });

      const pricingSection = document.getElementById("pricing");
      if (pricingSection) {
        const pricingObserver = new IntersectionObserver(
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

      document.addEventListener("mouseleave", (e) => {
        if (e.clientY <= 0 && shouldShowPopup() && exitPopup) {
          showExitPopup();
        }
      });

      setTimeout(() => {
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

      exitPopupClose?.addEventListener("click", () => {
        hideExitPopup();
        trackEvent({ category: "Exit Intent", action: "popup_closed" });
      });

      exitPopupOverlay?.addEventListener("click", () => {
        hideExitPopup();
        trackEvent({ category: "Exit Intent", action: "popup_closed_overlay" });
      });

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

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !exitPopup.classList.contains("hidden")) {
          hideExitPopup();
          trackEvent({ category: "Exit Intent", action: "popup_closed_esc" });
        }
      });

      logger.info("Exit Intent initialized");
    },
    "Exit Intent: #exit-popup not found",
  );
};
