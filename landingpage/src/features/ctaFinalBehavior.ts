import { logger } from "../utils/logger";

/**
 * CTA FINAL BEHAVIOR
 *
 * Implementa comportamento similar ao HERO:
 * - A seção inicia normal durante scroll
 * - Ao atingir viewport, começa a escalar e fixar (sticky)
 * - Completa a escala até ocupar 100% da tela
 * - Fica pinada/fixa enquanto o usuário não scroll mais
 */

export const initCtaFinalBehavior = () => {
  // Ensure we have a wrapper and lock container similar to hero structure.
  let wrapper = document.querySelector<HTMLElement>(".cta-final-stage");
  let lockContainer = document.querySelector<HTMLElement>(".cta-final-lock");
  const ctaFinal = document.querySelector<HTMLElement>(".cta-final");

  if (!ctaFinal) {
    logger.warn("CTA Final section (.cta-final) not found");
    return () => {};
  }

  // If wrapper/lock are missing, create them and move the CTA inside
  if (!wrapper || !lockContainer) {
    wrapper = wrapper ?? document.createElement("div");
    wrapper.className = "cta-final-stage";
    lockContainer = lockContainer ?? document.createElement("div");
    lockContainer.className = "cta-final-lock";
    // Replace CTA Final element with wrapper->lock->ctaFinal structure
    ctaFinal.parentNode?.insertBefore(wrapper, ctaFinal);
    wrapper.appendChild(lockContainer);
    lockContainer.appendChild(ctaFinal);
  }

  // If both classes were applied to the same element (merged wrapper/lock),
  // make the structure explicit by injecting a proper wrapper.
  // This helps recover from accidental DOM simplifications.
  if (wrapper && lockContainer && wrapper.isSameNode(lockContainer)) {
    const existingLock = lockContainer;
    const newWrapper = document.createElement("div");
    newWrapper.className = "cta-final-stage";
    existingLock.parentNode?.insertBefore(newWrapper, existingLock);
    newWrapper.appendChild(existingLock);
    // update references so remaining logic operates correctly
    wrapper = newWrapper;
    lockContainer = existingLock;
  }

  // Para o footer funcionar, ainda precisamos de uma flag “pinned”.
  // IMPORTANTE: essa flag só deve ativar quando o CTA já estiver 100% (full-screen).
  // Como o CTA usa o HERO invertido, full-screen => heroProgressForCta ~ 0.
  // Usamos histerese em cima do heroProgressForCta para evitar flicker.
  const FULLSCREEN_EPS_ON = 0.004;
  const FULLSCREEN_EPS_OFF = 0.02;

  // Estado de progresso (0 a 1)
  let collapseProgress = 0;
  let ctaFinalPinned = false;

  const updateCtaFinalProgress = () => {
    // === Modelo idêntico ao HERO ===
    // O HERO usa:
    // range = stageHeight - innerHeight
    // progress = clamp((scrollY - stageTop) / range)
    // Isso evita “crescer antes do topo” e mantém progressão estável e previsível.
    const stageHeight = wrapper.offsetHeight;
    const stageTop = wrapper.offsetTop;
    const range = Math.max(stageHeight - window.innerHeight, 1);
    const scrollY = window.scrollY;
    const clampedScroll = Math.min(Math.max(scrollY - stageTop, 0), range);
    const rawProgress = clampedScroll / range;

    // Progresso linear (0..1) baseado no scroll dentro do stage.
    collapseProgress = Math.max(0, Math.min(1, rawProgress));

    // Para o CTA, o comportamento desejado é o inverso do HERO:
    // - Scroll para baixo (collapseProgress sobe) => CTA CRESCE/abre
    // - Scroll para cima (collapseProgress desce) => CTA DIMINUI/fecha
    // O CSS do HERO interpreta progress=0 como “aberto” e progress=1 como “colapsado”.
    // Então, usamos (1 - collapseProgress) como variável local.
    const heroProgressForCta = Math.max(0, Math.min(1, 1 - collapseProgress));

    const isCtaFullScreen = ctaFinalPinned
      ? heroProgressForCta <= FULLSCREEN_EPS_OFF
      : heroProgressForCta <= FULLSCREEN_EPS_ON;

    // Importante: o CSS do HERO lê --hero-collapse-progress.
    // Setamos no lock do CTA (escopo local), evitando mexer no HERO real.
    lockContainer.style.setProperty(
      "--hero-collapse-progress",
      heroProgressForCta.toFixed(4),
    );

    // Adicionar/remover classe para estado pinned (usado pelo footer)
    // A fonte de verdade aqui é: CTA em full-screen (com histerese).
    const isPinned = isCtaFullScreen;

    // Removemos fallback de sticky porque pode ativar pinned cedo demais.
    if (isPinned && !ctaFinalPinned) {
      ctaFinalPinned = true;
      lockContainer.classList.add("cta-final-pinned");
      document.body.classList.add("cta-final-pinned");
    } else if (!isPinned && ctaFinalPinned) {
      ctaFinalPinned = false;
      lockContainer.classList.remove("cta-final-pinned");
      document.body.classList.remove("cta-final-pinned");
    }
  };

  // Event listener com passive: true para melhor performance
  // Throttle via requestAnimationFrame for smoother updates
  let rafId: number | null = null;
  const handleScroll = () => {
    if (rafId) return; // drop if animation frame already scheduled
    rafId = requestAnimationFrame(() => {
      updateCtaFinalProgress();
      rafId = null;
    });
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleScroll, { passive: true });

  // Calcular inicial
  updateCtaFinalProgress();

  // Return disposer
  return () => {
    try {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    } catch (err) {
      logger.error("Error cleaning up CTA Final behavior", err);
    }
  };
};
