import { setupScrollAnimations } from "../features/animations/scroll-effects";

export const mountScrollAnimations = () => {
  const el = document.querySelector("section, .fade-in-up, .fade-in-left, .fade-in-right");
  if (!el) return null;
  const disposer = setupScrollAnimations();
  return disposer;
};

export default mountScrollAnimations;
