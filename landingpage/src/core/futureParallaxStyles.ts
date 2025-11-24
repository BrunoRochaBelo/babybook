export async function setupFutureParallaxStyles() {
  try {
    const mod = await import("../styles/future-parallax.module.css");
    const styles = mod.default || mod;

    document
      .querySelectorAll(".future-parallax")
      .forEach((el) => el.classList.add(styles.futureParallax));
    document
      .querySelectorAll(".future-parallax .section-shell")
      .forEach((el) => el.classList.add(styles.sectionShell));
    document
      .querySelectorAll(".future-parallax-layer")
      .forEach((el) => el.classList.add(styles.futureParallaxLayer));
    document
      .querySelectorAll(".future-parallax-gradient")
      .forEach((el) => el.classList.add(styles.futureParallaxGradient));
    document
      .querySelectorAll(".future-parallax-grid")
      .forEach((el) => el.classList.add(styles.futureParallaxGrid));
    document
      .querySelectorAll(".future-parallax-ribbon")
      .forEach((el) => el.classList.add(styles.futureParallaxRibbon));
    document
      .querySelectorAll(".future-parallax-orb")
      .forEach((el) => el.classList.add(styles.futureParallaxOrb));
    document
      .querySelectorAll(".future-parallax-orb--left")
      .forEach((el) => el.classList.add(styles.futureParallaxOrbLeft));
    document
      .querySelectorAll(".future-parallax-orb--right")
      .forEach((el) => el.classList.add(styles.futureParallaxOrbRight));
  } catch (err) {
    // non-fatal
  }
}
