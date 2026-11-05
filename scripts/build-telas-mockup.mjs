/**
 * As telas de exemplo do estúdio de mockups: os nossos kits fotografados em celular e em desktop,
 * para o aparelho mostrar um produto, e não uma arte solta. Precisa do dev server no ar.
 *
 *   npx vite --port 5188 --strictPort
 *   node scripts/build-telas-mockup.mjs [http://localhost:5188]
 *   node scripts/build-telas-mockup.mjs --so-longas   # só a página inteira: refazer tudo muda todos os arquivos
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "@playwright/test";

const SO_LONGAS = process.argv.includes("--so-longas");
const BASE = process.argv.slice(2).find((a) => a.startsWith("http")) ?? "http://localhost:5188";
const SAIDA = path.resolve("public/media/telas");
const TELAS = [
  { id: "mesa", caminho: "/kit/mesa-de-trabalho", endereco: "norte.app/ciclos/33" },
  { id: "pagina", caminho: "/kit/pagina-que-vende", endereco: "faro.studio" },
  { id: "motion", caminho: "/kit/motion-e-estado", endereco: "prisma.app/gerar" },
  { id: "marca", caminho: "/kit/brand-system", endereco: "marca.app/" },
];
/* A página inteira, para o estúdio ter o que rolar. */
const LONGAS = ["pagina", "marca"];
const FORMAS = [
  { sufixo: "retrato", viewport: { width: 430, height: 882 }, escala: 2, toque: true },
  { sufixo: "deitado", viewport: { width: 882, height: 430 }, escala: 2, toque: true },
  { sufixo: "largo", viewport: { width: 1440, height: 900 }, escala: 1.5, toque: false },
];

fs.mkdirSync(SAIDA, { recursive: true });
const navegador = await chromium.launch({ channel: "chrome" });
for (const tela of SO_LONGAS ? [] : TELAS) {
  for (const forma of FORMAS) {
    const ctx = await navegador.newContext({ viewport: forma.viewport, deviceScaleFactor: forma.escala, hasTouch: forma.toque, colorScheme: "dark" });
    const pagina = await ctx.newPage();
    await pagina.goto(BASE + tela.caminho, { waitUntil: "networkidle" });
    await pagina.waitForTimeout(1500);
    // A janela de mentira do kit vira a tela inteira: sai a moldura de navegador, fica o produto.
    await pagina.evaluate((endereco) => {
      const rotulo = [...document.querySelectorAll("span")].find((e) => e.textContent?.startsWith(endereco) && e.className.includes("font-mono"));
      if (!rotulo) throw new Error(`janela nao achada: ${endereco}`);
      const barra = rotulo.parentElement;
      const janela = barra.parentElement;
      barra.style.display = "none";
      janela.style.cssText += ";position:fixed;inset:0;z-index:99999;margin:0;border:0;border-radius:0;overflow:hidden;background:var(--background)";
    }, tela.endereco);
    await pagina.waitForTimeout(700);
    const png = path.join(SAIDA, `${tela.id}-${forma.sufixo}.png`);
    await pagina.screenshot({ path: png });
    const webp = png.replace(/png$/, "webp");
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", png, "-quality", "86", webp]);
    fs.rmSync(png);
    console.log(webp);
    await ctx.close();
  }
}
for (const id of LONGAS) {
  const tela = TELAS.find((t) => t.id === id);
  const ctx = await navegador.newContext({ viewport: { width: 430, height: 882 }, deviceScaleFactor: 2, hasTouch: true, colorScheme: "dark" });
  const pagina = await ctx.newPage();
  await pagina.goto(BASE + tela.caminho, { waitUntil: "networkidle" });
  // Desce a página inteira antes: o que só entra perto da tela precisa já ter entrado na foto.
  await pagina.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 180));
    }
    window.scrollTo(0, 0);
  });
  await pagina.waitForTimeout(900);
  const png = path.join(SAIDA, `${id}-longa.png`);
  const janela = await pagina.evaluateHandle((endereco) => {
    const rotulo = [...document.querySelectorAll("span")].find((e) => e.textContent?.startsWith(endereco) && e.className.includes("font-mono"));
    if (!rotulo) throw new Error(`janela nao achada: ${endereco}`);
    rotulo.parentElement.style.display = "none";
    const j = rotulo.parentElement.parentElement;
    // Fora do fluxo e no topo do documento: nada em volta desloca ou corta a foto.
    j.style.cssText += ";position:absolute;top:0;left:0;right:0;z-index:99999;margin:0;border:0;border-radius:0;background:var(--background)";
    document.body.appendChild(j);
    window.scrollTo(0, 0);
    for (const el of j.querySelectorAll("*")) {
      // Dentro da janela, o que gruda volta ao lugar: na foto da página inteira ele fica no topo, e inteiro.
      if (getComputedStyle(el).position === "sticky") el.style.position = "relative", el.style.top = "0";
    }
    // O que gruda na tela é do site em volta: na foto da janela, entraria por cima do produto.
    for (const el of document.querySelectorAll("body *")) {
      if (j.contains(el) || el.contains(j)) continue;
      const pos = getComputedStyle(el).position;
      if (pos === "sticky" || pos === "fixed") el.style.visibility = "hidden";
    }
    return j;
  }, tela.endereco);
  await pagina.waitForTimeout(500);
  await janela.asElement().screenshot({ path: png });
  const webp = png.replace(/png$/, "webp");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", png, "-quality", "84", webp]);
  fs.rmSync(png);
  console.log(webp);
  await ctx.close();
}
await navegador.close();
