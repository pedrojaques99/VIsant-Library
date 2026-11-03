/**
 * O réu: o card de pricing do README da visant-skills-public, como dado.
 *
 * Uma fonte só para duas saídas: `fonte()` escreve o TSX que o killer-scan lê de
 * verdade (`captura.mjs`) e o `CartaoReu` desenha a mesma árvore na tela. O que o
 * visitante vê é o que foi escaneado; não existe uma segunda versão pra divergir.
 *
 * As classes moram em .ts porque o Tailwind daqui só varre js, ts, jsx e tsx. O
 * slop é de propósito, e a exceção escrita de cada detector está na linha.
 */

export type Conserto = "palette" | "emdash" | "hype" | "italic" | "serif" | "ladder";
export type Juizo = "numero" | "caixa" | "hierarquia" | "acao";

/** A ordem é o bit de cada conserto na chave do `scan.generated.json`. */
export const CONSERTOS: Conserto[] = ["palette", "emdash", "hype", "italic", "serif", "ladder"];
export const JUIZOS: Juizo[] = ["numero", "caixa", "hierarquia", "acao"];

export type No = { id: string; tag: string; cls?: string; filhos: (string | No)[] };

function frase(c: ReadonlySet<Conserto>): string {
  if (c.has("hype")) {
    return c.has("emdash") ? "Review every screen before it ships." : "Review every screen — before it ships.";
  }
  return c.has("emdash")
    ? "Unlock your full potential: a revolutionary way to ship."
    : "Unlock your full potential — a revolutionary way to ship.";
}

export function cartao(c: ReadonlySet<Conserto>, j: ReadonlySet<Juizo> = new Set()): No {
  const ladder = c.has("ladder");
  const apagado = "text-muted-foreground";
  const preco: No = {
    id: "preco",
    tag: "span",
    cls: j.has("hierarquia") ? "text-5xl font-semibold tabular-nums" : ladder ? "text-foreground" : "text-white/90",
    filhos: ["$49"],
  };
  const periodo: No = { id: "periodo", tag: "span", cls: ladder ? apagado : "text-white/40", filhos: ["per month"] };

  const titulo: No = j.has("acao")
    ? { id: "titulo", tag: "h1", cls: "text-xl font-semibold", filhos: ["Pro"] }
    : {
        id: "titulo",
        tag: "h1",
        // EXCEPTION to noise-scan/display-serif-tight: o réu da demonstração reprova de propósito neste ponto
        cls: c.has("serif") ? "text-5xl font-semibold tracking-tight" : "text-5xl font-serif tracking-tighter",
        filhos: c.has("italic") ? ["Design that converts"] : ["Design that ", { id: "enfase", tag: "em", filhos: ["converts"] }],
      };

  // EXCEPTION to token-fallback/tailwind-palette: o réu da demonstração usa a classe roxa que o detector precisa achar
  const caixaCls = c.has("palette") ? "border rounded-xl p-4 text-primary" : "border rounded-xl p-4 text-purple-500";
  const semCaixa = j.has("hierarquia") ? "mt-6 flex items-baseline gap-2" : "mt-6 flex gap-2";
  const caixa: No = {
    id: "caixa",
    tag: "div",
    cls: j.has("caixa") ? semCaixa : j.has("hierarquia") ? `mt-4 ${caixaCls} flex items-baseline gap-2` : caixaCls,
    filhos: j.has("hierarquia") ? [preco, periodo] : [periodo, preco],
  };

  const filhos: (string | No)[] = [];
  if (!j.has("numero")) {
    filhos.push({
      id: "etiqueta",
      tag: "span",
      cls: `font-mono text-xs uppercase tracking-widest ${ladder ? apagado : "text-white/50"}`,
      filhos: ["01 / Pricing"],
    });
  }
  const corDaFrase = ladder ? apagado : "text-white/70";
  filhos.push(titulo, { id: "frase", tag: "p", cls: j.size ? `mt-2 ${corDaFrase}` : corDaFrase, filhos: [frase(c)] }, caixa);
  if (j.has("acao")) {
    filhos.push({
      id: "acao",
      tag: "button",
      cls: "mt-6 w-full rounded-lg bg-foreground px-4 py-2.5 text-background",
      filhos: ["Start on Pro"],
    });
  }
  return { id: "cartao", tag: "section", cls: "border rounded-2xl p-8", filhos };
}

const abre = (n: No) => `<${n.tag}${n.cls ? ` className="${n.cls}"` : ""}>`;
const emLinha = (n: No): string =>
  `${abre(n)}${n.filhos.map((f) => (typeof f === "string" ? f : emLinha(f))).join("")}</${n.tag}>`;

function linhas(n: No, recuo: string): string[] {
  const temBloco = n.filhos.some((f) => typeof f !== "string" && f.tag !== "em");
  if (!temBloco && n.tag !== "div") return [recuo + emLinha(n)];
  return [
    recuo + abre(n),
    ...n.filhos.flatMap((f) => (typeof f === "string" ? [recuo + "  " + f] : linhas(f, recuo + "  "))),
    `${recuo}</${n.tag}>`,
  ];
}

/** O arquivo `src/Pricing.tsx` inteiro, igual ao que o scanner recebe. */
export function fonte(n: No): string {
  return ["export function Pricing() {", "  return (", ...linhas(n, "    "), "  );", "}", ""].join("\n");
}

export const chaveDe = (c: ReadonlySet<Conserto>) =>
  CONSERTOS.reduce((soma, id, i) => (c.has(id) ? soma + 2 ** i : soma), 0);

/** Qual conserto cada regra do scanner pede, e que elementos do card ela aponta. */
export const ALVOS: Record<string, { conserto: Conserto; alvos: string[] }> = {
  "tailwind-palette": { conserto: "palette", alvos: ["caixa"] },
  "em-dash": { conserto: "emdash", alvos: ["frase"] },
  "en-hype": { conserto: "hype", alvos: ["frase"] },
  "italic-headline-word": { conserto: "italic", alvos: ["enfase"] },
  "display-serif-tight": { conserto: "serif", alvos: ["titulo"] },
  "opacity-ladder": { conserto: "ladder", alvos: ["etiqueta", "frase", "periodo", "preco"] },
};
