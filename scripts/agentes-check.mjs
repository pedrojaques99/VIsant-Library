#!/usr/bin/env node
/**
 * O que um agente enxerga quando chega aqui.
 *
 *   npm run check:agentes                       produção
 *   npm run check:agentes -- http://localhost:4173        só os estáticos
 *   npm run check:agentes -- <url> --mcp <url do mcp>     MCP em outro endereço
 *
 * Cada rota responde o tipo certo, o llms.txt não aponta pra link quebrado e cabe
 * no teto, e o MCP fala o protocolo de verdade: initialize, tools/list, tools/call.
 *
 * Em localhost, cabeçalho e negociação por `Accept` não contam: quem os põe é o
 * `vercel.json`, e só a Vercel lê esse arquivo. O relatório diz o que ficou de fora.
 */

const args = process.argv.slice(2);
const opcao = (nome) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args.splice(i, 2)[1] : null;
};
const mcpArg = opcao("--mcp");
const BASE = (args[0] ?? "https://ui.visantlabs.com").replace(/\/$/, "");
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(BASE);
const MCP = mcpArg ?? (LOCAL ? null : `${BASE}/mcp`);

/* O índice precisa caber sem pesar: acima disto, o agente desiste de ler ou corta no meio. */
const TETO_LLMS = 34 * 1024;
const TETO_INDICE = 64 * 1024;
const PROD = "https://ui.visantlabs.com";
const MD = "text/markdown";

const falhas = [];
const puladas = [];
const ok = (msg) => console.log(`  ok    ${msg}`);
const falha = (msg) => {
  falhas.push(msg);
  console.log(`  FALHA ${msg}`);
};
const conferir = (cond, msg) => (cond ? ok(msg) : falha(msg));

/* Os links são absolutos em produção: no teste local, batem no servidor local. */
const local = (u) => u.replace(PROD, BASE);

async function pegar(caminho, init) {
  const r = await fetch(caminho.startsWith("http") ? local(caminho) : `${BASE}${caminho}`, init);
  return { r, corpo: await r.text() };
}

/* Arquivo em texto que volta como HTML é a página de erro ou o fallback do preview, não o arquivo. */
async function responde(u) {
  const r = await fetch(u).catch(() => null);
  if (!r?.ok) return false;
  await r.body?.cancel();
  return !/\.(md|txt|json)$/.test(u) || !(r.headers.get("content-type") ?? "").includes("text/html");
}

/* Em lotes, pra não parecer ataque nem esperar 200 requisições em fila. */
async function emLotes(lista, tamanho, fn) {
  const saida = [];
  for (let i = 0; i < lista.length; i += tamanho) saida.push(...(await Promise.all(lista.slice(i, i + tamanho).map(fn))));
  return saida;
}

const ROTAS = [
  ["/robots.txt", "text/plain"],
  ["/sitemap.xml", "xml"],
  ["/llms.txt", "text/plain"],
  ["/llms-full.txt", "text/plain"],
  ["/r/index.json", "application/json"],
  ["/r/kanban.md", MD],
  ["/r/kanban.json", "application/json"],
  ["/docs.md", MD],
  ["/skills.md", MD],
  ["/skills/killer.md", MD],
  ["/marca.md", MD],
  ["/.well-known/ai-catalog.json", "ai-catalog"],
  ["/mcp/server-card", "mcp-server-card"],
];

console.log(`\nPortas de agente em ${BASE}\n`);

console.log("Rotas");
const corpos = {};
for (const [rota, tipo] of ROTAS) {
  const { r, corpo } = await pegar(rota);
  corpos[rota] = corpo;
  const ct = r.headers.get("content-type") ?? "";
  /* O preview local não recebe os tipos do vercel.json nos JSON de descoberta. */
  const tipoOk = ct.includes(tipo) || (LOCAL && /well-known|server-card/.test(rota));
  conferir(r.ok && tipoOk, `${rota} ${r.status} ${ct} (${(corpo.length / 1024).toFixed(1)} KB)`);
}

console.log("\nÍndices");
const llms = corpos["/llms.txt"] ?? "";
const bytes = new TextEncoder().encode(llms).length;
conferir(bytes <= TETO_LLMS, `llms.txt tem ${(bytes / 1024).toFixed(1)} KB, teto ${TETO_LLMS / 1024} KB`);
conferir(llms.startsWith("# ") && llms.includes("\n> "), "llms.txt tem H1 e resumo (llmstxt.org)");
conferir(llms.includes("/mcp") && llms.includes("## Skills") && llms.includes("/docs.md"), "llms.txt fala de MCP, skills e docs");

let indice = { itens: [], urls: {} };
try {
  indice = JSON.parse(corpos["/r/index.json"]);
} catch {
  falha("r/index.json não é JSON");
}
const tamanhoIndice = new TextEncoder().encode(corpos["/r/index.json"] ?? "").length;
conferir(tamanhoIndice <= TETO_INDICE, `r/index.json tem ${(tamanhoIndice / 1024).toFixed(1)} KB, teto ${TETO_INDICE / 1024} KB`);
const arquivadas = indice.itens.filter((i) => i.arquivada).map((i) => i.nome);
conferir(!arquivadas.some((n) => llms.includes(`/r/${n}.md`)), `${arquivadas.length} arquivadas fora do llms.txt`);

console.log("\nLinks");
const links = [...new Set([...llms.matchAll(/\]\((https?:[^)\s]+)\)/g)].map((m) => m[1].split("#")[0]))];
const quebrados = (await emLotes(links, 12, async (u) => ((await responde(local(u))) ? null : u))).filter(Boolean);
conferir(!quebrados.length, `${links.length} links do llms.txt respondem`);
quebrados.slice(0, 20).forEach((q) => console.log(`        ${q}`));

const fichas = indice.itens.map((i) => `/r/${i.nome}.md`);
const semFicha = (await emLotes(fichas, 12, async (u) => ((await responde(`${BASE}${u}`)) ? null : u))).filter(Boolean);
conferir(!semFicha.length, `${fichas.length} fichas do índice respondem, arquivadas inclusive`);
semFicha.slice(0, 20).forEach((q) => console.log(`        ${q}`));

console.log("\nSitemap");
const locs = [...(corpos["/sitemap.xml"] ?? "").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
conferir(locs.length > 0, `${locs.length} endereços`);
conferir(!locs.some((u) => /\/kit(s)?(\/|$)/.test(u)), "sem kits");
conferir(!arquivadas.some((n) => locs.includes(`${PROD}/c/${n}`)), "sem peças arquivadas");
const amostra = locs.filter((_, i) => i % Math.ceil(locs.length / 25 || 1) === 0);
const sitemapRuim = (await emLotes(amostra, 8, async (u) => ((await responde(local(u))) ? null : u))).filter(Boolean);
conferir(!sitemapRuim.length, `amostra de ${amostra.length} responde 200${sitemapRuim.length ? `: ${sitemapRuim.join(", ")}` : ""}`);
conferir((corpos["/robots.txt"] ?? "").includes("Sitemap:"), "robots.txt aponta o sitemap");

console.log("\nHTML alternativo");
for (const [rota, md] of [
  ["/c/kanban", "/r/kanban.md"],
  ["/docs", "/docs.md"],
  ["/skills", "/skills.md"],
  ["/skills/killer", "/skills/killer.md"],
  ["/marca", "/marca.md"],
]) {
  /* A barra final é do preview local, que não abre o index.html da pasta sem ela. */
  const { r, corpo } = await pegar(LOCAL ? `${rota}/` : rota);
  conferir(
    r.ok && corpo.includes(`rel="alternate" type="text/markdown" href="${md}"`),
    `${rota} declara ${md}`,
  );
}

const SO_PRODUCAO = "Accept: text/markdown, Vary, Cache-Control e tipos do vercel.json";
if (LOCAL) {
  puladas.push(SO_PRODUCAO);
} else {
  console.log("\nNegociação");
  for (const [rota, md] of [
    ["/c/kanban", "/r/kanban.md"],
    ["/docs", "/docs.md"],
    ["/skills", "/skills.md"],
    ["/skills/killer", "/skills/killer.md"],
    ["/marca", "/marca.md"],
  ]) {
    const { r, corpo } = await pegar(rota, { headers: { Accept: "text/markdown" } });
    const final = new URL(r.url).pathname;
    conferir(
      r.ok && (r.headers.get("content-type") ?? "").includes(MD) && !corpo.startsWith("<!") && final === md,
      `${rota} com Accept: text/markdown entrega ${final}`,
    );
    const html = await pegar(rota, { headers: { Accept: "text/html" } });
    conferir(
      (html.r.headers.get("content-type") ?? "").includes("text/html") && /accept/i.test(html.r.headers.get("vary") ?? ""),
      `${rota} em HTML continua HTML, com Vary: Accept`,
    );
  }

  console.log("\nCache");
  for (const rota of ["/r/index.json", "/r/kanban.md", "/llms.txt", "/llms-full.txt"]) {
    const { r } = await pegar(rota);
    const cc = r.headers.get("cache-control") ?? "";
    conferir(/s-maxage=\d{4,}/.test(cc) && Boolean(r.headers.get("etag")), `${rota} ${cc} com ETag`);
  }
}

console.log("\nDescoberta");
try {
  const catalogo = JSON.parse(corpos["/.well-known/ai-catalog.json"]);
  const entrada = catalogo.entries?.find((e) => e.type === "application/mcp-server-card+json");
  conferir(entrada?.url === `${PROD}/mcp/server-card`, "catálogo aponta o cartão do servidor");
} catch {
  falha("ai-catalog.json não é JSON");
}
let cartao = null;
try {
  cartao = JSON.parse(corpos["/mcp/server-card"]);
  conferir(cartao.name && cartao.version && cartao.remotes?.[0]?.url === `${PROD}/mcp`, `cartão ${cartao.name} ${cartao.version}`);
} catch {
  falha("server-card não é JSON");
}

/* O protocolo de verdade, com o Accept que a spec exige. Serve JSON ou SSE: os dois valem. */
async function rpc(url, id, method, params) {
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-11-25",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  const corpo = await r.text();
  const cru = (r.headers.get("content-type") ?? "").includes("event-stream")
    ? corpo.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).filter(Boolean).pop()
    : corpo;
  return { status: r.status, msg: JSON.parse(cru) };
}
const textoDe = (m) => m.result?.content?.map((c) => c.text).join("\n") ?? "";

if (!MCP) {
  puladas.push("MCP (passe --mcp <url>)");
} else {
  console.log("\nMCP");
  try {
    const t0 = Date.now();
    const ini = await rpc(MCP, 1, "initialize", {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: { name: "agentes-check", version: "1.0.0" },
    });
    const info = ini.msg.result?.serverInfo;
    conferir(Boolean(info), `initialize ${info?.name} ${info?.version} (${Date.now() - t0} ms)`);
    if (cartao) conferir(info?.name === cartao.name && info?.version === cartao.version, "o cartão bate com o servidor vivo");

    const t1 = Date.now();
    const { msg: lista } = await rpc(MCP, 2, "tools/list", {});
    const nomes = lista.result?.tools?.map((t) => t.name) ?? [];
    conferir(nomes.length > 0, `tools/list: ${nomes.join(", ")} (${Date.now() - t1} ms)`);
    for (const n of ["recomendar_para_projeto", "listar_skills", "recomendar_skill", "tema_da_marca"]) {
      conferir(nomes.includes(n), `tem ${n}`);
    }

    const chamar = async (name, a) => (await rpc(MCP, 3, "tools/call", { name, arguments: a })).msg;
    conferir(/visant-design/.test(textoDe(await chamar("listar_skills", {}))), "listar_skills devolve as skills");
    const rec = textoDe(await chamar("recomendar_skill", { pedido: "tirar a cara de IA da tela" }));
    conferir(/^- visant-(killer|design)/.test(rec), `recomendar_skill: ${rec.split("\n")[0].slice(0, 60)}`);
    conferir(/theme-visant/.test(textoDe(await chamar("tema_da_marca", { marca: "visant" }))), "tema_da_marca devolve o tema público");
    const privada = textoDe(await chamar("tema_da_marca", { marca: "marca-que-nao-existe" }));
    conferir(/não é uma marca pública/.test(privada), "marca fora da lista é recusada");
    const invalido = await chamar("recomendar_skill", { pedido: 1 });
    conferir(Boolean(invalido.error || invalido.result?.isError), "entrada inválida vira erro legível");
  } catch (e) {
    falha(`MCP não respondeu: ${e.message}`);
  }
}

console.log("");
if (puladas.length) console.log(`Só vale em produção: ${puladas.join("; ")}.`);
if (falhas.length) {
  console.log(`${falhas.length} falha(s).\n`);
  process.exit(1);
}
console.log("Tudo certo.\n");
