export async function setupHeroStyles() {
  try {
    // Load CSS module dynamically so the styles are only included when needed
    const mod = await import("../styles/hero.module.css");
    const styles = mod.default || mod;
    // Map existing class names to CSS module classes
    document
      .querySelectorAll(".hero-stage")
      .forEach((el) => el.classList.add(styles.heroStage));
    document
      .querySelectorAll(".hero-lock")
      .forEach((el) => el.classList.add(styles.heroLock));
    document
      .querySelectorAll(".hero-section")
      .forEach((el) => el.classList.add(styles.heroSection));
    document
      .querySelectorAll(".hero-ambient")
      .forEach((el) => el.classList.add(styles.heroAmbient));
    document
      .querySelectorAll(".hero-glare")
      .forEach((el) => el.classList.add(styles.heroGlare));
    document
      .querySelectorAll(".hero-orb")
      .forEach((el) => el.classList.add(styles.heroOrb));
    document
      .querySelectorAll(".hero-orb--left")
      .forEach((el) => el.classList.add(styles.heroOrbLeft));
    document
      .querySelectorAll(".hero-orb--right")
      .forEach((el) => el.classList.add(styles.heroOrbRight));
    // Also map .max-w-4xl used in hero to CSS module class if needed
    document
      .querySelectorAll(".hero-lock .max-w-4xl")
      .forEach((el) => el.classList.add(styles.maxW4xl));
  } catch (err) {
    // Silently fail in case module mapping changes
    // console.warn('Could not apply hero CSS module classes', err);
  }
}
