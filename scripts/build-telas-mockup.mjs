/**
 * As telas de exemplo do estúdio de mockups: os nossos kits fotografados em celular e em desktop,
 * para o aparelho mostrar um produto, e não uma arte solta. Precisa do dev server no ar.
 *
 *   npx vite --port 5188 --strictPort
 *   node scripts/build-telas-mockup.mjs [http://localhost:5188]
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:5188";
const SAIDA = path.resolve("public/media/telas");
const TELAS = [
  { id: "mesa", caminho: "/kit/mesa-de-trabalho", endereco: "norte.app/ciclos/33" },
  { id: "pagina", caminho: "/kit/pagina-que-vende", endereco: "faro.studio" },
  { id: "motion", caminho: "/kit/motion-e-estado", endereco: "prisma.app/gerar" },
  { id: "marca", caminho: "/kit/brand-system", endereco: "marca.app/" },
];
const FORMAS = [
  { sufixo: "retrato", viewport: { width: 430, height: 882 }, escala: 2, toque: true },
  { sufixo: "deitado", viewport: { width: 882, height: 430 }, escala: 2, toque: true },
  { sufixo: "largo", viewport: { width: 1440, height: 900 }, escala: 1.5, toque: false },
];

fs.mkdirSync(SAIDA, { recursive: true });
const navegador = await chromium.launch({ channel: "chrome" });
for (const tela of TELAS) {
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
await navegador.close();
