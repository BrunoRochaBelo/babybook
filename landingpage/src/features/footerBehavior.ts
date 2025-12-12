import { logger } from "../utils/logger";
import { getLenis } from "../core/scroll";

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

  // Narrow types for the rest of the module.
  const ctaLock = ctaFinalLock;
  const ctaStage = ctaFinalStage;

  // Estado do footer
  let footerVisible = false;
  let footerProgress = 0;

  // "Respiro" após o CTA ficar full-screen: só depois desse delay a lógica
  // de revelação do footer é armada.
  let fullScreenSinceMs: number | null = null;
  let armTimeoutId: ReturnType<typeof setTimeout> | null = null;
  const nowMs = () =>
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();
  const FOOTER_ARM_DELAY_MS = 1800;

  const getFooterHeight = () => {
    // clientHeight pode ser afetado por max-height; ainda assim é o que importa para a gaveta.
    const h = footer.clientHeight || footer.offsetHeight;
    return Math.max(1, h);
  };

  const getStageScrollableDistance = () => {
    // Quanto a .cta-final-stage consegue "andar" (top ficar negativo) enquanto o lock está ativo.
    // Se for pequeno demais, o footer pode ficar só "pela metade".
    const stage = ctaFinalStage!;
    return Math.max(0, stage.offsetHeight - window.innerHeight);
  };

  const getRevealConfig = () => {
    const stageScrollable = getStageScrollableDistance();
    const footerHeight = getFooterHeight();

    // Margem de scroll antes de começar a revelar o footer.
    // A ideia é: mesmo com CTA 100%, o usuário precisa "andar" um pouco para
    // sentir a intenção de ir para o footer (evita ativação direta).
    // Depois do CTA ficar 100%, o "respiro" principal é temporal (FOOTER_ARM_DELAY_MS).
    // Aqui deixamos só um buffer de distância moderado para não ser 100% imediato.
    const REVEAL_THRESHOLD_BASE = Math.max(
      240,
      Math.round(window.innerHeight * 0.22),
    );

    // Se o stage for curto, não podemos gastar tudo em margem; garantimos uma janela
    // mínima de revelação ajustando o threshold para baixo.
    const MIN_REVEAL_WINDOW = 220;
    const revealThreshold = Math.max(
      0,
      Math.min(REVEAL_THRESHOLD_BASE, stageScrollable - MIN_REVEAL_WINDOW),
    );

    const maxReachable = Math.max(1, stageScrollable - revealThreshold);
    // Se não há scroll suficiente para percorrer toda a altura do footer,
    // comprimimos a animação para completar dentro do que for possível.
    const maxDistance = Math.min(footerHeight, maxReachable);

    return { footerHeight, stageScrollable, revealThreshold, maxDistance };
  };

  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
  const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

  const updateFooterBehavior = () => {
    // Gate: só ativar a lógica do footer quando o CTA estiver cobrindo 100% a tela.
    // No modo "HERO clone" do CTA, o CSS usa --hero-collapse-progress:
    // - 0.0 => CTA totalmente aberto/full-screen
    // - 1.0 => CTA colapsado
    let heroProgress = 1;
    try {
      const raw = getComputedStyle(ctaLock).getPropertyValue(
        "--hero-collapse-progress",
      );
      const parsed = parseFloat(String(raw).trim());
      if (!Number.isNaN(parsed)) heroProgress = parsed;
    } catch {
      // ignore and keep default
    }

    const CTA_FULL_SCREEN_EPS = 0.004;
    const isCtaFullScreen = heroProgress <= CTA_FULL_SCREEN_EPS;

    // Use the wrapper (.cta-final-stage) rect so we detect scroll *beyond* the sticky lock
    const wrapperRect = ctaStage.getBoundingClientRect();
    const isStageAtOrPastTop = wrapperRect.top <= 0;

    // Mantemos a classe como sinal, mas não dependemos dela exclusivamente.
    const isCtaPinned =
      document.body.classList.contains("cta-final-pinned") ||
      ctaLock.classList.contains("cta-final-pinned");

    const canRevealFooter =
      isCtaPinned && isCtaFullScreen && isStageAtOrPastTop;

    // Armar/desarmar o "respiro": só conta quando o CTA já está 100% e no topo.
    if (canRevealFooter) {
      if (fullScreenSinceMs === null) {
        fullScreenSinceMs = nowMs();

        // Se o usuário parar de rolar durante o respiro, ainda assim queremos
        // reavaliar e permitir o início do reveal após o delay.
        if (armTimeoutId) clearTimeout(armTimeoutId);
        armTimeoutId = setTimeout(() => {
          armTimeoutId = null;
          updateFooterBehavior();
        }, FOOTER_ARM_DELAY_MS + 1);
      }
    } else {
      fullScreenSinceMs = null;
      if (armTimeoutId) {
        clearTimeout(armTimeoutId);
        armTimeoutId = null;
      }
    }

    const isArmedByDelay =
      fullScreenSinceMs !== null &&
      nowMs() - fullScreenSinceMs >= FOOTER_ARM_DELAY_MS;

    if (!canRevealFooter || !isArmedByDelay) {
      // CTA Final não está pinado, footer fica oculto
      footerProgress = 0;
      if (footerVisible) {
        footerVisible = false;
        footer.style.setProperty("--footer-opacity", "0");
        footer.style.setProperty("--footer-translate-y", "100%");
        footer.style.setProperty("--footer-scale", "0.99");
        footer.style.setProperty("--footer-blur", "10px");
        footer.style.setProperty("--footer-pointer-events", "none");
        footer.classList.remove("footer-revealed");
      }
      return;
    }

    // CTA Final está pinado, agora o footer pode aparecer
    // Calcular quanto do footer deve aparecer baseado em scroll adicional

    const { revealThreshold, maxDistance } = getRevealConfig();

    // Quando CTA Final está fixado e totalmente visível
    // O footer começa a aparecer quando user faz scroll além desse ponto
    if (wrapperRect.top <= 0) {
      // Footer pode começar a aparecer
      // A distância que o footer deve subir é baseada em quanto a CTA FINAL
      // já passou do topo
      const distanceBeyondLock = Math.abs(Math.min(0, wrapperRect.top));

      const effectiveDistance = Math.max(
        0,
        distanceBeyondLock - revealThreshold,
      );

      footerProgress = Math.min(1, effectiveDistance / maxDistance);

      // Evita “aparecer no primeiro pixel”: só considera visível após um pequeno avanço.
      const VISIBLE_PROGRESS_THRESHOLD = 0.1;

      // Suavização: depois do threshold, remapeia para 0..1 e aplica easing
      const t = clamp01(
        (footerProgress - VISIBLE_PROGRESS_THRESHOLD) /
          Math.max(1e-6, 1 - VISIBLE_PROGRESS_THRESHOLD),
      );
      const eased = easeOutQuart(t);

      if (footerProgress >= VISIBLE_PROGRESS_THRESHOLD && !footerVisible) {
        footerVisible = true;
        footer.style.setProperty("--footer-pointer-events", "auto");
        footer.classList.add("footer-revealed");
      }

      // Aplicar transform de slide-up com opacity (mais orgânico)
      const translateY = Math.max(0, 100 - eased * 100);
      const scale = 0.99 + eased * 0.01;
      const blurPx = (1 - eased) * 10;
      const opacity = clamp01(0.2 + eased * 0.95);
      footer.style.setProperty("--footer-opacity", String(opacity));
      footer.style.setProperty("--footer-translate-y", `${translateY}%`);
      footer.style.setProperty("--footer-scale", scale.toFixed(4));
      footer.style.setProperty("--footer-blur", `${blurPx.toFixed(2)}px`);
    } else if (footerVisible) {
      footerVisible = false;
      footer.style.setProperty("--footer-opacity", "0");
      footer.style.setProperty("--footer-translate-y", "100%");
      footer.style.setProperty("--footer-scale", "0.99");
      footer.style.setProperty("--footer-blur", "10px");
      footer.style.setProperty("--footer-pointer-events", "none");
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
      const scrollDirection = currentScrollY > lastScrollY ? "down" : "up";
      lastScrollY = currentScrollY;

      // Snap logic: se footer está parcialmente visível e não está fazendo snap
      // Threshold baixo (10%) para disparar rápido
      if (footerProgress > 0.1 && footerProgress < 0.9 && !isSnapping) {
        // Cancelar timeout anterior se existir (debounce)
        if (snapTimeoutId) {
          clearTimeout(snapTimeoutId);
        }

        // Se já está fazendo snap, não fazer nada (deixar terminar)
        // A menos que o usuário esteja "brigando" com o scroll (interrupção via user input no Lenis já pararia o scroll, mas nosso boolean isSnapping pode ter ficado true)
        // Por segurança, o onComplete e o timeout de fallback lidam com reset do isSnapping.

        // Aguardar curto período para confirmar parada do usuário
        snapTimeoutId = setTimeout(() => {
          // Zona de ativação agressiva: qualquer coisa que não seja "fechado" (0) ou "aberto" (1)
          if (footerProgress > 0.01 && footerProgress < 0.99 && !isSnapping) {
            const lenis = getLenis();
            if (!lenis) return;

            isSnapping = true;

            // Recalcular offsets
            const { stageScrollable, revealThreshold, maxDistance } =
              getRevealConfig();
            const wrapperRect = ctaStage.getBoundingClientRect();
            const currentScroll = window.scrollY;
            const stageTopAbsolute = currentScroll + wrapperRect.top;
            const stageBottomAbsolute = stageTopAbsolute + stageScrollable;

            // Definir destinos
            const hideScrollPos = Math.min(
              stageBottomAbsolute,
              stageTopAbsolute + revealThreshold,
            );
            const showScrollPos = Math.min(
              stageBottomAbsolute,
              stageTopAbsolute + revealThreshold + maxDistance,
            );

            // Lógica de decisão de destino
            let targetPos = hideScrollPos;

            // Se passou de 50% OU rolou para baixo recentemente -> Abre
            // Se rolou para cima -> Fecha
            if (scrollDirection === "down") {
              targetPos = showScrollPos;
            } else {
              targetPos = hideScrollPos;
              // Exceção: Se o usuário parou muito perto do fim (>90%) mesmo subindo um pouco, talvez queira manter aberto?
              // Melhor ser estrito: subiu = quer esconder.
            }

            // Distância para animar
            const dist = Math.abs(targetPos - currentScroll);
            // Duração dinâmica baseada na distância (mín 0.6s, máx 1.0s)
            const duration = Math.min(1.0, Math.max(0.6, dist / 1000));

            // Executar Scroll
            lenis.scrollTo(targetPos, {
              duration: duration,
              easing: (t: number) => 1 - Math.pow(1 - t, 4), // Quartic out para "travar" suave mas firme
              lock: true, // Tenta travar scroll do usuário durante animação
              onComplete: () => {
                isSnapping = false;
              },
            });

            // Fallback de segurança para liberar estado
            setTimeout(
              () => {
                isSnapping = false;
              },
              duration * 1000 + 100,
            );
          }
          snapTimeoutId = null;
        }, 60); // Delay curto para resposta rápida
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
      if (armTimeoutId) clearTimeout(armTimeoutId);
    } catch (err) {
      logger.error("Error cleaning up Footer behavior", err);
    }
  };
};
