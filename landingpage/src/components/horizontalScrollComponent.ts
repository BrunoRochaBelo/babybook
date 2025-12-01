import { setupHorizontalScroll } from "../features/animations/scroll-effects";

export const mountHorizontalScroll = () => {
  const el = document.querySelector(".horizontal-scroll-section");
  if (!el) return null;
  const disposer = setupHorizontalScroll();
  return disposer;
};

export default mountHorizontalScroll;
