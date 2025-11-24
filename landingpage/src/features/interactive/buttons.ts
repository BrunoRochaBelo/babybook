import { trackEvent } from "../../utils/analytics";

// === LOADING STATES NOS BOTÕES + ANALYTICS ===
export const setupButtonLoading = () => {
  const ctaButtons = document.querySelectorAll(".cta-primary, .cta-secondary");

  ctaButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const btn = e.currentTarget as HTMLElement;
      const btnText = btn.textContent?.trim() || "CTA";
      const isHero = btn.closest("section")?.classList.contains("relative");

      trackEvent({
        category: "CTA",
        action: "click",
        label: btnText,
        value: isHero ? 1 : 0,
      });

      btn.classList.add("btn-loading");

      setTimeout(() => {
        btn.classList.remove("btn-loading");
      }, 2000);
    });
  });
};

// === LAZY LOADING DE IMAGENS ===
export const setupLazyLoading = () => {
  const imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const container = img.closest(".lazy-image") as HTMLElement;

          if (img.dataset.src) {
            img.src = img.dataset.src;

            img.onload = () => {
              container?.classList.remove("loading");
              container?.classList.add("loaded");
            };
          }

          imageObserver.unobserve(img);
        }
      });
    },
    {
      rootMargin: "50px",
      threshold: 0.01,
    },
  );

  document.querySelectorAll(".lazy-image img").forEach((img) => {
    imageObserver.observe(img);
  });
};
