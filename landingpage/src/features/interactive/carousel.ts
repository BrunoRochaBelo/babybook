import { prefersReducedMotion } from "../../utils/helpers";
import { CONFIG } from "../../utils/config";
import { logger, withElement } from "../../utils/logger";

// === CARROSSEL MOBILE (Seção Famílias) ===
export const setupCarousel = () => {
  withElement(
    "#families-carousel",
    () => {
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

      if (!track || !slides.length) {
        logger.warn("Carousel: Missing required elements");
        return;
      }

      let currentIndex = 0;
      let autoplayInterval: number | null = null;
      let isPressing = false;
      const AUTOPLAY_DELAY = CONFIG.carousel.autoplayDelay;

      function goToSlide(index: number, announce: boolean = true) {
        if (index < 0) {
          index = slides.length - 1;
        } else if (index >= slides.length) {
          index = 0;
        }

        currentIndex = index;

        const slideWidth = slides[0].offsetWidth;
        const gap = CONFIG.carousel.slideGap;
        const scrollPosition = (slideWidth + gap) * index;
        track.scrollTo({
          left: scrollPosition,
          behavior: CONFIG.carousel.scrollBehavior,
        });

        slides.forEach((slide, i) => {
          if (i === index) {
            slide.classList.add("active");
          } else {
            slide.classList.remove("active");
          }
        });

        updateDots(index);

        if (announce && liveRegion) {
          liveRegion.textContent = `Slide ${index + 1} de ${slides.length}`;
        }
      }

      function updateDots(activeIndex: number) {
        dots.forEach((dot, i) => {
          const isActive = i === activeIndex;
          dot.setAttribute("aria-selected", isActive.toString());
          dot.tabIndex = isActive ? 0 : -1;
        });
      }

      function goPrev() {
        goToSlide(currentIndex - 1);
        resetAutoplay();
      }

      function goNext() {
        goToSlide(currentIndex + 1);
        resetAutoplay();
      }

      function startAutoplay() {
        if (autoplayInterval || isPressing) return;
        autoplayInterval = window.setInterval(() => {
          goNext();
        }, AUTOPLAY_DELAY);
      }

      function pauseAutoplay() {
        if (autoplayInterval) {
          clearInterval(autoplayInterval);
          autoplayInterval = null;
        }
      }

      function resetAutoplay() {
        pauseAutoplay();
        if (!prefersReducedMotion() && !isPressing) {
          startAutoplay();
        }
      }

      if (prevBtn) prevBtn.addEventListener("click", goPrev);
      if (nextBtn) nextBtn.addEventListener("click", goNext);

      dots.forEach((dot) => {
        dot.addEventListener("click", () => {
          const index = parseInt(dot.getAttribute("data-index") || "0", 10);
          goToSlide(index);
          resetAutoplay();
        });
      });

      slides.forEach((slide) => {
        slide.addEventListener("touchstart", () => {
          isPressing = true;
          pauseAutoplay();
        });

        slide.addEventListener("touchend", () => {
          isPressing = false;
          if (!prefersReducedMotion()) {
            startAutoplay();
          }
        });

        slide.addEventListener("mousedown", () => {
          isPressing = true;
          pauseAutoplay();
        });

        slide.addEventListener("mouseup", () => {
          isPressing = false;
          if (!prefersReducedMotion()) {
            startAutoplay();
          }
        });

        slide.addEventListener("mouseleave", () => {
          if (isPressing) {
            isPressing = false;
            if (!prefersReducedMotion()) {
              startAutoplay();
            }
          }
        });
      });

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

      let scrollTimeout: number;
      track.addEventListener("scroll", () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = window.setTimeout(() => {
          const scrollLeft = track.scrollLeft;
          const slideWidth = slides[0].offsetWidth;
          const gap = 16;
          const newIndex = Math.round(scrollLeft / (slideWidth + gap));

          if (newIndex !== currentIndex) {
            currentIndex = newIndex;
            updateDots(newIndex);
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

      goToSlide(0, false);

      if (!prefersReducedMotion()) {
        startAutoplay();
      }

      logger.info("Carousel initialized", { slidesCount: slides.length });
    },
    "Carousel: #families-carousel not found",
  );
};
