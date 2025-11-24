// === HELPER FUNCTIONS ===

export const prefersReducedMotion = (): boolean => {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export const easeInOutQuad = (t: number): number => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

export const throttle = (callback: Function) => {
  let ticking = false;
  return (...args: any[]) => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        callback(...args);
        ticking = false;
      });
      ticking = true;
    }
  };
};

// Throttle específico para scroll - reutilizável
export const createScrollThrottle = (callback: () => void) => {
  let ticking = false;
  return () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        callback();
        ticking = false;
      });
      ticking = true;
    }
  };
};
