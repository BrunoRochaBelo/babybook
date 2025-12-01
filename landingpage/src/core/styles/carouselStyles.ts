import { CssModule, loadCssModule } from "./utils";

export async function setupCarouselStyles(overrideStyles?: CssModule) {
  try {
    const styles = await loadCssModule(
      overrideStyles,
      () => import("../../styles/carousel.module.css"),
    );
    document
      .querySelectorAll(".carousel-slide")
      .forEach((el) => el.classList.add(styles.carouselSlide));
    document
      .querySelectorAll(".carousel-nav-btn")
      .forEach((el) => el.classList.add(styles.carouselNavBtn));
  } catch (err) {
    // non-fatal
  }
}
