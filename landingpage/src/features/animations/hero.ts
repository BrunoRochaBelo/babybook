import { createScrollThrottle } from "../../utils/helpers";
import { prefersReducedMotion } from "../../utils/helpers";
import { logger } from "../../utils/logger";

// === HERO COLLAPSE PROGRESS ===
export const setupHeroCollapseProgress = () => {
  const heroStage = document.getElementById("hero-stage");
  if (!heroStage) {
    logger.warn("setupHeroCollapseProgress", "Hero stage not found");
    return;
  }

  const root = document.documentElement;
  logger.info("setupHeroCollapseProgress", "Initialized");

  const updateProgress = () => {
    const stageHeight = heroStage.offsetHeight;
    const stageTop = heroStage.offsetTop;
    const range = Math.max(stageHeight - window.innerHeight, 1);
    const scrollY = window.scrollY;
    const clampedScroll = Math.min(Math.max(scrollY - stageTop, 0), range);
    const rawProgress = clampedScroll / range;
    // Usando progresso linear para resposta mais direta ao scroll
    root.style.setProperty("--hero-collapse-progress", rawProgress.toFixed(4));
  };

  const throttledUpdate = createScrollThrottle(updateProgress);

  updateProgress();
  window.addEventListener("scroll", throttledUpdate, { passive: true });
  window.addEventListener("resize", updateProgress);
};

// === HERO POINTER GLOW ===
export const setupHeroPointerGlow = () => {
  const hero = document.querySelector(".hero-section");
  if (!hero) {
    logger.warn("setupHeroPointerGlow", "Hero section not found");
    return;
  }

  const root = document.documentElement;
  logger.info("setupHeroPointerGlow", "Initialized");

  const updatePointerVars = (event: PointerEvent) => {
    const rect = hero.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    root.style.setProperty("--pointer-x", x.toFixed(2));
    root.style.setProperty("--pointer-y", y.toFixed(2));
  };

  hero.addEventListener("pointermove", (event) =>
    updatePointerVars(event as PointerEvent),
  );
  hero.addEventListener("pointerleave", () => {
    root.style.setProperty("--pointer-x", "50");
    root.style.setProperty("--pointer-y", "40");
  });
};

// === MAGNETIC HOVER ===
export const setupMagneticHover = () => {
  const magnets = document.querySelectorAll<HTMLElement>(".magnetic");
  if (!magnets.length) {
    logger.warn("setupMagneticHover", "No magnetic elements found");
    return;
  }

  logger.info(
    "setupMagneticHover",
    `Initialized for ${magnets.length} elements`,
  );

  magnets.forEach((magnet) => {
    const strength = parseFloat(
      magnet.dataset.magneticStrength ||
        magnet.getAttribute("data-strength") ||
        "0.15",
    );

    const handlePointerMove = (event: PointerEvent) => {
      const rect = magnet.getBoundingClientRect();
      const offsetX = event.clientX - (rect.left + rect.width / 2);
      const offsetY = event.clientY - (rect.top + rect.height / 2);

      // Limitar o deslocamento máximo para evitar movimentos exagerados
      const maxOffset = 12; // pixels
      const moveX = Math.max(
        -maxOffset,
        Math.min(maxOffset, offsetX * strength),
      );
      const moveY = Math.max(
        -maxOffset,
        Math.min(maxOffset, offsetY * strength),
      );

      magnet.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
      magnet.classList.add("is-hovering");
    };

    const reset = () => {
      magnet.style.transform = "";
      magnet.classList.remove("is-hovering");
    };

    magnet.addEventListener("pointermove", (event) =>
      handlePointerMove(event as PointerEvent),
    );
    magnet.addEventListener("pointerleave", reset);
  });
};

// === BOOK CARD TILT ===
export const setupBookCardTilt = () => {
  const cards = document.querySelectorAll<HTMLElement>(".book-card");
  if (!cards.length) {
    logger.warn("setupBookCardTilt", "No book cards found");
    return;
  }

  const maxTilt = 8;
  logger.info("setupBookCardTilt", `Initialized for ${cards.length} cards`);

  cards.forEach((card) => {
    const handlePointerMove = (event: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const relX = (event.clientX - rect.left) / rect.width;
      const relY = (event.clientY - rect.top) / rect.height;
      const tiltX = (0.5 - relY) * maxTilt;
      const tiltY = (relX - 0.5) * maxTilt;
      card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);

      const spotlightX = (relX * 100).toFixed(1);
      const spotlightY = (relY * 100).toFixed(1);
      card.style.setProperty("--spotlight-x", `${spotlightX}%`);
      card.style.setProperty("--spotlight-y", `${spotlightY}%`);
    };

    const resetTilt = () => {
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
      card.style.removeProperty("--spotlight-x");
      card.style.removeProperty("--spotlight-y");
    };

    card.addEventListener("pointermove", (event) =>
      handlePointerMove(event as PointerEvent),
    );
    card.addEventListener("pointerleave", resetTilt);
  });
};

// === INICIALIZAR ANIMAÇÕES DE HOVER ===
export const initHoverAnimations = () => {
  if (!prefersReducedMotion()) {
    setupHeroPointerGlow();
    setupMagneticHover();
    setupBookCardTilt();
  }
};
