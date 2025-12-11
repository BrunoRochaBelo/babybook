import { logger } from "../utils/logger";

/**
 * FOOTER BEHAVIOR
 *
 * Implementa comportamento de gaveta (drawer):
 * - Footer inicia oculto
 * - Só aparece quando CTA FINAL está 100% pinado
 * - Scroll adicional faz o footer subir por cima da CTA FINAL
 * - Comportamento de "gaveta" suave
 */

export const initFooterBehavior = async () => {
  const footer = document.querySelector<HTMLElement>(".site-footer");
  let ctaFinalLock = document.querySelector<HTMLElement>(".cta-final-lock");
  let ctaFinalStage = document.querySelector<HTMLElement>(".cta-final-stage");

  // If our CTA wrappers were not present at the moment this module initialized
  // (this can happen if they were created later by the CTA behavior), wait
  // shortly for them to appear instead of bailing out immediately.
  const waitForCtaWrappers = async () => {
    if (ctaFinalLock && ctaFinalStage) return;
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise((r) => setTimeout(r, 50));
      ctaFinalLock = document.querySelector<HTMLElement>(".cta-final-lock");
      ctaFinalStage = document.querySelector<HTMLElement>(".cta-final-stage");
      if (ctaFinalLock && ctaFinalStage) return;
    }
  };

  await waitForCtaWrappers();

  if (!footer || !ctaFinalLock || !ctaFinalStage) {
    logger.warn("Footer or CTA Final stage/lock not found after wait");
    return () => {};
  }

  // Estado do footer
  let footerVisible = false;
  let footerProgress = 0;

  const updateFooterBehavior = () => {
    // Verificar se CTA Final está pinado
    const body = document.body;
    const isCtaPinned = body.classList.contains("cta-final-pinned");

    if (!isCtaPinned) {
      // CTA Final não está pinado, footer fica oculto
      if (footerVisible) {
        footerVisible = false;
        footer.style.opacity = "0";
        footer.style.pointerEvents = "none";
        footer.style.transform = "translateY(100%)";
        footer.classList.remove("footer-revealed");
      }
      return;
    }

    // CTA Final está pinado, agora o footer pode aparecer
    // Calcular quanto do footer deve aparecer baseado em scroll adicional

    // Use the wrapper (.cta-final-stage) rect so we detect scroll *beyond* the sticky lock
    const wrapperRect = ctaFinalStage!.getBoundingClientRect();
    const footerHeight = footer.clientHeight;

    // Quando CTA Final está fixado e totalmente visível
    // O footer começa a aparecer quando user faz scroll além desse ponto
    if (wrapperRect.top <= 0) {
      // Footer pode começar a aparecer
      // A distância que o footer deve subir é baseada em quanto a CTA FINAL
      // já passou do topo
      const distanceBeyondLock = Math.abs(Math.min(0, wrapperRect.top));

      // Adicionar threshold para atrasar o aparecimento do footer
      // Só começa a aparecer após 200px de derrapagem adicional
      const revealThreshold = 200;
      const effectiveDistance = Math.max(
        0,
        distanceBeyondLock - revealThreshold,
      );

      // Aumentar maxDistance para tornar a transição mais gradual
      const maxDistance = Math.max(1, footerHeight * 1.0);

      footerProgress = Math.min(1, effectiveDistance / maxDistance);

      if (footerProgress > 0 && !footerVisible) {
        footerVisible = true;
        footer.style.pointerEvents = "auto";
        footer.classList.add("footer-revealed");
      }

      // Aplicar transform de slide-up com opacity
      const translateY = Math.max(0, 100 - footerProgress * 100);
      footer.style.transform = `translateY(${translateY}%)`;
      footer.style.opacity = String(Math.min(1, footerProgress * 1.2));
    } else if (footerVisible) {
      footerVisible = false;
      footer.style.opacity = "0";
      footer.style.pointerEvents = "none";
      footer.style.transform = "translateY(100%)";
      footer.classList.remove("footer-revealed");
    }
  };

  // Event listener com passive: true para melhor performance
  let rafId: number | null = null;
  let snapTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let isSnapping = false;
  let lastScrollY = window.scrollY;
  
  const handleScroll = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      updateFooterBehavior();
      
      const currentScrollY = window.scrollY;
      const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
      lastScrollY = currentScrollY;
      
      // Snap logic: se footer está parcialmente visível e não está fazendo snap
      // Threshold baixo (10%) para disparar rápido
      if (footerProgress > 0.1 && footerProgress < 0.9 && !isSnapping) {
        // Cancelar timeout anterior se existir
        if (snapTimeoutId) {
          clearTimeout(snapTimeoutId);
        }
        
        // Aguardar 80ms para ver se usuário parou de rolar
        snapTimeoutId = setTimeout(() => {
          // Re-checar se ainda está na zona de snap
          if (footerProgress > 0.1 && footerProgress < 0.9 && !isSnapping) {
            isSnapping = true;
            
            // Comportamento de gaveta: baseado na direção do scroll
            // Scrollou para baixo = revela; Scrollou para cima = esconde
            const shouldReveal = scrollDirection === 'down';
            
            // Adicionar transição suave
            footer.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease';
            
            if (shouldReveal) {
              // Revelar footer completamente
              footer.style.transform = 'translateY(0%)';
              footer.style.opacity = '1';
              footerVisible = true;
              footer.classList.add('footer-revealed');
            } else {
              // Esconder footer completamente
              footer.style.transform = 'translateY(100%)';
              footer.style.opacity = '0';
              footerVisible = false;
              footer.classList.remove('footer-revealed');
            }
            
            // Reset after animation completes
            setTimeout(() => {
              isSnapping = false;
              // Remover transição inline para não interferir com scroll normal
              footer.style.transition = '';
            }, 400);
          }
          snapTimeoutId = null;
        }, 80);
      }
      
      rafId = null;
    });
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleScroll, { passive: true });

  // Calcular inicial
  updateFooterBehavior();

  // Return disposer
  return () => {
    try {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
      if (snapTimeoutId) clearTimeout(snapTimeoutId);
    } catch (err) {
      logger.error("Error cleaning up Footer behavior", err);
    }
  };
};
