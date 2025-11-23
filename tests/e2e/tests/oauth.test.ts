import { test, expect } from "@playwright/test";

test.describe("OAuth dev-mock flow", () => {
  test("user logs in with Google mock consent", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Entrar");
    // Click Google login
    await Promise.all([
      page.waitForNavigation({ url: /auth\/google\/authorize/ }),
      page.click("text=Entrar com Google"),
    ]);
    // On consent page, click Authorize
    await page.click("text=Authorize");
    // After authorization, should be redirected back to SPA
    await page.waitForURL(/\/jornada/);
    expect(page.url()).toContain("/jornada");
  });
});
