import { test, expect } from "@playwright/test";

// Checks that the stacking sliver CSS variable is present and has a value
// consistent with the expected offsets (8px mobile, 12px desktop)

test.describe("stacking cards sliver size", () => {
  test("desktop: sliver is at least 12px", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const firstInnerSelector =
      ".stacking-cards-container .card-stack-item .card-stack-inner";
    await page.waitForSelector(firstInnerSelector);
    const firstInner = await page.$(firstInnerSelector);
    const cssValue = await firstInner!.evaluate((el: HTMLElement) =>
      getComputedStyle(el).getPropertyValue("--card-stack-sliver"),
    );
    const px = parseInt(cssValue || "0", 10);
    expect(px).toBeGreaterThanOrEqual(12);
  });

  test("mobile: sliver is at least 8px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    const firstInnerSelector =
      ".stacking-cards-container .card-stack-item .card-stack-inner";
    await page.waitForSelector(firstInnerSelector);
    const firstInner = await page.$(firstInnerSelector);
    const cssValue = await firstInner!.evaluate((el: HTMLElement) =>
      getComputedStyle(el).getPropertyValue("--card-stack-sliver"),
    );
    const px = parseInt(cssValue || "0", 10);
    expect(px).toBeGreaterThanOrEqual(8);
  });
});
