#!/usr/bin/env node
/**
 * A versão leve do logo de cada marca: `public/logos/<slug>.webp`, 144 px de altura.
 *
 * O vault guarda um PNG só: 65 KB para um logo que `/marca` mostra com 48 px de altura. Em Slow 4G
 * isso é mais de um segundo na primeira dobra. A conversão roda no Chromium do Playwright, como a
 * das fotos do catálogo (`capture-registry.mjs`), sem dependência nova. Precisa de rede e de
 * browser, então não entra no `build`: rode depois de `npm run sync:brands` e versione o resultado.
 * Marca sem versão leve continua funcionando: o `<img>` cai no arquivo original.
 *
 *   npm run build:logos
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = join(ROOT, "public", "logos");
const ALTURA = 144;

const { brands } = JSON.parse(readFileSync(join(ROOT, "public", "r", "brands.json"), "utf8"));
mkdirSync(SAIDA, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
let feitas = 0;
for (const marca of brands) {
  const url = marca.logo?.url;
  if (!url) continue;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const tipo = res.headers.get("content-type") ?? "image/png";
    const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
    const dados = await page.evaluate(
      async ({ base64, tipo, altura }) => {
        const img = new Image();
        img.src = `data:${tipo};base64,${base64}`;
        await img.decode();
        const k = Math.min(1, altura / img.naturalHeight);
        const tela = new OffscreenCanvas(Math.round(img.naturalWidth * k), Math.round(img.naturalHeight * k));
        const ctx = tela.getContext("2d");
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, tela.width, tela.height);
        const blob = await tela.convertToBlob({ type: "image/webp", quality: 0.85 });
        const buf = new Uint8Array(await blob.arrayBuffer());
        let bin = "";
        for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        return btoa(bin);
      },
      { base64, tipo, altura: ALTURA },
    );
    const saida = Buffer.from(dados, "base64");
    writeFileSync(join(SAIDA, `${marca.slug}.webp`), saida);
    console.log(`${marca.slug}: ${Math.round(base64.length * 0.75 / 1024)} KB → ${(saida.length / 1024).toFixed(1)} KB`);
    feitas++;
  } catch (e) {
    console.warn(`${marca.slug}: ficou sem versão leve (${e.message})`);
  }
}
await browser.close();
console.log(`${feitas} logos em public/logos/`);
