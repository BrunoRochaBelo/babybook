import { test, expect } from "@playwright/test";

test.use({ storageState: "./.auth-state.json" });

test("dashboard mostra dados reais da conta demo", async ({ page }) => {
  await page.goto("/jornada");

  await expect(page.getByRole("button", { name: /Luna Demo/i })).toBeVisible({
    timeout: 15_000,
  });

  await expect(
    page.getByRole("heading", { name: "Jornada", exact: true }),
  ).toBeVisible();

  // Seed E2E cria um momento publicado (Primeiro sorriso)
  await expect(page.getByText("Primeiro sorriso")).toBeVisible({
    timeout: 15_000,
  });
});
