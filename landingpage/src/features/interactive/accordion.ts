// === FAQ ACCORDION ===
export const setupAccordion = () => {
  document.querySelectorAll(".accordion-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const content = btn.nextElementSibling as HTMLElement;
      const isExpanded = btn.getAttribute("aria-expanded") === "true";

      // Fecha todos
      document.querySelectorAll(".accordion-btn").forEach((b) => {
        b.setAttribute("aria-expanded", "false");
        const nextEl = b.nextElementSibling as HTMLElement;
        if (nextEl) nextEl.style.maxHeight = null as any;
      });

      // Abre atual se estava fechado
      if (!isExpanded) {
        btn.setAttribute("aria-expanded", "true");
        if (content) content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });
};
