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

      const cleanupFns: Array<() => void> = [];

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

      if (prevBtn) {
        prevBtn.addEventListener("click", goPrev);
        cleanupFns.push(() => prevBtn.removeEventListener("click", goPrev));
      }
      if (nextBtn) {
        nextBtn.addEventListener("click", goNext);
        cleanupFns.push(() => nextBtn.removeEventListener("click", goNext));
      }

      dots.forEach((dot) => {
        const onDotClick = () => {
          const index = parseInt(dot.getAttribute("data-index") || "0", 10);
          goToSlide(index);
          resetAutoplay();
        };
        dot.addEventListener("click", onDotClick);
        cleanupFns.push(() => dot.removeEventListener("click", onDotClick));

        const onDotKeydown = (e: KeyboardEvent) => {
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
        };
        dot.addEventListener("keydown", onDotKeydown);
        cleanupFns.push(() => dot.removeEventListener("keydown", onDotKeydown));
      });

      slides.forEach((slide) => {
        const onTouchStart = () => {
          isPressing = true;
          pauseAutoplay();
        };
        slide.addEventListener("touchstart", onTouchStart, { passive: true });
        cleanupFns.push(() =>
          slide.removeEventListener("touchstart", onTouchStart),
        );

        const onTouchEnd = () => {
          isPressing = false;
          if (!prefersReducedMotion()) {
            startAutoplay();
          }
        };
        slide.addEventListener("touchend", onTouchEnd, { passive: true });
        cleanupFns.push(() =>
          slide.removeEventListener("touchend", onTouchEnd),
        );

        const onMouseDown = () => {
          isPressing = true;
          pauseAutoplay();
        };
        slide.addEventListener("mousedown", onMouseDown);
        cleanupFns.push(() =>
          slide.removeEventListener("mousedown", onMouseDown),
        );

        const onMouseUp = () => {
          isPressing = false;
          if (!prefersReducedMotion()) {
            startAutoplay();
          }
        };
        slide.addEventListener("mouseup", onMouseUp);
        cleanupFns.push(() => slide.removeEventListener("mouseup", onMouseUp));

        const onMouseLeave = () => {
          if (isPressing) {
            isPressing = false;
            if (!prefersReducedMotion()) {
              startAutoplay();
            }
          }
        };
        slide.addEventListener("mouseleave", onMouseLeave);
        cleanupFns.push(() =>
          slide.removeEventListener("mouseleave", onMouseLeave),
        );
      });

      const trackKeydownHandler = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goPrev();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          goNext();
        }
      };
      track.addEventListener("keydown", trackKeydownHandler);
      cleanupFns.push(() =>
        track.removeEventListener("keydown", trackKeydownHandler),
      );

      let scrollTimeout: number | null = null;
      const trackScrollHandler = () => {
        if (scrollTimeout !== null) {
          window.clearTimeout(scrollTimeout);
        }
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
      };
      track.addEventListener("scroll", trackScrollHandler);
      cleanupFns.push(() =>
        track.removeEventListener("scroll", trackScrollHandler),
      );

      goToSlide(0, false);

      if (!prefersReducedMotion()) {
        startAutoplay();
      }

      logger.info("Carousel initialized", { slidesCount: slides.length });

      return () => {
        pauseAutoplay();
        if (scrollTimeout !== null) {
          window.clearTimeout(scrollTimeout);
          scrollTimeout = null;
        }
        cleanupFns.forEach((fn) => fn());
      };
    },
    "Carousel: #families-carousel not found",
  );
};
