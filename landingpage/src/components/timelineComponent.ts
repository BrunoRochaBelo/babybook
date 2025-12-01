import { setupTimelineAnimation } from "../features/animations/sections";

export const mountTimelineAnimation = () => {
  const timeline = document.querySelector("#how-it-works-section");
  if (!timeline) return null;
  const disposer = setupTimelineAnimation();
  return disposer;
};

export default mountTimelineAnimation;
