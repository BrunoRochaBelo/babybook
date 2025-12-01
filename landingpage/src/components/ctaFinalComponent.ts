import { setupCtaFinal } from "../features/animations/cta-final";

// Minimal mounting layer for CTA Final. It keeps initial html in place if present
// and runs the setup for animations and interactivity.
export const mountCtaFinal = () => {
  const el = document.querySelector<HTMLElement>(".cta-final");
  if (!el) {
    // No element present — nothing to mount
    return null;
  }
  // Initialize animations only when element exists
  setupCtaFinal();
  return el;
};

export default mountCtaFinal;
