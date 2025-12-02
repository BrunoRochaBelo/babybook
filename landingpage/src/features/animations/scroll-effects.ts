import { prefersReducedMotion } from "../../utils/helpers";

// === CHAOS TO ORDER ===
export const setupChaosToOrder = () => {
  const chaosSection = document.querySelector(
    ".chaos-container",
  ) as HTMLElement | null;
  const photos = document.querySelectorAll(".photo-scatter");
  const text1 = document.getElementById("chaos-text-1");
  const text2 = document.getElementById("chaos-text-2");
  const highlight = document.getElementById("chaos-highlight");

  if (!chaosSection) return;

  const clampProgress = (value: number) => Math.max(0, Math.min(1, value));
  const TEXT_PHASE_POINT = 0.32;
  const PHOTO_PHASE_POINT = 0.62;
  let ticking = false;

  const applyTextPhase = (active: boolean) => {
    if (text1) text1.classList.toggle("opacity-30", active);
    if (text2) text2.classList.toggle("opacity-30", !active);
    if (highlight) {
      highlight.style.color = active ? "#F59E0B" : "#6B7280";
      highlight.innerText = "Só precisava caber na vida real.";
    }
  };

  const applyPhotoPhase = (active: boolean) => {
    photos.forEach((photo) => photo.classList.toggle("organized", active));
  };

  const updateChaosState = () => {
    const rect = chaosSection.getBoundingClientRect();
    const sectionHeight = Math.max(
      1,
      chaosSection.offsetHeight - window.innerHeight,
    );
    const rawProgress = -rect.top / sectionHeight;
    const progress = clampProgress(rawProgress);

    applyTextPhase(progress > TEXT_PHASE_POINT);
    applyPhotoPhase(progress > PHOTO_PHASE_POINT);
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        ticking = false;
      });
      ticking = true;
    }
    updateChaosState();
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  updateChaosState();

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
  const SNAP_COOLDOWN = 650; // ms - cooldown between snaps

  // === ADVANCED WHEEL SENSITIVITY CONTROL ===
  // Wheel delta accumulator with velocity-aware processing
  let wheelDeltaAccumulator = 0;
  let wheelDebounceTimer: number | null = null;
  let lastWheelTime = 0;
  let consecutiveWheelEvents = 0;

  // Base thresholds (adjusted dynamically based on scroll velocity)
  const WHEEL_BASE_THRESHOLD = 60; // base accumulated deltaY before triggering snap
  const WHEEL_FAST_THRESHOLD = 40; // lower threshold for fast scrolling (more responsive)
  const WHEEL_DEBOUNCE_MS = 100; // ms to wait before processing accumulated delta
  const WHEEL_MIN_DELTA = 4; // ignore very small wheel movements (noise filter)
  const WHEEL_VELOCITY_WINDOW = 150; // ms - window to calculate scroll velocity
  const WHEEL_FAST_VELOCITY = 3; // deltaY per ms considered "fast scrolling"

  // Dead zone to prevent micro-movements and trembling
  const DEADZONE_THRESHOLD = 15; // accumulated delta below this is ignored after debounce

  // Vault thresholds - how much of the section needs to be scrolled to start unlock and to open
  const VAULT_UNLOCK_START = 0.55;
  const VAULT_OPEN_START = 0.82;
  // how close to the section edges (0..1) the user must be to allow exiting the horizontal section quickly
  const SECTION_EXIT_BUFFER = 0.09; // buffer maior para dar margem antes de liberar

  // Sensitivity presets (can be toggled by data-sensitivity attribute on the section)
  const SENSITIVITY_PRESETS = {
    default: {
      WHEEL_THRESHOLD: 18,
      DRAG_THRESHOLD: 32,
      DRAG_THRESHOLD_TOUCH_SMALL: 40,
      VELOCITY_THRESHOLD: 0.6,
    },
    aggressive: {
      WHEEL_THRESHOLD: 14,
      DRAG_THRESHOLD: 22,
      DRAG_THRESHOLD_TOUCH_SMALL: 30,
      VELOCITY_THRESHOLD: 0.45,
    },
    permissive: {
      WHEEL_THRESHOLD: 22,
      DRAG_THRESHOLD: 38,
      DRAG_THRESHOLD_TOUCH_SMALL: 48,
      VELOCITY_THRESHOLD: 0.85,
    },
  } as const;

  const detectedMode =
    (scrollSection.getAttribute(
      "data-sensitivity",
    ) as keyof typeof SENSITIVITY_PRESETS) ||
    (window.innerWidth >= 1024 ? "aggressive" : "default");
  const thresholds = SENSITIVITY_PRESETS[detectedMode];
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
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const rightArrowSvg = `
    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12h14"></path>
      <path d="M13 5l7 7-7 7"></path>
    </svg>
  `;
  const lockLabelText = isTouchDevice
    ? "Deslize para navegar"
    : "Role para navegar";
  lockIndicator.innerHTML = `<span class="lock-label">${lockLabelText}</span><span class="arrow" aria-hidden="true">${rightArrowSvg}</span>`;
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

  type SectionState = "before" | "inside" | "after";
  let sectionState: SectionState = "before";
  let entryAlignmentDirection: 1 | -1 | null = null;

  const getTargetMoveAmount = (index: number) => {
    const targetSlide = slides[index];
    if (!targetSlide) return 0;
    const slideOffsetLeft = targetSlide.offsetLeft;
    const slideCenter = slideOffsetLeft + targetSlide.offsetWidth / 2;
    const maxMove = Math.max(0, track.scrollWidth - window.innerWidth);
    let targetMoveAmount = slideCenter - windowCenter();
    if (targetMoveAmount < 0) targetMoveAmount = 0;
    if (targetMoveAmount > maxMove) targetMoveAmount = maxMove;
    return targetMoveAmount;
  };

  const jumpToIndex = (index: number) => {
    if (!slides[index]) return;
    const moveAmount = getTargetMoveAmount(index);
    track.style.transition = "";
    track.style.transform = `translateX(-${moveAmount}px)`;
    isSnapping = false;
    updateSlidesScale();
  };

  const markEntryDirection = (direction: 1 | -1) => {
    if (entryAlignmentDirection !== null) return;
    entryAlignmentDirection = direction;
  };

  const alignEntryIfNeeded = () => {
    if (entryAlignmentDirection === null) return;
    const targetIndex = entryAlignmentDirection === 1 ? 0 : slides.length - 1;
    if (targetIndex < 0 || targetIndex >= slides.length) {
      entryAlignmentDirection = null;
      return;
    }
    if (
      (entryAlignmentDirection === 1 && currentCenteredIndex === 0) ||
      (entryAlignmentDirection === -1 &&
        currentCenteredIndex === slides.length - 1)
    ) {
      entryAlignmentDirection = null;
      return;
    }
    jumpToIndex(targetIndex);
    entryAlignmentDirection = null;
  };

  const maybeMarkEntryDirectionForWheel = (
    direction: 1 | -1,
    rawPercentage: number,
  ) => {
    if (entryAlignmentDirection !== null) return;
    if (direction === 1 && rawPercentage <= 0.15) {
      markEntryDirection(1);
    } else if (direction === -1 && rawPercentage >= 0.85) {
      markEntryDirection(-1);
    }
  };

  const updateSectionState = (rawPercentage: number) => {
    const prevState = sectionState;
    let nextState: SectionState;
    if (rawPercentage <= 0) {
      nextState = "before";
    } else if (rawPercentage >= 1) {
      nextState = "after";
    } else {
      nextState = "inside";
    }

    if (nextState === "inside" && prevState !== "inside") {
      const inferredDirection = prevState === "after" ? -1 : 1;
      markEntryDirection(inferredDirection);
    } else if (nextState !== "inside") {
      entryAlignmentDirection = null;
    }

    sectionState = nextState;
  };

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
    // Update current index immediately to prevent re-triggering
    currentCenteredIndex = index;
    const targetSlide = slides[index];
    const slideOffsetLeft = targetSlide.offsetLeft;
    const slideCenter = slideOffsetLeft + targetSlide.offsetWidth / 2;
    let targetMoveAmount = slideCenter - windowCenter();
    const maxMove = Math.max(0, track.scrollWidth - window.innerWidth);
    if (targetMoveAmount < 0) targetMoveAmount = 0;
    if (targetMoveAmount > maxMove) targetMoveAmount = maxMove;

    isSnapping = true;
    track.style.transition =
      "transform 550ms cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    track.style.transform = `translateX(-${targetMoveAmount}px)`;
    setTimeout(() => {
      track.style.transition = "";
      isSnapping = false;
      updateSlidesScale();
    }, 580);
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

  // Calculate dynamic threshold based on scroll velocity
  const getDynamicThreshold = (): number => {
    const now = performance.now();
    const timeSinceLastWheel = now - lastWheelTime;

    // If scrolling fast (multiple events in quick succession), use lower threshold
    if (
      timeSinceLastWheel < WHEEL_VELOCITY_WINDOW &&
      consecutiveWheelEvents > 2
    ) {
      const velocity =
        Math.abs(wheelDeltaAccumulator) / Math.max(1, timeSinceLastWheel);
      if (velocity >= WHEEL_FAST_VELOCITY) {
        return WHEEL_FAST_THRESHOLD;
      }
    }
    return WHEEL_BASE_THRESHOLD;
  };

  // Process accumulated wheel delta and snap accordingly
  const processWheelAccumulator = () => {
    if (wheelDeltaAccumulator === 0) return;

    // Apply dead zone - ignore very small accumulated movements (prevents trembling)
    if (Math.abs(wheelDeltaAccumulator) < DEADZONE_THRESHOLD) {
      wheelDeltaAccumulator = 0;
      consecutiveWheelEvents = 0;
      return;
    }

    const direction = wheelDeltaAccumulator > 0 ? 1 : -1;
    // Only snap once per accumulation cycle
    snapToOffsetDirection(direction);
    wheelDeltaAccumulator = 0;
    consecutiveWheelEvents = 0;
  };

  // Wheel handling (desktop) - accumulate delta with velocity-aware snapping
  let wheelHandler = (e: WheelEvent) => {
    const now = performance.now();
    const rect = scrollSection.getBoundingClientRect();
    const sectionHeight = Math.max(
      1,
      scrollSection.offsetHeight - window.innerHeight,
    );
    const rawPercentage = Math.max(0, Math.min(1, -rect.top / sectionHeight));

    // Only respond when within the section (start visible to end)
    if (rawPercentage <= 0 || rawPercentage >= 1) {
      if (scrollLocked) {
        unlockScroll();
      }
      wheelDeltaAccumulator = 0;
      consecutiveWheelEvents = 0;
      return;
    }

    // Ignore very small wheel movements (noise filter)
    if (Math.abs(e.deltaY) < WHEEL_MIN_DELTA) return;

    // Track consecutive wheel events for velocity calculation
    if (now - lastWheelTime < WHEEL_VELOCITY_WINDOW) {
      consecutiveWheelEvents++;
    } else {
      consecutiveWheelEvents = 1;
    }
    lastWheelTime = now;

    const direction = e.deltaY > 0 ? 1 : -1;

    maybeMarkEntryDirectionForWheel(direction, rawPercentage);
    alignEntryIfNeeded();

    // Enter locked (scroll jacking) mode when we detect a scroll into the section
    if (!scrollLocked) {
      scrollLocked = true;
      enteredFromDirection = direction === 1 ? 1 : -1;
      document.documentElement.classList.add("horizontal-scroll-lock");
      lockIndicator.classList.add("visible");
      if (e.cancelable) e.preventDefault();
      // First snap on entry
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
      wheelDeltaAccumulator = 0;
      consecutiveWheelEvents = 0;
      return;
    }
    if (
      enteredFromDirection === -1 &&
      currentCenteredIndex === 0 &&
      direction === -1
    ) {
      unlockScroll();
      wheelDeltaAccumulator = 0;
      consecutiveWheelEvents = 0;
      return;
    }

    // Also allow releasing the lock early if user is near the top/bottom edges
    if (
      scrollLocked &&
      direction === -1 &&
      rawPercentage <= SECTION_EXIT_BUFFER
    ) {
      unlockScroll();
      wheelDeltaAccumulator = 0;
      consecutiveWheelEvents = 0;
      return;
    }
    if (
      scrollLocked &&
      direction === 1 &&
      rawPercentage >= 1 - SECTION_EXIT_BUFFER
    ) {
      unlockScroll();
      wheelDeltaAccumulator = 0;
      consecutiveWheelEvents = 0;
      return;
    }

    // Accumulate wheel delta
    wheelDeltaAccumulator += e.deltaY;

    // Clear previous debounce timer
    if (wheelDebounceTimer !== null) {
      window.clearTimeout(wheelDebounceTimer);
    }

    // Get dynamic threshold based on scroll velocity
    const threshold = getDynamicThreshold();

    // If accumulated delta exceeds threshold, process immediately
    if (Math.abs(wheelDeltaAccumulator) >= threshold) {
      processWheelAccumulator();
    } else {
      // Otherwise, wait for debounce period before processing
      wheelDebounceTimer = window.setTimeout(() => {
        processWheelAccumulator();
        wheelDebounceTimer = null;
      }, WHEEL_DEBOUNCE_MS);
    }
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
    dragBase = getTargetMoveAmount(currentCenteredIndex);
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

    updateSectionState(rawPercentage);
    alignEntryIfNeeded();

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
  onScroll2();

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
    if (wheelDebounceTimer !== null) window.clearTimeout(wheelDebounceTimer);
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
  const stepItems = Array.from(
    document.querySelectorAll(".step-item"),
  ) as HTMLElement[];
  const timelineBackground = document.querySelector(
    ".timeline-background",
  ) as HTMLElement;

  if (!timelineSection || !timelineContainer || !progressBar) return;

  const activateStep = (item: Element) => {
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
  };

  const deactivateStep = (item: Element) => {
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
  };

  let ticking3 = false;
  let prevActiveIndex = -1; // keep track of last active step index
  const onTimelineDrawScroll = () => {
    if (!ticking3) {
      window.requestAnimationFrame(() => {
        ticking3 = false;
      });
      ticking3 = true;
    }
    const sectionRect = timelineSection.getBoundingClientRect();
    const sectionHeight = Math.max(
      1,
      timelineSection.offsetHeight - window.innerHeight,
    );
    const rawProgress = -sectionRect.top / sectionHeight;
    const sectionProgress = Math.max(0, Math.min(1, rawProgress));

    if (timelineBackground) {
      const parallaxY = sectionProgress * 100;
      timelineBackground.style.transform = `translateY(${parallaxY}px) scale(${1 + sectionProgress * 0.1})`;
    }

    const timelinePercentage = Math.max(
      0,
      Math.min(100, (sectionProgress / 0.86) * 100),
    );
    progressBar.style.height = `${timelinePercentage}%`;

    const containerHeight = Math.max(1, timelineContainer.offsetHeight);
    const normalizedLineValue = timelinePercentage / 100;
    const isSectionVisible =
      sectionRect.bottom > 0 && sectionRect.top < window.innerHeight;
    const shouldResetBeforeView = !isSectionVisible && sectionProgress <= 0;

    if (shouldResetBeforeView) {
      stepItems.forEach((item) => {
        deactivateStep(item);
      });
      return;
    }

    let currentActiveIndex = -1;
    stepItems.forEach((item, idx) => {
      const itemTop = Math.max(0, item.offsetTop);
      const activationThreshold = Math.min(1, itemTop / containerHeight);
      const isActive = normalizedLineValue >= activationThreshold - 0.05;
      if (isActive) {
        activateStep(item);
        currentActiveIndex = idx;
      } else {
        deactivateStep(item);
      }
    });

    // If active item changed and we scrolled back to step 0 (calendar) from a later step,
    // restart the calendar animation explicitly. This will re-run even if the element
    // already has the 'active' class (useful when going up from step 2 -> step 1).
    if (currentActiveIndex !== prevActiveIndex) {
      // Only replay when we moved up to the first step (index 0) from another step
      if (
        currentActiveIndex === 0 &&
        prevActiveIndex > 0 &&
        !prefersReducedMotion()
      ) {
        const calendarEmoji = stepItems[0].querySelector(
          ".emoji-calendar",
        ) as HTMLElement | null;
        if (calendarEmoji && calendarEmoji.animate) {
          // Use Web Animations API to replay the shake animation reliably
          calendarEmoji.animate(
            [
              { transform: "rotate(0deg)" },
              { transform: "rotate(-8deg)" },
              { transform: "rotate(8deg)" },
              { transform: "rotate(0deg)" },
            ],
            { duration: 1000, easing: "ease-in-out" },
          );
        }
      }
      prevActiveIndex = currentActiveIndex;
    }
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

// === PRICING SECTION HOLD (Segura após "Sem mensalidade" aparecer) ===
export const setupPricingHold = () => {
  if (prefersReducedMotion()) return;

  const pricingSection = document.querySelector("#pricing") as HTMLElement;
  if (!pricingSection) return;

  const listItems = Array.from(
    pricingSection.querySelectorAll(".pricing-list-item"),
  ) as HTMLElement[];
  if (listItems.length === 0) return;

  // O último item é o "Sem mensalidade. Nunca."
  const lastItem = listItems[listItems.length - 1];

  // State management
  let isHolding = false;
  let holdTriggered = false;
  let holdCompleted = false;
  let holdProgress = 0;
  const HOLD_SCROLL_BUFFER = 100; // px de scroll que acumula durante o hold

  // Visual indicator for hold state
  const createHoldIndicator = () => {
    const indicator = document.createElement("div");
    indicator.className = "pricing-hold-indicator";
    indicator.style.cssText = `
      position: fixed;
      bottom: 32px;
      left: 50%;
      transform: translateX(-50%) scale(0);
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.2);
      border: 2px solid rgba(99, 102, 241, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 100;
      transition: transform 0.3s ease-out, opacity 0.3s ease-out;
      opacity: 0;
    `;
    indicator.innerHTML = `
      <svg class="pricing-hold-progress" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
        <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(99, 102, 241, 1)" stroke-width="2" 
          stroke-dasharray="88" stroke-dashoffset="88" stroke-linecap="round"
          style="transform: rotate(-90deg); transform-origin: center;"/>
      </svg>
    `;
    document.body.appendChild(indicator);
    return indicator;
  };

  const holdIndicator = createHoldIndicator();
  const progressCircle = holdIndicator.querySelector(
    "circle:last-child",
  ) as SVGCircleElement;

  // Check if last item is visible (animation completed)
  const isLastItemVisible = () => {
    return (
      lastItem.classList.contains("opacity-100") &&
      !lastItem.classList.contains("opacity-0")
    );
  };

  // Check if section is in the right position for hold
  const shouldTriggerHold = () => {
    const rect = pricingSection.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Seção está bem posicionada na viewport (centro visível)
    const sectionCenterVisible =
      rect.top < viewportHeight * 0.4 && rect.bottom > viewportHeight * 0.6;

    return sectionCenterVisible && isLastItemVisible() && !holdCompleted;
  };

  // Update hold progress visuals
  const updateHoldVisuals = (progress: number) => {
    const dashOffset = 88 * (1 - progress);
    progressCircle.style.strokeDashoffset = String(dashOffset);

    if (progress > 0 && progress < 1) {
      holdIndicator.style.transform = "translateX(-50%) scale(1)";
      holdIndicator.style.opacity = "1";
    } else {
      holdIndicator.style.transform = "translateX(-50%) scale(0)";
      holdIndicator.style.opacity = "0";
    }
  };

  // Wheel handler for hold behavior
  let accumulatedScroll = 0;

  const onWheel = (e: WheelEvent) => {
    // Only intercept when holding
    if (!isHolding && shouldTriggerHold() && !holdTriggered && e.deltaY > 0) {
      // Start hold
      isHolding = true;
      holdTriggered = true;
      holdProgress = 0;
      accumulatedScroll = 0;
      document.documentElement.classList.add("pricing-hold-active");
    }

    if (isHolding) {
      if (e.cancelable) e.preventDefault();

      // Allow scrolling up to cancel hold
      if (e.deltaY < 0) {
        isHolding = false;
        holdTriggered = false;
        holdProgress = 0;
        accumulatedScroll = 0;
        document.documentElement.classList.remove("pricing-hold-active");
        updateHoldVisuals(0);
        return;
      }

      // Accumulate scroll during hold
      accumulatedScroll += e.deltaY;

      // Calculate progress based on accumulated scroll
      holdProgress = Math.min(1, accumulatedScroll / HOLD_SCROLL_BUFFER);
      updateHoldVisuals(holdProgress);

      // Check if hold is complete
      if (holdProgress >= 1) {
        isHolding = false;
        holdCompleted = true;
        document.documentElement.classList.remove("pricing-hold-active");
        updateHoldVisuals(0);

        // Pulse animation on last item
        lastItem.classList.add("pricing-hold-complete");
        setTimeout(() => {
          lastItem.classList.remove("pricing-hold-complete");
        }, 600);
      }
    }
  };

  window.addEventListener("wheel", onWheel, { passive: false });

  // Touch handling for mobile
  let touchStartY = 0;
  let touchAccumulated = 0;

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartY = e.touches[0].clientY;
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 0) return;
    const currentY = e.touches[0].clientY;
    const deltaY = touchStartY - currentY; // positive = scrolling down

    if (!isHolding && shouldTriggerHold() && !holdTriggered && deltaY > 20) {
      isHolding = true;
      holdTriggered = true;
      holdProgress = 0;
      touchAccumulated = 0;
      document.documentElement.classList.add("pricing-hold-active");
    }

    if (isHolding) {
      if (e.cancelable) e.preventDefault();

      if (deltaY < -20) {
        // Scrolling up - cancel
        isHolding = false;
        holdTriggered = false;
        holdProgress = 0;
        touchAccumulated = 0;
        document.documentElement.classList.remove("pricing-hold-active");
        updateHoldVisuals(0);
        return;
      }

      touchAccumulated = Math.max(0, deltaY);
      holdProgress = Math.min(1, touchAccumulated / (HOLD_SCROLL_BUFFER * 0.8));
      updateHoldVisuals(holdProgress);

      if (holdProgress >= 1) {
        isHolding = false;
        holdCompleted = true;
        document.documentElement.classList.remove("pricing-hold-active");
        updateHoldVisuals(0);

        lastItem.classList.add("pricing-hold-complete");
        setTimeout(() => {
          lastItem.classList.remove("pricing-hold-complete");
        }, 600);
      }
    }
  };

  const onTouchEnd = () => {
    if (isHolding && holdProgress < 1) {
      // Didn't complete - reset
      isHolding = false;
      holdTriggered = false;
      holdProgress = 0;
      touchAccumulated = 0;
      document.documentElement.classList.remove("pricing-hold-active");
      updateHoldVisuals(0);
    }
    touchStartY = 0;
  };

  pricingSection.addEventListener("touchstart", onTouchStart, {
    passive: true,
  });
  pricingSection.addEventListener("touchmove", onTouchMove, { passive: false });
  pricingSection.addEventListener("touchend", onTouchEnd, { passive: true });

  // Reset when scrolling back up past the section
  const onScroll = () => {
    const rect = pricingSection.getBoundingClientRect();
    if (rect.top > window.innerHeight * 0.8) {
      // Section is below viewport - reset state
      holdCompleted = false;
      holdTriggered = false;
      isHolding = false;
      holdProgress = 0;
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("scroll", onScroll);
    pricingSection.removeEventListener("touchstart", onTouchStart);
    pricingSection.removeEventListener("touchmove", onTouchMove);
    pricingSection.removeEventListener("touchend", onTouchEnd);
    holdIndicator.remove();
    document.documentElement.classList.remove("pricing-hold-active");
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
