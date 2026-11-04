#!/usr/bin/env node
/**
 * O acervo em texto, pra quem não é browser.
 *
 * A vitrine é boa pra uma pessoa e opaca pra um agente: palco em iframe, painel
 * de knobs, tabela montada em React. Um modelo que abre `ui.visantlabs.com` lê
 * um `<div id="root">` vazio e conclui que a library não tem nada.
 *
 * E é o agente que instala componente hoje. Se ele não consegue ler o acervo,
 * ele escreve o marquee do zero — que é exatamente o desperdício que o registry
 * existe pra evitar, só que agora em escala de máquina.
 *
 * O que sai daqui, tudo em `dist/`:
 *
 *   llms.txt           o índice enxuto (llmstxt.org): como usar, tarefa, eixo, skills
 *   llms-full.txt      tudo de uma vez, com as arquivadas no fim
 *   r/<item>.md        a ficha da peça: o que é, como instalar, como usar, API
 *   r/index.json       índice compacto, pra escolher sem baixar o registry inteiro
 *   docs.md, skills.md, skills/killer.md, marca.md   as páginas em Markdown
 *   .well-known/ai-catalog.json, mcp/server-card     descoberta do MCP (SEP-2127)
 *
 * Tudo é derivado — descrição do `registry.json`, props do `props.generated.json`,
 * uso do `controls.generated.json` com o que a demo põe no palco. Nada aqui é
 * escrito à mão, porque um índice escrito à mão mente na primeira peça nova.
 *
 * Roda DEPOIS do `vite build`: escreve dentro de `dist/`.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { contaDaVitrine } from "./conta-vitrine.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "src", "app");
const DIST = process.env.VISANT_DIST ? resolve(process.env.VISANT_DIST) : join(ROOT, "dist");
const SITE = "https://ui.visantlabs.com";

if (!existsSync(DIST)) {
  console.error("llms: dist/ não existe — rode depois do `vite build`.");
  process.exit(0);
}

const ler = (p) => JSON.parse(readFileSync(p, "utf8"));

const registry = ler(join(ROOT, "registry.json"));
const props = ler(join(APP, "props.generated.json"));
const controles = ler(join(APP, "controls.generated.json"));
const deps = ler(join(APP, "deps.generated.json"));
const skills = ler(join(APP, "skills", "skills.generated.json"));
const notas = ler(join(ROOT, "curadoria", "notas.json"));
const kitsPecas = ler(join(APP, "kits.generated.json"));
const marcas = ler(join(ROOT, "public", "r", "brands.json")).brands;
const mcpFonte = readFileSync(join(ROOT, "api", "mcp.ts"), "utf8");
const catalogoFonte = readFileSync(join(APP, "catalog.tsx"), "utf8");

/** A mesma regra do MCP e da vitrine: nota até 2 ou marcada pra sair. */
const arquivada = (nome) => Boolean(notas[nome] && (notas[nome].excluir || notas[nome].nota <= 2));

const TIPO = {
  "registry:ui": "componente",
  "registry:block": "bloco",
  "registry:lib": "utilitário",
  "registry:hook": "hook",
  "registry:theme": "tema",
  "registry:base": "base de CSS",
};

/** `finish?: "grayscale" | "mono" | "none" = "grayscale"` */
function assinatura(p) {
  const tipo = p.valores?.length ? p.valores.map((v) => `"${v}"`).join(" | ") : p.tipo;
  // O padrão sai do docgen sem aspas. `= grayscale` lido por um agente vira uma
  // variável chamada grayscale — que é justamente o erro que uma ficha de API
  // existe pra não deixar acontecer.
  const cru = p.padrao;
  const literal =
    cru === null || cru === undefined
      ? null
      : /^(true|false|-?\d+(\.\d+)?|\[.*\]|\{.*\}|".*"|'.*')$/.test(String(cru).trim())
        ? String(cru).trim()
        : `"${cru}"`;
  return `${p.nome}${p.obrigatoria ? "" : "?"}: ${tipo}${literal ? ` = ${literal}` : ""}`;
}

/**
 * A chamada de exemplo, com o que a demo da vitrine tem no palco.
 *
 * É a mesma regra do snippet da ficha: só o que difere do padrão do componente.
 * Despejar as nove props com o valor que a peça já tem ensinaria o agente a
 * fixar padrões que deveriam continuar chegando de graça.
 */
function exemplo(item) {
  const doItem = controles[item.name];
  if (!doItem) return null;

  const [comp, lista] = Object.entries(doItem.componentes)[0] ?? [];
  if (!comp) return null;

  const linhas = lista
    .filter((c) => c.inicial !== undefined && c.inicial !== c.padrao)
    .map((c) => {
      const v = c.inicial;
      if (typeof v === "boolean") return v ? `  ${c.prop}` : `  ${c.prop}={false}`;
      if (typeof v === "number") return `  ${c.prop}={${v}}`;
      return `  ${c.prop}="${v}"`;
    });

  return linhas.length ? [`<${comp}`, ...linhas, "/>"].join("\n") : `<${comp} />`;
}

function fichaEmMarkdown(item) {
  const l = [];
  l.push(`# ${item.title ?? item.name}`);
  l.push("");
  if (arquivada(item.name)) {
    l.push("> Arquivada pela curadoria: continua instalável, mas não é recomendada em peça nova.");
    l.push("");
  }
  if (item.description) {
    l.push(item.description);
    l.push("");
  }
  l.push(`- Nome no registry: \`${item.name}\``);
  l.push(`- Tipo: ${TIPO[item.type] ?? item.type}`);
  const pacotes = deps[item.name] ?? [];
  l.push(`- Dependências npm: ${pacotes.length ? pacotes.join(", ") : "nenhuma"}`);
  l.push(`- Demo: ${SITE}/c/${item.name}`);
  if (item.categories?.length) l.push(`- Categorias: ${item.categories.join(", ")}`);
  l.push("");
  // O que o agente lê pra ESCOLHER entre peças parecidas (scripts/registry-meta.mjs).
  if (item.meta?.uso?.quando) {
    l.push("## Quando usar");
    l.push("");
    l.push(`- Use quando: ${item.meta.uso.quando}`);
    if (item.meta.uso.evite) l.push(`- Evite quando: ${item.meta.uso.evite}`);
    l.push("");
  }
  l.push("## Instalar");
  l.push("");
  l.push("```bash");
  l.push(`npx shadcn@latest add @visant/${item.name}`);
  l.push("```");

  const uso = exemplo(item);
  if (uso) {
    l.push("");
    l.push("## Usar");
    l.push("");
    l.push("```tsx");
    l.push(uso);
    l.push("```");
  }

  const componentes = props[item.name] ?? [];
  const comProps = componentes.filter((c) => c.props?.length);
  if (comProps.length) {
    l.push("");
    l.push("## API");
    for (const c of comProps) {
      l.push("");
      l.push(`### ${c.nome}`);
      if (c.descricao) {
        l.push("");
        l.push(c.descricao.split("\n")[0]);
      }
      l.push("");
      for (const p of c.props) {
        const nota = p.descricao?.split("\n")[0];
        l.push(`- \`${assinatura(p)}\`${nota ? ` — ${nota}` : ""}`);
      }
    }
  }

  l.push("");
  return l.join("\n");
}

mkdirSync(join(DIST, "r"), { recursive: true });

const itens = [...registry.items].sort((a, b) => a.name.localeCompare(b.name));
for (const item of itens) {
  writeFileSync(join(DIST, "r", `${item.name}.md`), fichaEmMarkdown(item));
}

/*
 * Daqui pra baixo, o que o agente lê ANTES de abrir uma ficha.
 *
 * Nada é lista à mão: família e rótulo saem do catálogo, tarefa dos kits do MCP,
 * skills do manifesto gerado, marcas do índice público. Fonte que mudar de formato
 * derruba o build, em vez de publicar um índice pela metade.
 */
const MCP_URL = `${SITE}/mcp`;
const SKILLS_REPO = "pedrojaques99/visant-skills-public";
const REGISTRIES = `"registries": { "@visant": "${SITE}/r/{name}.json" }`;
const CLAUDE_MCP = `claude mcp add --transport http visant-ui ${MCP_URL}`;

function exigir(cond, msg) {
  if (!cond) {
    console.error(`llms: ${msg}`);
    process.exit(1);
  }
}

const familias = [
  ...catalogoFonte
    .slice(catalogoFonte.indexOf("export const FAMILIES"), catalogoFonte.indexOf("export const MIN_ABA"))
    .matchAll(/key:\s*"([^"]+)",\s*label:\s*"([^"]+)",\s*regra:\s*"([^"]+)"/g),
].map(([, key, label, regra]) => ({ key, label, regra }));
exigir(familias.length, "nenhuma família lida de src/app/catalog.tsx");

const kits = [...mcpFonte.matchAll(/\{\s*slug:\s*"([^"]+)",\s*titulo:\s*"([^"]+)",\s*para:\s*"([^"]+)"\s*\}/g)].map(
  ([, slug, titulo, para]) => ({ slug, titulo, para, pecas: (kitsPecas[slug] ?? []).filter((n) => !arquivada(n)) }),
);
exigir(kits.length, "nenhum kit lido de api/mcp.ts");

const servidor = mcpFonte.match(/serverInfo:\s*\{\s*name:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*version:\s*"([^"]+)"/);
exigir(servidor, "serverInfo não lido de api/mcp.ts");

const familiaDe = (item) => item.categories?.[0] ?? "fundacao";
const ativas = itens.filter((i) => !arquivada(i.name));
const arquivadas = itens.filter((i) => arquivada(i.name));
const primeiraFrase = (t = "") => t.split(/(?<=[.!?])\s/)[0];

/** Uma linha que basta pra escolher: o "quando usar" ganha da descrição. */
const motivo = (item) => item.meta?.uso?.quando ?? primeiraFrase(item.description);
const linhaPeca = (item) => `- [${item.name}](${SITE}/r/${item.name}.md): ${motivo(item)}`;
const bash = (...linhas) => ["```bash", ...linhas, "```"];

const COMO_USAR = [
  "**Como usar**",
  "",
  `1. MCP, sem chave, recomenda e busca: \`${MCP_URL}\`. Em app web, adicione como conector por URL. No Claude Code: \`${CLAUDE_MCP}\`.`,
  `2. Instalar: no \`components.json\`, \`${REGISTRIES}\`. Depois \`npx shadcn@latest add @visant/<nome>\`. O código vai pro projeto e pode ser editado.`,
  `3. Tema: \`npx shadcn@latest add @visant/theme-<marca>\`, com ${marcas.map((m) => `\`${m.slug}\``).join(", ")}. Sem tema pronto, as peças leem os tokens do projeto.`,
  `4. Sem MCP: escolha em [/r/index.json](${SITE}/r/index.json) e leia a ficha em \`${SITE}/r/<nome>.md\`.`,
];

const indice = [
  "# @visant/ui",
  "",
  `> Registry shadcn da Visant Labs: ${contaDaVitrine(ROOT).frase} pra React e Tailwind, skills de interface e temas de marca.`,
  "",
  ...COMO_USAR,
  "",
  "## Referência",
  "",
  `- [Docs](${SITE}/docs.md): começar em 3 passos, trocar de marca em runtime, conectar agente, libs, hooks, temas e regras`,
  `- [Índice JSON](${SITE}/r/index.json): nome, família, quando usar, evite e dependências de todas as peças`,
  `- [Skills](${SITE}/skills.md): as ${skills.length} skills, com comando`,
  `- [Marca](${SITE}/marca.md): marcas públicas, paleta, fontes e tema`,
  "",
  "## Por tarefa",
  "",
  ...kits.map((k) => `- [${k.titulo}](${SITE}/kit/${k.slug}): ${k.para}. Peças: ${k.pecas.join(", ")}`),
  "",
  "## Skills",
  "",
  `Instalar: \`npx skills add ${SKILLS_REPO} --skill <nome>\`. Pra interface, comece por \`visant-design\`.`,
  "",
  ...skills.map((s) => `- [${s.nome}](${SITE}/skills.md#${s.nome}): ${primeiraFrase(s.descricao)}`),
  "",
];

for (const f of familias.filter((x) => x.key !== "anatomia")) {
  const lista = ativas.filter((i) => familiaDe(i) === f.key);
  if (!lista.length) continue;
  indice.push(`## ${f.label} (${lista.length})`, "", `${f.regra.replace(/^\w/, (c) => c.toUpperCase())}.`, "", ...lista.map(linhaPeca), "");
}

const didaticas = ativas.filter((i) => familiaDe(i) === "anatomia");
indice.push(
  "## Optional",
  "",
  `- [Tudo em um arquivo](${SITE}/llms-full.txt): fichas completas com API de todas as peças`,
  `- [Arquivadas](${SITE}/llms-full.txt): ${arquivadas.length} peças fora deste índice pela curadoria. Instalam, mas não são recomendadas; os endereços continuam valendo.`,
  ...(didaticas.length ? [`- [Figuras didáticas](${SITE}/llms-full.txt): ${didaticas.length} peças do curso, fora deste índice`] : []),
  "",
);
writeFileSync(join(DIST, "llms.txt"), indice.join("\n"));

/* Tudo de uma vez, pra quem prefere um arquivo só. Convenção de mercado: o llmstxt.org não cita llms-full. */
const descer = (md) => md.replace(/^(#{1,4}) /gm, "##$1 ");
const completo = [
  "# @visant/ui, completo",
  "",
  `> Tudo do registry em um arquivo. Pra escolher peça gastando menos, comece por ${SITE}/llms.txt.`,
  "",
  ...COMO_USAR,
  "",
  "## Skills",
  "",
  ...skills.flatMap((s) => [`### ${s.nome}`, "", s.descricao, "", ...bash(s.instalar), ""]),
  ...familias.flatMap((f) => {
    const lista = ativas.filter((i) => familiaDe(i) === f.key);
    return lista.length ? [`## ${f.label}`, "", ...lista.map((i) => descer(fichaEmMarkdown(i)))] : [];
  }),
  "## Arquivadas",
  "",
  "Fora do índice principal pela curadoria. Instalam, mas não são recomendadas em peça nova.",
  "",
  ...arquivadas.map((i) => descer(fichaEmMarkdown(i))),
];
writeFileSync(join(DIST, "llms-full.txt"), completo.join("\n"));

/*
 * O índice compacto. Campo vazio não sai, e as URLs ficam na raiz como molde:
 * repetir três endereços em cada peça custaria mais que a descrição dela.
 */
const peca = (i) => {
  const npm = deps[i.name] ?? [];
  const requer = i.registryDependencies ?? [];
  return {
    nome: i.name,
    tipo: i.type.replace("registry:", ""),
    familia: familiaDe(i),
    quando: motivo(i),
    ...(i.meta?.uso?.evite ? { evite: i.meta.uso.evite } : {}),
    ...(arquivada(i.name) ? { arquivada: true } : {}),
    ...(npm.length ? { deps: npm } : {}),
    ...(requer.length ? { requer } : {}),
  };
};
writeFileSync(
  join(DIST, "r", "index.json"),
  JSON.stringify({
    total: itens.length,
    urls: { ficha: `${SITE}/r/{nome}.md`, json: `${SITE}/r/{nome}.json`, demo: `${SITE}/c/{nome}` },
    instalar: "npx shadcn@latest add @visant/{nome}",
    itens: itens.map(peca),
  }),
);

/* As páginas em Markdown: `<link rel="alternate">` no prerender, `Accept` no vercel.json. */
/* A página e este Markdown leem o mesmo `docs-conteudo.json`: uma frase mudada lá muda aqui. */
const DOCS = JSON.parse(readFileSync(join(ROOT, "src", "app", "docs-conteudo.json"), "utf8"));
const cerca = (linguagem, codigo) => ["```" + linguagem, codigo, "```"];
const blocoDoPasso = (p) => [
  p.texto,
  "",
  ...bash(p.comando),
  ...(p.codigo ? ["", ...cerca(p.linguagem ?? "tsx", p.codigo)] : []),
  "",
];
const paginaDocs = [
  "# Docs @visant/ui",
  "",
  DOCS.lead,
  "",
  "## Começar em 3 passos",
  "",
  ...DOCS.passos.flatMap((p, i) => [`### ${i + 1}. ${p.titulo}`, "", ...blocoDoPasso(p)]),
  `Temas prontos: ${marcas.map((m) => `\`theme-${m.slug}\``).join(", ")}.`,
  "",
  `## ${DOCS.runtime.titulo}`,
  "",
  ...blocoDoPasso(DOCS.runtime),
  `## ${DOCS.agente.titulo}`,
  "",
  DOCS.agente.texto,
  "",
  ...DOCS.agente.linhas.map((l) => `- ${l.rotulo}: \`${l.comando}\``),
  "",
  "## Ler",
  "",
  `- [llms.txt](${SITE}/llms.txt): índice por tarefa e eixo`,
  `- [r/index.json](${SITE}/r/index.json): índice compacto`,
  `- [llms-full.txt](${SITE}/llms-full.txt): tudo`,
  `- [Skills](${SITE}/skills.md) e [Marca](${SITE}/marca.md)`,
  "",
  "## Referência: libs, hooks, temas e regras",
  "",
  ...ativas
    .filter((i) => familiaDe(i) === "fundacao")
    .flatMap((i) => [
      `### ${i.title ?? i.name}`,
      "",
      i.description ?? "",
      "",
      ...bash(`npx shadcn@latest add @visant/${i.name}`),
      ...(DOCS.exemplos[i.name] ? ["", ...cerca("tsx", DOCS.exemplos[i.name])] : []),
      "",
    ]),
  ...marcas.flatMap((m) => [`### Tema ${m.name ?? m.slug}`, "", ...bash(`npx shadcn@latest add @visant/theme-${m.slug}`), ""]),
];
writeFileSync(join(DIST, "docs.md"), paginaDocs.join("\n"));

const paginaSkills = [
  "# Skills da Visant",
  "",
  `> ${skills.length} skills públicas pra agentes de código. Código em https://github.com/${SKILLS_REPO}.`,
  "",
  "Pra interface, comece por `visant-design`. Com o MCP conectado, `recomendar_skill` escolhe a partir do pedido.",
  "",
  ...skills.flatMap((s) => [`## ${s.nome}`, "", s.descricao, "", ...bash(s.instalar), ""]),
];
writeFileSync(join(DIST, "skills.md"), paginaSkills.join("\n"));

const carro = ["visant-killer", "visant-design"].map((n) => skills.find((s) => s.nome === n));
exigir(carro.every(Boolean), "visant-killer ou visant-design sumiu do manifesto de skills");
const paginaKiller = [
  "# visant-killer e visant-design",
  "",
  "> A auditoria que reprova tela com cara de IA e a porta que leva a tela até o fim.",
  "",
  ...bash(`npx skills add ${SKILLS_REPO} --skill ${carro.map((s) => s.nome).join(" ")}`),
  "",
  ...carro.flatMap((s) => [
    `## ${s.nome}`,
    "",
    s.descricao,
    "",
    `- Scripts: ${s.scripts.join(", ") || "nenhum"}`,
    `- Referências: ${s.referencias.join(", ") || "nenhuma"}`,
    "",
  ]),
];
mkdirSync(join(DIST, "skills"), { recursive: true });
writeFileSync(join(DIST, "skills", "killer.md"), paginaKiller.join("\n"));

const paginaMarca = [
  "# Marcas públicas",
  "",
  "> Temas prontos pras peças do @visant/ui. As peças leem os tokens: trocar o tema troca a marca.",
  "",
  ...marcas.flatMap((m) => [
    `## ${m.name}`,
    "",
    ...(m.tagline ? [m.tagline, ""] : []),
    ...(m.ficticia ? ["Marca fictícia, de demonstração.", ""] : []),
    `- Paleta: ${(m.palette ?? []).map((c) => `${c.role ?? c.name} ${c.hex}`).join(", ")}`,
    `- Fontes: ${Object.entries(m.fonts ?? {}).map(([k, v]) => `${k} ${v}`).join(", ")}`,
    `- Tema: ${SITE}${m.themeUrl}`,
    "",
    ...bash(`npx shadcn@latest add @visant/theme-${m.slug}`),
    "",
  ]),
];
writeFileSync(join(DIST, "marca.md"), paginaMarca.join("\n"));

/*
 * Descoberta do MCP pela SEP-2127 (Final, trilha de extensões): o catálogo mora no
 * .well-known e o cartão em <url do MCP>/server-card. Nome e versão saem do
 * serverInfo de api/mcp.ts, porque o cartão não pode contradizer o servidor vivo.
 */
mkdirSync(join(DIST, ".well-known"), { recursive: true });
mkdirSync(join(DIST, "mcp"), { recursive: true });
const json = (dado) => JSON.stringify(dado, null, 2) + "\n";
writeFileSync(
  join(DIST, ".well-known", "ai-catalog.json"),
  json({
    specVersion: "1.0",
    entries: [
      { identifier: "urn:air:visantlabs.com:mcp:ui", type: "application/mcp-server-card+json", url: `${MCP_URL}/server-card` },
    ],
  }),
);
writeFileSync(
  join(DIST, "mcp", "server-card"),
  json({
    $schema: "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
    name: servidor[1],
    version: servidor[3],
    title: servidor[2],
    description: "Recomenda e busca componentes, skills e temas do registry @visant/ui. Sem chave.",
    websiteUrl: SITE,
    remotes: [{ type: "streamable-http", url: MCP_URL }],
  }),
);

const kb = (p) => `${(readFileSync(join(DIST, p)).length / 1024).toFixed(1)} KB`;
console.log(`llms: ${itens.length} fichas, llms.txt ${kb("llms.txt")}, llms-full.txt ${kb("llms-full.txt")}, r/index.json ${kb("r/index.json")}`);
