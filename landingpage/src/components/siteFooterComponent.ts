// Site footer component — mounts behaviors that apply to the footer itself.
export const mountSiteFooter = () => {
  const footer = document.querySelector<HTMLElement>(".site-footer");
  if (!footer) return null;

  const footerLinks = footer.querySelectorAll<HTMLAnchorElement>(".footer-section a");

  const handlers: Array<{ el: HTMLAnchorElement; onEnter: () => void; onLeave: () => void }> = [];

  footerLinks.forEach((link, i) => {
    link.style.animationDelay = `${0.5 + i * 0.05}s`;
    const onEnter = () => {
      link.style.transform = "translateY(-2px)";
    };
    const onLeave = () => {
      link.style.transform = "";
    };
    link.addEventListener("mouseenter", onEnter);
    link.addEventListener("mouseleave", onLeave);
    handlers.push({ el: link, onEnter, onLeave });
  });

  // Return a cleanup function for consistency
  return () => {
    handlers.forEach(({ el, onEnter, onLeave }) => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    });
  };
};

export default mountSiteFooter;
