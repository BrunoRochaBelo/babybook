import { test, expect } from "@playwright/test";

test.describe("Checkout mock flow", () => {
  test("user can register and buy via mock checkout", async ({ page }) => {
    const apiPort = Number(process.env.E2E_API_PORT ?? "8000");
    const apiOrigin = `http://127.0.0.1:${Number.isFinite(apiPort) ? apiPort : 8000}`;

    const random = Math.floor(Math.random() * 100000);
    const email = `e2e+${random}@example.com`;
    // Em alguns cenários o deep-link em /register pode cair em /login.
    // Navegamos via UI para garantir que estamos na tela certa.
    await page.goto("/login");
    await page.getByRole("link", { name: /criar agora/i }).click();
    await expect(page).toHaveURL(/\/register/);

    // Fill register (suporta tanto inputs com label quanto com placeholder)
    await page
      .getByLabel(/nome/i)
      .or(page.getByPlaceholder(/nome/i))
      .fill("E2E User");
    await page
      .getByLabel(/^email$/i)
      .or(page.getByPlaceholder(/email|e-?mail|seu melhor email/i))
      .fill(email);
    await page
      .getByLabel(/senha/i)
      .or(page.getByPlaceholder(/senha|•/i))
      .fill("senha123");
    await page.getByRole("button", { name: /criar conta/i }).click();
    // After registration, we should be redirected to /jornada
    await expect(page).toHaveURL(/\/jornada/);

    // Garante que o cookie de sessão foi criado para o origin da API
    // (isso evita 401 inesperado no bootstrap do /checkout em alguns ambientes).
    const apiCookiesAfterRegister = await page.context().cookies(apiOrigin);
    expect(apiCookiesAfterRegister.some((c) => c.name === "bb_session")).toBe(
      true,
    );

    // Ir para checkout via navegação client-side.
    // Evita reload do documento (que pode ficar preso esperando 'load' em alguns ambientes).
    await page.evaluate(() => {
      window.history.pushState({}, "", "/checkout");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await page.waitForURL(/\/checkout$/, { timeout: 15_000 });

    await expect(
      page.getByRole("heading", { name: /checkout \(mock\)/i }),
    ).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /comprar agora/i }).click();
    // The mock checkout redirects to /checkout/success and returns to app after mock apply
    await page.waitForURL("/jornada");
    expect(page.url()).toContain("/jornada");
  });
});
