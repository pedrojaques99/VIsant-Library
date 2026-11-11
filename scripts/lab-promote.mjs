#!/usr/bin/env node
/**
 * pnpm lab:promote <id> [<id>...] [--name kebab] [--no-build] [--shots]
 *
 * A peça aprovada no lab vira item do registry, e continua sendo UM arquivo:
 *
 *   1. `git mv lab/<kind>/<id>.tsx registry/visant/ui/<nome>.tsx`, já no padrão do
 *      registry: export nomeado, sem `meta`, hooks de `@/hooks/*`, tokens da casca
 *      (`--casa-*`) trocados pelos tokens do tema (`--foreground`, `--card`...).
 *   2. Entrada no `registry.json`, no `catalog.tsx` (estilo `lab` + carimbo do lab),
 *      no `uso.json`, demo em `src/app/demos/`, crédito em ATTRIBUTIONS.md se tiver fonte.
 *   3. Os geradores de sempre (registry-meta, deps, lang, gpu, docs, shadcn build) e,
 *      com `--shots`, `vite build` + as fotos claro/escuro.
 *
 * O texto do catálogo vem de `meta.catalogo` ({ nome, descricao, tags, familia,
 * quando, evite, preview }), escrito em português pela rodada que fez a peça. Sem ele,
 * o nome é o rótulo em minúsculas e a descrição é a primeira frase do cabeçalho.
 *
 * `pnpm lab:sync` chama isto para todo arquivo `kept` que ainda esteja em `lab/`:
 * aprovado não fica em dois lugares (lab/RULES.md, "The run").
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (...a) => path.join(ROOT, ...a);
const AUTOR = "Visant Labs <visantsupply@gmail.com>";
const today = () => new Date().toISOString().slice(0, 10);

/* Tokens da casca → tokens do tema. A casca (`src/styles/casa.css`) só existe neste
   site; quem instala a peça tem o tema shadcn. Mais longo primeiro. */
const TOKENS = [
  [/\bfont-casa-mono\b/g, "font-mono"],
  [/\bfont-casa\b/g, "[font-family:var(--font-display,inherit)]"],
  [/\btext-casa-sm\b/g, "text-xs"],
  [/\btext-casa-base\b/g, "text-sm"],
  [/\btext-casa-lg\b/g, "text-base"],
  [/\btext-casa-xl\b/g, "text-lg"],
  [/\brounded-tile\b/g, "rounded-[var(--r-surface)]"],
  [/\brounded-control\b/g, "rounded-[var(--r-control)]"],
  [/var\(--radius-control\)/g, "var(--r-control)"],
  [/casa-cta-fg\b/g, "primary-foreground"],
  [/casa-cta\b/g, "primary"],
  [/casa-tile-2\b/g, "muted"],
  [/casa-tile\b/g, "card"],
  [/casa-fg-[23]\b/g, "muted-foreground"],
  [/casa-fg\b/g, "foreground"],
  [/casa-bg\b/g, "background"],
  [/casa-line\b/g, "border"],
];

/** Troca os tokens da casca pelos do tema. */
export const retoken = (src) => TOKENS.reduce((out, [re, to]) => out.replace(re, to), src);

/* `../hooks` do lab → os hooks publicados (mesmo código, `registry/visant/hooks`). */
const HOOKS = {
  useInView: { from: "@/hooks/use-idle", dep: "@visant/use-idle" },
  useIdle: { from: "@/hooks/use-idle", dep: "@visant/use-idle" },
  useTilt: { from: "@/hooks/use-tilt", dep: "@visant/use-tilt" },
  useCoarse: { from: "@/hooks/use-media-query", dep: "@visant/use-media-query", as: "useMediaQuery" },
};

const die = (m) => {
  console.error(`lab:promote: ${m}`);
  process.exit(1);
};
const pascal = (kebab) => kebab.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("");
const kebabOk = (s) => /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(s);

/** O objeto literal de `export const meta`, com o trecho exato que ele ocupa no arquivo. */
export function readMeta(src) {
  const at = src.indexOf("export const meta");
  if (at < 0) return null;
  const open = src.indexOf("{", src.indexOf("=", at));
  let depth = 0;
  let q = null;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (q) {
      if (ch === "\\") i++;
      else if (ch === q) q = null;
    } else if (ch === '"' || ch === "'" || ch === "`") q = ch;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) {
      const end = src.indexOf("\n", i) + 1;
      // O meta é código do próprio repo, um literal sem chamadas: avaliar é o parse mais curto.
      const meta = new Function(`return (${src.slice(open, i + 1)});`)();
      return { meta, start: at, end };
    }
  }
  return null;
}

/** O arquivo do lab no padrão do registry. Comportamento e visual iguais; só tokens e imports. */
export function toRegistry(src, Name) {
  const { start, end } = readMeta(src);
  let out = src.slice(0, start) + src.slice(end).replace(/^\n/, "");
  out = out.replace(/^import type \{[^}]*\} from "\.\.\/types";\n/m, "");
  const deps = new Set();
  out = out.replace(/^import \{([^}]*)\} from "\.\.\/hooks";\n/m, (_, names) => {
    const by = new Map();
    for (const n of names.split(",").map((s) => s.trim()).filter(Boolean)) {
      const h = HOOKS[n];
      if (!h) die(`hook ${n} do lab sem versão no registry`);
      deps.add(h.dep);
      by.set(h.from, [...(by.get(h.from) ?? []), h.as ?? n]);
    }
    return [...by].map(([from, ns]) => `import { ${[...new Set(ns)].join(", ")} } from "${from}";\n`).join("");
  });
  out = out.replace(/\buseCoarse\(\)/g, 'useMediaQuery("(pointer: coarse)")');
  out = out.replace(/^export default function \w+\(/m, `export function ${Name}(`);
  if (!out.includes(`export function ${Name}(`)) die("não achei `export default function` para virar export nomeado");
  out = retoken(out);
  const sobra = out.match(/[\w-]*(?:-casa\b|\bcasa-)[\w-]*/);
  if (sobra) die(`token da casca sem tradução: ${sobra[0]}`);
  if (!/^"use client";/.test(out)) out = `"use client";\n\n${out}`;
  if (/@\/lib\/utils/.test(out)) deps.add("utils");
  return { out, deps: [...deps], motion: /from "motion\/react"/.test(out) };
}

const json = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const writeJson = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2) + "\n");

/** O carimbo que o card de /lab mostra (`LabCarimbo` em catalog.tsx). */
export function carimbo(meta, kind) {
  const c = { id: meta.id, kind, input: meta.tags.input, label: meta.label, hint: meta.hint };
  if (meta.hintTouch) c.hintTouch = meta.hintTouch;
  c.formula = meta.formula;
  if (meta.source) c.source = { title: meta.source.title, url: meta.source.url, studio: meta.source.studio };
  return c;
}

/** Marca um item que já está no catálogo com o estilo `lab` e o carimbo. Idempotente. */
export function stampCatalog(cat, name, lab) {
  const head = cat.indexOf(`\n    name: "${name}",\n`);
  if (head < 0) die(`${name} não está no catálogo`);
  const close = cat.indexOf("\n  },", head);
  let item = cat.slice(head, close);
  if (/\n {4}estilo: \[/.test(item)) {
    if (!/estilo: \[[^\]]*"lab"/.test(item)) item = item.replace(/(\n {4}estilo: \[)([^\]]*)\]/, (_, a, l) => `${a}${l ? `${l}, ` : ""}"lab"]`);
  } else item = item.replace(/(\n {4}family: "[^"]+",)/, '$1\n    estilo: ["lab"],');
  item = item.replace(/\n {4}lab: .*/, "") + `\n    lab: ${JSON.stringify(lab)},`;
  return cat.slice(0, head) + item + cat.slice(close);
}

function firstSentence(src) {
  const head = (src.match(/^\/\*\n([\s\S]*?)(?:\n \*\n|\n \*\/)/)?.[1] ?? "").replace(/^\s*\*\s?/gm, " ").trim();
  const s = head.replace(/^[A-Z]+:\s*/, "").split(/(?<=\.)\s/)[0];
  return s ? s[0].toUpperCase() + s.slice(1) : "";
}

function promoteOne(id, { name: forced } = {}) {
  const kind = fs.existsSync(p("lab", "components", `${id}.tsx`)) ? "component" : "experiment";
  const from = p("lab", kind === "component" ? "components" : "experiments", `${id}.tsx`);
  if (!fs.existsSync(from)) die(`não existe lab/*/${id}.tsx`);
  const src = fs.readFileSync(from, "utf8");
  const parsed = readMeta(src);
  if (!parsed) die(`${id}: sem export const meta`);
  const { meta } = parsed;
  const cat = meta.catalogo ?? {};
  const name = forced ?? cat.nome ?? meta.label.toLowerCase();
  if (!kebabOk(name)) die(`${id}: nome "${name}" não é kebab-case (--name)`);
  const registry = json(p("registry.json"));
  if (registry.items.some((i) => i.name === name)) die(`${id}: o nome ${name} já existe no registry (meta.catalogo.nome ou --name)`);
  const Name = pascal(name);
  const { out, deps, motion } = toRegistry(src, Name);
  const to = p("registry", "visant", "ui", `${name}.tsx`);

  // 1. O arquivo muda de lugar: o histórico vai junto, e não sobra cópia em lab/.
  execSync(`git mv "${path.relative(ROOT, from)}" "${path.relative(ROOT, to)}"`, { cwd: ROOT });
  fs.writeFileSync(to, out);

  // 2. Registry.
  const description = cat.descricao ?? firstSentence(src);
  registry.items.push({
    name,
    type: "registry:ui",
    title: cat.titulo ?? meta.title,
    description,
    ...(motion ? { dependencies: ["motion"] } : {}),
    registryDependencies: deps,
    files: [{ path: `registry/visant/ui/${name}.tsx`, type: "registry:ui" }],
    author: AUTOR,
  });
  writeJson(p("registry.json"), registry);

  // 3. Demo: a peça sozinha. Experimento enche o palco (nasceu num card quadrado);
  //    componente tem altura própria e fica centrado.
  const [outer, inner] =
    kind === "component" ? ["flex h-full w-full flex-col justify-center", "w-full"] : ["grid h-full w-full place-items-center", "h-full w-full"];
  fs.writeFileSync(
    p("src", "app", "demos", `${name}-demo.tsx`),
    `"use client";\n\n/** ${meta.label}, aprovada no lab (${id}): a peça sozinha, como nasceu lá. */\n\nimport { ${Name} } from "../../../registry/visant/ui/${name}";\n\nexport default function ${Name}Demo() {\n  return (\n    <div className="${outer}">\n      <div className="${inner}">\n        <${Name} />\n      </div>\n    </div>\n  );\n}\n`,
  );

  // 4. Catálogo: demo preguiçosa + item com estilo lab e o carimbo.
  let catalog = fs.readFileSync(p("src", "app", "catalog.tsx"), "utf8");
  const lazy = `const ${Name}LabDemo = React.lazy(() => import("./demos/${name}-demo"));\n`;
  const lastLazy = [...catalog.matchAll(/^const \w+LabDemo = React\.lazy\(.*\n/gm)].pop();
  if (!lastLazy) die("não achei onde declarar a demo em catalog.tsx");
  catalog = catalog.slice(0, lastLazy.index + lastLazy[0].length) + lazy + catalog.slice(lastLazy.index + lastLazy[0].length);
  const preview = cat.preview ?? (kind === "component" ? { w: 420, h: 420 } : { w: 360, h: 360 });
  const tags = cat.tags ?? [meta.label.toLowerCase(), meta.tags.input];
  const item = [
    "  {",
    `    name: ${JSON.stringify(name)},`,
    `    title: ${JSON.stringify(cat.titulo ?? meta.title)},`,
    `    type: "ui",`,
    `    family: ${JSON.stringify(cat.familia ?? (meta.tags.family === "typography" ? "texto" : "controles"))},`,
    `    estilo: ["lab"],`,
    `    description:`,
    `      ${JSON.stringify(description)},`,
    `    tags: ${JSON.stringify(tags)},`,
    `    demo: ${Name}LabDemo,`,
    `    preview: { w: ${preview.w}, h: ${preview.h} },`,
    `    lab: ${JSON.stringify(carimbo(meta, kind))},`,
    "  },",
  ].join("\n");
  const start = catalog.indexOf("export const CATALOG");
  const end = catalog.indexOf("\n];\n", start);
  catalog = catalog.slice(0, end) + "\n" + item + catalog.slice(end);
  fs.writeFileSync(p("src", "app", "catalog.tsx"), catalog);

  // 5. Quando usar (registry-meta leva isto para o registry.json).
  if (cat.quando) {
    const uso = json(p("src", "app", "uso.json"));
    uso[name] = { quando: cat.quando, evite: cat.evite ?? "" };
    writeJson(p("src", "app", "uso.json"), uso);
  }

  // 6. Crédito da fonte.
  if (meta.source?.url) {
    const f = p("ATTRIBUTIONS.md");
    const line = `- \`${name}\`: inspirado no princípio de "${meta.source.title}", ${meta.source.studio} (${meta.source.url})\n`;
    const a = fs.readFileSync(f, "utf8");
    const mark = "\n\nSem fonte de terceiros no `meta`";
    fs.writeFileSync(f, a.includes(mark) ? a.replace(mark, `\n${line.trimEnd()}${mark}`) : `${a.trimEnd()}\n${line}`);
  } else {
    // Sem fonte: entra na linha dos que não têm crédito de terceiros.
    const f = p("ATTRIBUTIONS.md");
    const a = fs.readFileSync(f, "utf8");
    fs.writeFileSync(f, a.replace(/(Sem fonte de terceiros no `meta` do experimento: .*?)\.\n/, (_, l) => `${l}, \`${name}\`.\n`));
  }

  fs.appendFileSync(p("lab", "PREFERENCES.md"), `- ${today()} · promoted · \`${id}\` → registry \`${name}\`\n`);
  console.log(`lab:promote: ${id} → registry/visant/ui/${name}.tsx (@visant/${name})`);
  return name;
}

/** Os geradores que uma peça nova pede, na ordem do build. */
export function generate({ shots = [] } = {}) {
  const run = (cmd) => execSync(cmd, { cwd: ROOT, stdio: "inherit" });
  run("node scripts/registry-meta.mjs");
  run("node scripts/deps-extract.mjs");
  run("node scripts/lang-extract.mjs");
  run("node scripts/gpu-extract.mjs");
  run("node scripts/build-docs.mjs");
  run("npx shadcn@latest build");
  if (shots.length) {
    run("npx vite build");
    run(`node scripts/capture-registry.mjs --only ${shots.join(",")}`);
  }
}

export function promote(ids, { name, build = true, shots = false } = {}) {
  if (name && ids.length > 1) die("--name vale para uma peça só");
  const names = ids.map((id) => promoteOne(id, { name }));
  if (build && names.length) generate({ shots: shots ? names : [] });
  return names;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const opt = (k) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : undefined);
  const ids = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--name");
  if (!ids.length) die("uso: pnpm lab:promote <id> [<id>...] [--name kebab] [--no-build] [--shots]");
  promote(ids, { name: opt("name"), build: !argv.includes("--no-build"), shots: argv.includes("--shots") });
}
