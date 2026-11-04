#!/usr/bin/env node
/**
 * Um HTML por item, com título, descrição e imagem de prévia.
 *
 * A vitrine é um SPA: sem isto, `/c/kanban` e `/c/marquee` são o MESMO documento
 * — mesmo `<title>`, mesma descrição, nenhuma imagem. Colar o link no Slack, no
 * WhatsApp ou no Twitter mostrava "Vintage UI UX Library" para os 47 itens, e o
 * Google indexava uma página só. Quem publica uma library precisa que cada peça
 * tenha endereço com cara própria; é assim que ela circula.
 *
 * O que roda aqui, depois do `vite build`:
 *
 *   1. reescreve `dist/index.html` com as meta tags da home;
 *   2. escreve `dist/c/<item>/index.html` para cada item do registry,
 *      `dist/catalogo/<familia>/index.html` para cada fatia do catálogo, e
 *      `dist/marca/`, `dist/rig/` para as outras seções;
 *
 * As imagens de prévia são geradas à parte (`npm run build:og`) e versionadas em
 * `public/og/`: gerar exige Chromium, e o build da Vercel não tem — fazer isso
 * aqui quebraria a publicação.
 *
 * O HTML gerado é o MESMO app: o React assume no cliente. O que muda é o que o
 * robô de prévia lê antes de qualquer JavaScript existir.
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { contaDaVitrine } from "./conta-vitrine.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = process.env.VISANT_DIST ? resolve(process.env.VISANT_DIST) : join(ROOT, "dist");
const SITE = "https://ui.visantlabs.com";

const registry = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf8"));
const base = readFileSync(join(DIST, "index.html"), "utf8");

const escapar = (s = "") =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Injeta as meta tags no lugar do `<title>` que o Vite deixou. */
function comMeta({ titulo, descricao, url, imagem, noindex, markdown }) {
  const tags = [
    `<title>${escapar(titulo)}</title>`,
    ...(noindex ? [`<meta name="robots" content="noindex" />`] : []),
    `<meta name="description" content="${escapar(descricao)}" />`,
    `<link rel="canonical" href="${url}" />`,
    ...(markdown ? [`<link rel="alternate" type="text/markdown" href="${markdown}" />`] : []),
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="@visant/ui" />`,
    `<meta property="og:title" content="${escapar(titulo)}" />`,
    `<meta property="og:description" content="${escapar(descricao)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${imagem}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapar(titulo)}" />`,
    `<meta name="twitter:description" content="${escapar(descricao)}" />`,
    `<meta name="twitter:image" content="${imagem}" />`,
  ].join("\n    ");

  return base.replace(/<title>.*?<\/title>/s, tags);
}

function escrever(caminhoRelativo, html) {
  const dir = join(DIST, caminhoRelativo);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
}

/*
 * A primeira dobra no próprio HTML.
 *
 * Em Slow 4G (400 kbps) o JavaScript de entrada leva 5 s só para descer: esperar o React
 * significava 9 a 14 s de tela vazia. O título sai aqui, com um CSS mínimo no próprio HTML, e
 * o `App.tsx` reaproveita este `<main>` como espera da rota.
 *
 * A folha principal desce para o fim do `<body>`: ela só segura o que vem depois dela, então
 * a dobra pinta sem esperá-la. O `<script>` vazio logo depois para o parser até a folha chegar,
 * e o módulo do app só roda depois disso: sem ele o Safari subia o React sem estilo. O texto é conferido contra a fonte para
 * não envelhecer em silêncio.
 */
const H1_CASA = "font-size:2rem;line-height:2.25rem;letter-spacing:-.02em";
const H1_HUB = "font-size:clamp(2.75rem,6.5vw,5.5rem);line-height:1.08;letter-spacing:-.03em";
const H1_KILLER = "font-size:clamp(2.25rem,4.4vw,3.5rem);line-height:1.05;letter-spacing:-.03em";
/* O tema em camada própria, declarada antes das do Tailwind: quando a folha chega, ela manda. */
const CSS_DOBRA = `<style>@layer dobra{html{background:oklch(.985 0 0);color:oklch(.17 0 0)}html.dark{background:oklch(.13 0 0);color:oklch(.97 0 0)}}.dobra-cab{height:88px}.dobra{box-sizing:border-box;max-width:90rem;margin:0 auto;padding:2.5rem 1rem 3rem;font-family:"Geist Variable",ui-sans-serif,system-ui,sans-serif}.dobra h1{margin:0;font-weight:500}.dobra p{margin:1.5rem 0 0;max-width:48ch;font-size:1rem;line-height:1.5rem;opacity:.72}@media(min-width:640px){.dobra-cab{height:56px}.dobra{padding:3.5rem 1.5rem 3rem}}</style>`;
const DOBRAS = {
  catalogo: {
    fonte: "src/app/Gallery.tsx",
    h1: "A library da Visant",
    classe: H1_CASA,
    sub: "Componentes e shaders pra React. Cada um veste a marca que você escolher.",
    chunks: [/^RotaCatalogo-.*\.js$/],
    /* As três primeiras fotos da grade no celular, no tema padrão. */
    imagens: JSON.parse(readFileSync(join(ROOT, "curadoria", "destaques.json"), "utf8"))
      .slice(0, 3)
      .map((n) => ({ src: `/shots/${n}-escuro.webp`, media: "(max-width: 639px)" })),
  },
  marca: {
    h1: "Marca",
    classe: H1_CASA,
    sub: "Identidade, cor, tipografia, forma e movimento, com um comando para instalar.",
    chunks: [/^BrandStudio-.*\.js$/],
    imagens: ["/logos/visant.webp"],
  },
  skills: {
    fonte: "src/app/skills/Hub.tsx",
    h1: "Tire a cara de IA da sua interface.",
    classe: H1_HUB,
    sub: "Skills pro Claude Code: interface, copy, motion, vídeo e projeto grande.",
    chunks: [/^Hub-.*\.js$/],
    imagens: [
      /* Só no celular: a tela larga escolhe a foto por `srcset`, e o preload pediria outra. */
      { asset: /^hero-a-.*\.webp$/, media: "(max-width: 1023px)" },
      { asset: /^hero-d-.*\.webp$/, media: "(max-width: 1023px)" },
    ],
  },
  docs: {
    fonte: "src/app/Docs.tsx",
    h1: "Docs",
    classe: H1_CASA,
    sub: JSON.parse(readFileSync(join(ROOT, "src", "app", "docs-conteudo.json"), "utf8")).lead,
    chunks: [/^Docs-.*\.js$/],
  },
  "skills/filme": {
    fonte: "src/app/skills/Filme.tsx",
    h1: "Tire a cara de IA da sua interface.",
    classe: H1_HUB,
    sub: "Skills grátis pro Claude Code. Role a página e veja esta tela ficar limpa.",
    chunks: [/^Filme-.*\.js$/, /^skills\.generated-.*\.js$/],
    /* A abertura do filme é o checkout (`ABERTURA` em roteiro.ts). */
    imagens: ["/media/skills/filme/checkout-antes.webp"],
    estilos: [/^Filme-.*\.css$/],
  },
  "skills/killer": {
    fonte: "src/app/skills/CarroChefe.tsx",
    h1: "Tire a cara de IA da sua tela antes do PR.",
    classe: H1_KILLER,
    sub: "A visant-killer roda quatro detectores no seu código, abre a tela e discute com o próprio veredito.",
    chunks: [/^CarroChefe-.*\.js$/],
  },
};

const ASSETS = readdirSync(join(DIST, "assets"));

/*
 * O chunk da rota e o que ele importa direto. Sem a lista inteira no HTML, cada nível do grafo só
 * é descoberto depois do anterior baixar, e em Slow 4G cada nível custa 400 ms de ida e volta.
 */
function comDependencias(chunks) {
  const vistos = new Set();
  const visitar = (f) => {
    if (vistos.has(f)) return;
    vistos.add(f);
    const codigo = readFileSync(join(DIST, "assets", f), "utf8");
    for (const [, dep] of codigo.matchAll(/(?:from|import)\s*"\.\/([^"]+\.js)"/g)) visitar(dep);
  };
  chunks.forEach(visitar);
  /* A entrada e o que ela importa já estão no HTML que o Vite escreveu. */
  return [...vistos].filter((f) => !base.includes(`/assets/${f}`));
}

function comDobra(html, slug) {
  const d = DOBRAS[slug];
  if (!d) return html;
  /* Rodar duas vezes sobre o mesmo dist perderia a folha de estilo: a dobra exige o HTML cru do Vite. */
  if (!html.includes('<div id="root"></div>')) {
    console.error("dist/index.html já passou pelo prerender: rode `vite build` antes.");
    process.exit(1);
  }
  if (d.fonte && !readFileSync(join(ROOT, d.fonte), "utf8").includes(d.h1)) {
    console.error(`o título da primeira dobra de /${slug} não existe mais em ${d.fonte}: "${d.h1}"`);
    process.exit(1);
  }
  const preloads = [
    ...comDependencias((d.chunks ?? []).flatMap((re) => ASSETS.filter((f) => re.test(f)))).map((f) => `<link rel="modulepreload" crossorigin href="/assets/${f}">`),
    ...(d.estilos ?? []).flatMap((re) => ASSETS.filter((f) => re.test(f))).map((f) => `<link rel="preload" as="style" crossorigin href="/assets/${f}">`),
    /* O tema da marca padrão: o provider pede um depois do outro, e eram duas idas e voltas depois do React. */
    `<link rel="preload" as="fetch" crossorigin href="/r/brands.json">`,
    `<link rel="preload" as="fetch" crossorigin href="/r/theme-visant.json">`,
    /* A fonte da casa e as fotos da dobra saem junto com o HTML: pedidas só depois do React, esperavam uma ida e volta a mais com a banda parada. */
    ...ASSETS.filter((f) => /^geist-latin-wght-normal-.*\.woff2$/.test(f)).map((f) => `<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/${f}">`),
    ...(d.imagens ?? []).map((i) => {
      const { src, asset, media } = typeof i === "string" ? { src: i } : i;
      const href = asset ? `/assets/${ASSETS.find((f) => asset.test(f))}` : src;
      return `<link rel="preload" as="image" href="${href}"${media ? ` media="${media}"` : ""}>`;
    }),
  ];
  /* O tema sai aqui também: esta dobra pinta antes de o `main.tsx` rodar. */
  const tema = `<script>try{document.documentElement.classList.toggle("dark",localStorage.getItem("visant:ui:tema")!=="claro")}catch(e){document.documentElement.classList.add("dark")}</script>`;
  const dobra = `<div class="dobra-cab"></div><main class="casa dobra"><h1 style="${d.classe}">${escapar(d.h1)}</h1><p>${escapar(d.sub)}</p></main>`;
  const folha = html.match(/<link rel="stylesheet"[^>]*>/)?.[0] ?? "";
  return html
    .replace(folha, "")
    .replace("</head>", `  ${tema}\n    ${CSS_DOBRA}\n    ${preloads.join("\n    ")}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${dobra}</div>\n      ${folha}\n      <script>0</script>`);
}

// --- páginas -----------------------------------------------------------------

/* A home é o catálogo. Os kits foram a porta de entrada por um tempo, e saíram
   dela até serem redesenhados — ainda não se explicavam sozinhos. */
/*
 * A mesma conta da vitrine (`contaComoComponente` em catalog.tsx): peça fora
 * das famílias ocultas e não arquivada pela curadoria. Antes este número saía
 * de `registry.items.length` e dizia 183 enquanto a página dizia 176.
 */
const { notas, arquivada, familias, pecasPorFamilia, frase: CONTA } = contaDaVitrine(ROOT);

const HOME = {
  titulo: "A library da Visant / @visant/ui",
  descricao: `${CONTA} pra React, em registry shadcn. Cada um veste a marca que você escolher.`,
};

writeFileSync(
  join(DIST, "index.html"),
  comDobra(comMeta({ ...HOME, url: `${SITE}/`, imagem: `${SITE}/og/home.png` }), "catalogo"),
);

const SECOES = [
  {
    slug: "kits",
    noindex: true,
    titulo: "Kits / @visant/ui",
    descricao: "Cinco composições montadas com as peças do registry: mesa de trabalho, landing, motion, bancada vintage e marca viva.",
  },
  {
    slug: "catalogo",
    titulo: "Catálogo / @visant/ui",
    /* `/catalogo` deixou de ser a página com tudo dentro: virou o índice das
       categorias, e cada fatia tem endereço próprio em `/catalogo/<familia>`. */
    descricao: `${CONTA} pra React, divididos por categoria, cada fatia com demo viva e comando de instalação.`,
  },
  {
    slug: "skills",
    titulo: "Skills / Visant",
    descricao: "Seis skills da Visant para Claude Code: interface, motion e copy, mostradas em uso.",
  },
  {
    slug: "skills/filme",
    titulo: "Skills em filme / Visant",
    descricao: "O que cada skill da Visant faz, em filme: telas fictícias, montadas para mostrar cada passada.",
  },
  {
    slug: "skills/como-usar",
    titulo: "Como usar as skills / Visant",
    descricao: "Mande uma mensagem pro seu agente de IA e comece a pedir: skills e componentes, um passo por tela.",
  },
  {
    slug: "skills/killer",
    titulo: "visant-killer e visant-design / Visant",
    descricao: "A auditoria que reprova tela com cara de IA e a porta que leva a tela até o fim.",
  },
  {
    slug: "docs",
    titulo: "Docs / @visant/ui",
    descricao: "Instale uma peça, troque de marca em runtime, conecte o agente e consulte libs, hooks, temas e regras.",
  },
  {
    slug: "marca",
    titulo: "Marca / @visant/ui",
    descricao: "O brand book da marca escolhida: cor, tipografia, forma e movimento, pesquisáveis e prontos pra copiar.",
  },
  /* `/rig` virou apelido de `/kit/rig-vintage`. A página continua existindo
     porque o endereço circulou — e sem HTML próprio o link colado no chat
     perderia a prévia que já tinha. */
  {
    slug: "rig",
    noindex: true,
    titulo: "Rig vintage / @visant/ui",
    descricao: "A bancada de áudio: knobs, faders, VU, osciloscópio e paleta de comandos.",
  },
  /* `/lab` não está no cabeçalho, mas entra por endereço: sem HTML próprio ele
     dá 404 na Vercel, porque o rewrite pro index.html não cobre esta vitrine. */
  {
    slug: "lab",
    noindex: true,
    titulo: "Lab / @visant/ui",
    descricao: "Bancada de interações: uma nova por dia, e só fica a que presta.",
  },
  /* Mesmo motivo do `/lab`: sem HTML próprio, 404 na Vercel. */
  {
    slug: "burilar",
    noindex: true,
    titulo: "Burilação / @visant/ui",
    descricao: "Duelos de copy para os admins da Visant.",
  },
  /* `/callback` é a volta do OAuth do Visant Labs (`visant-auth.tsx`). Mesmo
     buraco do `/lab`: sem HTML próprio a Vercel responde 404 antes do app
     ler o `?code=`, e o login nunca fecha. */
  {
    slug: "callback",
    noindex: true,
    titulo: "Entrando / @visant/ui",
    descricao: "Conectando sua conta Visant Labs.",
  },
];

/*
 * As salas de kit, lidas de `src/app/kits.tsx`.
 *
 * Uma cópia da lista aqui envelheceria na primeira sala nova — e o sintoma
 * seria silencioso: a página existiria no app e não teria prévia ao ser colada
 * em lugar nenhum. Mesma técnica do portão de catálogo, que lê o `catalog.tsx`.
 */
const kitsSrc = readFileSync(join(ROOT, "src", "app", "kits.tsx"), "utf8");
const KITS = [
  ...kitsSrc
    .slice(kitsSrc.indexOf("export const KITS"))
    .matchAll(/slug:\s*"([^"]+)",[\s\S]*?title:\s*"([^"]+)",[\s\S]*?tese:\s*\n?\s*"((?:[^"\\]|\\.)*)"/g),
].map(([, slug, title, tese]) => ({
  slug: `kit/${slug}`,
  noindex: true,
  titulo: `${title} / @visant/ui`,
  descricao: tese.replace(/\\"/g, '"'),
}));

if (!KITS.length) {
  console.error("nenhum kit lido de src/app/kits.tsx — o formato do arquivo mudou?");
  process.exit(1);
}

/*
 * As fatias do catálogo, lidas de `src/app/catalog.tsx`.
 *
 * O `registry.json` não sabe de família — a taxonomia mora no catálogo, e é lá
 * que ela tem de continuar morando. Reescrever as seis famílias aqui à mão daria
 * uma segunda fonte de verdade que envelhece calada: família nova apareceria no
 * app e a rota `/catalogo/<familia>` não teria HTML, ou seja, nenhuma prévia e
 * nada indexado. Mesma técnica do `catalog-check.mjs` e da leitura dos kits
 * acima — regex sobre o fonte, e portão se não vier nada.
 *
 * `/catalogo/marca` é a FAMÍLIA marca. O estúdio de marca é `/marca`, em SECOES
 * — dois endereços, dois documentos, sem sobreposição.
 */

const FAMILIAS = familias.map(({ key, label }) => {
  const n = pecasPorFamilia.get(key) ?? 0;
  return {
    slug: `catalogo/${key}`,
    /* "catálogo" não é enfeite: a família `marca` e a seção `/marca` (o Brand Studio) têm o
       mesmo rótulo. O mesmo título sai no cliente (`RotaCatalogo`). */
    titulo: `${label} / catálogo @visant/ui`,
    descricao: `${n} ${n === 1 ? "peça" : "peças"} da categoria ${label}, com demo viva e comando de instalação.`,
  };
});

/* Família declarada e vazia é rota que abre em branco — o portão é aqui, não
   na tela de quem abriu o link. */
const vazias = familias.filter((f) => !pecasPorFamilia.get(f.key)).map((f) => f.key);
if (!familias.length || vazias.length) {
  console.error(
    !familias.length
      ? "nenhuma família lida de src/app/catalog.tsx — o formato do arquivo mudou?"
      : `família sem nenhuma peça: ${vazias.join(", ")}`,
  );
  process.exit(1);
}

/* A Vercel serve este arquivo, com status 404, em todo endereço sem página: o app sobe e mostra a tela dele. */
writeFileSync(
  join(DIST, "404.html"),
  comMeta({ titulo: "Página não encontrada / @visant/ui", descricao: HOME.descricao, url: `${SITE}/`, imagem: `${SITE}/og/home.png`, noindex: true }),
);

const comDobraFinal = (slug, meta) => comDobra(comMeta(meta), slug);

/* As páginas que têm versão em Markdown própria, gerada por scripts/llms.mjs. */
const COM_MARKDOWN = new Set(["docs", "skills", "skills/killer", "marca"]);

for (const s of [...SECOES, ...FAMILIAS, ...KITS]) {
  escrever(s.slug, comDobraFinal(s.slug, {
    titulo: s.titulo,
    descricao: s.descricao,
    url: `${SITE}/${s.slug}`,
    // /skills/filme e /skills/killer herdam a de /skills.
    imagem: `${SITE}/og/${existsSync(join(ROOT, "public/og", `${s.slug.split("/")[0]}.png`)) ? s.slug.split("/")[0] : "home"}.png`,
    noindex: s.noindex,
    markdown: COM_MARKDOWN.has(s.slug) ? `/${s.slug}.md` : undefined,
  }));
}

for (const item of registry.items) {
  escrever(
    `c/${item.name}`,
    comMeta({
      titulo: `${item.title ?? item.name} / @visant/ui`,
      descricao: item.description ?? HOME.descricao,
      url: `${SITE}/c/${item.name}`,
      imagem: `${SITE}/og/${item.name}.png`,
      noindex: arquivada(notas[item.name]),
      markdown: `/r/${item.name}.md`,
    }),
  );
}

console.log(
  `páginas: ${registry.items.length + SECOES.length + FAMILIAS.length + KITS.length + 1}`,
);

/*
 * O que o robô pode ler. Só entra rota que responde 200 e quer ser indexada: sem
 * `noindex`, sem família oculta, sem endereço que o vercel.json redireciona e sem
 * peça arquivada. A fundação fica fora do catálogo, mas é o que /docs lista.
 */
const redirecionados = new Set(
  JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8")).redirects.filter((r) => !r.has).map((r) => r.source.slice(1)),
);
const familiaOculta = new Set(familias.filter((f) => f.oculta).map((f) => f.key));
const rotas = [
  "",
  ...SECOES.filter((s) => !s.noindex).map((s) => s.slug),
  ...familias.filter((f) => !f.oculta).map((f) => `catalogo/${f.key}`),
  ...registry.items
    .filter((i) => !arquivada(notas[i.name]))
    .filter((i) => i.categories?.[0] === "fundacao" || !familiaOculta.has(i.categories?.[0]))
    .map((i) => `c/${i.name}`),
].filter((r) => !redirecionados.has(r));

const xml = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  ...rotas.map((r) => `  <url><loc>${SITE}/${r}</loc></url>`),
  `</urlset>`,
  ``,
];
writeFileSync(join(DIST, "sitemap.xml"), xml.join("\n"));
/* `llms.txt` não é campo do padrão de robots (RFC 9309): vai como comentário, e o Sitemap é o oficial. */
const robots = [
  `# Agentes: comece por ${SITE}/llms.txt ou conecte ${SITE}/mcp`,
  `User-agent: *`,
  `Allow: /`,
  `Disallow: /api/`,
  ``,
  `Sitemap: ${SITE}/sitemap.xml`,
  ``,
];
writeFileSync(join(DIST, "robots.txt"), robots.join("\n"));

if (!existsSync(join(DIST, "c"))) {
  console.error("dist/c não foi criado — o prerender rodou antes do build?");
  process.exit(1);
}
