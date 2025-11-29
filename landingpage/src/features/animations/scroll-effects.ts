import { prefersReducedMotion } from "../../utils/helpers";

// === CHAOS TO ORDER ===
export const setupChaosToOrder = () => {
  const chaosSection = document.querySelector(".chaos-container");
  const photos = document.querySelectorAll(".photo-scatter");
  const text1 = document.getElementById("chaos-text-1");
  const text2 = document.getElementById("chaos-text-2");
  const highlight = document.getElementById("chaos-highlight");

  if (!chaosSection) return;

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        ticking = false;
      });
      ticking = true;
    }
    const rect = chaosSection.getBoundingClientRect();
    const progress = Math.max(
      0,
      Math.min(1, -rect.top / (rect.height - window.innerHeight)),
    );

    // FASE 1: Texto (0.32)
    if (progress > 0.32) {
      if (highlight) {
        highlight.style.color = "#F59E0B";
        highlight.innerText = "Só precisava caber na vida real.";
      }
      if (text1) text1.classList.add("opacity-30");
      if (text2) text2.classList.remove("opacity-30");
    } else {
      if (highlight) {
        highlight.style.color = "#6B7280";
        highlight.innerText = "Só precisava caber na vida real.";
      }
      if (text1) text1.classList.remove("opacity-30");
      if (text2) text2.classList.add("opacity-30");
    }

    // FASE 2: Fotos (0.62)
    if (progress > 0.62) {
      photos.forEach((p) => p.classList.add("organized"));
    } else {
      photos.forEach((p) => p.classList.remove("organized"));
    }
  });
};

// === HORIZONTAL SCROLL & VAULT UNLOCK ===
export const setupHorizontalScroll = () => {
  const scrollSection = document.querySelector(
    ".horizontal-scroll-section",
  ) as HTMLElement;
  const track = document.querySelector(".horizontal-track") as HTMLElement;
  const vaultCard = document.getElementById("vault-card");

  if (!scrollSection || !track || !vaultCard) return;

  let ticking2 = false;
  let scrollEndTimeout: number | null = null;
  let isSnapping = false;
  const lockedMode = true; // forces discrete (card-by-card) mapping for the track
  let currentCenteredIndex = 0;
  let lastSnapTime = 0;
  const SNAP_COOLDOWN = 800; // ms - slightly longer than transition duration for smoother feel
  const WHEEL_THRESHOLD = 10; // deltaY threshold to trigger
  const slides = Array.from(track.querySelectorAll('.book-card')) as HTMLElement[];
  // Make track focusable for keyboard navigation
  if (!track.hasAttribute('tabindex')) track.setAttribute('tabindex', '0');

  const windowCenter = () => window.innerWidth / 2;

  function updateSlidesScale() {
    if (!slides.length) return;
    let closestIndex = 0;
    let minDistance = Infinity;

    slides.forEach((slide, i) => {
      const rect = slide.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const distance = Math.abs(center - windowCenter());
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    });

    // Apply scale via CSS var --tilt-scale so we keep the tilt effect
    slides.forEach((slide, i) => {
      if (i === closestIndex) {
        slide.style.setProperty('--tilt-scale', '1');
        slide.classList.add('is-center');
        slide.classList.remove('is-adjacent');
        slide.setAttribute('aria-current', 'true');
        slide.setAttribute('aria-hidden', 'false');
        currentCenteredIndex = closestIndex;
      } else if (Math.abs(i - closestIndex) === 1) {
        slide.style.setProperty('--tilt-scale', '0.85');
        slide.classList.add('is-adjacent');
        slide.classList.remove('is-center');
        slide.setAttribute('aria-current', 'false');
        slide.setAttribute('aria-hidden', 'false');
      } else {
        slide.style.setProperty('--tilt-scale', '0.85');
        slide.classList.remove('is-center');
        slide.classList.remove('is-adjacent');
        slide.setAttribute('aria-current', 'false');
        slide.setAttribute('aria-hidden', 'true');
      }
    });
  }

  function snapToNearest() {
    if (!slides.length) return;
    // Find nearest slide
    let closestIndex = 0;
    let minDistance = Infinity;
    slides.forEach((slide, i) => {
      const rect = slide.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const distance = Math.abs(center - windowCenter());
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    });

    // Compute target move amount so center aligns
    const targetSlide = slides[closestIndex];
    const slideOffsetLeft = targetSlide.offsetLeft;
    const slideCenter = slideOffsetLeft + targetSlide.offsetWidth / 2;
    let targetMoveAmount = slideCenter - windowCenter();
    const maxMove = Math.max(0, track.scrollWidth - window.innerWidth);
    if (targetMoveAmount < 0) targetMoveAmount = 0;
    if (targetMoveAmount > maxMove) targetMoveAmount = maxMove;

    // Animate snapping
    isSnapping = true;
    track.style.transition = 'transform 650ms cubic-bezier(0.2, 0.8, 0.2, 1)';
    track.style.transform = `translateX(-${targetMoveAmount}px)`;
    // Remove transition after done
    setTimeout(() => {
      track.style.transition = '';
      isSnapping = false;
      updateSlidesScale();
    }, 680);
  }

  function snapToOffsetDirection(direction: number) {
    // direction: 1 -> next, -1 -> previous
    const now = Date.now();
    if (now - lastSnapTime < SNAP_COOLDOWN) return;
    let nextIndex = currentCenteredIndex + direction;
    if (nextIndex < 0) nextIndex = 0;
    if (nextIndex > slides.length - 1) nextIndex = slides.length - 1;
    if (nextIndex === currentCenteredIndex) return;
    lastSnapTime = now;
    snapToIndex(nextIndex);
  }

  function snapToIndex(index: number) {
    if (!slides[index]) return;
    const targetSlide = slides[index];
    const slideOffsetLeft = targetSlide.offsetLeft;
    const slideCenter = slideOffsetLeft + targetSlide.offsetWidth / 2;
    let targetMoveAmount = slideCenter - windowCenter();
    const maxMove = Math.max(0, track.scrollWidth - window.innerWidth);
    if (targetMoveAmount < 0) targetMoveAmount = 0;
    if (targetMoveAmount > maxMove) targetMoveAmount = maxMove;

    isSnapping = true;
    track.style.transition = 'transform 650ms cubic-bezier(0.2, 0.8, 0.2, 1)';
    track.style.transform = `translateX(-${targetMoveAmount}px)`;
    setTimeout(() => {
      track.style.transition = '';
      isSnapping = false;
      updateSlidesScale();
    }, 680);
  }

  // Initial alignment on load
  updateSlidesScale();
  // Ensure first slide starts centered
  setTimeout(() => snapToNearest(), 50);

  // Re-evaluate on resize
  window.addEventListener('resize', () => {
    if (scrollEndTimeout) window.clearTimeout(scrollEndTimeout);
    updateSlidesScale();
    // Ensure we snap after a resize
    scrollEndTimeout = window.setTimeout(() => snapToNearest(), 300);
  });

  // Click to focus behavior per card
  slides.forEach((slide, i) => {
    slide.addEventListener('click', () => snapToIndex(i));
    slide.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        snapToIndex(i);
      }
    });
  });

  // Wheel handling (desktop) - convert wheel direction to next/prev snap
  let wheelHandler = (e: WheelEvent) => {
    const rect = scrollSection.getBoundingClientRect();
    const sectionHeight = scrollSection.offsetHeight - window.innerHeight;
    const rawPercentage = Math.max(0, Math.min(1, -rect.top / sectionHeight));
    // Only respond when within the section (start visible to end)
    if (rawPercentage <= 0 || rawPercentage >= 1) return;

    if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;
    const direction = e.deltaY > 0 ? 1 : -1;
    snapToOffsetDirection(direction);
  };

  // Attach wheel only when the page is within the section
  window.addEventListener('wheel', wheelHandler, { passive: true });

  // Touch handling (mobile)
  let touchStartY: number | null = null;
  let touchStartTime = 0;
  scrollSection.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length > 0) {
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }
  }, { passive: true });

  scrollSection.addEventListener('touchend', (e) => {
    if (touchStartY === null) return;
    const touchEndTime = Date.now();
    const duration = touchEndTime - touchStartTime;
    // if changed, get last touch Y using changedTouches
    const changed = (e.changedTouches && e.changedTouches[0]) || null;
    if (!changed) {
      touchStartY = null;
      return;
    }
    const deltaY = touchStartY - changed.clientY;
    // quick swipe or sufficient distance
    const minDistance = 18; // px
    const isSwipe = Math.abs(deltaY) > minDistance || duration < 350;
    if (isSwipe) {
      const direction = deltaY > 0 ? 1 : -1;
      snapToOffsetDirection(direction);
    }
    touchStartY = null;
  }, { passive: true });

  // Keyboard navigation (left/right arrows) when track is focused
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      snapToOffsetDirection(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      snapToOffsetDirection(-1);
    }
  });
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

    let movePercentage = 0;

    if (rawPercentage < 0.68) {
      const normalized = rawPercentage / 0.68;
      movePercentage = 1 - Math.pow(1 - normalized, 3);
    } else {
      movePercentage = 1;
    }

    const moveAmount = movePercentage * (track.scrollWidth - window.innerWidth);
    // Locked mode: when inside the section we avoid continuous mapping; rely on snaps only
    if (!isSnapping) {
      if (!lockedMode) {
        track.style.transform = `translateX(-${moveAmount}px)`;
      } else {
        // Maintain current snapped index position while user scrolls
        const currentSlide = slides[currentCenteredIndex];
        if (currentSlide) {
          const slideCenter = currentSlide.offsetLeft + currentSlide.offsetWidth / 2;
          let targetMoveAmount = slideCenter - windowCenter();
          const maxMove = Math.max(0, track.scrollWidth - window.innerWidth);
          if (targetMoveAmount < 0) targetMoveAmount = 0;
          if (targetMoveAmount > maxMove) targetMoveAmount = maxMove;
          track.style.transform = `translateX(-${targetMoveAmount}px)`;
        }
      }
    }

    // Update scales while scrolling
    updateSlidesScale();

    // Snap on scroll end (debounce)
    if (scrollEndTimeout) window.clearTimeout(scrollEndTimeout);
    scrollEndTimeout = window.setTimeout(() => {
      snapToNearest();
    }, 260);

    const lockIcon = vaultCard.querySelector(
      ".vault-locked .text-5xl",
    ) as HTMLElement;

    // Fase 2: Destrancar (68% a 90%)
    if (rawPercentage > 0.68 && rawPercentage <= 0.9) {
      if (lockIcon) lockIcon.classList.remove("animate-bounce");

      const tension = (rawPercentage - 0.68) / 0.22;
      const shake = tension * 5;
      const randomX = (Math.random() - 0.5) * shake;
      const randomY = (Math.random() - 0.5) * shake;
      const scale = 1 - tension * 0.1;

      if (lockIcon) {
        lockIcon.style.transform = `translate(${randomX}px, ${randomY}px) scale(${scale})`;
      }
    } else if (rawPercentage <= 0.68) {
      vaultCard.classList.remove("is-unlocked");
      if (lockIcon) {
        lockIcon.style.transform = "none";
        lockIcon.classList.add("animate-bounce");
      }
    }

    // Fase 3: Abrir (90% a 100%)
    if (rawPercentage > 0.9) {
      vaultCard.classList.add("is-open");
      const lockedState = vaultCard.querySelector(
        ".vault-locked",
      ) as HTMLElement;
      if (lockedState) lockedState.style.opacity = "0";
      if (lockIcon) lockIcon.style.transform = "scale(1.2)";
    } else {
      vaultCard.classList.remove("is-open");
      const lockedState = vaultCard.querySelector(
        ".vault-locked",
      ) as HTMLElement;
      if (lockedState) lockedState.style.opacity = "1";
    }
  });
};

// === TIMELINE DRAW ON SCROLL ===
export const setupTimelineDraw = () => {
  const timelineSection = document.getElementById("how-it-works-section");
  const timelineContainer = document.getElementById("timeline-container");
  const progressBar = document.getElementById("timeline-progress");
  const stepItems = document.querySelectorAll(".step-item");
  const timelineBackground = document.querySelector(
    ".timeline-background",
  ) as HTMLElement;

  if (!timelineSection || !timelineContainer || !progressBar) return;

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

    const sectionProgress = Math.max(
      0,
      Math.min(1, -sectionRect.top / sectionHeight),
    );

    if (timelineBackground) {
      const parallaxY = sectionProgress * 100;
      timelineBackground.style.transform = `translateY(${parallaxY}px) scale(${1 + sectionProgress * 0.1})`;
    }

    let timelinePercentage = Math.min(100, (sectionProgress / 0.86) * 100);
    progressBar.style.height = `${timelinePercentage}%`;

    const containerHeight = timelineContainer.offsetHeight;
    stepItems.forEach((item, index) => {
      const itemTop = (item as HTMLElement).offsetTop;
      const currentLineHeight = (timelinePercentage / 100) * containerHeight;

      if (currentLineHeight >= itemTop - 50) {
        item.classList.add("active");
        const circle = item.querySelector(".step-circle");
        if (circle) {
          circle.classList.remove("border-gray-300", "text-gray-500");
          circle.classList.add("border-indigo-600", "text-ink");
        }
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
        if (index > 0) {
          item.classList.remove("active");
          const circle = item.querySelector(".step-circle");
          if (circle) {
            circle.classList.remove("border-indigo-600", "text-ink");
            circle.classList.add("border-gray-300", "text-gray-500");
          }
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
};

// === OBSERVER GENÉRICO (Fade In Up) ===
export const setupScrollAnimations = () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -100px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        const parentSection = element.closest("section");

        const isSpecialSection =
          parentSection &&
          (parentSection.id === "hero-stage" ||
            parentSection.classList.contains("hero-stage") ||
            parentSection.classList.contains("horizontal-scroll-section") ||
            parentSection.classList.contains("pricing-parallax"));

        if (!parentSection || isSpecialSection) {
          element.classList.add("visible");
          observer.unobserve(element);
        } else {
          let attempts = 0;
          const maxAttempts = 30;

          const checkAndAnimate = () => {
            if (
              parentSection.classList.contains("section-ready") ||
              attempts >= maxAttempts
            ) {
              element.classList.add("visible");
              observer.unobserve(element);
            } else {
              attempts++;
              setTimeout(checkAndAnimate, 100);
            }
          };
          checkAndAnimate();
        }
      }
    });
  }, observerOptions);

  if (!prefersReducedMotion()) {
    document
      .querySelectorAll(
        ".fade-in-up, .fade-in-left, .fade-in-right, .scale-in, .rotate-in",
      )
      .forEach((el) => observer.observe(el));
  } else {
    document
      .querySelectorAll(
        ".fade-in-up, .fade-in-left, .fade-in-right, .scale-in, .rotate-in",
      )
      .forEach((el) => el.classList.add("visible"));
  }
};
