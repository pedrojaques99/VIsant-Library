import { expect, test, type Page } from "@playwright/test";

/*
 * /admin com a API falsa: o dev server não serve `api/`. Aqui se prova o desenho e as regras de
 * leitura. O caminho real (middleware, /api/conta e as funções SQL) só se prova em produção.
 */

/* O catálogo inteiro entra nesta rota, e o dev server frio leva mais que os 5 s padrão. */
expect.configure({ timeout: 25_000 });

const hoje = new Date().toISOString().slice(0, 10);

const COMPLETO = {
  login: true,
  admin: true,
  fontes: { contagens: true, curadoria: true, burilacao: true, lab: true, skills: true, github: true },
  contagens: [
    { tipo: "visita", item: "site", dia: hoje, n: 42 },
    { tipo: "pagina", item: "/skills", dia: hoje, n: 30 },
    { tipo: "download", item: "logo-wall", dia: hoje, n: 9 },
    { tipo: "copia", item: "kanban", dia: hoje, n: 3 },
    { tipo: "origem", item: "t.co", dia: hoje, n: 7 },
    { tipo: "pais", item: "BR", dia: hoje, n: 40 },
    { tipo: "aparelho", item: "celular", dia: hoje, n: 25 },
  ],
  notas: [{ item: "logo-wall", nota: 2, comentario: "", excluir: false, data: hoje }],
  votos: [{ duelo: "d1", escolha: "a" }],
  veredictos: [{ id: "x", status: "kept", at: hoje }],
  skills: [
    { nome: "visant-killer", instalacoes: 47 },
    { nome: "visant-design", instalacoes: 5 },
  ],
  github: { estrelas: 82, forks: 2, views: null, clones: null },
};

const comApi = (page: Page, corpo: object) =>
  page.route("**/api/admin", (r) => r.fulfill({ json: corpo }));

test("quem não é admin não vê número nenhum", async ({ page }) => {
  await comApi(page, { login: true, admin: false });
  await page.goto("/admin");
  await expect(page.locator("h1")).toHaveText("Esta rota é só de admin.");
  await expect(page.locator("[data-indicador]")).toHaveCount(0);
});

test("o painel abre pelo que fazer, com a evidência ao lado", async ({ page }) => {
  await comApi(page, COMPLETO);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/admin");
  const leituras = page.locator("[data-leituras]");
  await expect(leituras).toContainText("está arquivada e segue sendo baixada");
  await expect(leituras).toContainText("9 downloads em 30 dias");
  await expect(leituras).toContainText("visant-design tem poucas instalações");
  await expect(page.locator('[data-indicador="Visitas"]')).toContainText("42");
  await expect(page.locator('[data-indicador="Estrelas"]')).toContainText("82");
  await expect(page.locator("[data-fontes-fora]")).toHaveCount(0);
});

test("fonte fora do ar é dita, e nunca vira zero", async ({ page }) => {
  await comApi(page, { ...COMPLETO, contagens: [], skills: [], github: null, fontes: { ...COMPLETO.fontes, contagens: false, skills: false, github: false } });
  await page.goto("/admin");
  await expect(page.locator("[data-fontes-fora]")).toContainText("Visitas, downloads e cópias");
  await expect(page.locator('[data-indicador="Visitas"]')).toContainText("fonte fora do ar");
  await expect(page.locator('[data-indicador="Estrelas"]')).toContainText("–");
  await expect(page.locator('[data-fonte="contagens"]')).toContainText("admin/supabase.sql");
});

test("no celular não rola de lado e o período cabe no toque", async ({ page }) => {
  await comApi(page, COMPLETO);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin");
  await expect(page.locator("[data-leituras]")).toBeVisible();
  const sobra = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(sobra).toBeLessThanOrEqual(0);
  await page.getByRole("button", { name: "7 dias" }).or(page.getByRole("radio", { name: "7 dias" })).first().click();
  await expect(page.locator("[data-leituras]")).toContainText("9 downloads em 7 dias");
});
