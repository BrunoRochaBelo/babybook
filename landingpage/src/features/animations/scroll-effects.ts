import { prefersReducedMotion } from "../../utils/helpers";

// === CHAOS TO ORDER ===
export const setupChaosToOrder = () => {
  const chaosSection = document.querySelector(".chaos-container");
  const photos = document.querySelectorAll(".photo-scatter");
  const text1 = document.getElementById("chaos-text-1");
  const text2 = document.getElementById("chaos-text-2");
  const highlight = document.getElementById("chaos-highlight");

  if (!chaosSection) return;

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        ticking = false;
      });
      ticking = true;
    }
    const rect = chaosSection.getBoundingClientRect();
    const progress = Math.max(
      0,
      Math.min(1, -rect.top / (rect.height - window.innerHeight)),
    );

    // FASE 1: Texto (0.32)
    if (progress > 0.32) {
      if (highlight) {
        highlight.style.color = "#F59E0B";
        highlight.innerText = "Só precisava caber na vida real.";
      }
      if (text1) text1.classList.add("opacity-30");
      if (text2) text2.classList.remove("opacity-30");
    } else {
      if (highlight) {
        highlight.style.color = "#6B7280";
        highlight.innerText = "Só precisava caber na vida real.";
      }
      if (text1) text1.classList.remove("opacity-30");
      if (text2) text2.classList.add("opacity-30");
    }

    // FASE 2: Fotos (0.62)
    if (progress > 0.62) {
      photos.forEach((p) => p.classList.add("organized"));
    } else {
      photos.forEach((p) => p.classList.remove("organized"));
    }
  });
};

// === HORIZONTAL SCROLL & VAULT UNLOCK ===
export const setupHorizontalScroll = () => {
  const scrollSection = document.querySelector(
    ".horizontal-scroll-section",
  ) as HTMLElement;
  const track = document.querySelector(".horizontal-track") as HTMLElement;
  const vaultCard = document.getElementById("vault-card");

  if (!scrollSection || !track || !vaultCard) return;

  let ticking2 = false;
  window.addEventListener("scroll", () => {
    if (!ticking2) {
      window.requestAnimationFrame(() => {
        ticking2 = false;
      });
      ticking2 = true;
    }
    const rect = scrollSection.getBoundingClientRect();
    const sectionHeight = scrollSection.offsetHeight - window.innerHeight;
    const rawPercentage = Math.max(0, Math.min(1, -rect.top / sectionHeight));

    let movePercentage = 0;

    if (rawPercentage < 0.68) {
      const normalized = rawPercentage / 0.68;
      movePercentage = 1 - Math.pow(1 - normalized, 3);
    } else {
      movePercentage = 1;
    }

    const moveAmount = movePercentage * (track.scrollWidth - window.innerWidth);
    track.style.transform = `translateX(-${moveAmount}px)`;

    const lockIcon = vaultCard.querySelector(
      ".vault-locked .text-5xl",
    ) as HTMLElement;

    // Fase 2: Destrancar (68% a 90%)
    if (rawPercentage > 0.68 && rawPercentage <= 0.9) {
      if (lockIcon) lockIcon.classList.remove("animate-bounce");

      const tension = (rawPercentage - 0.68) / 0.22;
      const shake = tension * 5;
      const randomX = (Math.random() - 0.5) * shake;
      const randomY = (Math.random() - 0.5) * shake;
      const scale = 1 - tension * 0.1;

      if (lockIcon) {
        lockIcon.style.transform = `translate(${randomX}px, ${randomY}px) scale(${scale})`;
      }
    } else if (rawPercentage <= 0.68) {
      vaultCard.classList.remove("is-unlocked");
      if (lockIcon) {
        lockIcon.style.transform = "none";
        lockIcon.classList.add("animate-bounce");
      }
    }

    // Fase 3: Abrir (90% a 100%)
    if (rawPercentage > 0.9) {
      vaultCard.classList.add("is-open");
      const lockedState = vaultCard.querySelector(
        ".vault-locked",
      ) as HTMLElement;
      if (lockedState) lockedState.style.opacity = "0";
      if (lockIcon) lockIcon.style.transform = "scale(1.2)";
    } else {
      vaultCard.classList.remove("is-open");
      const lockedState = vaultCard.querySelector(
        ".vault-locked",
      ) as HTMLElement;
      if (lockedState) lockedState.style.opacity = "1";
    }
  });
};

// === TIMELINE DRAW ON SCROLL ===
export const setupTimelineDraw = () => {
  const timelineSection = document.getElementById("how-it-works-section");
  const timelineContainer = document.getElementById("timeline-container");
  const progressBar = document.getElementById("timeline-progress");
  const stepItems = document.querySelectorAll(".step-item");
  const timelineBackground = document.querySelector(
    ".timeline-background",
  ) as HTMLElement;

  if (!timelineSection || !timelineContainer || !progressBar) return;

  let ticking3 = false;
  window.addEventListener("scroll", () => {
    if (!ticking3) {
      window.requestAnimationFrame(() => {
        ticking3 = false;
      });
      ticking3 = true;
    }
    const sectionRect = timelineSection.getBoundingClientRect();
    const sectionHeight = timelineSection.offsetHeight - window.innerHeight;

    const sectionProgress = Math.max(
      0,
      Math.min(1, -sectionRect.top / sectionHeight),
    );

    if (timelineBackground) {
      const parallaxY = sectionProgress * 100;
      timelineBackground.style.transform = `translateY(${parallaxY}px) scale(${1 + sectionProgress * 0.1})`;
    }

    let timelinePercentage = Math.min(100, (sectionProgress / 0.86) * 100);
    progressBar.style.height = `${timelinePercentage}%`;

    const containerHeight = timelineContainer.offsetHeight;
    stepItems.forEach((item, index) => {
      const itemTop = (item as HTMLElement).offsetTop;
      const currentLineHeight = (timelinePercentage / 100) * containerHeight;

      if (currentLineHeight >= itemTop - 50) {
        item.classList.add("active");
        const circle = item.querySelector(".step-circle");
        if (circle) {
          circle.classList.remove("border-gray-300", "text-gray-500");
          circle.classList.add("border-indigo-600", "text-ink");
        }
        const textContainer = item.querySelector("div:last-child");
        if (textContainer) {
          const title = textContainer.querySelector("h3");
          const description = textContainer.querySelector("p");
          if (title) {
            title.classList.remove("text-gray-500");
            title.classList.add("text-ink");
          }
          if (description) {
            description.classList.remove("text-gray-500");
            description.classList.add("text-gray-700");
          }
        }
      } else {
        if (index > 0) {
          item.classList.remove("active");
          const circle = item.querySelector(".step-circle");
          if (circle) {
            circle.classList.remove("border-indigo-600", "text-ink");
            circle.classList.add("border-gray-300", "text-gray-500");
          }
          const textContainer = item.querySelector("div:last-child");
          if (textContainer) {
            const title = textContainer.querySelector("h3");
            const description = textContainer.querySelector("p");
            if (title) {
              title.classList.remove("text-ink");
              title.classList.add("text-gray-500");
            }
            if (description) {
              description.classList.remove("text-gray-700");
              description.classList.add("text-gray-500");
            }
          }
        }
      }
    });
  });
};

// === OBSERVER GENÉRICO (Fade In Up) ===
export const setupScrollAnimations = () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -100px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        const parentSection = element.closest("section");

        const isSpecialSection =
          parentSection &&
          (parentSection.id === "hero-stage" ||
            parentSection.classList.contains("hero-stage") ||
            parentSection.classList.contains("horizontal-scroll-section") ||
            parentSection.classList.contains("pricing-parallax"));

        if (!parentSection || isSpecialSection) {
          element.classList.add("visible");
          observer.unobserve(element);
        } else {
          let attempts = 0;
          const maxAttempts = 30;

          const checkAndAnimate = () => {
            if (
              parentSection.classList.contains("section-ready") ||
              attempts >= maxAttempts
            ) {
              element.classList.add("visible");
              observer.unobserve(element);
            } else {
              attempts++;
              setTimeout(checkAndAnimate, 100);
            }
          };
          checkAndAnimate();
        }
      }
    });
  }, observerOptions);

  if (!prefersReducedMotion()) {
    document
      .querySelectorAll(
        ".fade-in-up, .fade-in-left, .fade-in-right, .scale-in, .rotate-in",
      )
      .forEach((el) => observer.observe(el));
  } else {
    document
      .querySelectorAll(
        ".fade-in-up, .fade-in-left, .fade-in-right, .scale-in, .rotate-in",
      )
      .forEach((el) => el.classList.add("visible"));
  }
};
