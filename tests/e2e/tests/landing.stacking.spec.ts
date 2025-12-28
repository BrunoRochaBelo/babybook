import { test, expect } from "@playwright/test";

// Este teste cobre a landing (projeto `landingpage`), que é separada do app React.
// Valida que os "book cards" do carrossel horizontal expõem variáveis CSS esperadas.

const landingBaseUrl =
  process.env.E2E_LANDING_BASE_URL ?? "http://127.0.0.1:4174";

test.describe("stacking cards sliver size", () => {
  test("desktop: tilt scale CSS var exists", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${landingBaseUrl}/`);

    const firstCardSelector = ".horizontal-track .book-card";
    const firstCard = page.locator(firstCardSelector).first();
    await firstCard.waitFor({ state: "attached" });
    await firstCard.scrollIntoViewIfNeeded();
    const cssValue = await firstCard.evaluate((el: HTMLElement) =>
      getComputedStyle(el).getPropertyValue("--tilt-scale"),
    );
    const scale = Number.parseFloat(cssValue || "0");
    expect(scale).toBeGreaterThanOrEqual(0.8);
  });

  test("mobile: tilt scale CSS var exists", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`${landingBaseUrl}/`);

    const firstCardSelector = ".horizontal-track .book-card";
    const firstCard = page.locator(firstCardSelector).first();
    await firstCard.waitFor({ state: "attached" });
    await firstCard.scrollIntoViewIfNeeded();
    const cssValue = await firstCard.evaluate((el: HTMLElement) =>
      getComputedStyle(el).getPropertyValue("--tilt-scale"),
    );
    const scale = Number.parseFloat(cssValue || "0");
    expect(scale).toBeGreaterThanOrEqual(0.8);
  });
});
