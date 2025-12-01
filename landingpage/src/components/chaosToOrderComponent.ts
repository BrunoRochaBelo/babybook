import { setupChaosToOrder } from "../features/animations/scroll-effects";

export const mountChaosToOrder = () => {
  const el = document.querySelector(".chaos-container");
  if (!el) return null;
  const disposer = setupChaosToOrder();
  return disposer;
};

export default mountChaosToOrder;
