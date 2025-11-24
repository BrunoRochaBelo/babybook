import Lenis from "lenis";

// === SMOOTH SCROLLING ===
export const initSmoothScrolling = (): Lenis => {
  const lenis = new Lenis({
    duration: 1.5,
    easing: (t: number) => {
      return 1 - Math.pow(1 - t, 3);
    },
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: true,
    wheelMultiplier: 0.85,
    touchMultiplier: 1.8,
    syncTouch: true,
    syncTouchLerp: 0.075,
  });

  function raf(time: number) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  return lenis;
};

// === SCROLL PROGRESS INDICATOR ===
export const initScrollProgress = () => {
  const progressBar = document.createElement("div");
  progressBar.className = "scroll-progress";
  document.body.appendChild(progressBar);

  window.addEventListener("scroll", () => {
    const windowHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (window.pageYOffset / windowHeight) * 100;
    progressBar.style.width = scrolled + "%";
  });
};
