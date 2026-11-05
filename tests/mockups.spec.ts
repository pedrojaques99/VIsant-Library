import { expect, test } from "@playwright/test";

/*
 * O close centra o ponto de foco fazendo a conta da projeção à mão (`pontoDeFoco`), sem medir a
 * tela: se a conta divergir do CSS, o foco cai no lugar errado e nada quebra. E o quadro do ponto
 * já nasceu com largura zero dentro do painel, sem erro nenhum. O resto prende o que a auditoria
 * achou: arquivo com medida certa, desfazer de um passo, tela que sobrevive a recarregar e zoom
 * do navegador que não vem junto.
 */

const CHAVE = "visant:mockup:3";

const cena = (modelo: string, rot: object, foco: object, extra: object = {}) => ({
  modelo,
  rot,
  telaId: "pagina",
  foco: { ativo: true, zoom: 1.6, area: 45, desfoque: 10, ...foco },
  ...extra,
});

/*
 * A cena entra por uma página sem o app: com o estúdio montado, o salvamento de saída
 * (`pagehide`) gravaria a cena dele por cima da do teste, e a suíte falharia de vez em quando.
 */
const abrir = async (page, c?: object) => {
  await page.route("**/__semente", (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html>" }));
  await page.goto("/__semente");
  await page.evaluate(([k, v]) => (v ? localStorage.setItem(k as string, JSON.stringify(v)) : localStorage.removeItem(k as string)), [CHAVE, c ?? null]);
  await page.goto("/mockups", { waitUntil: "networkidle" });
  await page.waitForSelector(".mk-camada .device-frame");
  // A câmera pinta no quadro seguinte ao efeito que a calcula.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};

const aba = (page, nome: string) => page.getByRole("tab", { name: nome }).click();
const PNG_1X1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==", "base64");

for (const [modelo, rot] of [
  ["phone", { x: 14, y: -12, z: 6 }],
  ["tablet", { x: 14, y: -12, z: 6 }],
  ["laptop", { x: -14, y: -22, z: 0 }],
] as const) {
  test(`${modelo}: o close põe o ponto escolhido no centro do quadro`, async ({ page }) => {
    await abrir(page, cena(modelo, rot, { x: 45, y: 45 }, { orientacao: modelo === "phone" ? "retrato" : "paisagem" }));
    const erro = await page.evaluate(() => {
      const m = document.createElement("span");
      m.style.cssText = "position:absolute;left:45%;top:45%;width:0;height:0";
      document.querySelector(".mk-camada:not(.mk-camada-copia) .device-frame-tela")!.appendChild(m);
      const r = m.getBoundingClientRect();
      const q = document.querySelector(".mk-quadro")!.getBoundingClientRect();
      m.remove();
      return Math.hypot(r.left - (q.left + q.width / 2), r.top - (q.top + q.height / 2));
    });
    expect(erro).toBeLessThan(1);
  });
}

test("celular deitado: o close acerta o ponto da tela como ela é vista", async ({ page }) => {
  await abrir(page, cena("phone", { x: 14, y: -12, z: 6 }, { x: 40, y: 60 }, { orientacao: "paisagem" }));
  const erro = await page.evaluate(() => {
    const m = document.createElement("span");
    m.style.cssText = "position:absolute;left:40%;top:60%;width:0;height:0";
    document.querySelector(".mk-camada:not(.mk-camada-copia) .mk-tela-girada")!.appendChild(m);
    const r = m.getBoundingClientRect();
    const q = document.querySelector(".mk-quadro")!.getBoundingClientRect();
    m.remove();
    return Math.hypot(r.left - (q.left + q.width / 2), r.top - (q.top + q.height / 2));
  });
  expect(erro).toBeLessThan(1);
});

test("o ponto de foco tem tamanho e segue o arrasto", async ({ page }) => {
  await abrir(page, cena("laptop", { x: -14, y: -22, z: 0 }, { x: 50, y: 50 }));
  await aba(page, "Movimento");
  const alvo = page.getByRole("slider", { name: "Área em foco" });
  await alvo.scrollIntoViewIfNeeded();
  // A seção abre animando: medir no meio dela faria o arrasto começar fora do alvo.
  await page.waitForTimeout(350);
  const c = (await alvo.boundingBox())!;
  expect(c.width).toBeGreaterThan(80);
  await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
  await page.mouse.down();
  await page.mouse.move(c.x + c.width * 0.25, c.y + c.height * 0.3, { steps: 3 });
  await page.mouse.up();
  await expect(alvo).toHaveAttribute("aria-valuetext", "25% na horizontal, 30% na vertical");
});

test("sem foco não existe cópia; o notebook troca de pose e o Sensor sai da lista", async ({ page }) => {
  await abrir(page);
  await expect(page.locator(".mk-camada-copia")).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "Sensor" })).toHaveCount(1);

  await aba(page, "Aparelho");
  await page.getByRole("radio", { name: "MacBook" }).click();
  await page.getByRole("button", { name: "Ajuste fino" }).click();
  await expect(page.getByRole("textbox", { name: "Rotação X" })).toHaveValue("-14°");
  await expect(page.locator('.mk-mini[aria-label="Sensor"]')).toHaveCount(0);

  await aba(page, "Movimento");
  await page.getByRole("radio", { name: "Close", exact: true }).click();
  await expect(page.locator(".mk-camada-copia")).toHaveCount(1);
  await expect(page.getByRole("radio", { name: "Com foco" })).toHaveAttribute("aria-checked", "true");
});

test("a rota é só a ferramenta: sem menu nem rodapé do site, com caminho de volta", async ({ page }) => {
  await abrir(page);
  await expect(page.getByRole("navigation", { name: "Seção" })).toHaveCount(0);
  const fora = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  expect(fora).toBeLessThanOrEqual(0);
  await page.getByRole("link", { name: "visant/ui" }).click();
  await expect(page.getByRole("navigation", { name: "Seção" }).first()).toBeVisible();
});

test("o arquivo sai em 1920×1080 em qualquer janela, e o fim diz o que saiu", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1100, height: 700 }]) {
    await page.setViewportSize(viewport);
    await abrir(page);
    await expect(page.locator(".mk-saida-resumo")).toContainText("1920×1080");
  }
  const baixou = page.waitForEvent("download");
  await page.locator(".mk-exportar").click();
  const arquivo = await baixou;
  expect(arquivo.suggestedFilename()).toBe("mockup-1920x1080.png");
  await expect(page.locator(".mk-pronto")).toContainText("PNG, 1920×1080");
  await expect(page.getByRole("button", { name: "Baixar de novo" })).toBeVisible();
});

test("desfazer logo depois de editar volta um passo, e refazer vem de volta", async ({ page }) => {
  await abrir(page);
  await aba(page, "Aparelho");
  const sombra = page.getByRole("slider", { name: "Sombra", exact: true });
  await sombra.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(500);
  await expect(sombra).toHaveAttribute("aria-valuenow", "57");

  const prata = page.getByRole("radio", { name: "Prata" });
  await prata.click();
  await page.keyboard.press("Control+z");
  await expect(prata).toHaveAttribute("aria-checked", "false");
  await expect(sombra).toHaveAttribute("aria-valuenow", "57");

  await page.waitForTimeout(500);
  await page.keyboard.press("Control+Shift+z");
  await expect(prata).toHaveAttribute("aria-checked", "true");
});

test("a tela enviada sobrevive a recarregar", async ({ page }) => {
  await abrir(page);
  await page.setInputFiles("input[type=file]", { name: "minha-tela.png", mimeType: "image/png", buffer: PNG_1X1 });
  await expect(page.getByRole("radio", { name: "minha-tela" })).toHaveAttribute("aria-checked", "true");
  await expect(page.locator(".mk-convite")).toHaveCount(0);
  await page.waitForTimeout(600);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("radio", { name: "minha-tela" })).toHaveAttribute("aria-checked", "true");
});

test("colar da área de transferência põe a tela no aparelho", async ({ page }) => {
  await abrir(page);
  await page.evaluate((b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], "colada.png", { type: "image/png" }));
    window.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
  }, PNG_1X1.toString("base64"));
  await expect(page.getByRole("radio", { name: "colada" })).toHaveAttribute("aria-checked", "true");
});

test("Ctrl + roda muda o tamanho sem dar zoom na página", async ({ page }) => {
  await abrir(page);
  const impedido = await page.evaluate(() => {
    const el = document.querySelector(".mk-palco")!;
    const e = new WheelEvent("wheel", { deltaY: -100, ctrlKey: true, bubbles: true, cancelable: true });
    el.dispatchEvent(e);
    return e.defaultPrevented;
  });
  expect(impedido).toBe(true);
});

test("cena pronta marca qual está valendo", async ({ page }) => {
  await abrir(page);
  await aba(page, "Cena");
  const papel = page.locator('.mk-mini[aria-label="Papel"]');
  await expect(papel).toHaveAttribute("aria-checked", "false");
  await papel.click();
  await expect(papel).toHaveAttribute("aria-checked", "true");
});

test("contorno tira o volume, o traço acompanha o fundo e o arquivo sai", async ({ page }) => {
  await abrir(page);
  await aba(page, "Aparelho");
  await page.getByRole("radio", { name: "Contorno" }).click();
  await expect(page.locator(".mk-pose")).toHaveAttribute("data-traco", "contorno");
  await expect(page.locator(".device-frame-camada").first()).toBeHidden();
  await expect(page.getByRole("textbox", { name: "Traço em hexadecimal" })).toHaveValue("#FFFFFF");

  await aba(page, "Cena");
  await page.locator('.mk-mini[aria-label="Contorno"]').click();
  await aba(page, "Aparelho");
  await expect(page.getByRole("textbox", { name: "Traço em hexadecimal" })).toHaveValue("#111114");

  const baixou = page.waitForEvent("download");
  await page.locator(".mk-exportar").click();
  expect((await baixou).suggestedFilename()).toBe("mockup-1920x1080.png");
});

test("primeira visita: o aparelho pede a tela, sem nada flutuando sobre a obra", async ({ page }) => {
  await abrir(page);
  await expect(page.locator(".mk-tela-convite").last()).toContainText("Solte sua tela aqui");
  await page.setInputFiles("input[type=file]", { name: "minha.png", mimeType: "image/png", buffer: PNG_1X1 });
  await expect(page.locator(".mk-tela-convite")).toHaveCount(0);
});

test("imagem estática com movimento ligado sai do quadro que está na tela", async ({ page }) => {
  await abrir(page, { telaId: "pagina", movimento: { tipo: "flutuar", duracao: 2, intensidade: 50 } });
  await expect(page.locator(".mk-exportar")).toContainText("Exportar vídeo");
  const baixou = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar este quadro em PNG" }).click();
  expect((await baixou).suggestedFilename()).toBe("mockup-1920x1080.png");
});

test("zoom: botões, teclas, roda e enquadrar falam do mesmo número", async ({ page }) => {
  await abrir(page, { telaId: "pagina", tamanho: 50 });
  const valor = page.locator(".mk-zoom-valor");
  await expect(valor).toHaveText("50%");
  await page.getByRole("button", { name: "Aumentar o zoom" }).click();
  await expect(valor).toHaveText("55%");
  await page.locator("body").press("+");
  await expect(valor).toHaveText("61%");
  await page.locator("body").press("-");
  await expect(valor).toHaveText("55%");
  const palco = (await page.locator(".mk-palco").boundingBox())!;
  await page.mouse.move(palco.x + palco.width / 2, palco.y + palco.height / 2);
  await page.mouse.wheel(0, -300);
  await expect.poll(async () => parseInt((await valor.textContent())!)).toBeGreaterThan(70);
  await page.locator("body").press("0");
  await expect(valor).toHaveText("76%");
  await page.locator(".mk-palco").dblclick({ position: { x: 10, y: 200 } });
  await expect(valor).toHaveText("76%");
});

test("cenas: marcar, girar, marcar, e a animação passa pelas duas", async ({ page }) => {
  await abrir(page, { telaId: "pagina", rot: { x: 0, y: 0, z: 0 } });
  await aba(page, "Movimento");
  await page.locator('.mk-mini[aria-label="Cenas"]').click();
  await expect(page.getByRole("button", { name: "Cena 1" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Marcar cena" }).click();
  await expect(page.getByRole("button", { name: "Cena 2" })).toHaveAttribute("aria-pressed", "true");

  const palco = (await page.locator(".mk-palco").boundingBox())!;
  await page.mouse.move(palco.x + 60, palco.y + palco.height / 2);
  await page.mouse.down();
  await page.mouse.move(palco.x + 160, palco.y + palco.height / 2, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(450);
  const salva = () => page.evaluate(() => JSON.parse(localStorage.getItem("visant:mockup:3")!).chaves);
  await expect.poll(async () => (await salva())[1].rot.y).toBe(40);
  expect((await salva())[0].rot.y).toBe(0);

  const corpo = page.locator(".mk-camada .device-frame-corpo").last();
  const giro = () => corpo.evaluate((e) => (e as HTMLElement).style.transform);
  await page.getByRole("button", { name: "Cena 1" }).click();
  await expect.poll(giro).not.toContain("rotateY(40deg)");
  await page.getByRole("button", { name: "Cena 2" }).click();
  await expect.poll(giro).toContain("rotateY(40deg)");

  await page.getByRole("button", { name: "Apagar esta cena" }).click();
  await expect(page.getByRole("button", { name: "Cena 2" })).toHaveCount(0);
});

test("rolagem: arquivo comprido desce na tela, por controle e teclado, e cada ponto sai num arquivo diferente", async ({ page }) => {
  await abrir(page, { telaId: "pagina" });
  const rolagem = page.getByRole("slider", { name: "Rolagem" });
  await expect(rolagem).toBeVisible();
  const posicao = () => page.locator(".mk-camada .mk-tela-midia").last().evaluate((e) => getComputedStyle(e).objectPosition);
  expect(await posicao()).toContain("0%");

  await rolagem.focus();
  await page.keyboard.press("End");
  await expect(rolagem).toHaveAttribute("aria-valuenow", "100");
  await expect.poll(posicao).toContain("100%");

  const baixar = async () => {
    const baixou = page.waitForEvent("download");
    await page.locator(".mk-exportar").click();
    const d = await baixou;
    const fs = await import("node:fs/promises");
    await page.getByRole("button", { name: "Fechar" }).click();
    return (await fs.readFile((await d.path())!)).toString("base64");
  };
  const fim = await baixar();
  await rolagem.focus();
  await page.keyboard.press("Home");
  await expect.poll(posicao).toContain("0%");
  expect(await baixar()).not.toBe(fim);

  await page.locator(".mk-pasta-titulo").first().focus();
  await page.keyboard.press("PageDown");
  await expect(rolagem).toHaveAttribute("aria-valuenow", "15");
});

test("rolagem some quando o arquivo cabe na tela e em Caber", async ({ page }) => {
  await abrir(page, { telaId: "mesa" });
  await expect(page.getByRole("slider", { name: "Rolagem" })).toHaveCount(0);
  await abrir(page, { telaId: "pagina", ajuste: "contain" });
  await expect(page.getByRole("slider", { name: "Rolagem" })).toHaveCount(0);
});

test("cada cena guarda a sua rolagem, e o movimento Rolar desce sozinho", async ({ page }) => {
  await abrir(page, { telaId: "pagina" });
  await aba(page, "Movimento");
  await page.locator('.mk-mini[aria-label="Cenas"]').click();
  await page.keyboard.press("k");
  await aba(page, "Tela");
  await page.getByRole("slider", { name: "Rolagem" }).focus();
  await page.keyboard.press("End");
  await page.waitForTimeout(450);
  const chaves = await page.evaluate(() => JSON.parse(localStorage.getItem("visant:mockup:3")!).chaves.map((k) => k.rolagem));
  expect(chaves).toEqual([0, 100]);

  await abrir(page, { telaId: "pagina", movimento: { tipo: "rolar", duracao: 1, intensidade: 50 } });
  const posicao = () => page.locator(".mk-camada .mk-tela-midia").last().evaluate((e) => parseFloat(getComputedStyle(e).objectPosition.split(" ")[1]));
  await expect.poll(posicao, { timeout: 4000 }).toBeGreaterThan(40);
});

test("Ctrl + S exporta, e o PNG pronto vai para a área de transferência", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await abrir(page, { telaId: "pagina" });
  const baixou = page.waitForEvent("download");
  await page.keyboard.press("Control+s");
  await baixou;
  await page.getByRole("button", { name: "Copiar imagem" }).click();
  await expect(page.getByRole("button", { name: "Imagem copiada" })).toBeVisible();
  const tipos = await page.evaluate(async () => (await navigator.clipboard.read())[0].types);
  expect(tipos).toContain("image/png");
});
