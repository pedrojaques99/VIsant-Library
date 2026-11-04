import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

/*
 * O que a revisão de design achou e não pode voltar: rodapé em toda rota, docs que abre o uso
 * em vez do arquivo cru, descrição de prop inteira, troca de marca na dobra, e a etiqueta
 * do card fora de cima da peça.
 */

const CELULAR = { viewport: { width: 390, height: 664 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 };

test.describe("rodapé no toque", () => {
  test.use(CELULAR);

  for (const rota of ["/", "/docs", "/marca", "/skills", "/skills/killer", "/skills/filme", "/c/kanban", "/catalogo/shaders", "/nao-existe"]) {
    test(`${rota} fecha com o rodapé, em alvos de 44px`, async ({ page }) => {
      await page.goto(rota);
      const rodape = page.locator("footer");
      await expect(rodape).toBeVisible();
      for (const nome of ["Catálogo", "Skills", "Marca", "Docs", "llms.txt", "GitHub", "Visant Labs"]) {
        const caixa = await rodape.getByRole("link", { name: nome }).boundingBox();
        expect(caixa?.height, nome).toBeGreaterThanOrEqual(44);
        expect(caixa?.width, nome).toBeGreaterThanOrEqual(44);
      }
    });
  }

  test("em /skills o dock não cobre o rodapé", async ({ page }) => {
    await page.goto("/skills");
    await expect(page.locator("[data-dock]")).toBeVisible({ timeout: 20_000 });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(400);
    const dock = await page.locator("[data-dock]").boundingBox();
    const github = await page.locator("footer").getByRole("link", { name: "GitHub" }).boundingBox();
    expect(github!.y + github!.height).toBeLessThanOrEqual(dock!.y + 1);
  });

  test("em /skills/filme o rodapé vem depois da linha do tempo", async ({ page }) => {
    await page.goto("/skills/filme");
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(400);
    const tempo = await page.locator(".filme-tempo").boundingBox();
    const rodape = await page.locator("footer").boundingBox();
    if (tempo) expect(tempo.y + tempo.height).toBeLessThanOrEqual(rodape!.y + 1);
  });

  test("/docs não rola de lado e a linha da referência abre o uso ali", async ({ page }) => {
    await page.goto("/docs");
    const linha = page.locator('[data-doc="use-debounce"]');
    await linha.getByRole("button", { name: /useDebounce/ }).click();
    await expect(page).toHaveURL(/\/docs$/);
    await expect(linha.locator("pre")).toContainText("useDebounce(texto, 300)");
    await expect(linha.locator("pre")).not.toContainText("use client");
    const lados = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    expect(lados[0]).toBeLessThanOrEqual(lados[1]);
  });
});

test.describe("docs", () => {
  test("3 passos, runtime, agente, e os comandos batem com o registry", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.getByRole("heading", { name: "Começar em 3 passos" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Trocar de marca em runtime" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Conectar o agente" })).toBeVisible();

    const nomes = (JSON.parse(readFileSync("registry.json", "utf8")).items as { name: string }[]).map((i) => i.name);
    const texto = await page.locator("main").innerText();
    const citados = [...texto.matchAll(/add @visant\/([a-z0-9-]+)/g)].map((m) => m[1]);
    expect(citados.length).toBeGreaterThan(3);
    for (const nome of citados) {
      if (!nome.startsWith("theme-")) expect(nomes, nome).toContain(nome);
    }
    await expect(page.getByText("ui.visantlabs.com/mcp").first()).toBeVisible();
  });

  test("a busca filtra sem acento", async ({ page }) => {
    await page.goto("/docs");
    await page.getByRole("searchbox", { name: "Buscar na referência" }).fill("relogio");
    await expect(page.locator('[data-doc="css-color"]')).toHaveCount(0);
    await expect(page.locator('[data-doc="tempo-clock"]')).toBeVisible();
  });

  test("/docs#item chega com a linha aberta", async ({ page }) => {
    await page.goto("/docs#css-color");
    await expect(page.locator('[data-doc="css-color"] pre')).toContainText("resolveCssColor");
  });
});

test.describe("ficha, catálogo e títulos", () => {
  test("a descrição da prop vem inteira", async ({ page }) => {
    await page.goto("/c/kanban");
    await page.getByRole("button", { name: /props/i }).first().click();
    await expect(page.getByText("mover entre colunas E reordenar dentro da mesma. O consumidor persiste").first()).toBeVisible();
    await expect(page.getByText("Também aceita drop quando vazia (o useDroppable no corpo inteiro)").first()).toBeVisible();
  });

  test("nenhuma descrição gerada guarda quebra de linha no meio da frase", () => {
    const docs = JSON.parse(readFileSync("src/app/props.generated.json", "utf8")) as Record<
      string,
      { descricao: string | null; props: { descricao: string | null }[] }[]
    >;
    for (const componentes of Object.values(docs)) {
      for (const c of componentes) {
        for (const o of [c, ...c.props]) {
          for (const paragrafo of (o.descricao ?? "").split("\n\n")) {
            for (const [i, linha] of paragrafo.split("\n").entries()) {
              if (i > 0) expect(linha, paragrafo).toMatch(/^(?:[-*•]|\d+[.)])\s/);
            }
          }
        }
      }
    }
  });

  test("as marcas da dobra trocam a marca de verdade", async ({ page }) => {
    await page.goto("/");
    const linha = page.locator("[data-marcas-na-dobra] button");
    await expect(linha).toHaveCount(4);
    const antes = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--brand"));
    await linha.nth(3).click();
    await expect(linha.nth(3)).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--brand")))
      .not.toBe(antes);
  });

  test("as marcas começam na margem do título", async ({ page }) => {
    await page.goto("/");
    const amostra = page.locator("[data-marcas-na-dobra] button > span").first();
    await expect(amostra).toBeVisible();
    const x = (await amostra.boundingBox())!.x;
    const titulo = (await page.locator("h1").first().boundingBox())!.x;
    expect(Math.abs(x - titulo), "a miniatura saiu da margem do título").toBeLessThan(2);
  });

  test("a etiqueta do card mora abaixo do palco", async ({ page }) => {
    await page.goto("/");
    const card = page.locator('article[data-name="fog-hero"]');
    await card.scrollIntoViewIfNeeded();
    await card.hover();
    const palco = await card.locator("[data-palco]").boundingBox();
    const etiqueta = await card.getByRole("button", { name: "Ver Fog Hero" }).boundingBox();
    expect(etiqueta!.y).toBeGreaterThanOrEqual(palco!.y + palco!.height - 1);
  });

  test("a aba Shaders em desktop não tem rodapé nem rolagem de página", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/catalogo/shaders");
    await expect(page.locator("footer")).toBeHidden();
    await expect(page).toHaveTitle("Shaders / catálogo @visant/ui");
    await page.waitForTimeout(500);
    const [altura, janela] = await page.evaluate(() => [document.documentElement.scrollHeight, innerHeight]);
    expect(altura).toBeLessThanOrEqual(janela);
  });

  test("família tem título próprio e o html é pt-BR", async ({ page }) => {
    await page.goto("/catalogo/motion");
    await expect(page).toHaveTitle(/ \/ catálogo @visant\/ui$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  });
});
