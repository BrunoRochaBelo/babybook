import { setupBookFlip } from "../features/interactive/bookFlip";

export const mountBookFlip = () => {
  // If there are no book cards, setupBookFlip will return null.
  const disposer = setupBookFlip();
  if (typeof disposer === "function") return disposer;
  return null;
};

export default mountBookFlip;
