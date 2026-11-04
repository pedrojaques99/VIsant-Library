import { expect, test, type Page } from "@playwright/test";

/*
 * A casca no dedo: "mobile first" escrito em invariante.
 *
 * Um revisor com o celular emulado achou o desktop apertado passando em todos os
 * portões: nenhum deles rodava com toque. Aqui o perfil tem `hasTouch` e `isMobile`,
 * que é o que faz `@media (pointer: coarse)` valer. Chromium só, como o resto da suíte.
 * O que se afirma é posição e área de toque, nunca pixel.
 */

const IPHONE = { viewport: { width: 390, height: 664 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 };
const PEQUENO = { viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 };

const SELETOR_DE_CONTROLES = 'button, a[href], select, textarea, input:not([type="checkbox"]), [role="switch"], [role="tab"]';

/**
 * A área de toque de cada controle da casca que está inteiro na tela, medida com
 * `elementFromPoint` em cruz a partir do centro: um vizinho por cima conta contra.
 * Peça no palco fica de fora: o tamanho dela é decisão da peça.
 */
const alvosPequenos = (page: Page, minimo = 44) =>
  page.evaluate(
    ({ seletor, minimo }) => {
      const pequenos: string[] = [];
      for (const el of Array.from(document.querySelectorAll<HTMLElement>(seletor))) {
        if (el.closest(".palco") || el.closest("label")) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        /* Inteiro na tela: cortado pela borda ou por quem gruda, a medida não diz nada. */
        if (r.top < 0 || r.left < 0 || r.bottom > innerHeight || r.right > innerWidth) continue;
        const estilo = getComputedStyle(el);
        if (estilo.visibility === "hidden" || estilo.pointerEvents === "none") continue;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const meu = (x: number, y: number) => {
          const t = document.elementFromPoint(x, y);
          return !!t && (t === el || el.contains(t));
        };
        if (!meu(cx, cy)) continue; /* coberto por quem gruda */
        const andar = (dx: number, dy: number) => {
          let n = 0;
          while (n < 60 && meu(cx + dx * (n + 1), cy + dy * (n + 1))) n++;
          return n;
        };
        const altura = andar(0, -1) + andar(0, 1) + 1;
        const largura = andar(-1, 0) + andar(1, 0) + 1;
        /* Um pixel de folga: o centro cai em fração quando o vizinho tem largura de texto. */
        if (altura < minimo - 1 || largura < minimo - 1) {
          const nome = (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 30);
          pequenos.push(`${nome} (${largura}x${altura})`);
        }
      }
      return pequenos;
    },
    { seletor: SELETOR_DE_CONTROLES, minimo },
  );

const larguraDoDocumento = (page: Page) =>
  page.evaluate(() => ({ doc: document.documentElement.scrollWidth, tela: innerWidth }));

const abrir = async (page: Page, caminho: string) => {
  await page.goto(caminho, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
};

test.describe("iPhone 13", () => {
  test.use(IPHONE);

  test("1. ao rolar gruda uma linha de cabeçalho, e a barra de abas responde ao toque logo abaixo", async ({ page }) => {
    await abrir(page, "/");
    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.waitForTimeout(300);

    const m = await page.evaluate(() => {
      const r = document.querySelector("header")!.getBoundingClientRect();
      const filtro = document.querySelector('button[aria-label^="Filtrar"]')!.getBoundingClientRect();
      const noFiltro = document.elementFromPoint(filtro.left + filtro.width / 2, filtro.top + filtro.height / 2);
      const aba = Array.from(document.querySelectorAll("button[aria-pressed]")).find((b) => /^Tudo/.test(b.textContent ?? ""))!;
      const ra = aba.getBoundingClientRect();
      const naAba = document.elementFromPoint(ra.left + ra.width / 2, ra.top + ra.height / 2);
      return {
        cabecalho: r.bottom,
        filtroTopo: filtro.top,
        filtroAcertado: !!noFiltro?.closest('button[aria-label^="Filtrar"]'),
        abaAcertada: !!naAba?.closest("button") && naAba!.closest("button") === aba,
      };
    });
    expect(m.cabecalho, "o cabeçalho grudado é uma linha só").toBeLessThanOrEqual(56);
    expect(m.filtroTopo, "a barra começa onde o cabeçalho acaba").toBeGreaterThanOrEqual(m.cabecalho);
    expect(m.filtroAcertado, "o toque no filtro cai no filtro").toBe(true);
    expect(m.abaAcertada, "o toque na aba cai na aba").toBe(true);

    await page.locator('button[aria-label^="Filtrar"]').tap();
    await expect(page.getByRole("button", { name: /^React\s*\d+$/ })).toBeVisible();
  });

  test("2. tocar num shader lá de baixo mostra o efeito, com nome e comando à mão", async ({ page }) => {
    await abrir(page, "/catalogo/shaders");
    const ultimo = page.locator("[data-filtro]").last();
    await ultimo.scrollIntoViewIfNeeded();
    await ultimo.tap();
    await page.waitForTimeout(600);
    await expect(ultimo).toHaveAttribute("aria-pressed", "true");

    const lab = page.locator("[data-shader-lab]");
    await expect(lab.locator("canvas")).toHaveCount(1);
    const canvas = await lab.locator("canvas").boundingBox();
    expect(canvas, "o canvas existe").not.toBeNull();
    expect(canvas!.y, "o palco não ficou atrás do cabeçalho nem da barra").toBeGreaterThanOrEqual(56);
    expect(canvas!.y + canvas!.height, "o palco está na tela").toBeLessThanOrEqual(664);

    const comando = await page.locator('[data-shader-lab] button[aria-label^="Copiar: "]:visible').boundingBox();
    expect(comando, "o comando está junto do palco").not.toBeNull();
    expect(comando!.y).toBeGreaterThanOrEqual(56);
    expect(comando!.y + comando!.height).toBeLessThanOrEqual(664);
  });

  test("5. a foto da grade não finge controle: o toque acorda a peça, e o nome abre a ficha", async ({ page }) => {
    await abrir(page, "/");
    const card = page.locator('article[data-name="book-3d"]');
    await expect(card).not.toHaveAttribute("data-viva", "");
    const caixa = (await card.locator("[data-palco]").boundingBox())!;
    await page.touchscreen.tap(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
    await expect(card).toHaveAttribute("data-viva", "");
    expect(new URL(page.url()).pathname, "continua na grade").toBe("/");

    await card.locator("[data-card-index]").tap();
    await expect(page.locator('[data-ficha="book-3d"]')).toBeVisible();
  });

  test("7. a ficha aberta do meio da grade começa no topo, e voltar devolve ao card", async ({ page }) => {
    await abrir(page, "/");
    const card = page.locator("article[data-name]").nth(8);
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const y = await page.evaluate(() => window.scrollY);
    expect(y).toBeGreaterThan(600);

    await card.locator("[data-card-index]").tap();
    await expect(page.locator("[data-ficha]")).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

    await page.goBack();
    await expect(page.locator("[data-ficha]")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(y);
  });

  test("8 e 10. a ficha mostra nome, palco e comando sem rolar, e o palco fica à vista enquanto se mexe", async ({ page }) => {
    await abrir(page, "/c/gauge");
    const titulo = (await page.locator("#ficha-titulo").boundingBox())!;
    const comando = (await page.locator('[data-ficha] button[aria-label^="Copiar: "]:visible').first().boundingBox())!;
    expect(titulo.y).toBeLessThan(664);
    expect(comando.y + comando.height, "o comando cabe na primeira dobra").toBeLessThanOrEqual(664);

    const slider = page.locator('[data-ficha] [role="slider"]').last();
    await slider.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const palco = (await page.locator("[data-ficha] .palco").first().boundingBox())!;
    const noSlider = (await slider.boundingBox())!;
    expect(palco.y, "o palco gruda sob o cabeçalho").toBeGreaterThanOrEqual(56);
    expect(palco.y + palco.height, "o controle aparece abaixo do palco").toBeLessThanOrEqual(noSlider.y + 1);
  });

  for (const rota of ["/", "/c/kanban", "/c/gauge", "/catalogo/shaders", "/marca"]) {
    test(`12. alvos de 44px em ${rota}`, async ({ page }) => {
      await abrir(page, rota);
      expect(await alvosPequenos(page), "na primeira dobra").toEqual([]);
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(300);
      expect(await alvosPequenos(page), "depois de rolar").toEqual([]);
    });
  }

  test("13. nada de instrução de teclado físico no toque", async ({ page }) => {
    const FALA_DE_TECLADO = /Setas percorrem|Enter aplica|tecla \/|⌘K|Ctrl\s*K/;

    await abrir(page, "/marca");
    expect(await page.locator("#busca-na-marca").getAttribute("placeholder")).not.toMatch(FALA_DE_TECLADO);
    expect(await page.locator("body").innerText()).not.toMatch(FALA_DE_TECLADO);

    await abrir(page, "/");
    expect(await page.locator("body").innerText()).not.toMatch(FALA_DE_TECLADO);
    await page.locator('header button[aria-haspopup="dialog"]:visible').first().tap();
    await expect(page.getByPlaceholder("Buscar marca, fonte ou cor…")).toBeVisible();
    await page.waitForTimeout(200);
    expect(await page.locator("body").innerText()).not.toMatch(FALA_DE_TECLADO);
  });

  test("9. nenhum campo da casca abaixo de 16px no toque", async ({ page }) => {
    await abrir(page, "/c/gauge");
    const fontes = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("input:not([type=checkbox]), textarea, select")).map(
        (el) => parseFloat(getComputedStyle(el).fontSize),
      ),
    );
    expect(fontes.length).toBeGreaterThan(0);
    expect(Math.min(...fontes)).toBeGreaterThanOrEqual(16);
  });

  test("14. Copiar pra IA abre folha inferior, com a peça ainda à vista", async ({ page }) => {
    await abrir(page, "/c/kanban");
    await page.getByRole("button", { name: "Copiar pra IA" }).tap();
    const folha = page.getByRole("dialog");
    await expect(folha).toBeVisible();
    await page.waitForTimeout(350);
    const caixa = (await folha.boundingBox())!;
    expect(caixa.y + caixa.height, "encosta no pé da tela").toBeGreaterThanOrEqual(663);
    expect(caixa.width).toBe(390);
    expect(await alvosPequenos(page)).toEqual([]);
  });
});

test.describe("360 com marca de nome longo", () => {
  test.use(PEQUENO);

  const NOME_LONGO = "Companhia Nacional de Nomes Compridos Demais";

  test("11. o cabeçalho cabe, com Entrar inteiro, seja qual for o nome", async ({ page }) => {
    await page.route("**/r/brands.json", async (route) => {
      const resposta = await route.fetch();
      const indice = await resposta.json();
      const lista = indice.brands ?? indice;
      const alvo = lista.find((b: { slug: string }) => b.slug === "visant");
      alvo.name = NOME_LONGO;
      await route.fulfill({ response: resposta, json: indice });
    });

    for (const marca of ["visant", "vega-noturno"]) {
      await abrir(page, `/?brand=${marca}`);
      const { doc, tela } = await larguraDoDocumento(page);
      expect(doc, `${marca}: o documento não passa da tela`).toBeLessThanOrEqual(tela);

      const entrar = (await page.getByRole("button", { name: "Entrar", exact: true }).boundingBox())!;
      expect(entrar.x + entrar.width, `${marca}: Entrar inteiro`).toBeLessThanOrEqual(tela);
      expect(entrar.width).toBeGreaterThan(40);
      expect(await alvosPequenos(page), `${marca}: alvos`).toEqual([]);
    }
  });
});
