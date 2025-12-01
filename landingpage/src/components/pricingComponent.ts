import { setupPricingListAnimation } from "../features/animations/sections";

export const mountPricingListAnimation = () => {
  const pricing = document.querySelector("#pricing");
  if (!pricing) return null;
  const disposer = setupPricingListAnimation();
  return disposer;
};

export default mountPricingListAnimation;
