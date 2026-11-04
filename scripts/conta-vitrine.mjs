/**
 * Quantas peças a vitrine diz ter: uma conta só, pro prerender, pros `llms` e pro cartão.
 *
 * A interface diz "125 componentes e 20 shaders", e a descrição de `/catalogo` dizia
 * "185 peças" porque contava o `registry.json` inteiro (temas, libs, arquivadas). Espelha
 * `contaComoComponente` e `arquivada` da vitrine, lidos do fonte como o resto dos scripts.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

export function contaDaVitrine(root) {
  const fonte = readFileSync(join(root, "src", "app", "catalog.tsx"), "utf8");
  const notas = JSON.parse(readFileSync(join(root, "curadoria", "notas.json"), "utf8"));
  const arquivada = (n) => Boolean(n && (n.excluir || n.nota <= 2));

  const familias = [
    ...fonte
      .slice(fonte.indexOf("export const FAMILIES"), fonte.indexOf("export const MIN_ABA"))
      .matchAll(/key:\s*"([^"]+)",\s*label:\s*"([^"]+)"[^}]*?(oculta: true)?\s*\}/g),
  ].map(([, key, label, oculta]) => ({ key, label, oculta: Boolean(oculta) }));

  const pecasPorFamilia = new Map();
  for (const [, nome, key] of fonte
    .slice(fonte.indexOf("export const CATALOG"))
    .matchAll(/^\s{4}name: "([^"]+)",(?:(?!\n\s{4}name: ")[\s\S])*?family: "([^"]+)"/gm)) {
    if (arquivada(notas[nome])) continue;
    pecasPorFamilia.set(key, (pecasPorFamilia.get(key) ?? 0) + 1);
  }

  const shaders = pecasPorFamilia.get("shaders") ?? 0;
  const componentes = familias
    .filter((f) => !f.oculta && f.key !== "shaders")
    .reduce((n, f) => n + (pecasPorFamilia.get(f.key) ?? 0), 0);

  return {
    notas,
    arquivada,
    familias,
    pecasPorFamilia,
    componentes,
    shaders,
    frase: `${componentes} componentes e ${shaders} shaders`,
  };
}
