#!/usr/bin/env node
/**
 * Render por linha de comando, para lote e para script repetido.
 *
 *   node scripts/mockup-agente/cli.mjs presets
 *   node scripts/mockup-agente/cli.mjs render cena.json [mais.json ...] [--pasta <dir>]
 *
 * Cada .json é uma spec (MOCKUP-AGENTE.md) ou uma lista delas.
 */
import { readFileSync } from "node:fs";
import { fechar, listarPresets, renderizar, SAIDA_PADRAO } from "./motor.mjs";

const [cmd, ...resto] = process.argv.slice(2);
const i = resto.indexOf("--pasta");
const pasta = i >= 0 ? resto.splice(i, 2)[1] : SAIDA_PADRAO;

try {
  if (cmd === "presets") {
    console.log(JSON.stringify(await listarPresets(), null, 2));
  } else if (cmd === "render" && resto.length) {
    const specs = resto.flatMap((f) => [JSON.parse(readFileSync(f, "utf8"))].flat());
    for (const s of specs) {
      const r = await renderizar(s, { pasta, aoProgresso: (e) => process.stderr.write(`[mockup] ${s.nome ?? ""} ${e}\n`) });
      console.log(JSON.stringify({ nome: r.nome, segundos: r.segundos, arquivos: r.arquivos, errosDaPagina: r.errosDaPagina }, null, 2));
    }
  } else {
    console.error("uso: cli.mjs presets | render <spec.json...> [--pasta <dir>]");
    process.exitCode = 2;
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await fechar();
}
