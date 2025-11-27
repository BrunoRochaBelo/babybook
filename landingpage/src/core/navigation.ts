import { CONFIG } from "../utils/config";
import { logger, withElement } from "../utils/logger";
import { createScrollThrottle } from "../utils/helpers";

// === NAV - Scroll behavior com hide/show e active section detection ===
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

      // === PREMIUM: Active Section Detection ===
      initActiveSectionDetection();

      logger.info("Navigation initialized with active section detection");
    },
    "Navigation: .nav-header not found",
  );
};

// === Active Section Detection com Intersection Observer ===
const initActiveSectionDetection = () => {
  const navLinks = document.querySelectorAll<HTMLAnchorElement>(".nav-link");
  const sections = new Map<string, Element>();

  // Mapeia cada link para sua seção correspondente
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href && href.startsWith("#")) {
      const sectionId = href.substring(1);
      const section = document.getElementById(sectionId);
      if (section) {
        sections.set(sectionId, section);
      }
    }
  });

  if (sections.size === 0) {
    logger.warn("No sections found for active detection");
    return;
  }

  // Intersection Observer para detectar seção visível
  const observerOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: "-20% 0px -60% 0px", // Trigger quando seção está 20% visível do topo
    threshold: [0, 0.25, 0.5, 0.75, 1],
  };

  let currentActiveId: string | null = null;

  const observer = new IntersectionObserver((entries) => {
    // Encontra a seção mais visível
    let maxRatio = 0;
    let mostVisibleId: string | null = null;

    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
        maxRatio = entry.intersectionRatio;
        mostVisibleId = entry.target.id;
      }
    });

    // Atualiza apenas se mudou
    if (mostVisibleId !== currentActiveId) {
      currentActiveId = mostVisibleId;
      updateActiveLink(mostVisibleId, navLinks, sections);
    }
  }, observerOptions);

  // Observa todas as seções
  sections.forEach((section) => {
    observer.observe(section);
  });

  logger.info(`Observing ${sections.size} sections for active detection`);
};

// Atualiza o link ativo na navegação
const updateActiveLink = (
  activeId: string | null,
  navLinks: NodeListOf<HTMLAnchorElement>,
  sections: Map<string, Element>,
) => {
  // Verifica se a seção ativa tem um link correspondente na navegação
  const hasCorrespondingLink = activeId && sections.has(activeId);

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    const linkId = href?.substring(1);

    // Só marca como ativo se:
    // 1. A seção tem um link correspondente na navegação
    // 2. O ID do link corresponde ao ID da seção ativa
    if (hasCorrespondingLink && linkId === activeId) {
      link.classList.add("nav-link-active");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("nav-link-active");
      link.removeAttribute("aria-current");
    }
  });
};
