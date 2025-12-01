import {
  setupHeroCollapseProgress,
  initHoverAnimations,
} from "../features/animations/hero";

// Mounts the hero-related features. Returns a cleanup function that removes event
// listeners and intervals if the hero was present. If hero isn't present, returns null.
export const mountHero = () => {
  const hero =
    document.querySelector(".hero-section") ||
    document.getElementById("hero-stage");
  if (!hero) return null;

  const disposers: Array<() => void> = [];

  const t1 = setupHeroCollapseProgress();
  if (t1) disposers.push(t1);
  const t2 = initHoverAnimations();
  if (t2) disposers.push(t2);

  return () => {
    disposers.forEach((d) => d && d());
  };
};

export default mountHero;
