import { logger } from "../utils/logger";

// === PREMIUM: Preload de Fontes Críticas via JavaScript ===
export const preloadCriticalFonts = () => {
  const fonts = [
    {
      name: "Inter",
      url: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2",
    },
    {
      name: "Lora",
      url: "https://fonts.gstatic.com/s/lora/v32/0QI6MX1D_JOuGQbT0gvTJPa787weuxJBkq0.woff2",
    },
  ];

  fonts.forEach((font) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "font";
    link.type = "font/woff2";
    link.crossOrigin = "anonymous";
    link.href = font.url;

    document.head.appendChild(link);
  });

  logger.info(`Preloaded ${fonts.length} critical fonts`);
};

// === PREMIUM: Otimização de Vídeo do Hero ===
export const optimizeHeroVideo = () => {
  const video = document.querySelector<HTMLVideoElement>(
    ".hero-section video"
  );

  if (!video) {
    logger.warn("Hero video not found");
    return;
  }

  // Adiciona preload metadata
  video.preload = "metadata";

  // Pausa vídeo quando fora do viewport (economia de bateria)
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            // Ignora erro se autoplay bloqueado
          });
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.25 }
  );

  observer.observe(video);

  logger.info("Hero video optimized");
};

// === PREMIUM: Skeleton Screens ===
export const setupSkeletonScreens = () => {
  // Skeleton para cards dos livros
  const bookCards = document.querySelectorAll<HTMLElement>(".book-card");

  bookCards.forEach((card) => {
    // Adiciona classe de loading inicialmente
    card.classList.add("skeleton-loading");

    // Remove skeleton quando conteúdo carrega
    // (simulando carregamento de CSS module)
    setTimeout(() => {
      card.classList.remove("skeleton-loading");
      card.classList.add("skeleton-loaded");
    }, 100);
  });

  logger.info(`Skeleton screens setup for ${bookCards.length} cards`);
};

// === PREMIUM: Transições entre Seções ===
export const setupSectionTransitions = () => {
  const sections = document.querySelectorAll<HTMLElement>("section");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const section = entry.target as HTMLElement;

        if (entry.isIntersecting) {
          section.classList.add("section-in-view");
          section.classList.remove("section-out-view");
        } else {
          section.classList.remove("section-in-view");
          section.classList.add("section-out-view");
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "-10% 0px -10% 0px",
    }
  );

  sections.forEach((section) => {
    observer.observe(section);
  });

  logger.info(`Section transitions setup for ${sections.length} sections`);
};

// === PREMIUM: Parallax no Mouse Expandido ===
export const setupMouseParallax = () => {
  // Elementos que terão parallax
  const parallaxElements = document.querySelectorAll<HTMLElement>(
    ".hero-orb, .hero-particles"
  );

  if (parallaxElements.length === 0) {
    logger.warn("No parallax elements found");
    return;
  }

  let mouseX = 0;
  let mouseY = 0;
  let currentX = 0;
  let currentY = 0;

  // Smooth mouse tracking
  const handleMouseMove = (e: MouseEvent) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  };

  // Animação suave com requestAnimationFrame
  const animate = () => {
    // Interpolação suave
    currentX += (mouseX - currentX) * 0.05;
    currentY += (mouseY - currentY) * 0.05;

    parallaxElements.forEach((element, index) => {
      // Força diferente para cada elemento
      const strength = (index + 1) * 10;

      // Movimento inverso para criar profundidade
      const x = -currentX * strength;
      const y = -currentY * strength;

      element.style.transform = `translate(${x}px, ${y}px)`;
    });

    requestAnimationFrame(animate);
  };

  // Apenas em desktop
  if (window.innerWidth > 768) {
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    animate();

    logger.info(
      `Mouse parallax enabled for ${parallaxElements.length} elements`
    );
  }
};
