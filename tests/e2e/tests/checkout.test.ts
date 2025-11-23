import { test, expect } from "@playwright/test";

test.describe("Checkout mock flow", () => {
  test("user can register and buy via mock checkout", async ({ page }) => {
    const random = Math.floor(Math.random() * 100000);
    const email = `e2e+${random}@example.com`;
    await page.goto("/");
    await page.click("text=Entrar");
    await page.click("text=Cadastrar");
    // Fill register
    await page.fill("input[placeholder='Nome']", "E2E User");
    await page.fill("input[placeholder='Email']", email);
    await page.fill("input[placeholder='Senha']", "senha123");
    await page.click("text=Criar Conta");
    // After registration, we should be redirected to /jornada
    await expect(page).toHaveURL(/\/jornada/);
    // go to checkout
    await page.goto("/checkout");
    await page.click("text=Comprar agora");
    // The mock checkout redirects to /checkout/success and returns to app after mock apply
    await page.waitForURL("/jornada");
    expect(page.url()).toContain("/jornada");
  });
});
