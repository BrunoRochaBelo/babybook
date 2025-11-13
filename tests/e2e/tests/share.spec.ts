import { test, expect } from "@playwright/test";

test("edge share renderiza payload p�blico", async ({ page }) => {
  await page.goto("http://127.0.0.1:8787/s/demo-stack-token");
  await expect(page.locator("pre")).toContainText("Primeiro sorriso");
  await expect(page.locator("pre")).toContainText("demo-stack-token");
});
