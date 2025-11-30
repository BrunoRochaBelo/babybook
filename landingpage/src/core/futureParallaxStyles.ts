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

    // Add new shape classes
    document
      .querySelectorAll(".future-parallax-shape-1")
      .forEach((el) => el.classList.add(styles.futureParallaxShape1));
    document
      .querySelectorAll(".future-parallax-shape-2")
      .forEach((el) => el.classList.add(styles.futureParallaxShape2));
    document
      .querySelectorAll(".future-parallax-shape-3")
      .forEach((el) => el.classList.add(styles.futureParallaxShape3));
    document
      .querySelectorAll(".future-parallax-shape-4")
      .forEach((el) => el.classList.add(styles.futureParallaxShape4));

    // Orbs removed: color sanitization for orb accents is no longer necessary.

    // Grid inner wrapper + dynamic image
    document.querySelectorAll(".future-parallax-grid").forEach((el) => {
      // only add class on root wrapper
      el.classList.add(styles.futureParallaxGrid);
      // avoid duplicate inner
      if (!el.querySelector(`.${styles.futureParallaxGridInner}`)) {
        const inner = document.createElement("div");
        inner.classList.add(styles.futureParallaxGridInner);
        const datasetImage = (el as HTMLElement).dataset.layerImage;
        if (datasetImage) {
          inner.style.backgroundImage = `url('${datasetImage}')`;
          inner.style.backgroundPosition = "center 30%";
          inner.style.opacity = "0.45";
        }
        el.appendChild(inner);
      }
    });

    // Ribbon inner wrapper + dynamic image
    document.querySelectorAll(".future-parallax-ribbon").forEach((el) => {
      el.classList.add(styles.futureParallaxRibbon);
      if (!el.querySelector(`.${styles.futureParallaxRibbonInner}`)) {
        const inner = document.createElement("div");
        inner.classList.add(styles.futureParallaxRibbonInner);
        const datasetImage = (el as HTMLElement).dataset.layerImage;
        if (datasetImage) {
          const img = document.createElement("div");
          img.classList.add(
            styles.futureParallaxRibbonImage || "futureParallaxRibbonImage",
          );
          (img as HTMLElement).style.backgroundImage = `url('${datasetImage}')`;
          (img as HTMLElement).style.opacity = "0.5";
          (img as HTMLElement).style.backgroundPosition = "center 33%";
          inner.appendChild(img);
        }
        el.appendChild(inner);
      }
    });

    // Orbs removed: no DOM injection necessary. Future: keep gradients, ribbons and grid for depth.
  } catch (err) {
    // non-fatal
  }
}
