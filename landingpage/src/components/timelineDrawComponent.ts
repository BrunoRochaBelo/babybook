import { setupTimelineDraw } from "../features/animations/scroll-effects";

export const mountTimelineDraw = () => {
  const el = document.querySelector("#how-it-works-section");
  if (!el) return null;
  const disposer = setupTimelineDraw();
  return disposer;
};

export default mountTimelineDraw;
