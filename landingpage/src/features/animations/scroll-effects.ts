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
  const onScroll = () => {
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
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    window.removeEventListener("scroll", onScroll);
    photos.forEach((p) => p.classList.remove("organized"));
    if (text1) text1.classList.remove("opacity-30");
    if (text2) text2.classList.remove("opacity-30");
    if (highlight) highlight.style.color = "";
  };
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

  // Vault thresholds - how much of the section needs to be scrolled to start unlock and to open
  const VAULT_UNLOCK_START = 0.55; // lower threshold so less scroll required
  const VAULT_OPEN_START = 0.82; // open at lower threshold to reduce amount of scroll
  // how close to the section edges (0..1) the user must be to allow exiting the horizontal section quickly
  const SECTION_EXIT_BUFFER = 0.06; // allow exiting when within 6% of top/bottom

  // Sensitivity presets (can be toggled by data-sensitivity attribute on the section)
  const SENSITIVITY_PRESETS = {
    default: {
      WHEEL_THRESHOLD: 10,
      DRAG_THRESHOLD: 20,
      DRAG_THRESHOLD_TOUCH_SMALL: 28,
      VELOCITY_THRESHOLD: 0.5,
    },
    aggressive: {
      WHEEL_THRESHOLD: 6,
      DRAG_THRESHOLD: 12,
      DRAG_THRESHOLD_TOUCH_SMALL: 20,
      VELOCITY_THRESHOLD: 0.35,
    },
    permissive: {
      WHEEL_THRESHOLD: 16,
      DRAG_THRESHOLD: 28,
      DRAG_THRESHOLD_TOUCH_SMALL: 36,
      VELOCITY_THRESHOLD: 0.8,
    },
  } as const;

  const detectedMode =
    (scrollSection.getAttribute(
      "data-sensitivity",
    ) as keyof typeof SENSITIVITY_PRESETS) ||
    (window.innerWidth >= 1024 ? "aggressive" : "default");
  const thresholds = SENSITIVITY_PRESETS[detectedMode];
  let WHEEL_THRESHOLD = thresholds.WHEEL_THRESHOLD; // deltaY threshold to trigger
  const slides = Array.from(
    track.querySelectorAll(".book-card"),
  ) as HTMLElement[];
  // Keep a reference to the lock icon (vault hold) so we can toggle animations across handlers
  const lockIcon = vaultCard.querySelector(
    ".vault-locked .text-6xl",
  ) as HTMLElement | null;
  const reduceMotion = prefersReducedMotion();

  // Throttled setter using requestAnimationFrame to reduce style thrash
  let pendingTension = 0;
  let rafId: number | null = null;
  function flushVaultResistance() {
    if (!lockIcon) return;
    const tRaw = Math.max(0, Math.min(1, pendingTension));
    // Apply non-linear mapping for a more elastic feel
    const t = Math.pow(tRaw, 1.6);
    // Map to pixel shake amplitude & rotation degrees
    const minShake = 2; // px
    const maxShake = 14; // px
    const minRotate = 0.5; // degrees
    const maxRotate = 4; // degrees
    const shake = minShake + (maxShake - minShake) * t;
    const rotate = minRotate + (maxRotate - minRotate) * t;
    // Scale down slightly as tension increases for a 'compressing' feel
    const minScale = 0.94;
    const maxScale = 1;
    const scale = minScale + (maxScale - minScale) * (1 - t);
    lockIcon.style.setProperty("--vault-shake", `${shake}px`);
    lockIcon.style.setProperty("--vault-rotate", `${rotate}`);
    lockIcon.style.setProperty("--vault-scale", `${scale}`);
    rafId = null;
  }
  function setVaultResistance(tension: number) {
    if (reduceMotion) {
      if (lockIcon) {
        // ensure defaults cleared
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
      return;
    }
    pendingTension = Math.max(0, Math.min(1, tension));
    if (rafId === null) {
      rafId = requestAnimationFrame(flushVaultResistance);
    }
  }
  // Throttle inline transform updates for the lock icon using rAF
  let pendingTransform: string | null = null;
  let rafTransformId: number | null = null;
  function flushLockTransform() {
    if (!lockIcon) return;
    if (pendingTransform !== null) {
      lockIcon.style.transform = pendingTransform;
      pendingTransform = null;
    }
    rafTransformId = null;
  }
  function setLockInlineTransform(transform: string | null) {
    if (!lockIcon) return;
    if (transform === null) transform = "";
    pendingTransform = transform;
    if (rafTransformId === null)
      rafTransformId = requestAnimationFrame(flushLockTransform);
  }

  // initialize variables
  if (lockIcon) setVaultResistance(0);
  // Create lock indicator for visual hint during scroll-jacking
  const lockIndicator = document.createElement("div");
  lockIndicator.className = "horizontal-lock-indicator";
  lockIndicator.setAttribute("aria-hidden", "true");
  lockIndicator.innerHTML =
    "Role para navegar <span class='arrow'>&rarr;</span>";
  const stickyWrapper = scrollSection.querySelector(".sticky-wrapper");
  if (stickyWrapper) stickyWrapper.appendChild(lockIndicator);
  else scrollSection.appendChild(lockIndicator);
  // Scroll jacking state
  let scrollLocked = false;
  let enteredFromDirection: 1 | -1 | 0 = 0; // 1 = entered from top (scroll down), -1 = entered from bottom (scroll up)
  // let lastPageScrollY = window.pageYOffset; // unused: removed
  // Make track focusable for keyboard navigation
  if (!track.hasAttribute("tabindex")) track.setAttribute("tabindex", "0");

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
        slide.style.setProperty("--tilt-scale", "1");
        slide.classList.add("is-center");
        slide.classList.remove("is-adjacent");
        slide.setAttribute("aria-current", "true");
        slide.setAttribute("aria-hidden", "false");
        currentCenteredIndex = closestIndex;
        // If we are in a scroll-locked state, release lock automatically when we reached the boundary
        if (
          scrollLocked &&
          enteredFromDirection === 1 &&
          currentCenteredIndex === slides.length - 1
        ) {
          unlockScroll();
        }
        if (
          scrollLocked &&
          enteredFromDirection === -1 &&
          currentCenteredIndex === 0
        ) {
          unlockScroll();
        }
      } else if (Math.abs(i - closestIndex) === 1) {
        slide.style.setProperty("--tilt-scale", "0.85");
        slide.classList.add("is-adjacent");
        slide.classList.remove("is-center");
        slide.setAttribute("aria-current", "false");
        slide.setAttribute("aria-hidden", "false");
      } else {
        slide.style.setProperty("--tilt-scale", "0.85");
        slide.classList.remove("is-center");
        slide.classList.remove("is-adjacent");
        slide.setAttribute("aria-current", "false");
        slide.setAttribute("aria-hidden", "true");
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
    track.style.transition = "transform 650ms cubic-bezier(0.2, 0.8, 0.2, 1)";
    track.style.transform = `translateX(-${targetMoveAmount}px)`;
    // Remove transition after done
    setTimeout(() => {
      track.style.transition = "";
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
    track.style.transition = "transform 650ms cubic-bezier(0.2, 0.8, 0.2, 1)";
    track.style.transform = `translateX(-${targetMoveAmount}px)`;
    setTimeout(() => {
      track.style.transition = "";
      isSnapping = false;
      updateSlidesScale();
    }, 680);
  }

  // Initial alignment on load
  updateSlidesScale();
  // Ensure first slide starts centered
  setTimeout(() => snapToNearest(), 50);

  // Re-evaluate on resize
  const onResize = () => {
    if (scrollEndTimeout) window.clearTimeout(scrollEndTimeout);
    updateSlidesScale();
    // Ensure we snap after a resize
    scrollEndTimeout = window.setTimeout(() => snapToNearest(), 300);
  };
  window.addEventListener("resize", onResize);

  // Click to focus behavior per card
  const slideHandlers: Array<{
    el: HTMLElement;
    onClick: (ev?: MouseEvent) => void;
    onKeydown: (ev: KeyboardEvent) => void;
  }> = [];
  slides.forEach((slide, i) => {
    const onClick = () => snapToIndex(i);
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        snapToIndex(i);
      }
    };
    slide.addEventListener("click", onClick);
    slide.addEventListener("keydown", onKeydown as any);
    slideHandlers.push({ el: slide, onClick, onKeydown });
  });

  // Wheel handling (desktop) - convert wheel direction to next/prev snap
  let wheelHandler = (e: WheelEvent) => {
    const rect = scrollSection.getBoundingClientRect();
    const sectionHeight = scrollSection.offsetHeight - window.innerHeight;
    const rawPercentage = Math.max(0, Math.min(1, -rect.top / sectionHeight));
    // Only respond when within the section (start visible to end)
    if (rawPercentage <= 0 || rawPercentage >= 1) {
      if (scrollLocked) {
        unlockScroll();
      }
      return;
    }

    if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;
    const direction = e.deltaY > 0 ? 1 : -1;

    // Enter locked (scroll jacking) mode when we detect a scroll into the section
    if (!scrollLocked) {
      scrollLocked = true;
      enteredFromDirection = direction === 1 ? 1 : -1;
      document.documentElement.classList.add("horizontal-scroll-lock");
      lockIndicator.classList.add("visible");
      if (e.cancelable) e.preventDefault();
      snapToOffsetDirection(direction);
      return;
    }

    // When locked, prevent default scroll and only navigate slides via our logic
    if (e.cancelable) e.preventDefault();

    // Release lock when we reached the first/last and user keeps trying to scroll past
    if (
      enteredFromDirection === 1 &&
      currentCenteredIndex === slides.length - 1 &&
      direction === 1
    ) {
      unlockScroll();
      return;
    }
    if (
      enteredFromDirection === -1 &&
      currentCenteredIndex === 0 &&
      direction === -1
    ) {
      unlockScroll();
      return;
    }

    // Also allow releasing the lock early if user is near the top/bottom edges and is scrolling out of the
    // section (small buffer to not require 100% reach)
    if (
      scrollLocked &&
      direction === -1 &&
      rawPercentage <= SECTION_EXIT_BUFFER
    ) {
      unlockScroll();
      return;
    }
    if (
      scrollLocked &&
      direction === 1 &&
      rawPercentage >= 1 - SECTION_EXIT_BUFFER
    ) {
      unlockScroll();
      return;
    }

    snapToOffsetDirection(direction);
  };

  // Attach wheel only when the page is within the section
  window.addEventListener("wheel", wheelHandler, { passive: false });

  // Touch handling (mobile)
  let touchStartY: number | null = null;
  let touchStartTime = 0;
  // let touchMoved = false; // unused: removed
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches && e.touches.length > 0) {
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }
  };
  scrollSection.addEventListener("touchstart", onTouchStart, { passive: true });

  // Unlock helper for scroll-jacking
  function unlockScroll() {
    scrollLocked = false;
    enteredFromDirection = 0;
    document.documentElement.classList.remove("horizontal-scroll-lock");
    lockIndicator.classList.remove("visible");
    if (lockIcon) {
      lockIcon.classList.remove("is-resisting");
      setVaultResistance(0);
    }
  }

  // Use a touchmove handler (non-passive) so we can prevent default while locked (avoid page scroll)
  const onTouchMove = (e: TouchEvent) => {
    if (e.touches && e.touches.length > 0 && touchStartY !== null) {
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      const direction = deltaY > 0 ? 1 : -1;
      const rect = scrollSection.getBoundingClientRect();
      const sectionHeight = scrollSection.offsetHeight - window.innerHeight;
      const rawPercentage = Math.max(0, Math.min(1, -rect.top / sectionHeight));

      if (!scrollLocked && rawPercentage > 0 && rawPercentage < 1) {
        scrollLocked = true;
        enteredFromDirection = direction === 1 ? 1 : -1;
        document.documentElement.classList.add("horizontal-scroll-lock");
        lockIndicator.classList.add("visible");
      }

      if (scrollLocked) {
        if (e.cancelable) e.preventDefault();

        if (
          enteredFromDirection === 1 &&
          currentCenteredIndex === slides.length - 1 &&
          direction === 1
        ) {
          unlockScroll();
          return;
        }
        if (
          enteredFromDirection === -1 &&
          currentCenteredIndex === 0 &&
          direction === -1
        ) {
          unlockScroll();
          return;
        }

        // allow touch to exit the section early if near the edges
        if (direction === -1 && rawPercentage <= SECTION_EXIT_BUFFER) {
          unlockScroll();
          return;
        }
        if (direction === 1 && rawPercentage >= 1 - SECTION_EXIT_BUFFER) {
          unlockScroll();
          return;
        }

        const minDistance = 18;
        if (Math.abs(deltaY) > minDistance) {
          snapToOffsetDirection(direction);
          // reset a minimal buffer so we don't trigger repeatedly
          touchStartY = touchY; // reset baseline so user can swipe another direction
        }
      }
    }
  };
  scrollSection.addEventListener("touchmove", onTouchMove, { passive: false });

  const onTouchEnd = (e: TouchEvent) => {
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
  };
  scrollSection.addEventListener("touchend", onTouchEnd, { passive: true });

  // Keyboard navigation (left/right arrows) when track is focused
  const onTrackKeydown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      snapToOffsetDirection(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      snapToOffsetDirection(-1);
    }
  };
  track.addEventListener("keydown", onTrackKeydown as any);

  // Pointer Drag (mouse or touch) handling for horizontal swipe/drag to change slides
  let isPointerDown = false;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let pointerStartTime = 0;
  let isDragging = false;
  let dragBase = 0;
  let pointerDeviceType: string | null = null;
  let DRAG_THRESHOLD = thresholds.DRAG_THRESHOLD; // px to start recognizing a horizontal drag
  let DRAG_THRESHOLD_TOUCH_SMALL = thresholds.DRAG_THRESHOLD_TOUCH_SMALL; // px for touch on small screens
  let VELOCITY_THRESHOLD = thresholds.VELOCITY_THRESHOLD; // px per ms (≈ 500 px/s)

  function getMoveAmountForIndex(index: number) {
    const targetSlide = slides[index];
    const slideOffsetLeft = targetSlide.offsetLeft;
    const slideCenter = slideOffsetLeft + targetSlide.offsetWidth / 2;
    let targetMoveAmount = slideCenter - windowCenter();
    const maxMove = Math.max(0, track.scrollWidth - window.innerWidth);
    if (targetMoveAmount < 0) targetMoveAmount = 0;
    if (targetMoveAmount > maxMove) targetMoveAmount = maxMove;
    return targetMoveAmount;
  }

  const onPointerDown = (e: PointerEvent) => {
    // Ignore if started on buttons or interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest(
        "button, a, input, textarea, select, .book-cover, .book-close-btn",
      )
    ) {
      return;
    }
    isPointerDown = true;
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    pointerStartTime = performance.now();
    pointerDeviceType = e.pointerType;
    isDragging = false;
    dragBase = getMoveAmountForIndex(currentCenteredIndex);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  track.addEventListener("pointerdown", onPointerDown, { passive: true });

  const onPointerMove = (e: PointerEvent) => {
    if (!isPointerDown) return;
    const dx = e.clientX - pointerStartX;
    const dy = e.clientY - pointerStartY;
    // measure time if needed in future
    // start horizontal drag only if movement is mostly horizontal and exceeds threshold
    // For touch on smaller screens, require a larger threshold so small vertical scrolls
    const effectiveDragThreshold =
      pointerDeviceType === "touch" && window.innerWidth < 768
        ? DRAG_THRESHOLD_TOUCH_SMALL
        : DRAG_THRESHOLD;

    if (
      !isDragging &&
      Math.abs(dx) > Math.abs(dy) &&
      Math.abs(dx) > effectiveDragThreshold
    ) {
      isDragging = true;
      // visual cue for dragging
      track.classList.add("dragging");
      // lock scroll when we start dragging inside the section
      if (!scrollLocked) {
        scrollLocked = true;
        enteredFromDirection = dx < 0 ? 1 : -1; // if dragging left, we're going forward
        document.documentElement.classList.add("horizontal-scroll-lock");
        lockIndicator.classList.add("visible");
      }
    }

    if (isDragging) {
      // prevent default page scroll / selection
      if (e.cancelable) e.preventDefault();
      // compute temporary transform to reflect drag visually
      const move = dragBase - (e.clientX - pointerStartX);
      const maxMove = Math.max(0, track.scrollWidth - window.innerWidth);
      let clamped = Math.min(Math.max(0, move), maxMove);
      track.style.transform = `translateX(-${clamped}px)`;
      // Provide resistance feedback for the vault when dragging on the last book
      if (
        currentCenteredIndex === slides.length - 1 &&
        scrollLocked &&
        enteredFromDirection === 1 &&
        lockIcon &&
        !reduceMotion
      ) {
        lockIcon.classList.add("is-resisting");
        // compute a tension from dx relative to slide width
        const curSlideWidth = slides[currentCenteredIndex]?.offsetWidth || 300;
        const tensionDrag = Math.max(
          0,
          Math.min(1, Math.abs(dx) / (curSlideWidth * 0.7)),
        );
        setVaultResistance(tensionDrag);
      } else if (lockIcon) {
        lockIcon.classList.remove("is-resisting");
        setVaultResistance(0);
        if (reduceMotion) setLockInlineTransform("");
      }
      // compute raw percentage and allow early unlock if near page edges (dragging out)
      const rect2 = scrollSection.getBoundingClientRect();
      const sectionHeight2 = scrollSection.offsetHeight - window.innerHeight;
      const rawPct2 = Math.max(0, Math.min(1, -rect2.top / sectionHeight2));
      const moveDirection = dx < 0 ? 1 : -1;
      if (moveDirection === -1 && rawPct2 <= SECTION_EXIT_BUFFER) {
        unlockScroll();
        return;
      }
      if (moveDirection === 1 && rawPct2 >= 1 - SECTION_EXIT_BUFFER) {
        unlockScroll();
        return;
      }
    }
    // pointerLastX not used; no-op
  };
  track.addEventListener("pointermove", onPointerMove as any, {
    passive: false,
  });

  const onPointerUp = (e: PointerEvent) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch (err) {
      // ignore if not captured
    }

    if (!isDragging) {
      // This was a tap or no meaningful drag; ignore
      return;
    }
    isDragging = false;
    track.classList.remove("dragging");
    const dx = e.clientX - pointerStartX;
    const upTime = performance.now();
    const totalDt = Math.max(1, upTime - pointerStartTime);
    const avgVel = dx / totalDt; // px/ms
    const direction = dx < 0 ? 1 : -1; // dx < 0 means user dragged left -> go next
    // If user attempted to drag past boundary, it should unlock scroll
    if (
      enteredFromDirection === 1 &&
      currentCenteredIndex === slides.length - 1 &&
      direction === 1
    ) {
      unlockScroll();
      if (lockIcon) {
        lockIcon.classList.remove("is-resisting");
        setVaultResistance(0);
      }
      return;
    }
    if (
      enteredFromDirection === -1 &&
      currentCenteredIndex === 0 &&
      direction === -1
    ) {
      unlockScroll();
      if (lockIcon) {
        lockIcon.classList.remove("is-resisting");
        setVaultResistance(0);
      }
      return;
    }
    // Determine slide width to compute necessary distance threshold
    const slideWidth = slides[currentCenteredIndex]?.offsetWidth || 300;
    const distanceThreshold = slideWidth * 0.25; // 25% of width

    // If velocity or distance threshold met -> change slide
    if (
      Math.abs(dx) > distanceThreshold ||
      Math.abs(avgVel) > VELOCITY_THRESHOLD
    ) {
      snapToOffsetDirection(direction);
    } else {
      // small drag: snap back to nearest
      snapToNearest();
      if (lockIcon) {
        lockIcon.classList.remove("is-resisting");
        setVaultResistance(0);
      }
    }
    // Always clear any resistance on pointer up
    if (lockIcon) {
      lockIcon.classList.remove("is-resisting");
      setVaultResistance(0);
    }
  };
  track.addEventListener("pointerup", onPointerUp as any, { passive: true });

  const onPointerCancel = () => {
    isPointerDown = false;
    isDragging = false;
    snapToNearest();
    if (lockIcon) {
      lockIcon.classList.remove("is-resisting");
      setVaultResistance(0);
    }
  };
  track.addEventListener("pointercancel", onPointerCancel as any, {
    passive: true,
  });
  const onScroll2 = () => {
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

    if (rawPercentage < VAULT_UNLOCK_START) {
      const normalized = rawPercentage / VAULT_UNLOCK_START;
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
          const slideCenter =
            currentSlide.offsetLeft + currentSlide.offsetWidth / 2;
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

    // Vault thresholds are declared at function top (VAULT_UNLOCK_START/VAULT_OPEN_START)

    // use `lockIcon` reference declared earlier (if found) for unlock visuals

    // Fase 2: Destrancar (VAULT_UNLOCK_START -> VAULT_OPEN_START)
    if (
      rawPercentage > VAULT_UNLOCK_START &&
      rawPercentage <= VAULT_OPEN_START
    ) {
      if (lockIcon) lockIcon.classList.remove("animate-bounce");

      const unlockRange = VAULT_OPEN_START - VAULT_UNLOCK_START;
      const tension = Math.max(
        0,
        Math.min(1, (rawPercentage - VAULT_UNLOCK_START) / unlockRange),
      );
      const shake = tension * 5;
      const randomX = (Math.random() - 0.5) * shake;
      const randomY = (Math.random() - 0.5) * shake;
      const scale = 1 - tension * 0.1;

      // If the user is currently centered on the last slide and trying to unlock (enteredFromDirection === 1)
      // apply a stronger, class-driven 'resistance' animation instead of inline random jitter.
      const isLastCard = currentCenteredIndex === slides.length - 1;
      const isForcingOpen =
        isLastCard && scrollLocked && enteredFromDirection === 1;

      if (lockIcon) {
        if (isForcingOpen && !reduceMotion) {
          // prefer CSS class animation (is-resisting) for consistent effect
          lockIcon.classList.add("is-resisting");
          // Map tension to CSS variables for intensity
          setVaultResistance(tension);
          // Remove any inline transforms so CSS animation fully controls transform
          setLockInlineTransform("");
        } else if (!reduceMotion) {
          // Remove class when not forcing open, but keep the jittering for the general scroll-to-open phase
          lockIcon.classList.remove("is-resisting");
          // very small jitter for animation (non-resisting)
          setLockInlineTransform(
            `translate(${randomX}px, ${randomY}px) scale(${scale})`,
          );
          // reset CSS variables to small amount
          setVaultResistance(tension * 0.4);
        } else {
          // Reduce motion: clear any transforms/animations
          lockIcon.classList.remove("is-resisting");
          setVaultResistance(0);
          setLockInlineTransform("");
        }
      }
    } else if (rawPercentage <= VAULT_UNLOCK_START) {
      vaultCard.classList.remove("is-unlocked");
      if (lockIcon) {
        setLockInlineTransform("");
        lockIcon.classList.remove("is-resisting");
        setVaultResistance(0);
        lockIcon.classList.add("animate-bounce");
      }
    }

    // Fase 3: Abrir (VAULT_OPEN_START a 100%)
    if (rawPercentage > VAULT_OPEN_START) {
      vaultCard.classList.add("is-open");
      const lockedState = vaultCard.querySelector(
        ".vault-locked",
      ) as HTMLElement;
      // We opened the vault - ensure any resisting animation is removed
      if (lockIcon) {
        lockIcon.classList.remove("is-resisting");
        setVaultResistance(0);
      }
      if (lockedState) lockedState.style.opacity = "0";
      if (lockIcon) setLockInlineTransform("scale(1.2)");
    } else {
      vaultCard.classList.remove("is-open");
      const lockedState = vaultCard.querySelector(
        ".vault-locked",
      ) as HTMLElement;
      if (lockedState) lockedState.style.opacity = "1";
    }
  };
  window.addEventListener("scroll", onScroll2, { passive: true });

  // Cleanup: remove listeners and reset UI state
  return () => {
    window.removeEventListener("resize", onResize);
    slideHandlers.forEach(({ el, onClick, onKeydown }) => {
      el.removeEventListener("click", onClick);
      el.removeEventListener("keydown", onKeydown as any);
    });
    window.removeEventListener("wheel", wheelHandler);
    scrollSection.removeEventListener("touchstart", onTouchStart as any);
    scrollSection.removeEventListener("touchmove", onTouchMove as any);
    scrollSection.removeEventListener("touchend", onTouchEnd as any);
    track.removeEventListener("keydown", onTrackKeydown as any);
    track.removeEventListener("pointerdown", onPointerDown as any);
    track.removeEventListener("pointermove", onPointerMove as any);
    track.removeEventListener("pointerup", onPointerUp as any);
    track.removeEventListener("pointercancel", onPointerCancel as any);
    window.removeEventListener("scroll", onScroll2 as any);

    if (scrollEndTimeout) window.clearTimeout(scrollEndTimeout);
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (rafTransformId !== null) cancelAnimationFrame(rafTransformId);

    track.style.transform = "";
    track.style.transition = "";
    slides.forEach((s) => {
      s.style.setProperty("--tilt-scale", "");
      s.classList.remove("is-center", "is-adjacent", "dragging");
      s.removeAttribute("aria-current");
      s.removeAttribute("aria-hidden");
    });
    if (lockIndicator && lockIndicator.parentElement) {
      lockIndicator.remove();
    }
    if (lockIcon) {
      lockIcon.style.removeProperty("--vault-shake");
      lockIcon.style.removeProperty("--vault-rotate");
      lockIcon.style.removeProperty("--vault-scale");
      lockIcon.style.transform = "";
      lockIcon.classList.remove("is-resisting", "animate-bounce");
    }
    vaultCard.classList.remove("is-unlocked", "is-open");
    document.documentElement.classList.remove("horizontal-scroll-lock");
  };
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
  const onTimelineDrawScroll = () => {
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
  };
  window.addEventListener("scroll", onTimelineDrawScroll, { passive: true });

  // Return cleanup for timeline draw
  return () => {
    window.removeEventListener("scroll", onTimelineDrawScroll);
    progressBar.style.height = "";
    stepItems.forEach((item) => item.classList.remove("active"));
    if (timelineBackground) timelineBackground.style.transform = "";
  };
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
  return () => observer.disconnect();
};
