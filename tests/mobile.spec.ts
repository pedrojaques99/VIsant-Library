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
      const aba = Array.from(document.querySelectorAll("button[aria-pressed]")).find((b) => /^Componentes/.test(b.textContent ?? ""))!;
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

  test("5. a foto de GPU não finge controle: o toque acorda a peça, e o nome abre a ficha", async ({ page }) => {
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
    await expect(page.getByPlaceholder("Buscar marca…")).toBeVisible();
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

/*
 * Sem `isMobile`: com ele o navegador alarga a janela até caber o conteúdo, `innerWidth` acompanha,
 * e a comparação dá igual mesmo com a página estourando. Foi assim que o menu passou 20 px em 360.
 */
test("em 360 de verdade, o menu cabe e a página não estoura", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const rota of ["/skills", "/docs"]) {
    await page.goto(rota);
    await expect(page.getByRole("navigation", { name: "Seção" }).first()).toBeVisible({ timeout: 20_000 });
    const largura = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(largura, rota).toBeLessThanOrEqual(360);
  }
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

/*
 * O gesto no dedo, por CDP: passa pelo reconhecedor de gesto da tela, então a
 * rolagem e o `touch-action` são os de verdade. `npm run check:toque` mede o acervo
 * inteiro; aqui fica a amostra que trava cada regra, em dez peças variadas.
 */
test.describe("gesto no dedo", () => {
  test.use({ ...IPHONE, viewport: { width: 390, height: 844 } });

  const dedo = async (page: Page) => {
    const cdp = await page.context().newCDPSession(page);
    const envia = (type: "touchStart" | "touchMove" | "touchEnd", x = 0, y = 0) =>
      cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
    return {
      mover: async (x: number, y: number) => {
        await envia("touchMove", x, y);
        await page.waitForTimeout(16);
      },
      arrastar: async (x0: number, y0: number, x1: number, y1: number, segurar = 30, antesDeSoltar?: () => Promise<void>) => {
        await envia("touchStart", x0, y0);
        await page.waitForTimeout(segurar);
        for (let i = 1; i <= 14; i++) {
          await envia("touchMove", x0 + ((x1 - x0) * i) / 14, y0 + ((y1 - y0) * i) / 14);
          await page.waitForTimeout(16);
        }
        await antesDeSoltar?.();
        await envia("touchEnd");
        await page.waitForTimeout(450);
      },
    };
  };

  const FICHA = "[data-ficha] [data-palco]";
  const caixa = async (page: Page, seletor: string) => (await page.locator(seletor).first().boundingBox())!;
  const rolagem = (page: Page) => page.evaluate(() => window.scrollY);

  /** De lado é da peça: `aria-valuenow` anda. Em pé é da página: rola, e a peça não anda. */
  for (const nome of ["slide-to-confirm", "elastic-slider", "vintage-slider", "voice-note"]) {
    test(`${nome}: de lado move a peça, em pé rola a página`, async ({ page }) => {
      await abrir(page, `/c/${nome}`);
      await page.waitForTimeout(800);
      const seletor = `${FICHA} [role="slider"]`;
      const b = await caixa(page, seletor);
      const cx = b.x + b.width / 2;
      const cy = b.y + b.height / 2;
      const d = await dedo(page);

      /* O polegar do slide-to-confirm só escreve o valor ao soltar: vale o valor ou a posição. */
      const estado = async () => {
        const el = page.locator(seletor).first();
        return `${await el.getAttribute("aria-valuenow")}|${Math.round((await el.boundingBox())!.x)}`;
      };
      const antes = await estado();
      let durante = antes;
      await d.arrastar(cx, cy, cx + (cx < 195 ? 90 : -90), cy, 30, async () => {
        durante = await estado();
      });
      expect(durante, "a peça andou com o dedo").not.toBe(antes);
      expect(await rolagem(page), "arrastar de lado não rola").toBe(0);

      await d.arrastar(cx, cy, cx, cy - 200);
      expect(await rolagem(page), "em pé a página rola").toBeGreaterThan(60);
    });
  }

  for (const nome of ["vintage-knob", "folding-bill"]) {
    test(`${nome}: a peça vertical segura o arrasto em pé`, async ({ page }) => {
      await abrir(page, `/c/${nome}`);
      await page.waitForTimeout(800);
      const alvo = page.locator(`${FICHA} [role="slider"], ${FICHA} [role="button"]`).first();
      const b = (await alvo.boundingBox())!;
      const antes = await page.locator(FICHA).screenshot();
      const d = await dedo(page);
      let durante: Buffer = antes;
      await d.arrastar(b.x + b.width / 2, b.y + b.height / 2, b.x + b.width / 2, b.y + b.height / 2 - 60, 30, async () => {
        durante = await page.locator(FICHA).screenshot();
      });
      expect(await rolagem(page), "a página fica").toBeLessThan(10);
      expect(durante.equals(antes), "a peça mudou").toBe(false);
    });
  }

  test("card-stack: de lado lança o cartão, em pé rola a página", async ({ page }) => {
    await abrir(page, "/c/card-stack");
    await page.waitForTimeout(800);
    const seletor = `${FICHA} [aria-roledescription="card"]`;
    const b = await caixa(page, seletor);
    const rotulo = await page.locator(seletor).getAttribute("aria-label");
    const d = await dedo(page);
    await d.arrastar(b.x + b.width / 2, b.y + b.height / 2, b.x + b.width / 2, b.y + b.height / 2 - 200);
    expect(await rolagem(page)).toBeGreaterThan(60);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(200);
    await d.arrastar(b.x + b.width / 2, b.y + b.height / 2, b.x + b.width + 80, b.y + b.height / 2);
    await page.waitForTimeout(500);
    expect(await page.locator(seletor).getAttribute("aria-label"), "o de cima foi pro fundo").not.toBe(rotulo);
  });

  test("photo-compare: quem começou de lado segura a página até soltar, e em pé a cortina não pula", async ({ page }) => {
    await abrir(page, "/c/photo-compare");
    await page.waitForTimeout(2500);
    const seletor = `${FICHA} .photo-compare`;
    const b = await caixa(page, seletor);
    const meio = b.y + b.height / 2;
    const cortina = () => page.locator(seletor).first().evaluate((e) => parseFloat((e as HTMLElement).style.getPropertyValue("--p")));
    const d = await dedo(page);

    await d.arrastar(b.x + b.width * 0.5, meio, b.x + b.width * 0.25, meio, 30, async () => {
      for (let i = 1; i <= 8; i++) await d.mover(b.x + b.width * 0.25, meio - i * 18);
    });
    expect(await cortina(), "a cortina segue o dedo").toBeCloseTo(25, 0);
    expect(await rolagem(page), "o dedo desviou para cima e a página ficou parada").toBe(0);

    await d.arrastar(b.x + b.width * 0.7, meio + 40, b.x + b.width * 0.7, meio - 120);
    expect(await rolagem(page), "em pé a página rola").toBeGreaterThan(40);
    expect(await cortina(), "e a cortina não foi até o dedo").toBeCloseTo(25, 0);
  });

  test("scrub-input: o campo todo arrasta, e rolar com o dedo torto não muda o valor", async ({ page }) => {
    await abrir(page, "/c/scrub-input");
    await page.waitForTimeout(800);
    const campo = page.locator('[role="spinbutton"]').first();
    const b = (await campo.boundingBox())!;
    const valor = async () => Number(await campo.getAttribute("aria-valuenow"));
    const d = await dedo(page);
    const cx = b.x + b.width * 0.7;
    const cy = b.y + b.height / 2;

    const antes = await valor();
    await d.arrastar(cx, cy + 4, cx + 8, cy - 120);
    expect(await valor(), "em pé, mesmo com desvio, é rolagem").toBe(antes);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    const q = (await campo.boundingBox())!;
    await d.arrastar(q.x + q.width * 0.7, q.y + q.height / 2, q.x + q.width * 0.7 + 60, q.y + q.height / 2);
    expect(await valor(), "de lado, do meio do campo, muda").toBeGreaterThan(antes);
  });

  test("scrub-input na ficha: seta e Esc ficam no campo", async ({ page }) => {
    await abrir(page, "/c/scrub-input");
    await page.waitForTimeout(800);
    const campo = page.locator('[role="spinbutton"]').first();
    await campo.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(/scrub-input/);
    await campo.locator("span.tabular-nums").first().dblclick();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    await expect(page).toHaveURL(/scrub-input/);
  });

  test("knob: o gesto gira e a página não anda, nem começando de lado", async ({ page }) => {
    await abrir(page, "/c/vintage-large-knob");
    await page.waitForTimeout(800);
    const seletor = `${FICHA} [role="slider"]`;
    const b = await caixa(page, seletor);
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;
    const valor = async () => Number(await page.locator(seletor).first().getAttribute("aria-valuenow"));
    const d = await dedo(page);
    const inicio = await valor();

    await d.arrastar(cx, cy + 30, cx, cy - 70);
    expect(await valor(), "subir aumenta").toBeGreaterThan(inicio);
    expect(await rolagem(page)).toBe(0);

    const alto = await valor();
    await d.arrastar(cx, cy - 30, cx + 60, cy - 20, 30, async () => {
      for (let i = 1; i <= 8; i++) await d.mover(cx + 60, cy - 20 + i * 10);
    });
    expect(await valor(), "começou de lado e o knob não morreu").toBeLessThan(alto);
    expect(await rolagem(page)).toBe(0);
  });

  test("pull-to-refresh: o dedo puxa o painel até o fim do gesto", async ({ page }) => {
    await abrir(page, "/c/pull-to-refresh");
    await page.waitForTimeout(800);
    const seletor = `${FICHA} [role="region"]`;
    const b = await caixa(page, seletor);
    const d = await dedo(page);
    let altura = 0;
    await d.arrastar(b.x + b.width / 2, b.y + 30, b.x + b.width / 2, b.y + 170, 30, async () => {
      altura = (await caixa(page, seletor)).height;
    });
    expect(altura, "o painel desce com o dedo: já morreu aos 10px por captura dupla").toBeGreaterThan(b.height + 30);
  });

  test("kanban: legível na ficha, e o cartão levantado não salta de tamanho", async ({ page }) => {
    await abrir(page, "/c/kanban");
    await page.waitForTimeout(1500);
    const palco = await caixa(page, FICHA);
    const cartao = await caixa(page, `${FICHA} .kanban-card`);
    expect(palco.width, "usa a largura do celular").toBeGreaterThan(340);
    expect(cartao.width, "sem miniatura").toBeGreaterThan(280);
    expect(cartao.height, "alvo de dedo").toBeGreaterThanOrEqual(44);

    const d = await dedo(page);
    let voando: { width: number; height: number; x: number; y: number } | null = null;
    const cx = cartao.x + cartao.width / 2;
    const cy = cartao.y + cartao.height / 2;
    await d.arrastar(cx, cy, cx, cy + 100, 330, async () => {
      voando = await page.locator(".kanban-card-overlay").boundingBox();
    });
    expect(voando, "o fantasma existe").not.toBeNull();
    expect(Math.abs(voando!.width - cartao.width), "mesma largura").toBeLessThan(3);
    expect(Math.abs(voando!.y + voando!.height / 2 - (cy + 100)), "acompanha o dedo").toBeLessThan(30);
  });

  test("grade do celular: peça sem GPU já está viva e o primeiro toque é dela", async ({ page }) => {
    await abrir(page, "/catalogo/controles");
    const card = page.locator('article[data-name="elastic-slider"]');
    await card.scrollIntoViewIfNeeded();
    await expect(card, "acorda ao assentar na tela").toHaveAttribute("data-viva", "", { timeout: 4000 });
    await page.waitForTimeout(500);
    const slider = card.locator('[role="slider"]').first();
    const b = (await slider.boundingBox())!;
    const antes = await slider.getAttribute("aria-valuenow");
    const d = await dedo(page);
    await d.arrastar(b.x + b.width / 2, b.y + b.height / 2, b.x + b.width / 2 + 60, b.y + b.height / 2);
    expect(await slider.getAttribute("aria-valuenow"), "o arrasto entrou").not.toBe(antes);
    expect(new URL(page.url()).pathname, "continua na grade").toBe("/catalogo/controles");
  });

  test("grade do celular: foto de GPU avisa, e dois toques nela não abrem a ficha", async ({ page }) => {
    await abrir(page, "/");
    const card = page.locator('article[data-name="book-3d"]');
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await expect(card.locator("svg.lucide-play"), "a foto diz que é foto").toBeVisible();
    const b = (await card.locator("[data-palco]").boundingBox())!;
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(300);
    expect(new URL(page.url()).pathname, "continua na grade").toBe("/");
    await expect(card).toHaveAttribute("data-viva", "");
  });

  test("a grade do celular respeita o teto de vivas", async ({ page }) => {
    await abrir(page, "/catalogo/controles?nivel=baixo");
    for (let y = 0; y < 6; y++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(350);
    }
    expect(await page.locator("article[data-viva]").count()).toBeLessThanOrEqual(3);
  });
});
