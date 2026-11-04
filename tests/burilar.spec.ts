import { readdirSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/*
 * /burilar: o admin vota, a resposta vai para a API e a rodada anda. A API é falsa aqui porque
 * o dev server não serve `api/`; a validação dela mora no próprio handler.
 */

async function comApi(page: Page, estado: object) {
  const votos: { duelo: string; escolha: string; motivos?: string[]; escrita?: string }[] = [];
  await page.route("**/api/burilacao", async (route) => {
    if (route.request().method() === "POST") {
      votos.push(route.request().postDataJSON());
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({ json: { login: true, store: true, admin: true, meus: [], votos: [], ...estado } });
  });
  return votos;
}

test("quem não é admin não vê duelo", async ({ page }) => {
  await comApi(page, { admin: false });
  await page.goto("/burilar");
  await expect(page.getByRole("heading", { name: "Esta rota é só de admin." })).toBeVisible();
  await expect(page.locator("[data-duelo]")).toHaveCount(0);
});

test("sem a tabela, a rota diz o que falta", async ({ page }) => {
  await comApi(page, { store: false });
  await page.goto("/burilar");
  await expect(page.locator("[data-aviso]")).toContainText("supabase.sql");
});

test("a rodada inteira no celular, com motivo, frase própria e imitação", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const votos = await comApi(page, {});
  await page.goto("/burilar");

  await expect(page.getByText("1 de 5")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);

  /* 1: escolhe e dá motivo. O motivo sai num segundo POST do mesmo duelo. */
  await page.locator('[data-opcao="a"]').click();
  await page.getByRole("button", { name: "vago" }).click();
  await page.locator("[data-proximo]").click();
  await expect(page.getByText("2 de 5")).toBeVisible();

  /* 2: escreve a própria. */
  await page.locator("[data-minha]").click();
  await page.locator("[data-frase]").fill("Minha frase");
  await page.getByRole("button", { name: "Enviar" }).click();
  await expect(page.getByText("3 de 5")).toBeVisible();

  /* 3: nenhuma. 4: escolhe sem motivo. */
  await page.locator("[data-nenhuma]").click();
  await expect(page.getByText("4 de 5")).toBeVisible();
  await page.locator('[data-opcao="b"]').click();
  await page.locator("[data-proximo]").click();
  await expect(page.getByText("5 de 5")).toBeVisible();

  /* 5: imitação revela a autoria e conta no fim. */
  await expect(page.getByRole("heading", { name: "Qual foi a gente que escreveu?" })).toBeVisible();
  await page.locator('[data-opcao="a"]').click();
  await expect(page.locator("[data-revelado]")).toHaveCount(2);
  await page.locator("[data-proximo]").click();
  await expect(page.getByRole("heading", { name: "Rodada feita." })).toBeVisible();
  await expect(page.locator("[data-aviso]")).toContainText(/em [01] de 1/);

  expect(votos.map((v) => v.escolha)).toEqual(["a", "a", "minha", "nenhuma", "b", "a"]);
  expect(votos[1].motivos).toEqual(["vago"]);
  expect(votos[2].escrita).toBe("Minha frase");
});

test("falha ao gravar avisa e não perde o duelo", async ({ page }) => {
  await comApi(page, {});
  await page.route("**/api/burilacao", (route) =>
    route.request().method() === "POST" ? route.fulfill({ status: 500, json: {} }) : route.fallback(),
  );
  await page.goto("/burilar");
  await page.locator('[data-opcao="a"]').click();
  await expect(page.getByRole("alert")).toContainText("Não gravou");
  await expect(page.getByText("1 de 5")).toBeVisible();
});

test("quem já votou tudo vê a rodada feita", async ({ page }) => {
  const ultima = readdirSync("burilacao/rodadas").sort().at(-1);
  const rodada = JSON.parse(readFileSync(`burilacao/rodadas/${ultima}`, "utf8")) as { duelos: { id: string }[] };
  await comApi(page, { meus: rodada.duelos.map((d) => d.id) });
  await page.goto("/burilar");
  await expect(page.getByRole("heading", { name: "Rodada feita." })).toBeVisible();
});
