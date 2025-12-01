import {
  prefersReducedMotion,
  createScrollThrottle,
} from "../../utils/helpers";
import { logger, withElement } from "../../utils/logger";

// === CTA FINAL: Animações e Interações Premium na seção do rodapé ===
export const setupCtaFinal = () => {
  if (prefersReducedMotion()) {
    logger.info("setupCtaFinal", "Skipped (prefers-reduced-motion)");
    return;
  }

  return withElement(
    ".cta-final",
    (cta) => {
      logger.info("setupCtaFinal", "Initializing advanced animations");

      const sectionShell = cta.querySelector<HTMLElement>(".section-shell");
      const orbs = Array.from(
        cta.querySelectorAll<HTMLElement>(".floating-orb"),
      );
      const titleEl = cta.querySelector<HTMLElement>(".section-shell h2");
      const pulseBg = cta.querySelector<HTMLElement>(".pulsating-background");
      const counterEl = cta.querySelector<HTMLSpanElement>("#urgency-count");
      const premiumButtons = cta.querySelectorAll<HTMLElement>(
        ".premium-button-container",
      );
      const guaranteeBadge = cta.querySelector<HTMLElement>(".guarantee-badge");
      const accentLines = cta.querySelectorAll<HTMLElement>(
        ".accent-line-top, .accent-line-bottom",
      );

      // ===== OBSERVER PARA A SEÇÃO ANTERIOR (FAQ): Detecta saída e prepara 'snap' da CTA =====
      const prevSection = document.querySelector<HTMLElement>(".faq-section");
      let prevSectionExited = false;
      let snappedCTA = false;
      let prevObserver: IntersectionObserver | null = null;
      if (prevSection) {
        prevObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) {
                // Usuário saiu da FAQ — já podemos escutar o próximo scroll para 'snap'
                prevSectionExited = true;
                logger.debug(
                  "setupCtaFinal",
                  "FAQ left — CTA will snap on next downward scroll",
                );
              } else {
                // Usuário voltou para FAQ — reset
                prevSectionExited = false;
                snappedCTA = false;
              }
            });
          },
          { threshold: 0.1, rootMargin: "0px 0px -10% 0px" },
        );

        prevObserver.observe(prevSection);
      }

      // ===== INTERSECTION OBSERVER: Ativa animações quando seção entra na viewport =====
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              cta.classList.add("cta-final-active");

              // Stagger em cascata nos orbs com easing sofisticado
              orbs.forEach((orb, i) => {
                setTimeout(() => {
                  orb.classList.add("orb-active");
                  const depth = 10 + i * 6;
                  orb.style.transform = `translate3d(0, ${-depth}px, 0) scale(${1 + i * 0.04}) rotateZ(${i * 15}deg)`;
                  orb.style.opacity = String(0.5 + i * 0.15);
                }, i * 150); // Stagger mais suave
              });

              // Elevação em cascata dos botões
              premiumButtons.forEach((btn, i) => {
                setTimeout(
                  () => {
                    btn.style.transform = `translateY(-8px) scale(1)`;
                    btn.style.opacity = "1";
                  },
                  i * 100 + 200,
                );
              });

              // Animar badge de garantia
              if (guaranteeBadge) {
                setTimeout(() => {
                  guaranteeBadge.style.opacity = "1";
                  guaranteeBadge.style.transform = "translateY(0)";
                }, 400);
              }

              // Animar linhas de acentuação
              accentLines.forEach((line, i) => {
                setTimeout(
                  () => {
                    line.style.opacity = "1";
                  },
                  300 + i * 100,
                );
              });
            } else {
              cta.classList.remove("cta-final-active");
              orbs.forEach((orb) => {
                orb.classList.remove("orb-active");
                orb.style.transform = "";
                orb.style.opacity = "0.36";
              });
              premiumButtons.forEach((btn) => {
                btn.style.transform = "";
                btn.style.opacity = "1";
              });
              if (guaranteeBadge) {
                guaranteeBadge.style.opacity = "0.8";
                guaranteeBadge.style.transform = "translateY(10px)";
              }
              accentLines.forEach((line) => {
                line.style.opacity = "0";
              });
            }
          });
        },
        { threshold: 0.25, rootMargin: "0px 0px -100px 0px" },
      );

      observer.observe(cta);

      // ===== PARALLAX AVANÇADO: Movimento sofisticado dos orbs ao scrollar =====
      let scrollAnimationFrameId: number | null = null;

      const updateParallax = () => {
        const rect = cta.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const isInViewport = rect.top < windowHeight && rect.bottom > 0;

        if (!isInViewport) {
          scrollAnimationFrameId = null;
          return;
        }

        // Calcular progresso do scroll na seção com easing suave
        const progress = Math.max(
          0,
          Math.min(1, (windowHeight - rect.top) / (windowHeight + rect.height)),
        );

        // Aplicar parallax sofisticado nos orbs com requestAnimationFrame
        orbs.forEach((orb, i) => {
          // Profundidade variada para cada orb com exponential easing
          const baseDepth = 8 + i * 6;
          const parallaxStrength = 0.8 - i * 0.15; // Orbs distantes menos parallax
          const depth = baseDepth * parallaxStrength;

          // Movimento com cubic-bezier simulation para suavidade
          const easedProgress =
            progress < 0.5
              ? 2 * progress * progress
              : -1 + (4 - 2 * progress) * progress;

          // Movimento vertical principal
          const y = Math.round((easedProgress - 0.5) * depth * 25);

          // Movimento horizontal com variação de profundidade
          const horizontalShift = i % 2 === 0 ? 1 : -1;
          const x = Math.round(
            (easedProgress - 0.5) * depth * 12 * horizontalShift,
          );

          // Opacidade e escala responsivos com smooth decay
          const baseOpacity = 0.3 + easedProgress * 0.35;
          const scale = 0.95 + easedProgress * 0.15;

          // Rotation sutil baseado no índice com easing
          const rotation = easedProgress * (i + 1) * 8;

          orb.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotateZ(${rotation}deg)`;
          orb.style.opacity = String(baseOpacity);
        });

        // Animar posição do gradiente de fundo com parallax inverso
        if (pulseBg) {
          const pulsScale = 0.95 + progress * 0.12;
          const pulseY = Math.round((progress - 0.5) * 30);
          pulseBg.style.transform = `translate(-50%, calc(-50% + ${pulseY}px)) scale(${pulsScale})`;
          pulseBg.style.opacity = String(0.28 + progress * 0.3);
        }

        // Efeito de "breathing" no título quando ativo com animação suave
        if (cta.classList.contains("cta-final-active") && titleEl) {
          const now = performance.now();
          const breathScale = 1 + Math.sin(now / 3000) * 0.02;
          titleEl.style.transform = `scale(${breathScale})`;
        }
      };

      const onScroll = createScrollThrottle(() => {
        if (scrollAnimationFrameId === null) {
          scrollAnimationFrameId = requestAnimationFrame(updateParallax);
        }
      });

      window.addEventListener("scroll", onScroll, { passive: true });

      // ===== SNAP CTA ON NEXT SCROLL: wheel, touch, and keyboard handlers =====
      let lastTouchY: number | null = null;
      const shouldSnapCTAToTop = () => {
        if (!prevSectionExited || snappedCTA) return false;
        // If CTA is already at or near the top, don't snap
        const rect = cta.getBoundingClientRect();
        if (rect.top <= 2) return false;
        return true;
      };

      const doSnapCTA = () => {
        if (!shouldSnapCTAToTop()) return;
        // Smooth scroll CTA to top
        cta.scrollIntoView({ behavior: "smooth", block: "start" });
        snappedCTA = true;
        prevSectionExited = false;
        logger.info("setupCtaFinal", "CTA snapped to top after leaving FAQ");
      };

      const wheelHandler = (e: WheelEvent) => {
        // only respond to downward scroll intent
        if (!shouldSnapCTAToTop()) return;
        if ((e.deltaY ?? 0) <= 0) return;
        doSnapCTA();
      };

      const touchStartHandler = (e: TouchEvent) => {
        lastTouchY = e.touches[0]?.clientY ?? null;
      };

      const touchMoveHandler = (e: TouchEvent) => {
        if (!shouldSnapCTAToTop() || lastTouchY === null) return;
        const currentY = e.touches[0]?.clientY ?? 0;
        const delta = lastTouchY - currentY;
        // 5px threshold to avoid minor accidental touches
        if (delta > 6) {
          doSnapCTA();
        }
      };

      const keyDownHandler = (e: KeyboardEvent) => {
        if (!shouldSnapCTAToTop()) return;
        if (e.key === "ArrowDown" || e.key === "PageDown") {
          doSnapCTA();
        }
      };

      window.addEventListener("wheel", wheelHandler, { passive: true });
      window.addEventListener("touchstart", touchStartHandler, {
        passive: true,
      });
      window.addEventListener("touchmove", touchMoveHandler, { passive: true });
      window.addEventListener("keydown", keyDownHandler, { passive: true });

      // ===== EFEITO MAGNÉTICO NOS BOTÕES: Segue o cursor suavemente com otimização =====
      // Keep handler pairs for cleanup later
      const premiumButtonHandlers: Array<{
        el: HTMLElement;
        onMouseMove: (e: MouseEvent) => void;
        onMouseLeave: () => void;
      }> = [];

      premiumButtons.forEach((button) => {
        const magneticStrength = parseFloat(
          button.getAttribute("data-magnetic-strength") || "0.3",
        );
        let mouseAnimationFrameId: number | null = null;

        const updateMagneticPosition = (clientX: number, clientY: number) => {
          const rect = button.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          const distX = (clientX - centerX) * magneticStrength;
          const distY = (clientY - centerY) * magneticStrength;

          // Aplicar suavização com easing
          button.style.transform = `translate(${distX * 0.98}px, ${distY * 0.98}px)`;
        };

        const onMouseMove = (e: MouseEvent) => {
          if (prefersReducedMotion()) return;

          if (mouseAnimationFrameId !== null) {
            cancelAnimationFrame(mouseAnimationFrameId);
          }

          mouseAnimationFrameId = requestAnimationFrame(() => {
            updateMagneticPosition(e.clientX, e.clientY);
            mouseAnimationFrameId = null;
          });
        };

        const onMouseLeave = () => {
          if (mouseAnimationFrameId !== null) {
            cancelAnimationFrame(mouseAnimationFrameId);
          }
          button.style.transform = "";
        };

        button.addEventListener("mousemove", onMouseMove, { passive: true });
        button.addEventListener("mouseleave", onMouseLeave);

        premiumButtonHandlers.push({ el: button, onMouseMove, onMouseLeave });
      });

      // ===== CONTADOR DE URGÊNCIA: Atualização determinística com animação suave =====
      let counterAnimationFrameId: number | null = null;

      const updateUrgency = () => {
        if (!counterEl) return;

        const now = new Date();
        const dayOfYear = Math.floor(
          (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) /
            86400000,
        );
        const hourOfDay = now.getHours();

        // Valor base de 8-28 (mais natural com variação semanal)
        const base = 8 + (dayOfYear % 20);
        // Oscilação ao longo do dia (mais pessoas "comprando" em certos horários)
        const dayOscillation = Math.round(
          Math.sin((hourOfDay + 2) / 4.5) * 6, // Pico às 18-20h (horário de compra)
        );
        // Micro-oscilação com minutos para parecer dinâmico e contínuo
        const microOscillation = Math.round(
          Math.sin(now.getTime() / 30000) * 3,
        );

        const finalValue = Math.max(
          5,
          base + dayOscillation + microOscillation,
        );

        // Animar mudança de número com fade in/out refinado
        if (counterAnimationFrameId !== null) {
          cancelAnimationFrame(counterAnimationFrameId);
        }

        counterAnimationFrameId = requestAnimationFrame(() => {
          counterEl.style.transition = "opacity 0.2s ease-out";
          counterEl.style.opacity = "0.5";

          setTimeout(() => {
            if (counterEl) {
              counterEl.textContent = String(finalValue);
              counterEl.style.opacity = "1";
            }
          }, 100);

          counterAnimationFrameId = null;
        });
      };

      updateUrgency();
      const urgencyInterval = window.setInterval(updateUrgency, 12000);

      // ===== POSICIONAMENTO DINÂMICO DO GRADIENTE PULSANTE COM DEBOUNCING =====
      let resizeAnimationFrameId: number | null = null;

      const updatePulsePosition = () => {
        if (!pulseBg || !titleEl || !sectionShell) return;

        const titleRect = titleEl.getBoundingClientRect();
        const sectionRect = sectionShell.getBoundingClientRect();

        // Calcular posição relativa ao centro do título com suavização
        const relX = titleRect.left + titleRect.width / 2 - sectionRect.left;
        const relY = titleRect.top + titleRect.height / 2 - sectionRect.top;

        // Aplicar com requestAnimationFrame para sincronizar com paint
        if (resizeAnimationFrameId !== null) {
          cancelAnimationFrame(resizeAnimationFrameId);
        }

        resizeAnimationFrameId = requestAnimationFrame(() => {
          // Suavizar a transição com cubic-bezier otimizado
          pulseBg.style.transition =
            "left 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          pulseBg.style.left = `${relX}px`;
          pulseBg.style.top = `${relY}px`;
          resizeAnimationFrameId = null;
        });
      };

      updatePulsePosition();

      // Debounce resize events para melhor performance
      let resizeTimeout: number | null = null;
      window.addEventListener("resize", () => {
        if (resizeTimeout !== null) {
          clearTimeout(resizeTimeout);
        }
        resizeTimeout = window.setTimeout(updatePulsePosition, 100);
      });

      // Footer link hover effects were moved to components/siteFooterComponent

      // ===== INICIALIZAÇÃO DE ESTILOS =====
      premiumButtons.forEach((btn) => {
        btn.style.opacity = "0";
        btn.style.transform = "translateY(20px)";
      });

      if (guaranteeBadge) {
        guaranteeBadge.style.opacity = "0.8";
        guaranteeBadge.style.transform = "translateY(10px)";
        guaranteeBadge.style.transition = "all 0.4s ease";
      }

      accentLines.forEach((line) => {
        line.style.opacity = "0";
        line.style.transition = "opacity 0.6s ease";
      });

      // ===== LIMPEZA E PREVENÇÃO DE MEMORY LEAKS COM GERENCIAMENTO EFICIENTE =====
      const cleanup = () => {
        // Desligar observer
        observer.disconnect();

        // Cancelar animation frames pendentes
        if (scrollAnimationFrameId !== null) {
          cancelAnimationFrame(scrollAnimationFrameId);
        }
        if (counterAnimationFrameId !== null) {
          cancelAnimationFrame(counterAnimationFrameId);
        }
        if (resizeAnimationFrameId !== null) {
          cancelAnimationFrame(resizeAnimationFrameId);
        }

        // Limpar intervals
        clearInterval(urgencyInterval);
        if (resizeTimeout !== null) {
          clearTimeout(resizeTimeout);
        }

        // Remover event listeners
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("beforeunload", cleanup);
        // Remover snap handlers
        window.removeEventListener("wheel", wheelHandler as EventListener);
        window.removeEventListener(
          "touchstart",
          touchStartHandler as EventListener,
        );
        window.removeEventListener(
          "touchmove",
          touchMoveHandler as EventListener,
        );
        window.removeEventListener("keydown", keyDownHandler as EventListener);
        prevSectionExited = false;
        snappedCTA = false;
        // Disconnect prev section observer
        if (prevObserver !== null) {
          prevObserver.disconnect();
          prevObserver = null;
        }

        premiumButtonHandlers.forEach(({ el, onMouseMove, onMouseLeave }) => {
          el.removeEventListener("mousemove", onMouseMove as EventListener);
          el.removeEventListener("mouseleave", onMouseLeave as EventListener);
        });

        logger.info("setupCtaFinal", "Cleanup completed successfully");
      };

      window.addEventListener("beforeunload", cleanup);

      logger.info(
        "setupCtaFinal",
        "Advanced animations initialized successfully",
      );
      return cleanup;
    },
    "CTA Final not found",
  );
};

export default setupCtaFinal;
