// API do Visant Labs → temas do registry, em lote.
//
// `brand-theme-item.mjs` compila UMA marca. Este script varre o workspace
// inteiro e produz duas coisas:
//
//   public/r/theme-<slug>.json   um registry-item por marca (instalável)
//   public/r/brands.json         o índice que o <BrandSelector /> consome
//
// O índice existe porque o seletor precisa listar marca, logo e paleta ANTES de
// baixar tema nenhum — e porque a chave da API não pode viajar para o browser.
// Aqui ela fica: o build lê a API autenticado, o cliente lê JSON público.
//
//   node scripts/brands-sync.mjs            # todas as marcas
//   node scripts/brands-sync.mjs --only visant,outra-marca
//   node scripts/brands-sync.mjs --dry      # só o relatório, não escreve
//
// Fonte da chave: .env.local (VISANT_LABS_API_KEY). Sem chave → falha alto, não
// silenciosamente: um índice vazio publicado é pior que um build quebrado.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { inflateSync } from "node:zlib";
import { buildBrandThemeItem } from "./brand-theme-item.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const outDir = join(root, "public/r");

/*
 * O que pode ser PUBLICADO.
 *
 * O vault é a conta pessoal do dono do repo: nome, tagline, logo, paleta e
 * completude de cliente pagante. Isto aqui vira arquivo estático num domínio
 * público, com `Access-Control-Allow-Origin: *` — qualquer um lia a carteira de
 * clientes inteira. Não é uma feature faltando, é dado que não devia sair.
 *
 * A partir daqui o sync só escreve em `public/r` o que estiver nesta lista. As
 * outras marcas continuam sendo compiladas para o cache local (`.brands-local/`,
 * fora do git e fora do deploy), que é o que faz o dev na máquina do dono
 * funcionar sem publicar nada.
 *
 * A vitrine pública demonstra multi-marca com as fictícias de
 * `scripts/demo-brands.mjs`. Marca real de cliente só aparece para quem entrar
 * com a própria conta.
 */
const PUBLICAVEIS = new Set(["visant"]);

const localDir = join(root, ".brands-local");

// --- env ---------------------------------------------------------------------
// Sem dotenv: o parse de KEY=valor é trivial e uma dependência a menos no build.
function loadEnvLocal() {
  const f = join(root, ".env.local");
  if (!existsSync(f)) return;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvLocal();

const KEY = process.env.VISANT_LABS_API_KEY || process.env.VISANT_API_TOKEN;
const BASE = process.env.VISANT_LABS_API_URL || "https://api.visantlabs.com";

// --- API ---------------------------------------------------------------------
/**
 * Lista as guidelines do workspace COM as seções embutidas.
 *
 * `GET /api/brand-guidelines` (sem `?sections=`) já devolve `colors`,
 * `typography` e `logos` dentro de cada item — verificado contra a API real em
 * 30/07/2026, 24 marcas. Isso derruba o N+1 óbvio (listar e depois buscar uma a
 * uma) para uma requisição só.
 *
 * Cuidado herdado do visant-board: `?sections=a,b` (lista separada por vírgula)
 * devolve 200 com TODAS as seções vazias. Não passar o parâmetro é o caminho
 * certo — o erro seria mudo.
 */
async function listBrands() {
  const out = [];
  for (let skip = 0; skip < 1000; skip += 100) {
    const res = await fetch(`${BASE}/api/brand-guidelines?limit=100&skip=${skip}`, {
      headers: { Authorization: `Bearer ${KEY}`, "x-api-key": KEY, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`list brand-guidelines → HTTP ${res.status}`);
    const data = await res.json();
    const items = data?.guidelines ?? [];
    out.push(...items);
    if (items.length < 100 || !data?.page?.hasMore) break;
  }
  return out;
}

// --- normalização ------------------------------------------------------------
/**
 * O vocabulário de papéis é do humano que preencheu a guideline, não do motor.
 *
 * Na amostra real aparecem papéis COMPOSTOS: `background/text`, `accent/cta`,
 * `accent/background`. O motor casa papel por igualdade exata, então
 * `background/text` não resolve o slot `background` — e o fallback (cor mais
 * usada) escolheria o preto de uma marca como fundo do tema claro. Texto preto
 * sobre fundo preto, sem erro nenhum no build.
 *
 * A correção é aqui e não no motor de propósito: o motor é SSoT do
 * `visantlabs-os`; este repo normaliza o que consome. Cada segmento vira uma
 * entrada própria, e a ordem de publicação vira `usageRank` (a API não manda
 * um) para o fallback preferir a primeira cor listada, que é a principal.
 */
function normalizeBrand(g) {
  const colors = [];
  (g.colors ?? []).forEach((c, i) => {
    const hex = typeof c?.hex === "string" ? c.hex : typeof c?.value === "string" ? c.value : null;
    if (!hex) return;
    const roles = String(c.role ?? c.name ?? "")
      .split(/[/,|]/)
      .map((r) => r.trim().toLowerCase())
      .filter(Boolean);
    const base = { hex, name: c.name ?? null, usage: c.usage ?? null, usageRank: c.usageRank ?? i + 1 };
    if (!roles.length) colors.push({ ...base, role: null });
    for (const role of roles) colors.push({ ...base, role });
  });

  // Desempate dentro de um mesmo papel. Uma marca publica DUAS cores que
  // expandem para `accent`: EQUILÍBRIO (#FAF3DC, um creme) e VIGOR (#7B1F28, o
  // vermelho da marca). O motor pega a primeira do array — e a marca inteira
  // saía pintada de creme, com `--brand` quase indistinguível do fundo.
  // Critério: em papel de identidade vence a cor mais saturada; em papel de
  // fundo vence a mais clara. Ordenação estável, então papéis distintos mantêm
  // a ordem de publicação.
  //
  // Agrupa por papel e ordena DENTRO do grupo: um comparador que devolve 0 para
  // papéis diferentes não é ordem total, e o TimSort só compara elementos
  // adjacentes — cores do mesmo papel separadas no array nunca se comparariam.
  const BG_ROLES = new Set(["background", "bg", "canvas", "base", "surface"]);
  const groups = new Map();
  for (const c of colors) {
    const k = c.role ?? "";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(c);
  }
  const ordered = [];
  for (const [role, list] of groups) {
    list.sort((a, b) => {
      const A = hexStats(a.hex), B = hexStats(b.hex);
      return BG_ROLES.has(role) ? B.lum - A.lum : B.sat - A.sat;
    });
    ordered.push(...list);
  }
  colors.length = 0;
  colors.push(...ordered);

  // Duas formas convivem na API: a atual `{family, role, size}` e uma legada
  // `{fontFamily, name, fontSize}` (marcas antigas do vault). Ler só a atual
  // descartava a tipografia dessas marcas e o motor recusava a marca inteira
  // por "publishes no typography" — com a guideline preenchida.
  const typography = (g.typography ?? [])
    .map((t) => ({
      family: typeof t?.family === "string" ? t.family : typeof t?.fontFamily === "string" ? t.fontFamily : null,
      role: (t?.role ?? t?.name) ? String(t.role ?? t.name).toLowerCase() : null,
      size: Number.isFinite(Number(t?.size ?? t?.fontSize)) ? Number(t.size ?? t.fontSize) : null,
    }))
    .filter((t) => t.family);

  return {
    id: g.id,
    name: g.identity?.name ?? null,
    colors,
    typography,
    extraction: g.extraction ?? null,
    currentVersion: g.currentVersion ?? null,
    _source: `brand-guidelines-list(${g.id})`,
  };
}

/** Luminância e saturação aproximadas de um hex — só para desempatar ordem. */
function hexStats(hex) {
  const h = String(hex).replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return { lum: 0.2126 * r + 0.7152 * g + 0.0722 * b, sat: max - min };
}

/** `Marca®` → `marca`. Mesmo slug do motor, para o nome do item bater. */
function slugify(name) {
  return String(name || "brand")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

/** Logo para o seletor: prefere a variante principal, aceita qualquer uma com url. */
function pickLogo(g) {
  const withUrl = (g.logos ?? []).filter((l) => typeof l?.url === "string" && l.url);
  const primary = withUrl.find((l) => l.variant === "primary" || l.variant === "main");
  const l = primary ?? withUrl[0];
  return l ? { url: l.url, thumbnailUrl: l.thumbnailUrl ?? l.url, variant: l.variant ?? null } : null;
}

/**
 * A tinta de um logo PNG, para a página escolher o fundo certo da paleta.
 *
 * O bucket não manda CORS, então o browser não consegue ler os pixels: a conta é
 * feita aqui. Só PNG de 8 bits sem entrelace, que é o que o vault tem; qualquer
 * outra coisa devolve `null` e a página usa o fundo da paleta.
 */
async function tintaDoLogo(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const png = Buffer.from(await res.arrayBuffer());
    if (png.toString("latin1", 1, 4) !== "PNG") return null;
    const partes = [];
    let largura, altura, tipo, profundidade, entrelace;
    for (let p = 8; p < png.length; ) {
      const n = png.readUInt32BE(p);
      const nome = png.toString("latin1", p + 4, p + 8);
      if (nome === "IHDR") {
        largura = png.readUInt32BE(p + 8);
        altura = png.readUInt32BE(p + 12);
        profundidade = png[p + 16];
        tipo = png[p + 17];
        entrelace = png[p + 20];
      } else if (nome === "IDAT") partes.push(png.subarray(p + 8, p + 8 + n));
      p += 12 + n;
    }
    const canais = { 2: 3, 6: 4 }[tipo];
    if (!canais || profundidade !== 8 || entrelace) return null;
    const dados = inflateSync(Buffer.concat(partes));
    const passo = largura * canais;
    let anterior = Buffer.alloc(passo);
    let opacos = 0;
    let soma = 0;
    let canto = null;
    for (let y = 0; y < altura; y++) {
      const ini = y * (passo + 1);
      const filtro = dados[ini];
      const linha = Buffer.from(dados.subarray(ini + 1, ini + 1 + passo));
      for (let i = 0; i < passo; i++) {
        const a = i >= canais ? linha[i - canais] : 0;
        const b = anterior[i];
        const c = i >= canais ? anterior[i - canais] : 0;
        const paeth = () => {
          const d = a + b - c;
          const [da, db, dc] = [Math.abs(d - a), Math.abs(d - b), Math.abs(d - c)];
          return da <= db && da <= dc ? a : db <= dc ? b : c;
        };
        const soma8 = [0, a, b, (a + b) >> 1, paeth][filtro];
        linha[i] = (linha[i] + (typeof soma8 === "function" ? soma8() : soma8)) & 255;
      }
      if (y === altura >> 1) canto = `#${linha.subarray(0, 3).toString("hex")}`; // a borda no meio: quina pode ter vinheta
      for (let x = 0; x < passo; x += canais) {
        if (canais === 4 && linha[x + 3] < 128) continue;
        opacos++;
        soma += 0.2126 * linha[x] + 0.7152 * linha[x + 1] + 0.0722 * linha[x + 2];
      }
      anterior = linha;
    }
    if (!opacos) return null;
    // Sem transparência o arquivo traz o próprio fundo: a placa repete a cor do canto.
    if (opacos / (largura * altura) > 0.95) return { tinta: "opaco", fundo: canto };
    return { tinta: soma / opacos > 128 ? "clara" : "escura" };
  } catch {
    return null;
  }
}

/**
 * O livro da marca: só o que a página pública dela já mostra a qualquer visitante.
 *
 * O pedido sai SEM a chave, de propósito: é a mesma resposta que o anônimo recebe,
 * e a lista autenticada traz campos que não são para sair. Cada campo daqui é
 * escolhido por nome, então campo novo na API não vaza sozinho, e cada um só entra
 * se a seção dele estiver ativa em `activeSections` (o mapa é o do editor do
 * visantlabs-os: `identity`, `tags`, `strategy`, `editorial`, `logos`).
 */
async function livroPublico(g) {
  if (g.isPublic !== true || !g.publicSlug) return null;
  const res = await fetch(`${BASE}/api/brand-guidelines/public/${encodeURIComponent(g.publicSlug)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    console.warn(`  livro de ${g.identity?.name}: HTTP ${res.status}, publicando sem ele`);
    return null;
  }
  const p = (await res.json())?.guideline;
  if (p?.isPublic !== true) return null;

  const ativa = new Set(p.activeSections ?? []);
  const texto = (v) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const lista = (v) => {
    const l = (Array.isArray(v) ? v : []).map(texto).filter(Boolean);
    return l.length ? l : undefined;
  };

  const livro = { fonte: "publica" };
  if (ativa.has("identity")) livro.descricao = texto(p.identity?.description);
  if (ativa.has("tags")) livro.tom = lista(p.tags?.tone);
  if (ativa.has("strategy")) {
    livro.essencia = texto(p.strategy?.manifesto);
    const valores = (p.strategy?.pillars ?? [])
      .map((v) => ({ nome: texto(v?.value), texto: texto(v?.description) }))
      .filter((v) => v.nome && v.texto);
    if (valores.length) {
      livro.valores = valores;
      livro.valoresTitulo = "Pilares";
    }
    const m = p.strategy?.coreMessage;
    const mensagem = { produto: texto(m?.product), diferencial: texto(m?.differential), vinculo: texto(m?.emotionalBond) };
    if (Object.values(mensagem).some(Boolean)) livro.mensagem = mensagem;
  }
  if (ativa.has("editorial")) {
    livro.voz = texto(p.guidelines?.voice);
    livro.faz = lista(p.guidelines?.dos);
    livro.naoFaz = lista(p.guidelines?.donts);
  }
  if (ativa.has("logos")) {
    const logos = [];
    for (const l of p.logos ?? []) {
      const url = texto(l?.url);
      if (url) logos.push({ url, variant: texto(l?.variant) ?? null, tinta: null, ...(await tintaDoLogo(url)) });
    }
    if (logos.length) livro.logos = logos;
  }
  return livro;
}

// --- main --------------------------------------------------------------------
const argv = process.argv.slice(2);
const dry = argv.includes("--dry");
const onlyArg = argv[argv.indexOf("--only") + 1];
const only = argv.includes("--only") ? onlyArg.split(",").map((s) => s.trim().toLowerCase()) : null;

if (!KEY) {
  console.error("✗ VISANT_LABS_API_KEY ausente (.env.local ou env). Nada foi escrito.");
  process.exit(1);
}

const raw = await listBrands();
console.log(`Visant Labs: ${raw.length} guidelines\n`);

const brands = [];
const skipped = [];

for (const g of raw) {
  const name = g.identity?.name ?? g.id;
  const slug = slugify(name);
  if (only && !only.includes(slug)) continue;

  try {
    const item = buildBrandThemeItem(normalizeBrand(g));
    // O motor deriva o slug do nome; o índice tem de usar EXATAMENTE o mesmo,
    // senão o seletor pede um tema que não existe.
    const itemSlug = item.name.replace(/^theme-/, "");

    if (!dry) {
      // Público só o que está na lista; o resto vai para o cache local, fora do
      // git e fora do deploy.
      const destino = PUBLICAVEIS.has(itemSlug) ? outDir : localDir;
      mkdirSync(destino, { recursive: true });
      writeFileSync(join(destino, `${item.name}.json`), JSON.stringify(item, null, 2) + "\n", "utf8");
    }

    brands.push({
      id: g.id,
      slug: itemSlug,
      name,
      tagline: g.identity?.tagline ?? null,
      logo: pickLogo(g),
      // Paleta publicada, crua — é o que o humano reconhece na lista. Os tokens
      // compilados abaixo é que a UI aplica.
      palette: (g.colors ?? [])
        .filter((c) => typeof c?.hex === "string")
        .map((c) => ({ hex: c.hex, name: c.name ?? null, role: c.role ?? null })),
      fonts: {
        display: item.cssVars.theme["font-display"].split(",")[0].replace(/'/g, ""),
        sans: item.cssVars.theme["font-sans"].split(",")[0].replace(/'/g, ""),
      },
      // Prévia: 4 tokens por modo bastam para o card do seletor pintar a marca
      // sem baixar o tema inteiro. O tema completo só desce quando se escolhe.
      preview: {
        light: pluck(item.cssVars.light),
        dark: pluck(item.cssVars.dark),
      },
      theme: item.name,
      themeUrl: `/r/${item.name}.json`,
      version: g.currentVersion ?? null,
      completeness: g.extraction?.completeness ?? null,
      updatedAt: g.updatedAt ?? null,
      // Só marca publicável busca livro: marca de cliente não ganha nem o pedido.
      ...(PUBLICAVEIS.has(itemSlug) ? { livro: await livroPublico(g) } : {}),
    });
  } catch (err) {
    skipped.push({ name, reason: err.message.replace("@visant/brand-tokens: ", ""), detail: err.detail });
  }
}

function pluck(vars) {
  const keys = ["background", "foreground", "brand", "brand-foreground", "accent-ink", "card", "border", "muted-foreground"];
  return Object.fromEntries(keys.map((k) => [k, vars[k]]).filter(([, v]) => v));
}

brands.sort((a, b) => (b.completeness ?? 0) - (a.completeness ?? 0) || a.name.localeCompare(b.name));

const index = {
  $schema: "https://visant-ui.vercel.app/schema/brands.json",
  generatedAt: new Date().toISOString(),
  source: `${BASE}/api/brand-guidelines`,
  engine: "@visant/brand-tokens",
  count: brands.length,
  brands,
};

if (!dry) {
  /*
   * Dois índices, e só um sai de casa.
   *
   * `public/r/brands.json` é o que o site publicado serve: a casa mais as
   * fictícias. `.brands-local/brands.json` é o índice completo, para desenvolver
   * na máquina do dono contra as marcas de verdade.
   */
  const publicas = brands.filter((b) => PUBLICAVEIS.has(b.slug));
  const demo = existsSync(join(outDir, "demo-brands.json"))
    ? JSON.parse(readFileSync(join(outDir, "demo-brands.json"), "utf8"))
    : [];

  writeFileSync(
    join(outDir, "brands.json"),
    JSON.stringify({ ...index, count: publicas.length + demo.length, brands: [...publicas, ...demo] }, null, 2) + "\n",
    "utf8",
  );

  mkdirSync(localDir, { recursive: true });
  writeFileSync(join(localDir, "brands.json"), JSON.stringify(index, null, 2) + "\n", "utf8");
}

// --- relatório ---------------------------------------------------------------
const pad = (s, n) => String(s ?? "").padEnd(n).slice(0, n);
console.log(pad("MARCA", 22), pad("SLUG", 20), pad("DISPLAY", 16), pad("BRAND", 26), "VAULT");
for (const b of brands) {
  console.log(pad(b.name, 22), pad(b.slug, 20), pad(b.fonts.display, 16), pad(b.preview.light.brand, 26), `${b.completeness ?? "?"}%`);
}
if (skipped.length) {
  console.log(`\n${skipped.length} sem tokens suficientes (a guideline é que está vazia, não o build):`);
  for (const s of skipped) console.log(`  · ${pad(s.name, 22)} ${s.reason}`);
}
console.log(`\n${dry ? "[dry] " : "✓ "}${brands.length} temas · public/r/brands.json`);
