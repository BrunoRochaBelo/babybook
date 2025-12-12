import Lenis from "lenis";

// === SMOOTH SCROLLING ===
export const initSmoothScrolling = (): (() => void) => {
  const lenis = new Lenis({
    duration: 1.9,
    easing: (t: number) => {
      return 1 - Math.pow(1 - t, 3);
    },
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: true,
    wheelMultiplier: 0.6,
    touchMultiplier: 1.6,
    syncTouch: true,
    syncTouchLerp: 0.075,
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
