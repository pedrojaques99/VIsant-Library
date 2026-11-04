/**
 * O catálogo @visant/ui como servidor MCP remoto: ui.visantlabs.com/mcp
 *
 * O MCP oficial do shadcn (`npx shadcn mcp`) já busca e instala de qualquer
 * registry, mas pede terminal e `components.json`. Apps web (Claude.ai,
 * ChatGPT e afins) só aceitam conector por URL. Este servidor é esse conector,
 * e acrescenta o que o shadcn não tem: RECOMENDAR peças e kits pra um projeto,
 * lendo o "quando usar / evite" de cada peça (scripts/registry-meta.mjs).
 * Instalar continua sendo do shadcn: aqui só sai o comando.
 *
 * Skills e marcas públicas vêm junto: `listar_skills`, `recomendar_skill` e
 * `tema_da_marca`. Resposta curta por padrão, com paginação e `detalhe`, porque
 * cada linha devolvida aqui é contexto gasto no agente de quem chamou.
 *
 * Sem estado, sem banco, sem chave: lê o `registry.json` do próprio deploy.
 * `mcp-handler` (Vercel) cuida do transporte; isto é só o catálogo.
 */

import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

import registry from "../registry.json" with { type: "json" };
import kitsPecas from "../src/app/kits.generated.json" with { type: "json" };
import notas from "../curadoria/notas.json" with { type: "json" };
import skills from "../src/app/skills/skills.generated.json" with { type: "json" };
import marcas from "../public/r/brands.json" with { type: "json" };
import demos from "../public/r/demo-brands.json" with { type: "json" };

const SITE = "https://ui.visantlabs.com";

type Item = {
  name: string;
  title?: string;
  type: string;
  description?: string;
  categories?: string[];
  meta?: { uso?: { quando?: string; evite?: string } };
};

const KITS: { slug: string; titulo: string; para: string }[] = [
  { slug: "mesa-de-trabalho", titulo: "Mesa de trabalho", para: "app de gestão, dashboard, board de tarefas, SaaS, admin" },
  { slug: "pagina-que-vende", titulo: "Página que vende", para: "landing page, site institucional, estúdio, agência, produto, marketing" },
  { slug: "motion-e-estado", titulo: "Motion e estado", para: "fila, espera, carregamento, geração por IA, exportação, upload" },
  { slug: "rig-vintage", titulo: "Rig vintage", para: "áudio, música, sintetizador, painel analógico, skeuomorfismo" },
  { slug: "brand-system", titulo: "Brand system", para: "guideline de marca, design tokens, portal de marca, tema" },
];

/* Arquivadas pela curadoria (nota ≤ 2 ou marcadas pra sair) não são recomendadas. */
const arquivada = (n: string) => {
  const v = (notas as Record<string, { nota?: number; excluir?: boolean }>)[n];
  return Boolean(v && (v.excluir || (v.nota ?? 5) <= 2));
};

const ITENS = (registry.items as Item[]).filter((i) => !arquivada(i.name));

/* Só a casa e as fictícias declaradas, a mesma régua de scripts/privacy-check.mjs. */
const PUBLICAS = new Set(["visant", ...demos.map((d) => d.slug)]);
const MARCAS = marcas.brands.filter((m) => PUBLICAS.has(m.slug));

const fold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const tokens = (s: string) => fold(s).split(/[^a-z0-9]+/).filter((t) => t.length > 2);
/* Radical curto: "botões" e "botao", "confirmação" e "confirmar" se encontram. */
const raiz = (t: string) => t.slice(0, 5);

/* Assunto do projeto → categorias que costumam servir. */
const ASSUNTOS: [RegExp, string[]][] = [
  [/landing|site|institucional|marketing|venda|estudio|agencia|portfolio|evento|lancamento/, ["conteudo", "texto", "efeitos"]],
  [/dashboard|admin|painel|saas|crm|gestao|tarefa|board|interno|backoffice/, ["conteudo", "controles", "feedback"]],
  [/loja|ecommerce|e-commerce|produto|catalogo|checkout|carrinho/, ["conteudo", "controles"]],
  [/fintech|banco|pagamento|carteira|financeiro|cobranca/, ["conteudo", "controles"]],
  [/formulario|cadastro|onboarding|configuracao|perfil|conta/, ["controles", "feedback"]],
  [/chat|mensagem|social|comunidade|comentario/, ["conteudo", "feedback", "controles"]],
  [/\bia\b|gerador|geracao|upload|export|fila|carregando/, ["feedback", "efeitos"]],
  [/3d|webgl|imersivo|interativo|experiencia/, ["conteudo", "shaders", "efeitos"]],
  [/audio|musica|som|sintetizador|podcast|radio/, ["controles"]],
  [/marca|branding|guideline|tokens|tema/, ["fundacao", "texto"]],
  [/aula|curso|didatico|explicacao|tutorial/, ["anatomia"]],
];

function pontuar(item: Item, termos: string[], bonusCategorias: string[] = []) {
  const campos: [string, number][] = [
    [item.name.replace(/-/g, " "), 3],
    [(item.categories ?? []).join(" "), 2],
    [item.meta?.uso?.quando ?? "", 2],
    [item.title ?? "", 2],
    [item.description ?? "", 1],
  ];
  let p = 0;
  for (const [texto, peso] of campos) {
    const ts = tokens(texto).map(raiz);
    for (const t of termos) if (ts.includes(raiz(t))) p += peso;
  }
  const fam = item.categories?.[0];
  if (fam && bonusCategorias.includes(fam)) p += 1.5;
  // Hook, lib e tema só sobem se a pessoa pediu por eles.
  if (["registry:lib", "registry:hook", "registry:theme", "registry:base", "registry:item"].includes(item.type)) p *= 0.6;
  return p;
}

const linha = (i: Item) => {
  const u = i.meta?.uso;
  return [
    `- ${i.name} (${i.categories?.[0] ?? i.type}): ${i.description ?? ""}`,
    u?.quando ? `  Use quando: ${u.quando}` : null,
    u?.evite ? `  Evite quando: ${u.evite}` : null,
  ]
    .filter(Boolean)
    .join("\n");
};

const texto = (t: string) => ({ content: [{ type: "text" as const, text: t }] });

const primeiraFrase = (t = "") => t.split(/(?<=[.!?])\s/)[0];

/* Curto por padrão: o nome e o motivo bastam pra escolher; o resto é `detalhe: true`. */
const linhaCurta = (i: Item) =>
  `- ${i.name} (${i.categories?.[0] ?? i.type}): ${i.meta?.uso?.quando ?? primeiraFrase(i.description)}`;

const PAGINA = z.number().int("pagina precisa ser inteiro").min(1, "pagina começa em 1").optional().describe("Página, a partir de 1.");
const DETALHE = z.boolean().optional().describe("true devolve a versão completa. Por padrão a resposta é curta, pra economizar contexto.");

/** Fatia a lista e diz, numa linha, se ainda há mais. */
function paginar<T>(lista: T[], pagina = 1, limite = 10) {
  const ini = (pagina - 1) * limite;
  const fatia = lista.slice(ini, ini + limite);
  const fim = ini + fatia.length;
  const rodape = fim < lista.length ? `Mostrando ${ini + 1} a ${fim} de ${lista.length}. Próxima: pagina=${pagina + 1}.` : null;
  return { fatia, rodape };
}

const juntar = (...partes: (string | null | undefined)[]) => partes.filter(Boolean).join("\n\n");

type Skill = (typeof skills)[number];

const fichaSkill = (s: Skill, detalhe?: boolean) =>
  detalhe
    ? [`- ${s.nome}: ${s.descricao}`, `  Instalar: ${s.instalar}`, `  Scripts: ${s.scripts.join(", ") || "nenhum"}`, `  Referências: ${s.referencias.join(", ") || "nenhuma"}`].join("\n")
    : `- ${s.nome}: ${primeiraFrase(s.descricao)}\n  ${s.instalar}`;

/* Palavra de ligação não escolhe skill. Duas letras contam: "ui", "ux" e "ia" são o assunto inteiro. */
const VAZIAS = new Set("uma uns umas com que para pra por de da do das dos em no na nos nas os as um ao the and for with this that use on to of in my me eu meu minha quero preciso tem esta essa esse isso mais".split(" "));

function pontuarSkill(s: Skill, pedido: string) {
  const dobrado = fold(pedido);
  const termos = dobrado.split(/[^a-z0-9]+/).filter((t) => t.length > 1 && !VAZIAS.has(t)).map(raiz);
  const gatilhos = [...s.descricao.matchAll(/"([^"]+)"/g)].map((m) => fold(m[1]));
  const palavras = (t: string) => t.split(/[^a-z0-9]+/).filter(Boolean).map(raiz);
  const doNome = palavras(fold(s.nome));
  const dosGatilhos = gatilhos.flatMap(palavras);
  const doResto = palavras(fold(s.descricao));
  let p = gatilhos.filter((g) => dobrado.includes(g)).length * 6;
  for (const t of termos) {
    if (doNome.includes(t)) p += 4;
    if (dosGatilhos.includes(t)) p += 2;
    else if (doResto.includes(t)) p += 1;
  }
  return p;
}

type Marca = (typeof MARCAS)[number];

const resumoMarca = (m: Marca) =>
  [
    `${m.name} (${m.slug})${"ficticia" in m && m.ficticia ? ", fictícia" : ""}`,
    `  Paleta: ${m.palette.map((c) => `${c.role ?? c.name} ${c.hex}`).join(", ")}`,
    `  Fontes: ${Object.entries(m.fonts).map(([k, v]) => `${k} ${v}`).join(", ")}`,
    `  Instalar: npx shadcn@latest add @visant/theme-${m.slug}`,
  ].join("\n");

/* As famílias reais do registry: família errada vira erro legível, não uma busca vazia. */
const FAMILIAS = [...new Set((registry.items as Item[]).map((i) => i.categories?.[0]).filter(Boolean) as string[])] as [string, ...string[]];

/* Nada aqui escreve, e tudo responde só com o que está no deploy. */
const LEITURA = { readOnlyHint: true, openWorldHint: false };

const COMO_INSTALAR = [
  "Instalar (no projeto do usuário):",
  "  npx shadcn@latest add @visant/<nome> [@visant/<outro> ...]",
  "Se o projeto ainda não conhece o @visant, no components.json:",
  `  "registries": { "@visant": "${SITE}/r/{name}.json" }`,
  `Sem config: npx shadcn@latest add ${SITE}/r/<nome>.json`,
].join("\n");

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "recomendar_para_projeto",
      {
        title: "Recomendar componentes pra um projeto",
        description:
          "Use antes de escrever interface do zero. Recebe a descrição do projeto (e, se tiver, as dependências do package.json) e devolve um kit montado e as peças @visant que fazem sentido, com quando usar e quando evitar cada uma.",
        inputSchema: z.object({
          descricao: z.string().min(3).describe("O que o projeto é e o que a tela precisa fazer."),
          dependencias: z.array(z.string()).optional().describe("Pacotes do package.json, ex. ['next','three']."),
          limite: z.number().int().min(3).max(20).optional(),
          pagina: PAGINA,
        }),
        annotations: LEITURA,
      },
      async ({ descricao, dependencias, limite, pagina }) => {
        const d = fold(descricao);
        const categorias = [...new Set(ASSUNTOS.filter(([re]) => re.test(d)).flatMap(([, c]) => c))];
        const deps = (dependencias ?? []).join(" ");
        if (/three|@react-three/.test(deps)) categorias.push("conteudo", "shaders");
        const termos = tokens(descricao);
        const ranking = ITENS.map((i) => ({ i, p: pontuar(i, termos, categorias) }))
          .filter((r) => r.p > 0)
          .sort((a, b) => b.p - a.p);
        const { fatia, rodape } = paginar(ranking, pagina, limite ?? 10);
        const kits = KITS.filter((k) => tokens(k.para).some((t) => termos.map(raiz).includes(raiz(t))));
        const partes = [
          kits.length
            ? `Kit montado que cabe (uma tela inteira de exemplo, peças listadas):\n${kits
                .map((k) => `- ${k.titulo}: ${SITE}/kit/${k.slug} · peças: ${(kitsPecas as Record<string, string[]>)[k.slug]?.filter((n) => !arquivada(n)).join(", ")}`)
                .join("\n")}`
            : null,
          fatia.length
            ? `Peças recomendadas (da mais pra menos aderente):\n${fatia.map((r) => linha(r.i)).join("\n")}`
            : "Nenhuma peça bateu com a descrição. Tente buscar_componentes com palavras do que a tela faz (ex.: confirmar, slider, galeria, gráfico).",
          rodape,
          `Ficha completa de cada peça: ${SITE}/r/<nome>.md`,
          COMO_INSTALAR,
        ];
        return texto(partes.filter(Boolean).join("\n\n"));
      },
    );

    server.registerTool(
      "buscar_componentes",
      {
        title: "Buscar componentes",
        description:
          "Use quando já sabe o que a tela faz e quer achar a peça: busca por intenção ou assunto (ex.: 'confirmar ação destrutiva', 'gráfico de série temporal', 'hero com 3D'). Devolve nome, família e quando usar, da mais pra menos aderente.",
        inputSchema: z.object({
          consulta: z.string().min(2),
          categoria: z.enum(FAMILIAS).optional().describe("Família da peça."),
          limite: z.number().int().min(1).max(30).optional(),
          pagina: PAGINA,
          detalhe: DETALHE,
        }),
        annotations: LEITURA,
      },
      async ({ consulta, categoria, limite, pagina, detalhe }) => {
        const termos = tokens(consulta);
        const lista = ITENS.filter((i) => !categoria || i.categories?.[0] === categoria)
          .map((i) => ({ i, p: pontuar(i, termos) }))
          .filter((r) => r.p > 0 || (categoria && !termos.length))
          .sort((a, b) => b.p - a.p);
        const { fatia, rodape } = paginar(lista, pagina, limite ?? 10);
        return texto(
          fatia.length
            ? juntar(fatia.map((r) => (detalhe ? linha(r.i) : linhaCurta(r.i))).join("\n"), rodape)
            : "Nada encontrado. Tente outras palavras ou recomendar_para_projeto.",
        );
      },
    );

    server.registerTool(
      "ler_componente",
      {
        title: "Ler a ficha de um componente",
        description: "Use depois de escolher a peça e antes de escrever o código: a ficha completa, com o que é, quando usar e evitar, como instalar, exemplo de uso e API (props).",
        inputSchema: z.object({ nome: z.string().min(2).describe("Nome no registry, ex. slide-to-confirm") }),
        annotations: LEITURA,
      },
      async ({ nome }) => {
        const n = fold(nome).replace(/^@visant\//, "").trim();
        const item = ITENS.find((i) => i.name === n);
        if (!item) return texto(`Não existe @visant/${n}. Use buscar_componentes.`);
        try {
          const r = await fetch(`${SITE}/r/${n}.md`);
          if (r.ok) return texto(await r.text());
        } catch {
          /* sem rede: devolve o que o registry sabe */
        }
        return texto(`${linha(item)}\n\n${COMO_INSTALAR.replace(/<nome>/g, n)}`);
      },
    );

    server.registerTool(
      "comando_de_instalar",
      {
        title: "Comando de instalar",
        description: "Use quando as peças já estão escolhidas: monta o comando shadcn pra instalar uma ou mais, e a config do components.json se o projeto ainda não tiver o namespace.",
        inputSchema: z.object({ nomes: z.array(z.string()).min(1) }),
        annotations: LEITURA,
      },
      async ({ nomes }) => {
        const validos = nomes.map((n) => fold(n).replace(/^@visant\//, "").trim()).filter((n) => ITENS.some((i) => i.name === n));
        const faltam = nomes.length - validos.length;
        return texto(
          [
            `npx shadcn@latest add ${validos.map((n) => `@visant/${n}`).join(" ")}`,
            `Se o projeto não conhece o @visant, no components.json: "registries": { "@visant": "${SITE}/r/{name}.json" }`,
            "Pra o agente escolher sozinho nas próximas vezes: npx shadcn@latest add @visant/agent-rules",
            faltam ? `(${faltam} nome(s) não existem no registry e ficaram de fora)` : null,
          ]
            .filter(Boolean)
            .join("\n"),
        );
      },
    );

    server.registerTool(
      "listar_skills",
      {
        title: "Listar skills",
        description: "Use quando o usuário perguntar quais skills de agente a Visant oferece. Lista as skills públicas com o comando de instalar.",
        inputSchema: z.object({
          limite: z.number().int().min(1).max(50).optional(),
          pagina: PAGINA,
          detalhe: DETALHE,
        }),
        annotations: LEITURA,
      },
      async ({ limite, pagina, detalhe }) => {
        const { fatia, rodape } = paginar(skills, pagina, limite ?? 12);
        return texto(fatia.length ? juntar(fatia.map((s) => fichaSkill(s, detalhe)).join("\n"), rodape) : `Não há página ${pagina}. São ${skills.length} skills.`);
      },
    );

    server.registerTool(
      "recomendar_skill",
      {
        title: "Recomendar skill",
        description:
          "Use quando o usuário pedir ajuda com interface, copy, motion, vídeo ou preparação de projeto e você quiser saber se uma skill resolve. Recebe o pedido em texto e devolve as skills mais aderentes, com o comando de instalar.",
        inputSchema: z.object({
          pedido: z.string().min(2, "Descreva o pedido em pelo menos 2 letras.").describe("O que o usuário pediu, nas palavras dele. Ex.: 'tirar a cara de IA da tela'."),
          limite: z.number().int().min(1).max(12).optional(),
          pagina: PAGINA,
          detalhe: DETALHE,
        }),
        annotations: LEITURA,
      },
      async ({ pedido, limite, pagina, detalhe }) => {
        const pontos = skills.map((s) => ({ s, p: pontuarSkill(s, pedido) })).sort((a, b) => b.p - a.p);
        /* Acerto de raspão na descrição não vira recomendação: só o que chega perto da melhor nota. */
        const corte = Math.max(1, pontos[0].p / 2);
        const ranking = pontos.filter((r) => r.p >= corte).map((r) => r.s);
        if (!ranking.length) return texto("Nenhuma skill bateu com o pedido. Veja todas com listar_skills.");
        const { fatia, rodape } = paginar(ranking, pagina, limite ?? 3);
        return texto(juntar(fatia.map((s) => fichaSkill(s, detalhe)).join("\n"), rodape));
      },
    );

    server.registerTool(
      "tema_da_marca",
      {
        title: "Tema de marca",
        description:
          "Use quando for aplicar uma marca pública às peças. Sem `marca`, lista as marcas públicas; com `marca`, devolve paleta, fontes e o comando do tema. Marcas de cliente não estão aqui: nesse caso, use os tokens do próprio projeto.",
        inputSchema: z.object({
          marca: z.string().min(2, "Informe o slug ou o nome da marca.").optional().describe("Slug ou nome. Sem isto, lista as públicas."),
          limite: z.number().int().min(1).max(20).optional(),
          pagina: PAGINA,
          detalhe: z.boolean().optional().describe("true inclui as variáveis CSS do tema, claro e escuro."),
        }),
        annotations: LEITURA,
      },
      async ({ marca, limite, pagina, detalhe }) => {
        if (!marca) {
          const { fatia, rodape } = paginar(MARCAS, pagina, limite ?? 10);
          return texto(juntar(fatia.map(resumoMarca).join("\n"), rodape));
        }
        const chave = (t: string) => fold(t).replace(/[^a-z0-9 -]/g, "").trim();
        const m = MARCAS.find((b) => b.slug === chave(marca) || chave(b.name) === chave(marca));
        if (!m) return texto(`"${marca}" não é uma marca pública. Públicas: ${MARCAS.map((b) => b.slug).join(", ")}.`);
        return texto(juntar(resumoMarca(m), `Tema: ${SITE}${m.themeUrl}`, detalhe ? `Variáveis CSS:\n${JSON.stringify(m.preview)}` : null));
      },
    );
  },
  {
    serverInfo: { name: "com.visantlabs/ui", title: "@visant/ui", version: "1.1.0" },
    instructions:
      `Catálogo @visant/ui (Visant Labs): ${ITENS.length} peças React e Tailwind distribuídas como registry shadcn, que leem os tokens de marca do projeto. Antes de escrever interface do zero, chame recomendar_para_projeto ou buscar_componentes, leia a ficha com ler_componente e instale com o comando de comando_de_instalar. Skills de agente: recomendar_skill. Tema de marca pública: tema_da_marca.`,
  },
);

export { handler as GET, handler as POST, handler as DELETE };
