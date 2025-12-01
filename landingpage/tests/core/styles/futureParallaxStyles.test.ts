import { describe, it, expect, beforeEach } from "vitest";
import { setupFutureParallaxStyles } from "../../../src/core/styles/futureParallaxStyles";

// The helper loadCssModule accepts an override mapping of CSS module
// keys -> class names. We'll pass a minimal mapping to validate that the
// function adds the right classes and inner nodes.

const fakeStyles = {
  futureParallax: "fp-root",
  futureParallaxLayer: "fp-layer",
  futureParallaxGrid: "fp-grid",
  futureParallaxGridInner: "fp-grid-inner",
  futureParallaxRibbon: "fp-ribbon",
  futureParallaxRibbonInner: "fp-ribbon-inner",
  futureParallaxRibbonImage: "fp-ribbon-image",
  futureParallaxGradient: "fp-gradient",
  futureCard: "fp-card",
};

describe("setupFutureParallaxStyles", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <section class="future-parallax">
        <div class="future-parallax-layer future-parallax-gradient" data-parallax-depth="0.12" aria-hidden="true"></div>
        <div id="gridLayer" class="future-parallax-layer future-parallax-grid" data-parallax-depth="0.22" aria-hidden="true" data-layer-image="/assets/hero.png"></div>
        <div id="ribbonLayer" class="future-parallax-layer future-parallax-ribbon" data-parallax-depth="0.35" aria-hidden="true" data-layer-image="/assets/hero.png"></div>
        <div class="section-shell">
          <article class="future-card group bg-white">Card 1</article>
          <article class="future-card group bg-white">Card 2</article>
        </div>
      </section>
    `;
  });

  it("adds module classes and creates inner elements with background images", async () => {
    await setupFutureParallaxStyles(fakeStyles as any);

    const root = document.querySelector(".future-parallax") as HTMLElement;
    expect(root).toBeTruthy();
    expect(root.classList.contains("fp-root")).toBe(true);

    const gradient = document.querySelector(
      ".future-parallax-layer.future-parallax-gradient",
    ) as HTMLElement;
    expect(gradient.classList.contains("fp-gradient")).toBe(true);

    const gridLayer = document.querySelector("#gridLayer") as HTMLElement;
    expect(gridLayer.classList.contains("fp-layer")).toBe(true);
    expect(gridLayer.classList.contains("fp-grid")).toBe(true);

    const gridInner = gridLayer.querySelector(".fp-grid-inner") as HTMLElement;
    expect(gridInner).toBeTruthy();
    expect(gridInner.style.backgroundImage).toContain("/assets/hero.png");

    const ribbonLayer = document.querySelector("#ribbonLayer") as HTMLElement;
    expect(ribbonLayer.classList.contains("fp-layer")).toBe(true);
    expect(ribbonLayer.classList.contains("fp-ribbon")).toBe(true);

    const ribbonInner = ribbonLayer.querySelector(
      ".fp-ribbon-inner",
    ) as HTMLElement;
    expect(ribbonInner).toBeTruthy();

    const ribbonImage = ribbonInner.querySelector(
      ".fp-ribbon-image",
    ) as HTMLElement;
    expect(ribbonImage).toBeTruthy();
    expect(ribbonImage.style.backgroundImage).toContain("/assets/hero.png");
  });

  it("does not duplicate inner elements when run twice", async () => {
    await setupFutureParallaxStyles(fakeStyles as any);
    await setupFutureParallaxStyles(fakeStyles as any);

    const gridLayer = document.querySelector("#gridLayer") as HTMLElement;
    const gridInners = gridLayer.querySelectorAll(".fp-grid-inner");
    expect(gridInners.length).toBe(1);

    const ribbonLayer = document.querySelector("#ribbonLayer") as HTMLElement;
    const ribbonInners = ribbonLayer.querySelectorAll(".fp-ribbon-inner");
    expect(ribbonInners.length).toBe(1);
  });

  it("applies futureCard class to cards", async () => {
    await setupFutureParallaxStyles(fakeStyles as any);

    const cards = document.querySelectorAll(".future-card");
    expect(cards.length).toBe(2);
    cards.forEach((card) => {
      expect(card.classList.contains("fp-card")).toBe(true);
      // Inline style should enforce a solid background color and full opacity
      const el = card as HTMLElement;
      expect(el.style.backgroundColor).toBeTruthy();
      expect(el.style.opacity).toBe("1");
    });
  });
});
