import Lenis from "lenis";

// === SMOOTH SCROLLING ===
export const initSmoothScrolling = (): (() => void) => {
  const lenis = new Lenis({
    // Valores mais naturais: evita sensação de “seções infinitas” e reduz engasgos
    // por excesso de smoothing (especialmente em trackpad).
    duration: 1.25,
    easing: (t: number) => {
      return 1 - Math.pow(1 - t, 3);
    },
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.2,
    syncTouch: true,
    syncTouchLerp: 0.1,
  });
  lenisInstance = lenis;

  let rafId = 0;
  function raf(time: number) {
    lenis.raf(time);
    rafId = requestAnimationFrame(raf);
  }

  rafId = requestAnimationFrame(raf);

  // Return disposer
  return () => {
    try {
      if (rafId) cancelAnimationFrame(rafId);
      // If lenis exposes a destroy method, call it
      (lenis as any).destroy?.();
      // Clear instance on destroy
      lenisInstance = null;
    } catch (err) {
      // ignore errors
    }
  };
};

let lenisInstance: Lenis | null = null;
export const getLenis = () => lenisInstance;

// === SCROLL PROGRESS INDICATOR ===
export const initScrollProgress = () => {
  const progressBar = document.createElement("div");
  progressBar.className = "scroll-progress";
  document.body.appendChild(progressBar);
  const handleScroll = () => {
    const windowHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (window.pageYOffset / windowHeight) * 100;
    progressBar.style.width = scrolled + "%";
  };

  window.addEventListener("scroll", handleScroll, { passive: true });

  // Return disposer
  return () => {
    try {
      progressBar.remove();
      window.removeEventListener("scroll", handleScroll);
    } catch (err) {
      // ignore
    }
  };
};
