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

  // Configuration constants to make the behavior easy to tweak - we support 'variants'
  const ctaVariant = (wrapper?.dataset?.ctaVariant ||
    lockContainer?.dataset?.ctaVariant ||
    ctaFinal?.dataset?.ctaVariant ||
    "hero") as string;
  const VARIANTS: Record<
    string,
    {
      PIN_THRESHOLD: number;
      EASING_EXPONENT: number;
      SNAP_OVERSHOOT: number;
      SNAP_DURATION: number;
    }
  > = {
    soft: {
      PIN_THRESHOLD: 0.92,
      EASING_EXPONENT: 1.6,
      SNAP_OVERSHOOT: 1.02,
      SNAP_DURATION: 300,
    },
    hero: {
      PIN_THRESHOLD: 0.88,
      EASING_EXPONENT: 2.2,
      SNAP_OVERSHOOT: 1.035,
      SNAP_DURATION: 420,
    },
    punch: {
      PIN_THRESHOLD: 0.85,
      EASING_EXPONENT: 2.8,
      SNAP_OVERSHOOT: 1.06,
      SNAP_DURATION: 520,
    },
  };
  const VAR = VARIANTS[ctaVariant] ?? VARIANTS.hero;
  const PIN_THRESHOLD = VAR.PIN_THRESHOLD;
  const EASING_EXPONENT = VAR.EASING_EXPONENT;
  const SNAP_OVERSHOOT = VAR.SNAP_OVERSHOOT;
  const SNAP_DURATION = VAR.SNAP_DURATION;

  // Estado de progresso (0 a 1)
  let collapseProgress = 0;
  let ctaFinalPinned = false;
  let snappedOnce = false;

  const updateCtaFinalProgress = () => {
    const wrapperRect = wrapper.getBoundingClientRect();

    // Calcular progresso com base na posição do wrapper
    // Quando o topo do wrapper atinge o topo da viewport
    // começamos a contar o progresso
    // Use a trigger range so the collapse progress feels similar to the hero.
    // start when wrapper top enters viewport and ends when wrapper top reaches the top.
    const triggerStart = window.innerHeight; // begins when wrapper enters bottom of viewport
    const triggerEnd = 0; // ends when top of wrapper reaches top of viewport

    let progress = 0;

    if (wrapperRect.top <= triggerStart && wrapperRect.top >= triggerEnd) {
      // Calcular progresso: 0 quando wrapper acaba de entrar, 1 quando está no topo
      progress = 1 - wrapperRect.top / triggerStart;
      progress = Math.max(0, Math.min(1, progress));
    } else if (wrapperRect.top < triggerEnd) {
      // Se passou além, mantém em 1
      progress = 1;
    }

    // Apply a gentle ease to make the growth nonlinear like the HERO
    // We use a pow curve similar to the hero; exponent is adjustable above
    // Add a small offset to make the animation feel more responsive at the start
    const eased = 1 - Math.pow(1 - progress, EASING_EXPONENT);
    const responsiveEased = progress < 0.1 ? progress * 2 : eased;
    // Add a subtle bounce effect near completion for more impact
    const bounceEffect =
      progress > 0.85 ? Math.sin((progress - 0.85) * 20) * 0.02 : 0;
    collapseProgress = Math.min(1, responsiveEased + bounceEffect);

    // Aplicar transformação
    lockContainer.style.setProperty(
      "--cta-collapse-progress",
      String(collapseProgress),
    );

    // Adicionar/remover classe para estado pinned
    let isPinned = collapseProgress >= PIN_THRESHOLD;

    // Fallback: se por algum motivo o `collapseProgress` não atinge o limiar
    // mas o lock está efetivamente colado no topo (position: sticky),
    // reconhecer como pinned usando a posição do lock.
    if (!isPinned) {
      try {
        const lockRect = lockContainer.getBoundingClientRect();
        const nearTop = lockRect.top <= 2; // pequena tolerância
        // Se o lock ocupa praticamente toda a viewport verticalmente e está no topo
        const fullHeight = Math.abs(lockRect.height - window.innerHeight) <= 2;
        if (nearTop && fullHeight) {
          isPinned = true;
        }
      } catch (err) {
        // ignore errors; keep computed isPinned
      }
    }
    if (isPinned && !ctaFinalPinned) {
      ctaFinalPinned = true;
      lockContainer.classList.add("cta-final-pinned");
      document.body.classList.add("cta-final-pinned");
      // Trigger snap overshoot animation once on pin
      if (!snappedOnce) {
        snappedOnce = true;
        const ctaEl = lockContainer.querySelector<HTMLElement>(".cta-final");
        if (ctaEl) {
          // set CSS vars used by animation
          ctaEl.style.setProperty("--cta-snap-scale", String(SNAP_OVERSHOOT));
          ctaEl.style.setProperty("--cta-snap-duration", `${SNAP_DURATION}ms`);
          ctaEl.classList.add("cta-final-snapped");
          // Remove class and CSS vars after animation completes
          const cleanupSnap = () => {
            ctaEl.classList.remove("cta-final-snapped");
            ctaEl.style.removeProperty("--cta-snap-scale");
            ctaEl.style.removeProperty("--cta-snap-duration");
            ctaEl.removeEventListener("animationend", cleanupSnap);
          };
          ctaEl.addEventListener("animationend", cleanupSnap, { once: true });
        }
      }
    } else if (!isPinned && ctaFinalPinned) {
      ctaFinalPinned = false;
      lockContainer.classList.remove("cta-final-pinned");
      document.body.classList.remove("cta-final-pinned");
      // Reset snappedOnce if user scrolls back up and we want to allow re-snap
      snappedOnce = false;
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
