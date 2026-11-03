#!/usr/bin/env node
/**
 * Captura a saída real do killer-scan para todos os estados do card de `reu.ts`.
 *
 * São 6 consertos independentes, logo 64 estados. Em vez de escrever à mão o que
 * o terminal da página diria (e errar), este script grava cada estado num projeto
 * temporário com components.json, roda o scanner e guarda stdout. A página só
 * toca o que foi gravado aqui.
 *
 *   node --experimental-strip-types src/app/skills/carro-chefe/captura.mjs
 *
 * Mudou o card, a regra do scanner ou o AUDIT.md: rode de novo.
 */
import { execFile } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { CONSERTOS, JUIZOS, cartao, fonte } from "./reu.ts";

const AQUI = dirname(fileURLToPath(import.meta.url));
const SCAN = join(homedir(), ".claude/skills/visant-killer/scripts/killer-scan.mjs");
const run = promisify(execFile);

function projeto(tsx) {
  const dir = mkdtempSync(join(tmpdir(), "reu-"));
  mkdirSync(join(dir, "src"));
  writeFileSync(join(dir, "package.json"), '{ "name": "demo", "private": true, "dependencies": { "react": "19.0.0" } }\n');
  writeFileSync(join(dir, "components.json"), '{ "style": "default", "tailwind": { "css": "src/app.css" } }\n');
  writeFileSync(join(dir, "src/Pricing.tsx"), tsx);
  return dir;
}

async function scan(tsx, extra = []) {
  const dir = projeto(tsx);
  try {
    if (extra.length) copyFileSync(join(AQUI, "AUDIT.md"), join(dir, "AUDIT.md"));
    const r = await run(process.execPath, [SCAN, ...extra, "src"], { cwd: dir }).catch((e) => e);
    const saida = String(r.stdout ?? "").trimEnd().split(/\r?\n/);
    while (saida[0] === "") saida.shift();
    return { saida, codigo: r.code ?? 0 };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const dicionario = [];
const indice = new Map();
const comprime = (saida) =>
  saida.map((l) => {
    if (!indice.has(l)) {
      indice.set(l, dicionario.length);
      dicionario.push(l);
    }
    return indice.get(l);
  });

const estados = {};
const fila = Array.from({ length: 2 ** CONSERTOS.length }, (_, i) => i);
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (fila.length) {
      const chave = fila.shift();
      const c = new Set(CONSERTOS.filter((_, b) => chave & (1 << b)));
      const { saida, codigo } = await scan(fonte(cartao(c)));
      estados[chave] = { codigo, linhas: saida };
    }
  }),
);
const comprimidos = {};
for (let i = 0; i < 64; i++) comprimidos[i] = { codigo: estados[i].codigo, linhas: comprime(estados[i].linhas) };

const todos = new Set(CONSERTOS);
const julgado = await scan(fonte(cartao(todos, new Set(JUIZOS))));
const aberto = await scan(fonte(cartao(todos, new Set(JUIZOS))), ["--report", "AUDIT.md"]);

writeFileSync(
  join(AQUI, "scan.generated.json"),
  `${JSON.stringify({
    comando: "node visant-killer/scripts/killer-scan.mjs src",
    comandoFinal: "node visant-killer/scripts/killer-scan.mjs --report AUDIT.md src",
    dicionario,
    estados: comprimidos,
    julgado: { codigo: julgado.codigo, linhas: comprime(julgado.saida) },
    aberto: { codigo: aberto.codigo, linhas: comprime(aberto.saida) },
  })}\n`,
);
console.log(`estados: ${Object.keys(comprimidos).length}, linhas distintas: ${dicionario.length}`);
console.log("--- 0\n" + estados[0].linhas.join("\n"));
console.log("--- 63\n" + estados[63].linhas.join("\n"));
console.log("--- julgado\n" + julgado.saida.join("\n"));
console.log("--- aberto\n" + aberto.saida.join("\n"));
