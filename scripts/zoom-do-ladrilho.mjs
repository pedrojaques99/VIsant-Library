#!/usr/bin/env node
/*
 * Quanto da caixa cada peça ocupa, medido na capa, para ela crescer no ladrilho.
 *
 * O palco cabe a CAIXA declarada no `preview`, e a peça costuma ocupar só o miolo
 * dela: sobrava card vazio em volta de um botão. As capas são PNG/WebP sem fundo,
 * então o alfa diz onde a peça pinta. Sai daqui a tinta: a distância até o centro,
 * de 0 a 1 em cada eixo. O `PalcoFixo` usa isso para escalar a partir do centro até
 * perto da borda do ladrilho, na largura que estiver.
 *
 * Medir aqui, e não no navegador de quem visita: a peça não pula depois de montar,
 * e foto e peça viva recebem o mesmo número.
 *
 * Rode depois de refazer capas: `npm run build:zoom`.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHOTS = join(ROOT, "public/shots");
const SAIDA = join(ROOT, "src/app/zoom-do-ladrilho.generated.json");

const nomes = readdirSync(SHOTS)
  .filter((a) => a.endsWith("-escuro.webp"))
  .map((a) => a.replace("-escuro.webp", ""));

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
await pagina.goto("about:blank");

const medir = (arquivo) =>
  pagina.evaluate(async (b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const bmp = await createImageBitmap(new Blob([bytes], { type: "image/webp" }));
    const c = new OffscreenCanvas(bmp.width, bmp.height);
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(bmp, 0, 0);
    const { data } = g.getImageData(0, 0, bmp.width, bmp.height);
    let x0 = bmp.width, x1 = 0, y0 = bmp.height, y1 = 0;
    for (let y = 0; y < bmp.height; y++)
      for (let x = 0; x < bmp.width; x++)
        if (data[(y * bmp.width + x) * 4 + 3] > 24) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
    if (x1 < x0) return null;
    // Distância até o centro, de 0 a 1: o palco escala do meio da caixa.
    return {
      x: Math.max(0.5 - x0 / bmp.width, (x1 + 1) / bmp.width - 0.5) * 2,
      y: Math.max(0.5 - y0 / bmp.height, (y1 + 1) / bmp.height - 0.5) * 2,
    };
  }, readFileSync(arquivo).toString("base64"));

const tinta = {};
for (const nome of nomes) {
  // Os dois temas: a sombra de um pode pintar mais longe que a do outro.
  const medidas = [];
  for (const tema of ["escuro", "claro"]) {
    const m = await medir(join(SHOTS, `${nome}-${tema}.webp`)).catch(() => null);
    if (m) medidas.push(m);
  }
  if (!medidas.length) continue;
  const x = Math.max(...medidas.map((m) => m.x));
  const y = Math.max(...medidas.map((m) => m.y));
  // Peça que já enche a caixa não tem o que ganhar, e fica de fora do arquivo.
  if (x < 0.97 || y < 0.97) tinta[nome] = [Number(x.toFixed(2)), Number(y.toFixed(2))];
}
await navegador.close();

const ordenado = Object.fromEntries(Object.entries(tinta).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(SAIDA, `${JSON.stringify(ordenado)}\n`);
console.log(`tinta medida: ${Object.keys(ordenado).length} de ${nomes.length} peças`);
