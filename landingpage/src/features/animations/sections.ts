import { prefersReducedMotion } from "../../utils/helpers";
import { createScrollThrottle } from "../../utils/helpers";
import { easeInOutQuad } from "../../utils/helpers";
import { CONFIG } from "../../utils/config";
import { logger } from "../../utils/logger";

// === SCALE PROGRESSIVO NAS SEÇÕES ===
export const setupSectionScale = () => {
  if (prefersReducedMotion()) {
    logger.info("setupSectionScale", "Skipped (prefers-reduced-motion)");
    return;
  }

  const allSections = Array.from(
    document.querySelectorAll<HTMLElement>("section"),
  ).filter((section) => {
    const isHero =
      section.id === "hero-stage" || section.classList.contains("hero-stage");
    const isSpecial = section.classList.contains("horizontal-scroll-section");
    return !isHero && !isSpecial;
  });

  if (!allSections.length) {
    logger.warn("setupSectionScale", "No sections found");
    return;
  }

  logger.info(
    "setupSectionScale",
    `Initialized for ${allSections.length} sections`,
  );

  const updateSectionScale = () => {
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY;

    allSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top + scrollY;
      const sectionHeight = rect.height;
      const sectionCenter = sectionTop + sectionHeight / 2;
      const viewportCenter = scrollY + windowHeight / 2;

      const distance = Math.abs(sectionCenter - viewportCenter);
      const { plateauZone, maxDistanceMultiplier } =
        CONFIG.animations.sectionScale;
      const maxDistance = windowHeight * maxDistanceMultiplier;

      let normalizedDistance: number;
      if (distance < plateauZone) {
        normalizedDistance = 0;
      } else {
        normalizedDistance = Math.min(
          (distance - plateauZone) / (maxDistance - plateauZone),
          1,
        );
      }

      const { easingPower, scaleReduction, opacityReduction } =
        CONFIG.animations.sectionScale;
      const easedDistance = Math.pow(normalizedDistance, easingPower);
      const scale = 1 - easedDistance * scaleReduction;
      const opacity = 1 - easedDistance * opacityReduction;

      section.style.transform = `scale(${scale.toFixed(3)})`;
      section.style.opacity = opacity.toFixed(2);
      section.style.transformOrigin = "center center";
      section.style.transition = CONFIG.animations.sectionScale.transition;

      // Animação específica para a seção Futuro: Arredondar bordas ao sair do foco
      if (section.classList.contains("future-parallax")) {
        const maxBorderRadius = 48;
        const borderRadius = easedDistance * maxBorderRadius;
        section.style.borderRadius = `${borderRadius.toFixed(0)}px`;
        // Adiciona transição de border-radius mantendo a transição base
        section.style.transition = `${CONFIG.animations.sectionScale.transition}, border-radius 1.2s cubic-bezier(0.19, 1, 0.22, 1)`;
      }

      if (scale >= 0.98) {
        section.classList.add("section-ready");
        section.classList.add("scale-sticky");
      } else {
        section.classList.remove("section-ready");
        section.classList.remove("scale-sticky");
      }
    });
  };

  const throttledUpdate = createScrollThrottle(updateSectionScale);

  updateSectionScale();
  window.addEventListener("scroll", throttledUpdate, { passive: true });
  window.addEventListener("resize", updateSectionScale);
};

// === ANIMAÇÃO DA TIMELINE ===
export const setupTimelineAnimation = () => {
  if (prefersReducedMotion()) {
    logger.info("setupTimelineAnimation", "Skipped (prefers-reduced-motion)");
    return;
  }

  const timelineSection = document.querySelector(
    "#how-it-works-section",
  ) as HTMLElement;
  if (!timelineSection) {
    logger.warn("setupTimelineAnimation", "Timeline section not found");
    return;
  }

  const steps = Array.from(
    timelineSection.querySelectorAll(".step-item"),
  ) as HTMLElement[];
  if (!steps.length) {
    logger.warn("setupTimelineAnimation", "No step items found");
    return;
  }

  logger.info(
    "setupTimelineAnimation",
    `Initialized for ${steps.length} steps`,
  );

  let animationStarted = false;
  let currentStep = 0;

  const activateStep = (index: number) => {
    if (index >= steps.length) return;

    const step = steps[index];
    step.classList.add("active");
    logger.debug("setupTimelineAnimation", `Activated step ${index + 1}`);

    setTimeout(() => {
      currentStep++;
      if (currentStep < steps.length) {
        activateStep(currentStep);
      }
    }, CONFIG.animations.timeline.stepDelay);
  };

  const checkSectionReady = () => {
    if (animationStarted) return;

    if (timelineSection.classList.contains("section-ready")) {
      animationStarted = true;
      setTimeout(() => {
        activateStep(0);
      }, CONFIG.animations.timeline.initialDelay);
    }
  };

  const intervalId = setInterval(() => {
    checkSectionReady();
    if (animationStarted) {
      clearInterval(intervalId);
    }
  }, CONFIG.animations.timeline.checkInterval);

  setTimeout(
    () => clearInterval(intervalId),
    CONFIG.animations.timeline.maxWait,
  );
};

// === SURFACE OBSERVER ===
export const setupSurfaceObserver = () => {
  const surfaces = document.querySelectorAll<HTMLElement>(
    ".section-surface, .hero-section",
  );
  if (!surfaces.length) {
    logger.warn("setupSurfaceObserver", "No surfaces found");
    return;
  }

  logger.info("setupSurfaceObserver", `Observing ${surfaces.length} surfaces`);

  const surfaceObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("surface-active", entry.isIntersecting);
      });
    },
    { threshold: CONFIG.animations.surfaceObserver.threshold },
  );

  surfaces.forEach((surface) => surfaceObserver.observe(surface));
};

// === PARALLAX SECTIONS ===
export const setupParallaxSections = () => {
  if (prefersReducedMotion()) {
    logger.info("setupParallaxSections", "Skipped (prefers-reduced-motion)");
    return;
  }

  const sections = document.querySelectorAll<HTMLElement>(
    "[data-parallax-section]",
  );
  if (!sections.length) {
    logger.warn("setupParallaxSections", "No parallax sections found");
    return;
  }

  logger.info(
    "setupParallaxSections",
    `Initialized for ${sections.length} sections`,
  );

  const updateLayers = () => {
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const sectionCenter = rect.top + rect.height / 2;
      const delta = sectionCenter - window.innerHeight / 2;
      const layers = section.querySelectorAll<HTMLElement>(
        "[data-parallax-depth]",
      );

      layers.forEach((layer) => {
        const depth = parseFloat(
          layer.dataset.parallaxDepth ||
            String(CONFIG.animations.parallax.defaultDepth),
        );
        const movement =
          -(delta / window.innerHeight) *
          depth *
          CONFIG.animations.parallax.movementMultiplier;
        layer.style.transform = `translate3d(0, ${movement}px, 0)`;
      });
    });
  };

  const throttledUpdate = createScrollThrottle(updateLayers);

  updateLayers();
  window.addEventListener("scroll", throttledUpdate, { passive: true });
  window.addEventListener("resize", updateLayers);
};

// === ANIMAÇÃO DA LISTA DE PREÇOS ===
export const setupPricingListAnimation = () => {
  if (prefersReducedMotion()) {
    logger.info(
      "setupPricingListAnimation",
      "Skipped (prefers-reduced-motion)",
    );
    return;
  }

  const pricingSection = document.querySelector("#pricing") as HTMLElement;
  if (!pricingSection) {
    logger.warn("setupPricingListAnimation", "Pricing section not found");
    return;
  }

  const listItems = Array.from(
    pricingSection.querySelectorAll(".pricing-list-item"),
  ) as HTMLElement[];
  if (!listItems.length) {
    logger.warn("setupPricingListAnimation", "No pricing list items found");
    return;
  }

  logger.info(
    "setupPricingListAnimation",
    `Initialized for ${listItems.length} items`,
  );

  const updateVisibility = () => {
    const rect = pricingSection.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const sectionHeight = rect.height;

    // Calcula o progresso baseado na posição da seção na viewport
    // A animação começa quando o topo da seção entra na viewport
    // e termina quando o fundo da seção sai da viewport
    const sectionTop = rect.top;

    // Define os pontos de início e fim da animação com movimento contínuo
    const animationStart = windowHeight * 0.8; // Começa um pouco antes da seção ficar totalmente visível
    const animationEnd = -sectionHeight * 0.5; // Termina bem depois da seção sair da viewport

    // Calcula o progresso sem limitar em 1.0 para movimento contínuo
    let progress = Math.max(
      0,
      (animationStart - sectionTop) / (animationStart - animationEnd),
    );

    // Limita o progresso para evitar valores extremos, mas permite ir além de 1.0
    progress = Math.min(progress, 2.0); // Permite até 2 voltas completas

    // Calcula progresso separado para itens (linear) e gradiente (com easing)
    const linearProgress = Math.min(progress, 1.0); // Progresso linear para itens (0-1)
    const easedProgress =
      easeInOutQuad(Math.min(progress, 1.0)) * (progress > 1.0 ? 2.0 : 1.0); // Progresso com easing para gradiente

    // Calcula quantos itens devem estar visíveis baseado no progresso linear (intervalos uniformes)
    const totalItems = listItems.length;
    const visibleItems = Math.floor(linearProgress * totalItems);

    // Calcula a posição do gradiente usando o progresso com easing para movimento mais dramático
    const angle = easedProgress * 2 * Math.PI; // Movimento completo sem offset inicial
    const radius = 80; // Raio ainda maior para movimento dramático nas bordas
    const centerX = 50; // Centro horizontal
    const centerY = 50; // Centro vertical

    // Calcula posição sem limitações para movimento completo de 360º
    const gradientX = centerX + radius * Math.cos(angle);
    const gradientY = centerY + radius * Math.sin(angle);

    // Atualiza as variáveis CSS para o movimento do gradiente
    pricingSection.style.setProperty("--gradient-x", `${gradientX}%`);
    pricingSection.style.setProperty("--gradient-y", `${gradientY}%`);

    // Atualiza a visibilidade de cada item
    listItems.forEach((item, index) => {
      if (index < visibleItems) {
        // Item deve estar visível
        item.classList.remove("opacity-0", "translate-y-4");
        item.classList.add("opacity-100", "translate-y-0");
      } else {
        // Item deve estar oculto
        item.classList.remove("opacity-100", "translate-y-0");
        item.classList.add("opacity-0", "translate-y-4");
      }
    });
  };

  const throttledUpdate = createScrollThrottle(updateVisibility);

  // Atualiza inicialmente
  updateVisibility();

  window.addEventListener("scroll", throttledUpdate, { passive: true });
  window.addEventListener("resize", updateVisibility);
};
