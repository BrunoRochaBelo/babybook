export async function setupCarouselStyles() {
  try {
    const mod = await import("../styles/carousel.module.css");
    const styles = mod.default || mod;
    document
      .querySelectorAll(".carousel-slide")
      .forEach((el) => el.classList.add(styles.carouselSlide));
    document
      .querySelectorAll(".carousel-slide:not(.active)")
      .forEach((el) => el.classList.add(styles.carouselSlideNotActive));
    document
      .querySelectorAll(".carousel-slide.active")
      .forEach((el) => el.classList.add(styles.carouselSlideActive));
    document
      .querySelectorAll(".carousel-dot")
      .forEach((el) => el.classList.add(styles.carouselDot));
    document
      .querySelectorAll(".carousel-dot")
      .forEach((el) => el.classList.add(styles.carouselDotHover));
    document
      .querySelectorAll('.carousel-dot[aria-selected="true"]')
      .forEach((el) => el.classList.add(styles.carouselDotSelected));
    document
      .querySelectorAll(".carousel-nav-btn")
      .forEach((el) => el.classList.add(styles.carouselNavBtn));
  } catch (err) {
    // non-fatal
  }
}
