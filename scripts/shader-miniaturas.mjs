#!/usr/bin/env node
/**
 * As miniaturas da aba Shaders: cada filtro sobre cada imagem padrão.
 *
 * A aba tem um WebGL só, o do palco. As miniaturas precisam vir prontas e, ao
 * contrário de `build:shots`, são uma foto da imagem filtrada, sem o seletor.
 *
 *   node scripts/shader-miniaturas.mjs                     # http://localhost:5182
 *   node scripts/shader-miniaturas.mjs --only shader-crt
 *
 * Saída: public/shots/shader/<peça>-<imagem>.webp. Precisa de dev server e ffmpeg.
 * Sai com 1 se alguma falhar: miniatura faltando vira buraco na aba.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const iOnly = argv.indexOf("--only");
const SO = iOnly >= 0 ? argv[iOnly + 1] : null;
const BASE = argv.find((a, i) => !a.startsWith("--") && argv[i - 1] !== "--only") ?? "http://localhost:5182";

/* A ordem é a de `PADROES` em src/app/demos/imagem-do-shader.tsx. */
const IMAGENS = ["mao", "tv", "forma", "gradiente"];

const catalogo = readFileSync(join(ROOT, "src", "app", "catalog.tsx"), "utf8");
const pecas = [...catalogo.matchAll(/^\s{4}name: "([^"]+)",(?:(?!\n\s{4}name: ")[\s\S])*?family: "shaders"/gm)]
  .map((m) => m[1])
  .filter((n) => !SO || n === SO);
if (!pecas.length) {
  console.error("nenhuma peça da família shaders encontrada");
  process.exit(1);
}

const SAIDA = join(ROOT, "public", "shots", "shader");
mkdirSync(SAIDA, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), "shader-mini-"));

const navegador = await chromium.launch();
const falhas = [];
for (const nome of pecas) {
  const pagina = await navegador.newPage({ viewport: { width: 480, height: 520 }, colorScheme: "dark" });
  try {
    await pagina.goto(`${BASE}/c/${nome}?solo=1`, { waitUntil: "load" });
    await pagina.getByLabel("Próxima imagem").waitFor();
    for (const chave of IMAGENS) {
      await pagina.waitForTimeout(1400);
      const png = join(tmp, `${nome}-${chave}.png`);
      await pagina.locator("canvas").first().screenshot({ path: png });
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", png, "-vf", "scale=200:200:force_original_aspect_ratio=increase,crop=200:200", "-c:v", "libwebp", "-quality", "72", join(SAIDA, `${nome}-${chave}.webp`)]);
      await pagina.getByLabel("Próxima imagem").click();
    }
    console.log(`✓ ${nome}`);
  } catch (e) {
    falhas.push(nome);
    console.error(`✗ ${nome}: ${String(e).slice(0, 160)}`);
  }
  await pagina.close();
}
await navegador.close();
rmSync(tmp, { recursive: true, force: true });
if (falhas.length) process.exit(1);
