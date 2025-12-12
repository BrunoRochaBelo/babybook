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

  // Nota importante:
  // A versão anterior fazia scroll-jacking (preventDefault no wheel/touch) + snap agressivo.
  // Isso tende a travar/saltar (principalmente em trackpad) e pode impedir o progresso
  // vertical necessário para destrancar o “Cofre”.
  // Agora a seção é controlada pelo scroll vertical normal (sticky + progresso),
  // com um snap SUAVE apenas quando o usuário para de rolar.

  let ticking2 = false;
  let scrollEndTimeout: number | null = null;
  let isSnapping = false;
  let isDragging = false;
  let currentCenteredIndex = 0;

  // Vault thresholds - how much of the section needs to be scrolled to start unlock and to open
  const VAULT_UNLOCK_START = 0.55;
  const VAULT_OPEN_START = 0.82;

  // Sensibilidade de drag
  const DRAG_THRESHOLD = 32;
  const DRAG_THRESHOLD_TOUCH_SMALL = 40;
  const VELOCITY_THRESHOLD = 0.6; // px/ms (≈ 600 px/s)
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

  // Make track focusable for keyboard navigation
  if (!track.hasAttribute("tabindex")) track.setAttribute("tabindex", "0");

  const windowCenter = () => window.innerWidth / 2;

  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const getSectionProgress = () => {
    const rect = scrollSection.getBoundingClientRect();
    const sectionHeight = Math.max(
      1,
      scrollSection.offsetHeight - window.innerHeight,
    );
    return clamp01(-rect.top / sectionHeight);
  };

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
    const duration = reduceMotion ? 0 : 420;
    track.style.transition =
      duration === 0
        ? ""
        : "transform 420ms cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    track.style.transform = `translateX(-${targetMoveAmount}px)`;
    // Remove transition after done
    window.setTimeout(() => {
      track.style.transition = "";
      isSnapping = false;
      updateSlidesScale();
    }, duration + 30);
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

  // Keyboard navigation (left/right arrows) when track is focused
  const onTrackKeydown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      snapToIndex(Math.min(slides.length - 1, currentCenteredIndex + 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      snapToIndex(Math.max(0, currentCenteredIndex - 1));
    }
  };
  track.addEventListener("keydown", onTrackKeydown as any);

  // Pointer Drag (mouse or touch) handling for horizontal swipe/drag to change slides
  let isPointerDown = false;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let pointerStartTime = 0;
  let dragBase = 0;
  let pointerDeviceType: string | null = null;

  const getCurrentMoveAmount = () => {
    const t = track.style.transform || "";
    const m = /translateX\(-([0-9.]+)px\)/.exec(t);
    if (!m) return getTargetMoveAmount(currentCenteredIndex);
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : getTargetMoveAmount(currentCenteredIndex);
  };

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
    dragBase = getCurrentMoveAmount();
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
      isDragging = true;
      // visual cue for dragging
      track.classList.add("dragging");
    }

    if (isDragging) {
      // prevent default page scroll / selection
      if (e.cancelable) e.preventDefault();
      // compute temporary transform to reflect drag visually
      const move = dragBase - (e.clientX - pointerStartX);
      const maxMove = Math.max(0, track.scrollWidth - window.innerWidth);
      let clamped = Math.min(Math.max(0, move), maxMove);
      track.style.transform = `translateX(-${clamped}px)`;
      // Não forçamos lock do scroll vertical; apenas arrasto horizontal.
      if (lockIcon) {
        lockIcon.classList.remove("is-resisting");
        setVaultResistance(0);
        if (reduceMotion) setLockInlineTransform("");
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
    isDragging = false;
    track.classList.remove("dragging");
    const dx = e.clientX - pointerStartX;
    const upTime = performance.now();
    const totalDt = Math.max(1, upTime - pointerStartTime);
    const avgVel = dx / totalDt; // px/ms
    const direction = dx < 0 ? 1 : -1; // dx < 0 means user dragged left -> go next
    // Determine slide width to compute necessary distance threshold
    const slideWidth = slides[currentCenteredIndex]?.offsetWidth || 300;
    const distanceThreshold = slideWidth * 0.25; // 25% of width

    // If velocity or distance threshold met -> change slide
    if (
      Math.abs(dx) > distanceThreshold ||
      Math.abs(avgVel) > VELOCITY_THRESHOLD
    ) {
      snapToIndex(
        Math.max(
          0,
          Math.min(slides.length - 1, currentCenteredIndex + direction),
        ),
      );
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
    const rawPercentage = getSectionProgress();

    let movePercentage = 0;

    if (rawPercentage < VAULT_UNLOCK_START) {
      const normalized = rawPercentage / VAULT_UNLOCK_START;
      movePercentage = 1 - Math.pow(1 - normalized, 3);
    } else {
      movePercentage = 1;
    }

    const moveAmount = movePercentage * (track.scrollWidth - window.innerWidth);
    // Mapeamento contínuo (suave) pelo scroll vertical.
    if (!isSnapping && !isDragging) {
      track.style.transform = `translateX(-${moveAmount}px)`;
    }

    // Update scales while scrolling
    updateSlidesScale();

    // Snap suave no fim do scroll (debounce) — evita “pulos” durante a rolagem.
    if (scrollEndTimeout) window.clearTimeout(scrollEndTimeout);
    if (rawPercentage > 0 && rawPercentage < 1 && !isDragging) {
      scrollEndTimeout = window.setTimeout(() => {
        snapToNearest();
      }, 220);
    }

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
      const isForcingOpen = isLastCard && !reduceMotion;

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
    if (lockIcon) {
      lockIcon.style.removeProperty("--vault-shake");
      lockIcon.style.removeProperty("--vault-rotate");
      lockIcon.style.removeProperty("--vault-scale");
      lockIcon.style.transform = "";
      lockIcon.classList.remove("is-resisting", "animate-bounce");
    }
    vaultCard.classList.remove("is-unlocked", "is-open");
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
