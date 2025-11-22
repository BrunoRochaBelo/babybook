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

document.addEventListener("DOMContentLoaded", () => {
  // 1. OBSERVER GENÉRICO (Fade In Up) - Ajustado para melhor timing
  const observerOptions = {
    threshold: 0.15, // Ligeiramente mais alto para trigger mais cedo
    rootMargin: "0px 0px -80px 0px", // Maior margem para trigger mais natural
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  document
    .querySelectorAll(".fade-in-up")
    .forEach((el) => observer.observe(el));

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

      // FASE 1: Texto (0.32) - Balanceado
      if (progress > 0.32) {
        if (highlight) {
          highlight.style.color = "#F2995D"; // Using accent color
          highlight.innerText = "Só precisava caber na vida real.";
        }
        if (text1) text1.classList.add("opacity-30"); // Esmaece texto antigo
        if (text2) text2.classList.remove("opacity-30"); // Revela texto novo
      } else {
        if (highlight) {
          highlight.style.color = "#9CA3AF";
          highlight.innerText = "Só precisava caber na vida real."; // Mantem texto, muda cor
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
          const circle = item.querySelector("div");
          if (circle) {
            circle.classList.remove("border-gray-200", "text-gray-400");
            circle.classList.add("border-indigo-600", "text-ink");
          }
          // Ativa a cor do texto
          const textContainer = item.querySelector("div:last-child");
          if (textContainer) {
            const title = textContainer.querySelector("h3");
            const description = textContainer.querySelector("p");
            if (title) {
              title.classList.remove("text-gray-400");
              title.classList.add("text-ink");
            }
            if (description) {
              description.classList.remove("text-gray-400");
              description.classList.add("text-gray-600");
            }
          }
        } else {
          // Se o usuário rolar para cima, desativa (opcional)
          if (index > 0) {
            // Mantém o primeiro sempre ativo se quiser
            item.classList.remove("active");
            const circle = item.querySelector("div");
            if (circle) {
              circle.classList.remove("border-indigo-600", "text-ink");
              circle.classList.add("border-gray-200", "text-gray-400");
            }
            // Desativa a cor do texto
            const textContainer = item.querySelector("div:last-child");
            if (textContainer) {
              const title = textContainer.querySelector("h3");
              const description = textContainer.querySelector("p");
              if (title) {
                title.classList.remove("text-ink");
                title.classList.add("text-gray-400");
              }
              if (description) {
                description.classList.remove("text-gray-600");
                description.classList.add("text-gray-400");
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
});
