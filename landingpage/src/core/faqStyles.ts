export async function setupFaqStyles() {
  try {
    const mod = await import("../styles/faq.module.css");
    const styles = mod.default || mod;

    document
      .querySelectorAll(".faq-section")
      .forEach((el) => el.classList.add(styles.faqSection));
    document
      .querySelectorAll(".faq-section .max-w-3xl")
      .forEach((el) => el.classList.add(styles.maxW3xl));
    // .faq-section.section-surface -> use a helper to add the section surface styles
    document
      .querySelectorAll(".faq-section.section-surface")
      .forEach((el) => el.classList.add(styles.faqSectionSectionSurface));
    // Map surface-active state
    document
      .querySelectorAll(".faq-section.section-surface.surface-active")
      .forEach((el) => el.classList.add(styles.surfaceActive));
    // The ::after is not directly mapable; preserve structure by toggling parent class names
  } catch (err) {
    // non-fatal
  }
}
