import { setupSectionScale } from "../features/animations/sections";

export const mountSectionScale = () => {
  const sections = document.querySelectorAll("section");
  if (!sections.length) return null;
  const disposer = setupSectionScale();
  return disposer;
};

export default mountSectionScale;
