/**
 * A inteligência do brand book, sem React: contraste, pares, busca e exportação.
 *
 * Tudo aqui deriva de `brands.json` e do tema compilado da marca. Nada de voz,
 * estratégia ou proporção de cor: o índice público não traz, então não existe.
 */

import type { BrandPaletteEntry, BrandSummary, BrandThemeItem } from "@/lib/brand-theme";
import { resolveCssColor, type RGB } from "@/lib/css-color";

// --- o livro: o que a marca diz de si ------------------------------------------

/** Vem de `brands.json`: página pública da guideline, ou ficção de `demo-brands.mjs`. */
export interface LivroDaMarca {
  fonte: "publica" | "ficticia";
  essencia?: string;
  descricao?: string;
  tom?: string[];
  voz?: string;
  faz?: string[];
  naoFaz?: string[];
  valoresTitulo?: string;
  valores?: { nome: string; texto: string }[];
  mensagem?: { produto?: string; diferencial?: string; vinculo?: string };
  /** `fundo` só em arquivo opaco: a cor do canto dele, medida no sync. */
  logos?: { url: string; variant: string | null; tinta: "clara" | "escura" | "opaco" | null; fundo?: string }[];
}

/** O tipo do registry não conhece o livro; o dado publicado, sim. */
export function livroDa(marca: BrandSummary | null): LivroDaMarca | null {
  return (marca as (BrandSummary & { livro?: LivroDaMarca | null }) | null)?.livro ?? null;
}

const tomDe = (hex: string) => razao(hex, "#000000") ?? 0;

/**
 * O fundo da paleta em que o logo aparece: tinta clara pede a cor mais escura,
 * tinta escura pede a mais clara. Arquivo opaco já traz o próprio fundo (`null`).
 */
export function fundoDoLogo(tinta: "clara" | "escura" | "opaco" | null, paleta: BrandPaletteEntry[]) {
  if (tinta === "opaco" || !paleta.length) return null;
  if (!tinta) return paleta.find((c) => c.role === "background") ?? paleta[0];
  const ordem = [...paleta].sort((a, b) => tomDe(a.hex) - tomDe(b.hex));
  return tinta === "clara" ? ordem[0] : ordem[ordem.length - 1];
}

const VARIANTES: Record<string, string> = { primary: "Principal", main: "Principal", secondary: "Secundária", icon: "Ícone" };

/** O rótulo de um item do mapa `mensagem`, na ordem em que aparece. */
export const ROTULOS_DA_MENSAGEM = [
  ["produto", "Produto"],
  ["diferencial", "Diferencial"],
  ["vinculo", "Vínculo"],
] as const;

// --- contraste ----------------------------------------------------------------

function luminancia(c: RGB) {
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão WCAG entre duas cores CSS. `null` se alguma não resolver. */
export function razao(a: string, b: string): number | null {
  if (!a || !b) return null;
  try {
    const [claro, escuro] = [luminancia(resolveCssColor(a)), luminancia(resolveCssColor(b))].sort((x, y) => y - x);
    return (claro + 0.05) / (escuro + 0.05);
  } catch {
    return null;
  }
}

export type Grau = "AAA" | "AA" | "Só título" | "Evitar";

/** AAA 7:1 e AA 4,5:1 em texto corrido; 3:1 só vale para texto grande (WCAG 1.4.3). */
export function grau(r: number): Grau {
  if (r >= 7) return "AAA";
  if (r >= 4.5) return "AA";
  if (r >= 3) return "Só título";
  return "Evitar";
}

/** Corta em vez de arredondar: 4,48 nunca aparece como um "4,5" que reprova. */
export function formatarRazao(r: number) {
  const cortado = Math.floor(r * 10) / 10;
  return `${cortado.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}:1`;
}

// --- paleta -------------------------------------------------------------------

const PAPEIS: Record<string, string> = {
  background: "Fundo",
  foreground: "Texto",
  text: "Texto",
  primary: "Primária",
  secondary: "Secundária",
  accent: "Destaque",
  muted: "Apagada",
};

export const papelDa = (c: BrandPaletteEntry) => (c.role ? (PAPEIS[c.role] ?? c.role) : null);
export const nomeDa = (c: BrandPaletteEntry) => c.name ?? papelDa(c) ?? c.hex;

export interface TextoNoFundo {
  cor: BrandPaletteEntry;
  razao: number;
  grau: Grau;
}

export interface FundoDaPaleta {
  fundo: BrandPaletteEntry;
  /** Cor das legendas da faixa: a paleta se der AA; senão, preto ou branco. */
  legenda: string;
  /** Do melhor para o pior. */
  textos: TextoNoFundo[];
}

export function paresDaPaleta(paleta: BrandPaletteEntry[]): FundoDaPaleta[] {
  return paleta.map((fundo) => {
    const textos = paleta
      .filter((c) => c.hex !== fundo.hex)
      .map((cor) => {
        const r = razao(cor.hex, fundo.hex) ?? 1;
        return { cor, razao: r, grau: grau(r) };
      })
      .sort((a, b) => b.razao - a.razao);
    const melhor = textos[0];
    const legenda =
      melhor && melhor.razao >= 4.5
        ? melhor.cor.hex
        : (razao("#000000", fundo.hex) ?? 0) > (razao("#ffffff", fundo.hex) ?? 0)
          ? "#000000"
          : "#ffffff";
    return { fundo, legenda, textos };
  });
}

// --- tema: os tokens, cada um com o par em que é lido ---------------------------

export type Modo = "light" | "dark";

export interface TokenDeCor {
  nome: string;
  /** Sobre qual token ele é lido. Superfície e divisória não carregam texto. */
  sobre?: string;
  /** A razão não vira elogio: `brand` é fundo e borda, mesmo quando passa. */
  naoEhTexto?: boolean;
  busca: string;
}

export const TOKENS_DE_COR: TokenDeCor[] = [
  { nome: "background", busca: "fundo pagina superficie" },
  { nome: "foreground", sobre: "background", busca: "texto principal" },
  { nome: "card", busca: "cartao superficie" },
  { nome: "muted", busca: "apagado superficie" },
  { nome: "muted-foreground", sobre: "background", busca: "texto apagado secundario legenda" },
  { nome: "border", busca: "borda divisoria linha" },
  { nome: "brand", sobre: "background", naoEhTexto: true, busca: "marca destaque primaria acao botao" },
  { nome: "brand-foreground", sobre: "brand", busca: "texto sobre a marca botao" },
  { nome: "accent-ink", sobre: "background", busca: "destaque texto link tinta" },
];

const TOKENS_VIVOS: { nome: string; capitulo: string; busca: string }[] = [
  { nome: "r-control", capitulo: "Forma", busca: "raio canto controle botao" },
  { nome: "r-surface", capitulo: "Forma", busca: "raio canto superficie cartao" },
  { nome: "r-pill", capitulo: "Forma", busca: "raio canto pilula" },
  { nome: "e-flat", capitulo: "Forma", busca: "elevacao sombra" },
  { nome: "e-raised", capitulo: "Forma", busca: "elevacao sombra" },
  { nome: "e-overlay", capitulo: "Forma", busca: "elevacao sombra" },
  { nome: "e-modal", capitulo: "Forma", busca: "elevacao sombra" },
  { nome: "control-h", capitulo: "Forma", busca: "espaco altura controle botao" },
  { nome: "pad-card", capitulo: "Forma", busca: "espaco respiro cartao" },
  { nome: "gap-zone", capitulo: "Forma", busca: "espaco intervalo" },
  { nome: "ease-out", capitulo: "Movimento", busca: "curva easing" },
  { nome: "ease-in-out", capitulo: "Movimento", busca: "curva easing" },
  { nome: "ease-drawer", capitulo: "Movimento", busca: "curva easing" },
  { nome: "dur-press", capitulo: "Movimento", busca: "duracao tempo" },
  { nome: "dur-fast", capitulo: "Movimento", busca: "duracao tempo" },
  { nome: "dur-base", capitulo: "Movimento", busca: "duracao tempo" },
  { nome: "dur-slow", capitulo: "Movimento", busca: "duracao tempo" },
  { nome: "font-display", capitulo: "Tipografia", busca: "fonte face titulo" },
  { nome: "font-sans", capitulo: "Tipografia", busca: "fonte face texto leitura" },
];

export const NOMES_VIVOS = [...TOKENS_DE_COR.map((t) => t.nome), ...TOKENS_VIVOS.map((t) => t.nome)];

/** O alvo de busca de uma cor da paleta: o `data-token` da faixa dela. */
export const alvoDaPaleta = (c: BrandPaletteEntry) => `paleta:${c.hex.toLowerCase()}`;

// --- busca --------------------------------------------------------------------

export interface Resultado {
  alvo: string;
  nome: string;
  detalhe: string;
  valor: string;
  /** Presente quando o resultado é uma cor: pinta a amostra da lista. */
  cor?: string;
  /** Presente quando o resultado é um logo: a lista mostra a miniatura. */
  miniatura?: { url: string; fundo?: string };
  /** Frase da marca, lida em texto corrido; token e valor ficam em mono. */
  prosa?: boolean;
  texto: string;
}

export function indiceDaBusca(
  marca: BrandSummary | null,
  vivos: Record<string, string>,
  dobrar: (s: string) => string,
): Resultado[] {
  const paleta: Resultado[] = (marca?.palette ?? []).map((c) => ({
    alvo: alvoDaPaleta(c),
    nome: nomeDa(c),
    detalhe: papelDa(c) ?? "Paleta",
    valor: c.hex,
    cor: c.hex,
    texto: dobrar(`${c.name ?? ""} ${papelDa(c) ?? ""} ${c.role ?? ""} ${c.hex} paleta cor`),
  }));
  const cores: Resultado[] = TOKENS_DE_COR.map((t) => ({
    alvo: `--${t.nome}`,
    nome: `--${t.nome}`,
    detalhe: "Tema",
    valor: vivos[t.nome] ?? "",
    cor: vivos[t.nome] || undefined,
    texto: dobrar(`--${t.nome} ${vivos[t.nome] ?? ""} ${t.busca} cor tema token`),
  }));
  const resto: Resultado[] = TOKENS_VIVOS.map((t) => ({
    alvo: `--${t.nome}`,
    nome: `--${t.nome}`,
    detalhe: t.capitulo,
    valor: vivos[t.nome] ?? "",
    texto: dobrar(`--${t.nome} ${vivos[t.nome] ?? ""} ${t.busca} ${t.capitulo} token`),
  }));
  const livro = livroDa(marca);
  const doLivro = (alvo: string, nome: string, valor: string | undefined, chaves: string): Resultado[] =>
    valor
      ? [{ alvo, nome, detalhe: "Essência", valor, prosa: true, texto: dobrar(`${nome} ${valor} ${chaves} essencia`) }]
      : [];
  const ditos: Resultado[] = !livro
    ? []
    : [
        ...doLivro("livro:essencia", "Essência", livro.essencia, "manifesto"),
        ...doLivro("livro:descricao", "Descrição", livro.descricao, "o que e sobre"),
        ...doLivro("livro:tom", "Tom", livro.tom?.join(", "), "tom de voz personalidade"),
        ...doLivro("livro:voz", "Voz", livro.voz, "tom como fala"),
        ...(livro.valores ?? []).flatMap((v, i) =>
          doLivro(`livro:valor-${i}`, v.nome, v.texto, `${livro.valoresTitulo ?? "valores"} valor pilar`),
        ),
        ...(livro.faz ?? []).flatMap((t, i) => doLivro(`livro:faz-${i}`, "Faz", t, "voz fazer usar")),
        ...(livro.naoFaz ?? []).flatMap((t, i) => doLivro(`livro:nao-faz-${i}`, "Não faz", t, "voz evitar nao usar")),
        ...ROTULOS_DA_MENSAGEM.flatMap(([k, rotulo]) =>
          doLivro(`livro:mensagem-${k}`, rotulo, livro.mensagem?.[k], "mensagem central"),
        ),
        // A URL do bucket não entra no texto nem na busca: logo se acha por nome e fundo.
        ...(livro.logos ?? []).map((l, i): Resultado => {
          const fundo = fundoDoLogo(l.tinta, marca?.palette ?? []);
          const variante = VARIANTES[l.variant ?? ""] ?? l.variant ?? "Versão";
          const onde = fundo ? `sobre ${nomeDa(fundo)}` : "fundo próprio";
          return {
            alvo: `livro:logo-${i}`,
            nome: `Logo ${i + 1}`,
            detalhe: variante,
            valor: onde,
            prosa: true,
            miniatura: { url: l.url, fundo: fundo?.hex ?? l.fundo },
            texto: dobrar(`logo ${i + 1} ${variante} ${onde} logotipo simbolo arquivo png essencia`),
          };
        }),
      ];
  return [...paleta, ...cores, ...resto, ...ditos];
}

/** Quem começa com o termo vem antes de quem só contém. */
export function buscar(indice: Resultado[], termo: string, dobrar: (s: string) => string, limite = 8) {
  if (!termo) return [];
  const partes = termo.split(/\s+/);
  const limpo = termo.replace(/^--/, "");
  const peso = (r: Resultado) => {
    const nome = dobrar(r.nome).replace(/^--/, "");
    const valor = dobrar(r.valor);
    if (nome === limpo || valor === termo) return 0;
    if (nome.startsWith(limpo) || valor.startsWith(termo)) return 1;
    if (dobrar(r.detalhe).startsWith(termo)) return 2;
    return 3;
  };
  return indice
    .filter((r) => partes.every((p) => r.texto.includes(p)))
    .map((r, i) => ({ r, i, p: peso(r) }))
    .sort((a, b) => a.p - b.p || a.i - b.i)
    .slice(0, limite)
    .map((x) => x.r);
}

// --- exportação ---------------------------------------------------------------

const bloco = (seletor: string, vars: Record<string, string> = {}) => {
  const linhas = Object.entries(vars).map(([k, v]) => `  --${k}: ${v};`);
  return `${seletor} {\n${linhas.join("\n")}\n}`;
};

export function exportarCss(item: BrandThemeItem) {
  const { theme, light, dark } = item.cssVars;
  return `${bloco(":root", { ...theme, ...light })}\n\n${bloco(".dark", dark)}\n`;
}

export function exportarJson(marca: BrandSummary, item: BrandThemeItem) {
  const { theme, light, dark } = item.cssVars;
  const dados = { name: marca.name, slug: marca.slug, fonts: marca.fonts, palette: marca.palette, theme, light, dark };
  return `${JSON.stringify(dados, null, 2)}\n`;
}

/** Tailwind v4: as variáveis e o `@theme inline` que as vira em classe. */
export function exportarTailwind(item: BrandThemeItem) {
  const { theme = {}, light = {} } = item.cssVars;
  const linhas = [
    ...Object.keys(light)
      .filter((k) => k !== "shadow")
      .map((k) => `  --color-${k}: var(--${k});`),
    ...Object.keys(theme).flatMap((k) => {
      if (k.startsWith("font-")) return [`  --${k}: var(--${k});`];
      if (k.startsWith("r-")) return [`  --radius-${k.slice(2)}: var(--${k});`];
      if (k.startsWith("e-")) return [`  --shadow-${k.slice(2)}: var(--${k});`];
      if (k.startsWith("ease-")) return [`  --${k}: var(--${k});`];
      return [];
    }),
  ];
  return `@theme inline {\n${linhas.join("\n")}\n}\n\n${exportarCss(item)}`;
}

/** O par de cor como CSS, do jeito que vai para a área de transferência. */
export const cssDoPar = (fundo: string, cor: string) => `background: ${fundo};\ncolor: ${cor};`;
