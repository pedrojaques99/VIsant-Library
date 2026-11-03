import { expect, test } from "@playwright/test";

/*
 * As landings das skills: abrem, não rolam na horizontal, e endereço errado
 * parece errado. As demos têm verificação própria; aqui é o que não pode quebrar
 * calado num deploy.
 */

const PAGINAS = [
  { rota: "/skills", titulo: /Tire a cara de IA/ },
  { rota: "/skills/filme", titulo: /Tire a cara de IA/ },
  { rota: "/skills/killer", titulo: /Tire a cara de IA/ },
];

for (const { rota, titulo } of PAGINAS) {
  for (const largura of [1440, 390]) {
    test(`${rota} abre em ${largura}px sem rolar de lado`, async ({ page }) => {
      const erros: string[] = [];
      page.on("pageerror", (e) => erros.push(e.message));
      await page.setViewportSize({ width: largura, height: 850 });
      await page.goto(rota);
      await expect(page.locator("h1").first()).toHaveText(titulo, { timeout: 20_000 });
      const sobra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(sobra).toBeLessThanOrEqual(0);
      expect(erros).toEqual([]);
    });
  }
}

test("endereço que não existe mostra 404, e a volta do OAuth não", async ({ page }) => {
  for (const rota of ["/skills/nada", "/nada-aqui"]) {
    await page.goto(rota);
    await expect(page.getByRole("heading", { name: "Essa página não existe." })).toBeVisible();
    await expect(page).toHaveTitle(/não encontrada/);
  }
  await page.goto("/callback");
  await expect(page.getByRole("heading", { name: "Essa página não existe." })).toHaveCount(0);
});

test("a aba Tudo abre pelos destaques do admin", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/catalogo");
  const primeira = page.locator("article[data-name]").first();
  await expect(primeira).toHaveAttribute("data-name", "book-3d");
});
