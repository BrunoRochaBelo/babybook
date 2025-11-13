import { test, expect } from "@playwright/test";

test("dashboard mostra cartões de quota", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Armazenamento")).toBeVisible();
  await expect(page.getByText("Momentos")).toBeVisible();
});
