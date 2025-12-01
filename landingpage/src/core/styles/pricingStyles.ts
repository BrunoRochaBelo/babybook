import { CssModule, loadCssModule } from "./utils";

export async function setupPricingStyles(overrideStyles?: CssModule) {
  try {
    const styles = await loadCssModule(
      overrideStyles,
      () => import("../../styles/pricing.module.css"),
    );

    document
      .querySelectorAll(".pricing-parallax")
      .forEach((el) => el.classList.add(styles.pricingParallax));
    document
      .querySelectorAll(".pricing-layer")
      .forEach((el) => el.classList.add(styles.pricingLayer));
    document
      .querySelectorAll(".pricing-grid")
      .forEach((el) => el.classList.add(styles.pricingGrid));
    document
      .querySelectorAll(".pricing-orb")
      .forEach((el) => el.classList.add(styles.pricingOrb));
    document
      .querySelectorAll(".pricing-orb--one")
      .forEach((el) => el.classList.add(styles.pricingOrbOne));
    document
      .querySelectorAll(".pricing-orb--two")
      .forEach((el) => el.classList.add(styles.pricingOrbTwo));
    document
      .querySelectorAll(".pricing-shell")
      .forEach((el) => el.classList.add(styles.pricingShell));
    document
      .querySelectorAll(".pricing-card-panel")
      .forEach((el) => el.classList.add(styles.pricingCardPanel));
  } catch (err) {
    // non-fatal
  }
}
