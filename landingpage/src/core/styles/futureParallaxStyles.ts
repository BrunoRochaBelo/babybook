import { CssModule, loadCssModule } from "./utils";

export async function setupFutureParallaxStyles(overrideStyles?: CssModule) {
  try {
    const styles = await loadCssModule(
      overrideStyles,
      () => import("../../styles/future-parallax.module.css"),
    );
    document
      .querySelectorAll(".future-parallax")
      .forEach((el) => el.classList.add(styles.futureParallax));
  } catch (err) {
    // non-fatal
  }
}
