import { test, expect } from "@playwright/test";

test("dashboard mostra dados reais da conta demo", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Luna Demo")).toBeVisible();
  await expect(page.getByText("Armazenamento")).toBeVisible();
  await expect(page.getByText("Momentos")).toBeVisible();
});
