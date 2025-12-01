import { setupParallaxSections } from "../features/animations/sections";

export const mountParallaxSections = () => {
  const els = document.querySelectorAll("[data-parallax-section]");
  if (!els.length) return null;
  const disposer = setupParallaxSections();
  return disposer;
};

export default mountParallaxSections;
