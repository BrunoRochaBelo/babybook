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

    // Helper: map known bright/violet colors to brand accent to keep UI cohesive
    const sanitizeOrbColor = (raw?: string) => {
      if (!raw) return undefined;
      const color = raw.trim().toLowerCase();
      // map the specific violet used in the markup to the brand accent warm tone
      const mapping: Record<string, string> = {
        '#7c3aed': '#f2995d',
        '#7c3ae3': '#f2995d',
        '7c3aed': '#f2995d',
        '#fb7185': '#fad5b8'
      };
      return mapping[color] || raw;
    };

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
          inner.style.backgroundPosition = 'center 30%';
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
          const img = document.createElement('div');
          img.classList.add(
            styles.futureParallaxRibbonImage || "futureParallaxRibbonImage",
          );
          (img as HTMLElement).style.backgroundImage = `url('${datasetImage}')`;
          (img as HTMLElement).style.opacity = "0.5";
          (img as HTMLElement).style.backgroundPosition = 'center 33%';
          inner.appendChild(img);
        }
        el.appendChild(inner);
      }
    });

    // Orbs: inner wrappers + dynamic image/color
    document.querySelectorAll(".future-parallax-orb").forEach((el) => {
      el.classList.add(styles.futureParallaxOrb);
      if (!el.querySelector(`.${styles.futureParallaxOrbInner}`)) {
        const inner = document.createElement("div");
        inner.classList.add(styles.futureParallaxOrbInner);
        // orb color - sanitize mapping for colours that clash with UI.
        const orbColor = sanitizeOrbColor((el as HTMLElement).dataset.orbColor);
        if (orbColor) {
          inner.style.setProperty("--orb-accent", orbColor);
        }
        const orbImage = (el as HTMLElement).dataset.orbImage;
        if (orbImage) {
          const img = document.createElement('div');
          img.classList.add(
            styles.futureParallaxOrbImage || "futureParallaxOrbImage",
          );
          (img as HTMLElement).style.backgroundImage = `url('${orbImage}')`;
          (img as HTMLElement).style.opacity = "0.65";
          (img as HTMLElement).style.backgroundPosition = 'center 30%';
          inner.appendChild(img);
        }
        el.appendChild(inner);
      }
    });
  } catch (err) {
    // non-fatal
  }
}
