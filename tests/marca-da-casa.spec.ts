import { expect, test, type Page } from "@playwright/test";

/*
 * O botão único da marca, com a conta falsa: demonstração e vault na mesma lista.
 * A guideline falsa compila no motor de verdade, então aplicar é o caminho real.
 */

expect.configure({ timeout: 25_000 });

const GUIDELINES = {
  guidelines: [
    {
      id: "abc123",
      name: "Marca do Vault",
      colors: [
        { hex: "#101820", role: "background", name: "Fundo" },
        { hex: "#F5F1E8", role: "text", name: "Texto" },
        { hex: "#D94F1E", role: "primary", name: "Laranja Queimado" },
      ],
      typography: [{ family: "Barlow", role: "display" }],
    },
  ],
};

async function entrarDeMentira(page: Page) {
  await page.addInitScript(() => localStorage.setItem("visant:refresh", "falso"));
  await page.route("**/oauth/token", (route) =>
    route.fulfill({ json: { access_token: "falso", refresh_token: "falso" } }),
  );
  await page.route("**/api/brand-guidelines**", (route) => route.fulfill({ json: GUIDELINES }));
}

const gatilho = (page: Page) => page.locator("[data-marca-da-casa]");

test("logado: um botão só, com as duas listas, e aplicar marca do vault fica no nome", async ({ page }) => {
  await entrarDeMentira(page);
  await page.goto("/?brand=visant");
  await expect(gatilho(page)).toBeEnabled();

  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Minhas marcas/ })).toHaveCount(0);
  await expect(page.locator("header").getByRole("button", { name: /^Marcas/ })).toHaveCount(0);

  await gatilho(page).click();
  await expect(page.getByText("Demonstração")).toBeVisible();
  await expect(page.getByText("Sua conta")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sair da conta" })).toBeVisible();

  await page.getByRole("option", { name: /Marca do Vault/ }).click();
  await expect(gatilho(page)).toContainText("Marca do Vault");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.brand)).toBe("conta:abc123");

  // Fechar sem escolher não desfaz a marca da conta.
  await gatilho(page).click();
  await page.keyboard.press("Escape");
  await expect(gatilho(page)).toContainText("Marca do Vault");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.brand)).toBe("conta:abc123");

  // Voltar para a demonstração é a mesma lista.
  await gatilho(page).click();
  await page.getByPlaceholder("Buscar marca…").fill("Vega");
  await page.getByRole("option", { name: /Vega Noturno/ }).click();
  await expect(gatilho(page)).toContainText("Vega Noturno");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.brand)).toBe("vega-noturno");
});

test("fora da conta: a lista é só demonstração, e Entrar segue à vista", async ({ page }) => {
  await page.goto("/?brand=visant");
  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeVisible();
  await expect(gatilho(page)).toBeEnabled();
  await gatilho(page).click();
  await expect(page.getByText("Demonstração")).toBeVisible();
  await expect(page.getByText("Sua conta")).toHaveCount(0);

  // Prévia ao percorrer, e Escape volta.
  const antes = await page.evaluate(() => document.documentElement.dataset.brand);
  await page.getByRole("option", { name: /Vega Noturno/ }).hover();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.brand)).toBe("vega-noturno");
  await page.keyboard.press("Escape");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.brand)).toBe(antes);
});

const pintada = (page: Page) => page.evaluate(() => document.documentElement.dataset.brand);

test("a marca da conta sobrevive ao F5, até alguém trocar ou sair", async ({ page }) => {
  await entrarDeMentira(page);
  await page.goto("/");
  await expect(gatilho(page)).toBeEnabled();
  await gatilho(page).click();
  await page.getByRole("option", { name: /Marca do Vault/ }).click();
  await expect.poll(() => pintada(page)).toBe("conta:abc123");

  await page.reload();
  await expect(gatilho(page)).toContainText("Marca do Vault");
  await expect.poll(() => pintada(page)).toBe("conta:abc123");

  // Na primeira dobra, nenhum atalho finge estar vestido; tocar num deles é trocar de marca.
  const dobra = page.locator("[data-marcas-na-dobra]");
  await expect(dobra.locator('button[aria-pressed="true"]')).toHaveCount(0);
  await dobra.getByRole("button", { name: "Vega Noturno" }).click();
  await expect(gatilho(page)).toContainText("Vega Noturno");
  await page.reload();
  await expect(gatilho(page)).toContainText("Vega Noturno");
  await expect.poll(() => pintada(page)).toBe("vega-noturno");

  // Sair esquece a escolha.
  await gatilho(page).click();
  await page.getByRole("option", { name: /Marca do Vault/ }).click();
  await expect.poll(() => pintada(page)).toBe("conta:abc123");
  await gatilho(page).click();
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("visant:marca-da-conta"))).toBeNull();
  await expect.poll(() => pintada(page)).toBe("vega-noturno");
});

test("link com ?brand= vale mais que a marca guardada", async ({ page }) => {
  await entrarDeMentira(page);
  await page.addInitScript(() => localStorage.setItem("visant:marca-da-conta", "abc123"));
  await page.goto("/?brand=norte-verde");
  await expect(gatilho(page)).toContainText("Norte Verde");
  await page.waitForTimeout(1000);
  await expect(gatilho(page)).toContainText("Norte Verde");
});

test("vault fora do ar não vira pedido em loop", async ({ page }) => {
  await entrarDeMentira(page);
  let pedidos = 0;
  await page.route("**/api/brand-guidelines**", (route) => {
    pedidos += 1;
    return route.fulfill({ status: 500, json: {} });
  });
  await page.goto("/");
  await expect(gatilho(page)).toBeEnabled();
  await gatilho(page).click();
  await expect(page.getByText("Não deu pra ler o vault")).toBeVisible();
  await page.waitForTimeout(1000);
  expect(pedidos).toBe(1);
});
