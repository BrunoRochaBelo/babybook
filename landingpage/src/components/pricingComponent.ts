import { setupPricingListAnimation } from "../features/animations/sections";
import { setupPricingHold } from "../features/animations/scroll-effects";

export const mountPricingListAnimation = () => {
  const pricing = document.querySelector("#pricing");
  if (!pricing) return null;
  const disposer = setupPricingListAnimation();
  return disposer;
};

export const mountPricingHold = () => {
  const pricing = document.querySelector("#pricing");
  if (!pricing) return null;
  const disposer = setupPricingHold();
  return disposer;
};

export default mountPricingListAnimation;
