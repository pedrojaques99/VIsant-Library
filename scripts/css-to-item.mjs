#!/usr/bin/env node
/**
 * Grava um arquivo .css no campo `css` de um item do registry.json.
 *
 *   node scripts/css-to-item.mjs <item> <arquivo.css>          # grava
 *   node scripts/css-to-item.mjs <item> <arquivo.css> --check  # só confere (sai 1 se divergir)
 *
 * Por quê: o bloco `css` do item é JSON aninhado (seletor → declarações), e escrever CSS à mão
 * dentro de JSON é onde nasce o erro bobo (vírgula, aspas, regra esquecida). O CSS de verdade fica
 * num arquivo ao lado do componente, legível e com comentário; este script é a ponte, e o
 * `--check` impede que os dois se desencontrem.
 *
 * Cobre o que um item usa: regras, `@media`, `@supports`, `@keyframes` e `@container`, aninhados.
 * Não entende chave dentro de string (`content: "{"`): se precisar disso, o CSS pede outra forma.
 */
import fs from "node:fs";
import path from "node:path";

const [nome, arquivo, flag] = process.argv.slice(2);
if (!nome || !arquivo) {
  console.error("uso: node scripts/css-to-item.mjs <item> <arquivo.css> [--check]");
  process.exit(2);
}

/** CSS → objeto: chave com objeto é seletor/at-rule, chave com string é declaração. */
function ler(css) {
  const fonte = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let i = 0;
  const bloco = () => {
    const obj = {};
    let buf = "";
    while (i < fonte.length) {
      const c = fonte[i++];
      if (c === "{") {
        const chave = buf.trim().replace(/\s+/g, " ");
        buf = "";
        const filho = bloco();
        obj[chave] = obj[chave] ? { ...obj[chave], ...filho } : filho;
      } else if (c === "}") {
        declarar(obj, buf);
        return obj;
      } else if (c === ";") {
        declarar(obj, buf);
        buf = "";
      } else buf += c;
    }
    declarar(obj, buf);
    return obj;
  };
  const declarar = (obj, s) => {
    const t = s.trim();
    if (!t) return;
    const k = t.indexOf(":");
    if (k < 0) throw new Error(`declaração sem ":" → ${t}`);
    obj[t.slice(0, k).trim()] = t.slice(k + 1).trim().replace(/\s+/g, " ");
  };
  return bloco();
}

const reg = path.resolve("registry.json");
const registry = JSON.parse(fs.readFileSync(reg, "utf8"));
const item = registry.items.find((x) => x.name === nome);
if (!item) {
  console.error(`css-to-item: item "${nome}" não está no registry.json`);
  process.exit(1);
}
const css = ler(fs.readFileSync(arquivo, "utf8"));

if (flag === "--check") {
  const igual = JSON.stringify(item.css ?? {}) === JSON.stringify(css);
  console.log(igual ? `css-to-item: ${nome} em dia com ${arquivo}` : `css-to-item: ${nome} DIVERGE de ${arquivo}; rode sem --check`);
  process.exit(igual ? 0 : 1);
}

item.css = css;
fs.writeFileSync(reg, JSON.stringify(registry, null, 2) + "\n");
console.log(`css-to-item: ${nome} ← ${arquivo} (${Object.keys(css).length} blocos)`);
