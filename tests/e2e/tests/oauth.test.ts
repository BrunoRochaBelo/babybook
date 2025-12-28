import { test, expect } from "@playwright/test";

test.describe("OAuth dev-mock flow", () => {
  test("user logs in with Google mock consent", async ({ page }) => {
    await page.goto("/login");
    // Click Google login
    await page.getByRole("button", { name: /continuar com google/i }).click();
    await page.waitForURL(/\/auth\/google\/authorize/);
    // On consent page, click Authorize
    await page.getByRole("button", { name: /^Authorize$/ }).click();
    // After authorization, should be redirected back to SPA
    await page.waitForURL(/\/jornada/);
    expect(page.url()).toContain("/jornada");
  });
});
