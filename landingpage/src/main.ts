import "./main.css";
import Lenis from "lenis";

// Initialize Lenis for smooth scrolling - Configuração equilibrada
const lenis = new Lenis({
  duration: 1.5, // Balanceado entre suave e responsivo
  easing: (t: number) => {
    // Easing suave mas não excessivo
    return 1 - Math.pow(1 - t, 3);
  },
  orientation: "vertical",
  gestureOrientation: "vertical",
  smoothWheel: true,
  wheelMultiplier: 0.85, // Balanceado - nem muito pesado, nem muito leve
  touchMultiplier: 1.8, // Melhor resposta no touch
  syncTouch: true,
  syncTouchLerp: 0.075, // Mais responsivo no touch
});

function raf(time: number) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

// Verifica preferência de movimento reduzido
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// === SISTEMA DE ANALYTICS ===
interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

const trackEvent = (event: AnalyticsEvent) => {
  // Google Analytics 4
  if (typeof (window as any).gtag !== "undefined") {
    (window as any).gtag("event", event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
    });
  }

  // Console log em desenvolvimento
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    console.log("📊 Analytics Event:", event);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // === SCROLL PROGRESS INDICATOR ===
  const createScrollProgress = () => {
    const progressBar = document.createElement("div");
    progressBar.className = "scroll-progress";
    document.body.appendChild(progressBar);

    window.addEventListener("scroll", () => {
      const windowHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.pageYOffset / windowHeight) * 100;
      progressBar.style.width = scrolled + "%";
    });
  };
  createScrollProgress();

  // NAV - Scroll behavior com hide/show
  const nav = document.querySelector(".nav-header") as HTMLElement;
  let lastScroll = 0;

  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset;

    // Adiciona classe scrolled após 100px
    if (currentScroll > 100) {
      nav?.classList.add("scrolled");
    } else {
      nav?.classList.remove("scrolled");
    }

    // Hide/Show baseado APENAS na direção do scroll
    if (currentScroll > lastScroll && currentScroll > 150) {
      // Scrollando para baixo - esconder
      nav?.classList.add("nav-hidden");
    } else if (currentScroll < lastScroll) {
      // Scrollando para cima - mostrar
      nav?.classList.remove("nav-hidden");
    }

    lastScroll = currentScroll;
  });

  // === 1. LOADING STATES NOS BOTÕES + ANALYTICS ===
  const setupButtonLoading = () => {
    const ctaButtons = document.querySelectorAll(
      ".cta-primary, .cta-secondary",
    );

    ctaButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const btn = e.currentTarget as HTMLElement;
        const btnText = btn.textContent?.trim() || "CTA";
        const isHero = btn.closest("section")?.classList.contains("relative");

        // Track click event
        trackEvent({
          category: "CTA",
          action: "click",
          label: btnText,
          value: isHero ? 1 : 0,
        });

        // Adiciona loading state
        btn.classList.add("btn-loading");

        // Simula ação (em produção, seria uma requisição real)
        setTimeout(() => {
          btn.classList.remove("btn-loading");
        }, 2000);
      });
    });
  };
  setupButtonLoading();

  const setupSurfaceObserver = () => {
    const surfaces = document.querySelectorAll<HTMLElement>(
      ".section-surface, .hero-section",
    );
    if (!surfaces.length) return;

    const surfaceObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("surface-active", entry.isIntersecting);
        });
      },
      { threshold: 0.35 },
    );

    surfaces.forEach((surface) => surfaceObserver.observe(surface));
  };
  setupSurfaceObserver();

  const setupParallaxSections = () => {
    if (prefersReducedMotion) return;
    const sections = document.querySelectorAll<HTMLElement>(
      "[data-parallax-section]",
    );
    if (!sections.length) return;

    const updateLayers = () => {
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const delta = sectionCenter - window.innerHeight / 2;
        const layers = section.querySelectorAll<HTMLElement>(
          "[data-parallax-depth]",
        );

        layers.forEach((layer) => {
          const depth = parseFloat(layer.dataset.parallaxDepth || "0.15");
          const movement = -(delta / window.innerHeight) * depth * 120;
          layer.style.transform = `translate3d(0, ${movement}px, 0)`;
        });
      });
    };

    let ticking = false;
    const requestUpdate = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateLayers();
          ticking = false;
        });
        ticking = true;
      }
    };

    updateLayers();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
  };
  setupParallaxSections();

  const setupHeroCollapseProgress = () => {
    const heroStage = document.getElementById("hero-stage");
    if (!heroStage) return;
    const root = document.documentElement;
    let ticking = false;

    const easeInOutQuad = (t: number) =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const updateProgress = () => {
      const stageHeight = heroStage.offsetHeight;
      const stageTop = heroStage.offsetTop;
      const range = Math.max(stageHeight - window.innerHeight, 1);
      const scrollY = window.scrollY;
      const clampedScroll = Math.min(Math.max(scrollY - stageTop, 0), range);
      const rawProgress = clampedScroll / range;
      const easedProgress = easeInOutQuad(rawProgress);
      root.style.setProperty(
        "--hero-collapse-progress",
        easedProgress.toFixed(4),
      );
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    updateProgress();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateProgress);
  };
  setupHeroCollapseProgress();

  const setupHeroPointerGlow = () => {
    const hero = document.querySelector(".hero-section");
    if (!hero) return;
    const root = document.documentElement;

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

  const setupMagneticHover = () => {
    const magnets = document.querySelectorAll<HTMLElement>(".magnetic");
    if (!magnets.length) return;

    magnets.forEach((magnet) => {
      const strength = parseFloat(
        magnet.dataset.magneticStrength ||
          magnet.getAttribute("data-strength") ||
          "0.25",
      );

      const handlePointerMove = (event: PointerEvent) => {
        const rect = magnet.getBoundingClientRect();
        const offsetX = event.clientX - (rect.left + rect.width / 2);
        const offsetY = event.clientY - (rect.top + rect.height / 2);
        magnet.style.transform = `translate3d(${offsetX * strength}px, ${offsetY * strength}px, 0)`;
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

  const setupBookCardTilt = () => {
    const cards = document.querySelectorAll<HTMLElement>(".book-card");
    if (!cards.length) return;
    const maxTilt = 8;

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
      };

      const resetTilt = () => {
        card.style.removeProperty("--tilt-x");
        card.style.removeProperty("--tilt-y");
      };

      card.addEventListener("pointermove", (event) =>
        handlePointerMove(event as PointerEvent),
      );
      card.addEventListener("pointerleave", resetTilt);
    });
  };

  if (!prefersReducedMotion) {
    setupHeroPointerGlow();
    setupMagneticHover();
    setupBookCardTilt();
  }

  // === 2. CURSOR PERSONALIZADO NOS CARDS === (DESABILITADO)
  // Função removida para restaurar experiência original

  // === 3. LAZY LOADING DE IMAGENS ===
  const setupLazyLoading = () => {
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const container = img.closest(".lazy-image") as HTMLElement;

            // Carrega a imagem
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

    // Observa todas as imagens lazy
    document.querySelectorAll(".lazy-image img").forEach((img) => {
      imageObserver.observe(img);
    });
  };
  setupLazyLoading();

  // === SCROLL DEPTH TRACKING ===
  const trackScrollDepth = () => {
    const milestones = [25, 50, 75, 100];
    const tracked = new Set<number>();

    window.addEventListener("scroll", () => {
      const windowHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.pageYOffset / windowHeight) * 100;

      milestones.forEach((milestone) => {
        if (scrolled >= milestone && !tracked.has(milestone)) {
          tracked.add(milestone);
          trackEvent({
            category: "Scroll Depth",
            action: `Scrolled ${milestone}%`,
            label: window.location.pathname,
            value: milestone,
          });
        }
      });
    });
  };
  trackScrollDepth();

  // === TRACK SEÇÃO VISUALIZADA ===
  const trackSectionViews = () => {
    const sections = document.querySelectorAll("section[id]");
    const viewedSections = new Set<string>();

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            if (sectionId && !viewedSections.has(sectionId)) {
              viewedSections.add(sectionId);
              trackEvent({
                category: "Section View",
                action: "viewed",
                label: sectionId,
              });
            }
          }
        });
      },
      { threshold: 0.5 },
    );

    sections.forEach((section) => sectionObserver.observe(section));
  };
  trackSectionViews();

  // 1. OBSERVER GENÉRICO (Fade In Up) - Respeitando prefer-reduced-motion
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -100px 0px",
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  if (!prefersReducedMotion) {
    document
      .querySelectorAll(
        ".fade-in-up, .fade-in-left, .fade-in-right, .scale-in, .rotate-in",
      )
      .forEach((el) => observer.observe(el));
  } else {
    // Se prefer reduced motion, já mostra tudo
    document
      .querySelectorAll(
        ".fade-in-up, .fade-in-left, .fade-in-right, .scale-in, .rotate-in",
      )
      .forEach((el) => el.classList.add("visible"));
  }

  // 2. CHAOS TO ORDER (Lógica ajustada com throttle)
  const chaosSection = document.querySelector(".chaos-container");
  const photos = document.querySelectorAll(".photo-scatter");
  const text1 = document.getElementById("chaos-text-1");
  const text2 = document.getElementById("chaos-text-2");
  const highlight = document.getElementById("chaos-highlight");

  if (chaosSection) {
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          ticking = false;
        });
        ticking = true;
      }
      const rect = chaosSection.getBoundingClientRect();
      // Calcula progresso dentro da seção (0 a 1)
      const progress = Math.max(
        0,
        Math.min(1, -rect.top / (rect.height - window.innerHeight)),
      );

      // FASE 1: Texto (0.32) - Melhorado com cores mais acessíveis
      if (progress > 0.32) {
        if (highlight) {
          highlight.style.color = "#F59E0B"; // Amber-500 para melhor contraste
          highlight.innerText = "Só precisava caber na vida real.";
        }
        if (text1) text1.classList.add("opacity-30");
        if (text2) text2.classList.remove("opacity-30");
      } else {
        if (highlight) {
          highlight.style.color = "#6B7280"; // Gray-500
          highlight.innerText = "Só precisava caber na vida real.";
        }
        if (text1) text1.classList.remove("opacity-30");
        if (text2) text2.classList.add("opacity-30");
      }

      // FASE 2: Fotos (0.62) - Intervalo adequado
      if (progress > 0.62) {
        photos.forEach((p) => p.classList.add("organized"));
      } else {
        photos.forEach((p) => p.classList.remove("organized"));
      }
    });
  }

  // 3. HORIZONTAL SCROLL & VAULT UNLOCK
  const scrollSection = document.querySelector(
    ".horizontal-scroll-section",
  ) as HTMLElement;
  const track = document.querySelector(".horizontal-track") as HTMLElement;
  const vaultCard = document.getElementById("vault-card");

  if (scrollSection && track && vaultCard) {
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

      // FASES DA ANIMAÇÃO - Equilibradas
      // 0% - 68%: Scroll Horizontal (Move o trilho de 0 a 100%)
      // 68% - 90%: Destrancar Cofre (Trilho parado, tensão visual)
      // 90% - 100%: Abrir Cofre (Trilho parado, conteúdo revela)

      let movePercentage = 0;

      if (rawPercentage < 0.68) {
        // Normalizando 0-0.68 para 0-1 com easing suave
        const normalized = rawPercentage / 0.68;
        // Easing suave
        movePercentage = 1 - Math.pow(1 - normalized, 3);
      } else {
        // Travado no fim do trilho a partir de 60%
        movePercentage = 1;
      }

      // Move o trilho
      const moveAmount =
        movePercentage * (track.scrollWidth - window.innerWidth);
      track.style.transform = `translateX(-${moveAmount}px)`;

      // Lógica do Cofre
      const lockIcon = vaultCard.querySelector(
        ".vault-locked .text-5xl",
      ) as HTMLElement; // Seleciona o ícone do cadeado

      // Fase 2: Destrancar (68% a 90%)
      // Resistência: O usuário precisa rolar bastante. Adicionamos tensão visual.
      if (rawPercentage > 0.68 && rawPercentage <= 0.9) {
        // REMOVIDO: vaultCard.classList.add('is-unlocked'); -> Isso abria o cofre visualmente!
        if (lockIcon) lockIcon.classList.remove("animate-bounce"); // Remove animação padrão para não conflitar

        // Calcula tensão de 0 a 1 dentro da fase de travamento
        const tension = (rawPercentage - 0.68) / 0.22;

        // Aplica efeito de "tremor" ou "pressão" baseado na tensão
        // Tremor aleatório aumenta com a tensão
        const shake = tension * 5; // Max 5px shake
        const randomX = (Math.random() - 0.5) * shake;
        const randomY = (Math.random() - 0.5) * shake;
        const scale = 1 - tension * 0.1; // Encolhe levemente (pressão)

        if (lockIcon) {
          lockIcon.style.transform = `translate(${randomX}px, ${randomY}px) scale(${scale})`;
        }
      } else if (rawPercentage <= 0.68) {
        vaultCard.classList.remove("is-unlocked");
        if (lockIcon) {
          lockIcon.style.transform = "none"; // Reseta
          lockIcon.classList.add("animate-bounce"); // Devolve a animação se voltar
        }
      }

      // Fase 3: Abrir (90% a 100%)
      if (rawPercentage > 0.9) {
        vaultCard.classList.add("is-open");
        const lockedState = vaultCard.querySelector(
          ".vault-locked",
        ) as HTMLElement;
        if (lockedState) lockedState.style.opacity = "0";
        if (lockIcon) lockIcon.style.transform = "scale(1.2)"; // Pop final ao abrir (opcional, mas já está sumindo com opacity)
      } else {
        vaultCard.classList.remove("is-open");
        const lockedState = vaultCard.querySelector(
          ".vault-locked",
        ) as HTMLElement;
        if (lockedState) lockedState.style.opacity = "1";
      }
    });
  }

  // 4. TIMELINE DRAW ON SCROLL (Refined com Parallax)
  const timelineSection = document.getElementById("how-it-works-section");
  const timelineContainer = document.getElementById("timeline-container");
  const progressBar = document.getElementById("timeline-progress");
  const stepItems = document.querySelectorAll(".step-item");
  const timelineBackground = document.querySelector(
    ".timeline-background",
  ) as HTMLElement;

  if (timelineSection && timelineContainer && progressBar) {
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

      // Calcula o progresso geral da seção (0 a 1)
      const sectionProgress = Math.max(
        0,
        Math.min(1, -sectionRect.top / sectionHeight),
      );

      // Efeito Parallax no fundo - movimento sutil
      if (timelineBackground) {
        const parallaxY = sectionProgress * 100; // Move 100px ao longo da seção
        timelineBackground.style.transform = `translateY(${parallaxY}px) scale(${1 + sectionProgress * 0.1})`;
      }

      // Calcula a porcentagem da timeline (0 a 100%)
      // A timeline só avança nos primeiros 86% do scroll da seção
      let timelinePercentage = Math.min(100, (sectionProgress / 0.86) * 100);

      progressBar.style.height = `${timelinePercentage}%`;

      // Lógica para ativar os itens individualmente
      const containerHeight = timelineContainer.offsetHeight;
      stepItems.forEach((item, index) => {
        // Posição relativa do item dentro do container
        const itemTop = (item as HTMLElement).offsetTop;
        // Altura atual da linha em pixels
        const currentLineHeight = (timelinePercentage / 100) * containerHeight;

        if (currentLineHeight >= itemTop - 50) {
          // -50 para ativar um pouco antes de chegar
          item.classList.add("active");
          // Ativa a cor da borda do círculo
          const circle = item.querySelector(".step-circle");
          if (circle) {
            circle.classList.remove("border-gray-300", "text-gray-500");
            circle.classList.add("border-indigo-600", "text-ink");
          }
          // Ativa a cor do texto
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
          // Se o usuário rolar para cima, desativa
          if (index > 0) {
            item.classList.remove("active");
            const circle = item.querySelector(".step-circle");
            if (circle) {
              circle.classList.remove("border-indigo-600", "text-ink");
              circle.classList.add("border-gray-300", "text-gray-500");
            }
            // Desativa a cor do texto
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
  }

  // 5. CARROSSEL MOBILE (Seção Famílias)
  const carousel = document.getElementById("families-carousel");
  if (carousel) {
    const track = document.getElementById("carousel-track") as HTMLElement;
    const slides = Array.from(
      document.querySelectorAll(".carousel-slide"),
    ) as HTMLElement[];
    const dots = Array.from(
      document.querySelectorAll(".carousel-dot"),
    ) as HTMLButtonElement[];
    const prevBtn = document.getElementById(
      "carousel-prev",
    ) as HTMLButtonElement;
    const nextBtn = document.getElementById(
      "carousel-next",
    ) as HTMLButtonElement;
    const liveRegion = document.getElementById(
      "carousel-live-region",
    ) as HTMLElement;

    let currentIndex = 0;
    let autoplayInterval: number | null = null;
    let isPressing = false;
    const AUTOPLAY_DELAY = 5000; // 5 segundos

    // Função para ir para um slide específico
    function goToSlide(index: number, announce: boolean = true) {
      // Looping: volta ao início/fim
      if (index < 0) {
        index = slides.length - 1;
      } else if (index >= slides.length) {
        index = 0;
      }

      currentIndex = index;

      // Scroll suave até o slide
      const slideWidth = slides[0].offsetWidth;
      const gap = 16; // 1rem = 16px (gap-4)
      const scrollPosition = (slideWidth + gap) * index;
      track.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });

      // Atualizar estado ativo dos slides (para efeito visual opcional)
      slides.forEach((slide, i) => {
        if (i === index) {
          slide.classList.add("active");
        } else {
          slide.classList.remove("active");
        }
      });

      // Atualizar dots
      updateDots(index);

      // Anunciar mudança para leitores de tela
      if (announce && liveRegion) {
        liveRegion.textContent = `Slide ${index + 1} de ${slides.length}`;
      }
    }

    // Atualizar indicadores (dots)
    function updateDots(activeIndex: number) {
      dots.forEach((dot, i) => {
        const isActive = i === activeIndex;
        dot.setAttribute("aria-selected", isActive.toString());
        dot.tabIndex = isActive ? 0 : -1;
      });
    }

    // Navegação Anterior
    function goPrev() {
      goToSlide(currentIndex - 1);
      resetAutoplay();
    }

    // Navegação Próximo
    function goNext() {
      goToSlide(currentIndex + 1);
      resetAutoplay();
    }

    // Iniciar Autoplay
    function startAutoplay() {
      if (autoplayInterval || isPressing) return;
      autoplayInterval = window.setInterval(() => {
        goNext();
      }, AUTOPLAY_DELAY);
    }

    // Pausar Autoplay
    function pauseAutoplay() {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
      }
    }

    // Resetar Autoplay (pausa e reinicia após interação do usuário)
    function resetAutoplay() {
      pauseAutoplay();
      // Verifica preferência do usuário (prefers-reduced-motion)
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (!prefersReducedMotion && !isPressing) {
        startAutoplay();
      }
    }

    // Event Listeners
    if (prevBtn) prevBtn.addEventListener("click", goPrev);
    if (nextBtn) nextBtn.addEventListener("click", goNext);

    // Clique nos dots
    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const index = parseInt(dot.getAttribute("data-index") || "0", 10);
        goToSlide(index);
        resetAutoplay();
      });
    });

    // Pausar ao pressionar e segurar cards (touch e mouse)
    slides.forEach((slide) => {
      // Touch events
      slide.addEventListener("touchstart", () => {
        isPressing = true;
        pauseAutoplay();
      });

      slide.addEventListener("touchend", () => {
        isPressing = false;
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        if (!prefersReducedMotion) {
          startAutoplay();
        }
      });

      // Mouse events (para teste em desktop)
      slide.addEventListener("mousedown", () => {
        isPressing = true;
        pauseAutoplay();
      });

      slide.addEventListener("mouseup", () => {
        isPressing = false;
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        if (!prefersReducedMotion) {
          startAutoplay();
        }
      });

      // Mouse leave (caso o usuário saia do card enquanto segura)
      slide.addEventListener("mouseleave", () => {
        if (isPressing) {
          isPressing = false;
          const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;
          if (!prefersReducedMotion) {
            startAutoplay();
          }
        }
      });
    });

    // Navegação por teclado nos dots (ArrowLeft/ArrowRight)
    dots.forEach((dot) => {
      dot.addEventListener("keydown", (e) => {
        let newIndex = currentIndex;

        if (e.key === "ArrowLeft") {
          e.preventDefault();
          newIndex = currentIndex - 1;
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          newIndex = currentIndex + 1;
        } else if (e.key === "Home") {
          e.preventDefault();
          newIndex = 0;
        } else if (e.key === "End") {
          e.preventDefault();
          newIndex = slides.length - 1;
        }

        if (newIndex !== currentIndex) {
          goToSlide(newIndex);
          dots[newIndex]?.focus();
          resetAutoplay();
        }
      });
    });

    // Navegação por teclado no carrossel (setas)
    if (track) {
      track.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goPrev();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          goNext();
        }
      });
    }

    // Detecção de scroll manual (para atualizar dots)
    let scrollTimeout: number;
    track.addEventListener("scroll", () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        // Calcular qual slide está visível
        const scrollLeft = track.scrollLeft;
        const slideWidth = slides[0].offsetWidth;
        const gap = 16;
        const newIndex = Math.round(scrollLeft / (slideWidth + gap));

        if (newIndex !== currentIndex) {
          currentIndex = newIndex;
          updateDots(newIndex);
          // Atualizar classes dos slides
          slides.forEach((slide, i) => {
            if (i === newIndex) {
              slide.classList.add("active");
            } else {
              slide.classList.remove("active");
            }
          });
        }
      }, 150);
    });

    // Inicialização
    goToSlide(0, false); // Não anuncia no carregamento

    // Respeitar preferência do usuário sobre movimento reduzido
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!prefersReducedMotion) {
      startAutoplay();
    }
  }

  // 6. FAQ ACCORDION
  document.querySelectorAll(".accordion-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const content = btn.nextElementSibling as HTMLElement;
      const isExpanded = btn.getAttribute("aria-expanded") === "true";

      // Fecha todos
      document.querySelectorAll(".accordion-btn").forEach((b) => {
        b.setAttribute("aria-expanded", "false");
        const nextEl = b.nextElementSibling as HTMLElement;
        if (nextEl) nextEl.style.maxHeight = null as any;
      });

      // Abre atual se estava fechado
      if (!isExpanded) {
        btn.setAttribute("aria-expanded", "true");
        if (content) content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });

  // 7. SERVICE WORKER REGISTRATION
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✅ Service Worker registrado:", registration.scope);

          // Verificar atualizações
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  console.log(
                    "🔄 Nova versão disponível! Recarregue a página.",
                  );
                }
              });
            }
          });
        })
        .catch((error) => {
          console.log("❌ Erro ao registrar Service Worker:", error);
        });
    });
  }

  // 8. PWA INSTALL PROMPT
  let deferredPrompt: any;
  const pwaPromptShown = localStorage.getItem("pwaPromptShown");

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Mostrar prompt após 10 segundos se não foi mostrado antes
    if (!pwaPromptShown) {
      setTimeout(showPWAPrompt, 10000);
    }
  });

  function showPWAPrompt() {
    if (!deferredPrompt) return;

    const promptHTML = `
      <div class="pwa-install-prompt" id="pwa-prompt">
        <div class="pwa-prompt-content">
          <div class="pwa-prompt-icon">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          <div class="pwa-prompt-text">
            <h4>Instalar Baby Book</h4>
            <p>Acesse offline e tenha uma experiência melhor</p>
          </div>
        </div>
        <div class="pwa-prompt-actions">
          <button class="pwa-prompt-btn pwa-prompt-dismiss" id="pwa-dismiss">Agora Não</button>
          <button class="pwa-prompt-btn pwa-prompt-install" id="pwa-install">Instalar</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", promptHTML);

    const prompt = document.getElementById("pwa-prompt");
    setTimeout(() => prompt?.classList.add("show"), 100);

    document
      .getElementById("pwa-install")
      ?.addEventListener("click", async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        console.log(`PWA install prompt: ${outcome}`);
        trackEvent({
          category: "PWA",
          action: "install_prompt",
          label: outcome,
        });

        deferredPrompt = null;
        prompt?.remove();
        localStorage.setItem("pwaPromptShown", "true");
      });

    document.getElementById("pwa-dismiss")?.addEventListener("click", () => {
      prompt?.remove();
      localStorage.setItem("pwaPromptShown", "true");
      trackEvent({ category: "PWA", action: "dismiss_prompt" });
    });
  }

  // 9. EXIT INTENT POPUP (Estratégico)
  let exitIntentShown = false;
  let hasScrolledPast50 = false;
  let hasViewedPricing = false;
  let timeOnSite = 0;
  const exitPopup = document.getElementById("exit-popup");
  const exitPopupClose = exitPopup?.querySelector(".exit-popup-close");
  const exitPopupOverlay = exitPopup?.querySelector(".exit-popup-overlay");
  const exitPopupForm = document.getElementById(
    "exit-popup-form",
  ) as HTMLFormElement;

  // Rastrear tempo no site
  setInterval(() => {
    timeOnSite += 1;
  }, 1000);

  // Rastrear scroll profundidade
  window.addEventListener("scroll", () => {
    const scrollPercent =
      (window.pageYOffset /
        (document.documentElement.scrollHeight - window.innerHeight)) *
      100;
    if (scrollPercent > 50) {
      hasScrolledPast50 = true;
    }
  });

  // Rastrear visualização da seção de preço
  const pricingSection = document.getElementById("pricing");
  if (pricingSection) {
    const pricingObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            hasViewedPricing = true;
          }
        });
      },
      { threshold: 0.5 },
    );
    pricingObserver.observe(pricingSection);
  }

  // Condições estratégicas para mostrar o popup
  const shouldShowPopup = () => {
    // Só mostrar se:
    // 1. Passou de 50% da página OU viu a seção de preço
    // 2. Está no site há pelo menos 30 segundos
    // 3. Ainda não foi mostrado
    return (
      (hasScrolledPast50 || hasViewedPricing) &&
      timeOnSite >= 30 &&
      !exitIntentShown
    );
  };

  // Detectar movimento do mouse para o topo (intenção de sair) - COM VALIDAÇÃO
  document.addEventListener("mouseleave", (e) => {
    if (e.clientY <= 0 && shouldShowPopup() && exitPopup) {
      showExitPopup();
    }
  });

  // Timeout mais longo e condicional (5 minutos E condições atendidas)
  setTimeout(() => {
    if (shouldShowPopup() && exitPopup) {
      showExitPopup();
    }
  }, 300000); // 5 minutos

  function showExitPopup() {
    if (!exitPopup) return;

    exitIntentShown = true;
    exitPopup.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    trackEvent({ category: "Exit Intent", action: "popup_shown" });
  }

  function hideExitPopup() {
    if (!exitPopup) return;

    exitPopup.classList.add("hidden");
    document.body.style.overflow = "";
  }

  exitPopupClose?.addEventListener("click", () => {
    hideExitPopup();
    trackEvent({ category: "Exit Intent", action: "popup_closed" });
  });

  exitPopupOverlay?.addEventListener("click", () => {
    hideExitPopup();
    trackEvent({ category: "Exit Intent", action: "popup_closed_overlay" });
  });

  exitPopupForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById(
      "exit-email",
    ) as HTMLInputElement;
    const email = emailInput?.value;

    if (email) {
      // Aqui você integraria com seu backend/API
      console.log("Email capturado:", email);

      trackEvent({
        category: "Exit Intent",
        action: "email_submitted",
        label: email,
      });

      // Mostrar mensagem de sucesso
      const successMessage = `
        <div style="text-align: center; padding: 2rem;">
          <svg class="w-16 h-16 mx-auto text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Perfeito! 🎉</h3>
          <p class="text-gray-600">Enviamos seu cupom de 20% de desconto para <strong>${email}</strong></p>
          <p class="text-sm text-gray-500 mt-4">Verifique sua caixa de entrada (e spam também!)</p>
        </div>
      `;

      if (exitPopup) {
        const exitPopupContent = exitPopup.querySelector(".exit-popup-content");
        if (exitPopupContent) {
          exitPopupContent.innerHTML = successMessage;
        }
      }

      setTimeout(() => {
        hideExitPopup();
      }, 3000);
    }
  });

  // Fechar popup com ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !exitPopup?.classList.contains("hidden")) {
      hideExitPopup();
      trackEvent({ category: "Exit Intent", action: "popup_closed_esc" });
    }
  });
});
