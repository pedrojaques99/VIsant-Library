/**
 * O slop de propósito. Este arquivo é a amostra que as demos corrigem, por isso
 * reprova em copy-lint e motion-lint e fica FORA das duas passagens.
 *
 * As regras de `REGRAS` espelham `visant-copy/scripts/copy-lint.mjs` (repo
 * visant-skills-public), linha a linha, sem as de `.json`. Regex igual, dica
 * traduzida. Mudou lá, muda aqui. As saídas de terminal foram capturadas rodando
 * as ferramentas de verdade em cima destas mesmas amostras, em 2026-11-03.
 */

const L = "(?<![\\p{L}\\p{N}])";
const R = "(?![\\p{L}\\p{N}])";
const rx = (src: string) => new RegExp(src, "iu");

export interface Regra {
  id: string;
  familia?: string;
  re: RegExp;
  dica: string;
}

export const REGRAS: Regra[] = [
  { id: "em-dash", re: /[—–]/u, dica: "Travessão é proibido. Vira ponto, vírgula, dois-pontos ou parênteses." },
  {
    id: "bullet-separator",
    re: /(?:\s[·•∙‧](?![·•∙‧])|(?<![·•∙‧])[·•∙‧]\s)/u,
    dica: "A bolinha separadora é proibida. Em lista, ponto e vírgula. Em rótulo, dois-pontos.",
  },
  { id: "hyphen-as-dash", re: / -{1,2} /u, dica: "Hífen solto virou travessão. Faça dele um ponto ou uma vírgula." },
  {
    id: "pt-not-x-but-y",
    familia: "negation",
    re: rx(`${L}n[ãa]o\\s+(?:é|s[ãa]o|era|eram|foi|foram)${R}[^.!?;]{0,80}[.,;:]\\s*(?:é|s[ãa]o|era|foi|isso\\s+é)${R}`),
    dica: "A construção «não é X, é Y». Corte a metade negativa e afirme só o Y.",
  },
  {
    id: "pt-not-just",
    familia: "negation",
    re: rx(`${L}n[ãa]o\\s+(?:é|s[ãa]o|foi)\\s+(?:apenas|s[óo]|somente)${R}`),
    dica: "«Não é apenas X» promete profundidade e não entrega. Diga o Y direto.",
  },
  {
    id: "pt-defined-by-negation",
    familia: "negation",
    re: rx(`${L}n[ãa]o\\s+(?:é|s[ãa]o)\\s+(?:um|uma|o|a|os|as)?\\s*[^.!?]{2,40}[.!]`),
    dica: "Frase que define pela negação. Apague a frase e deixe a próxima carregar o peso.",
  },
  {
    id: "pt-not-about",
    familia: "negation",
    re: rx(`${L}n[ãa]o\\s+se\\s+trata\\s+de${R}`),
    dica: "Mesma família de «não é X, é Y». Afirme direto.",
  },
  {
    id: "pt-trailing-negation",
    familia: "negation",
    re: rx(`,\\s*n[ãa]o\\s+(?:é|foi|s[óo]|apenas|somente|o|a|um|uma|de|pra|para|que)${R}`),
    dica: "Negação pendurada no fim. Apague o rabo negativo: a frase quase sempre melhora.",
  },
  {
    id: "pt-is-about",
    re: rx(`${L}(?:é|era|s[ãa]o|eram)\\s+sobre${R}`),
    dica: "«É sobre X» não afirma nada. Troque pelo verbo: o que a coisa FAZ.",
  },
  {
    id: "pt-less-x-more-y",
    re: rx(`${L}menos\\s+[^.!?]{1,40}${L}e\\s+mais${R}`),
    dica: "A fórmula «menos X e mais Y». Diga só o Y.",
  },
  {
    id: "pt-more-than-just",
    re: rx(`${L}mais\\s+(?:do\\s+)?que\\s+(?:apenas|s[óo]|um\\s+simples|uma\\s+simples)${R}`),
    dica: "«Não é apenas» disfarçado. Corte.",
  },
  {
    id: "pt-hype",
    familia: "hype",
    re: rx(
      `${L}(?:revolucion[áa]ri\\w*|transformador\\w*|desbloqu\\w+|potencial\\s+m[áa]ximo|` +
        `eleve\\s+(?:seu|sua)|nunca\\s+foi\\s+t[ãa]o|no\\s+mundo\\s+de\\s+hoje|` +
        `cada\\s+vez\\s+mais\\s+competitivo|game\\s*changer|` +
        `jornada\\s+de\\s+(?:sucesso|transforma\\w+)|descubra\\s+o\\s+(?:poder|segredo))${R}`,
    ),
    dica: "Palavra de folheto. Troque por um fato que dá pra conferir ou por um número.",
  },
  {
    id: "pt-guru-opener",
    familia: "guru",
    re: rx(
      `${L}(?:imagine\\s+(?:que|se|s[óo]|comigo)|e\\s+se\\s+eu\\s+te\\s+dissesse|` +
        `prepare-se|chegou\\s+a\\s+hora|j[áa]\\s+parou\\s+pra\\s+pensar|` +
        `deixa\\s+eu\\s+te\\s+contar)${R}`,
    ),
    dica: "Abertura de guru. Comece pelo fato ou pela cena, sem aquecimento.",
  },
  {
    id: "pt-generic-urgency",
    familia: "urgency",
    re: rx(
      `${L}(?:[úu]ltimas\\s+vagas|vagas\\s+limitadas|[úu]ltima\\s+chance|` +
        `corre\\s+que\\s+(?:acaba|t[áa]\\s+acabando)|n[ãa]o\\s+perca\\s+(?:essa|a)\\s+chance|` +
        `por\\s+tempo\\s+limitado|s[óo]\\s+hoje)${R}`,
    ),
    dica: "Urgência genérica. Se a escassez existe, diga o número: «este lote tem 30 vagas».",
  },
  {
    id: "emoji",
    re: /[\p{Emoji_Presentation}\u{1F300}-\u{1FAFF}]/u,
    dica: "Zero emoji em texto de página.",
  },
  {
    id: "pt-llm-connector",
    familia: "connector",
    re: rx(
      `(?:^|\\n)\\s*(?:Al[ée]m\\s+disso|Por\\s+fim|Em\\s+resumo|` +
        `Vale\\s+(?:a\\s+pena\\s+)?(?:lembrar|ressaltar|destacar)|Em\\s+outras\\s+palavras)${R}`,
    ),
    dica: "Conector de redação de IA. Comece a frase pelo sujeito.",
  },
  {
    id: "en-not-about",
    familia: "negation",
    re: rx(
      `${L}(?:isn['’]t|is\\s+not|wasn['’]t|it['’]s\\s+not|aren['’]t|are\\s+not)\\s+(?:just\\s+|only\\s+|really\\s+)?about${R}` +
        `[^.!?]{1,80}[,;:.]\\s*(?:it|this|that|they|we)(?:['’]s|['’]re|\\s+is|\\s+are|\\s+was)\\s+(?:all\\s+)?about${R}`,
    ),
    dica: "«Isn't about X, it's about Y». Corte a metade negativa e diga o que a coisa faz.",
  },
  {
    id: "en-not-x-but-y",
    familia: "negation",
    re: rx(
      `${L}(?:(?:it|this|that)(?:['’]s\\s+not|\\s+is\\s+not|\\s+isn['’]t)|(?:we|they|you)(?:['’]re\\s+not|\\s+are\\s+not|\\s+aren['’]t))${R}` +
        `[^.!?;]{1,80}[,;:.]\\s*(?:it|this|that|we|they|you)(?:['’]s|['’]re|\\s+is|\\s+are)${R}`,
    ),
    dica: "«It's not X, it's Y». Corte a metade negativa e afirme só o Y.",
  },
  {
    id: "en-not-just",
    familia: "negation",
    re: rx(
      `${L}(?:(?:isn['’]t|is\\s+not|aren['’]t|are\\s+not|wasn['’]t)\\s+(?:just|only|merely|simply)|` +
        `not\\s+(?:just|only|merely|simply)${R}[^.!?;]{1,60}?${L}but)${R}`,
    ),
    dica: "«Not just X, but Y» promete e não entrega. Diga o Y direto.",
  },
  {
    id: "en-more-than-just",
    re: rx(`${L}more\\s+than\\s+(?:just|merely|a\\s+simple|an?\\s+ordinary)${R}`),
    dica: "«Not just X» disfarçado. Corte e diga o que a coisa faz.",
  },
  {
    id: "en-all-about",
    re: rx(`${L}(?:it['’]s|it\\s+is|is|are|was)\\s+all\\s+about${R}`),
    dica: "«It's all about X» não afirma nada. Diga o que a coisa FAZ.",
  },
  {
    id: "en-hype",
    familia: "hype",
    re: rx(
      `${L}(?:unlock\\s+(?:your\\s+(?:full\\s+|true\\s+)?(?:potential|creativ\\w+|power|growth|success|future|genius)|` +
        `the\\s+(?:full\\s+|true\\s+)?(?:power|potential)|new\\s+possibilities|endless)|` +
        `(?:full|true)\\s+potential|unleash\\w*|supercharg\\w+|revolutioni[sz]\\w*|revolutionary|` +
        `game[-\\s]?chang\\w+|next[-\\s]level|cutting[-\\s]edge|` +
        `seamlessly|seamless\\s+(?:experience|integration|workflow|collaboration|solution|journey)|` +
        `elevate\\s+your|empower(?:s|ing)?\\s+(?:you|your|teams|businesses|creators|brands)|` +
        `transform\\s+(?:your|the\\s+way|how)|harness\\s+the\\s+power|` +
        `in\\s+today['’]s\\s+(?:fast[-\\s]paced|digital|competitive|ever[-\\s]changing)\\s+(?:world|landscape|age|era|market)|` +
        `ever[-\\s](?:evolving|changing)\\s+landscape|look\\s+no\\s+further)${R}`,
    ),
    dica: "Palavra de folheto. Troque por um fato que dá pra conferir ou por um número.",
  },
  {
    id: "en-guru-opener",
    familia: "guru",
    re: rx(
      `${L}(?:imagine\\s+(?:a\\s+world|if)|what\\s+if\\s+I\\s+told\\s+you|let['’]s\\s+dive\\s+in(?:to)?|` +
        `here['’]s\\s+the\\s+thing|picture\\s+this|ever\\s+wondered|buckle\\s+up)${R}`,
    ),
    dica: "Abertura de guru. Comece pelo fato ou pela cena.",
  },
  {
    id: "en-llm-connector",
    familia: "connector",
    re: rx(
      `(?:^|[.!?>"“]\\s*)(?:(?:Moreover|Furthermore|Additionally|Ultimately|In\\s+conclusion|In\\s+summary|Notably),|` +
        `It['’]s\\s+worth\\s+noting|It\\s+is\\s+worth\\s+noting|It\\s+is\\s+important\\s+to\\s+note)`,
    ),
    dica: "Conector de redação de IA. Comece a frase pelo sujeito.",
  },
  {
    id: "en-generic-urgency",
    familia: "urgency",
    re: rx(
      `${L}(?:limited\\s+time\\s+only|for\\s+a\\s+limited\\s+time|act\\s+now|don['’]t\\s+miss\\s+out|` +
        `last\\s+chance|while\\s+supplies\\s+last|before\\s+it['’]s\\s+too\\s+late|spots\\s+are\\s+filling\\s+up)${R}`,
    ),
    dica: "Urgência genérica. Se a escassez existe, diga o número.",
  },
];

export interface Achado {
  id: string;
  dica: string;
  linha: number;
  /** Posição no texto inteiro, para pintar por cima. */
  de: number;
  ate: number;
  trecho: string;
}

/** O mesmo laço do linter: uma ocorrência por regra por linha, uma por família. */
export function lintar(texto: string): Achado[] {
  const achados: Achado[] = [];
  let base = 0;
  texto.split("\n").forEach((linha, i) => {
    const vistas = new Set<string>();
    for (const regra of REGRAS) {
      if (regra.familia && vistas.has(regra.familia)) continue;
      const m = regra.re.exec(linha);
      if (!m) continue;
      if (regra.familia) vistas.add(regra.familia);
      achados.push({
        id: regra.id,
        dica: regra.dica,
        linha: i + 1,
        de: base + m.index,
        ate: base + m.index + m[0].length,
        trecho: m[0].trim(),
      });
    }
    base += linha.length + 1;
  });
  return achados;
}

/**
 * O que dá pra consertar sem gente: pontuação e rabo negativo. O resto o linter
 * aponta e quem reescreve é o agente, que é exatamente como a skill trabalha.
 */
export function consertoMecanico(texto: string): string {
  return texto
    .split("\n")
    .map((linha) =>
      linha
        .replace(/\s*[—–]\s*(\p{L})/gu, (_, c: string) => `. ${c.toUpperCase()}`)
        .replace(/ -{1,2} /gu, ". ")
        .replace(/\s[·•∙‧]\s/gu, ", ")
        .replace(/,\s*n[ãa]o\s+(?:é|foi|s[óo]|apenas|somente|o|a|um|uma|de|pra|para|que)(?![\p{L}\p{N}])[^.!?]*/giu, "")
        .replace(/^(?:imagine\s+(?:que|se|s[óo]|comigo)|prepare-se(?:\s+pra)?|chegou\s+a\s+hora(?:\s+de)?)\s+/iu, "")
        .replace(/[\p{Emoji_Presentation}\u{1F300}-\u{1FAFF}]\s?/gu, "")
        .replace(/^\p{Ll}/u, (c) => c.toUpperCase()),
    )
    .join("\n");
}

/** Texto de IA para o editor. `depois` foi reescrito à mão e passa no linter. */
export const TEXTOS = [
  {
    id: "landing",
    nome: "Landing",
    antes: [
      "Não é só um template — é uma revolução no seu fluxo.",
      "Imagine que sua equipe pudesse desbloquear todo o potencial do design.",
      "Nossa solução robusta é sobre transformar a experiência, não apenas a tela.",
      "Últimas vagas! Corre que acaba.",
    ],
    depois: [
      "Um template que você edita numa tarde.",
      "Sua equipe publica a página sem abrir chamado pro design.",
      "Troca a tela inteira e mantém o que já funcionava.",
      "Este lote tem 30 vagas.",
    ],
  },
  {
    id: "email",
    nome: "E-mail",
    antes: [
      "Chegou a hora de elevar sua marca!",
      "Prepare-se pra nossa jornada de transformação — tudo em um só lugar.",
      "Além disso, nunca foi tão fácil vender mais.",
    ],
    depois: [
      "Sua marca tá em quatro lugares, com quatro cores.",
      "A gente junta logo, fonte e paleta num arquivo só.",
      "Quem atende cliente para de pedir o PNG certo no grupo.",
    ],
  },
  {
    id: "english",
    nome: "English",
    antes: [
      "Unlock your full potential — a revolutionary way to ship.",
      "It's not a tool, it's a seamless experience.",
      "Moreover, it's all about your growth.",
    ],
    depois: [
      "Ship the page today.",
      "Paste a screen, get the list of what looks AI-made.",
      "Fix those lines and run it again.",
    ],
  },
];

/** O cartão de preço do README do repo, com as linhas batendo com a saída. */
export const CODIGO_SLOP = [
  "export function Pricing() {",
  "  return (",
  '<section className="border rounded-2xl p-8">',
  '  <span className="font-mono text-xs uppercase tracking-widest text-white/50">01 / Pricing</span>',
  '  <h1 className="text-5xl font-serif tracking-tighter">Design that <em>converts</em></h1>',
  '  <p className="text-white/70">Unlock your full potential — a revolutionary way to ship.</p>',
  '  <div className="border rounded-xl p-4 text-purple-500">',
  '    <span className="text-white/40">per month</span>',
  '    <span className="text-white/90">$49</span>',
  "  </div>",
  "</section>",
  "  );",
  "}",
];

export const CODIGO_LIMPO = [
  "export function Pricing() {",
  "  return (",
  '    <section className="border rounded-2xl p-8">',
  '      <h1 className="text-3xl font-medium">Pro</h1>',
  '      <p className="text-muted-foreground">For studios with up to 5 people.</p>',
  '      <p className="mt-4 text-2xl text-foreground">$49 per month</p>',
  "    </section>",
  "  );",
  "}",
];

/** O mesmo cartão, desenhado: é o que a demo mostra. A cor é a do `text-purple-500` do README. */
export const SLOP_CARTAO = {
  rotulo: "01 / Pricing",
  titulo: "Design that",
  enfase: "converts",
  lead: "Unlock your full potential — a revolutionary way to ship.",
  preco: "$49 per month",
  cor: "#a855f7",
};

export interface LinhaSaida {
  linha: string;
  alvo?: number;
  fecho?: boolean;
  /** Em qual detector (0 a 3) a linha entra. */
  passo: number;
}

/** Saída real do `killer-scan` sobre o cartão acima, condensada na largura da coluna. */
export const SAIDA_FECHADA: LinhaSaida[] = [
  { passo: 0, linha: "[OK]    impeccable   (AI tell)  zero" },
  { passo: 1, linha: "[FAIL]  audit:design (token)    1 finding(s)" },
  { passo: 1, linha: "  src/Pricing.tsx:7  tailwind-palette", alvo: 7 },
  { passo: 2, linha: "[FAIL]  copy         (tic)      2 finding(s)" },
  { passo: 2, linha: "  src/Pricing.tsx:6  em-dash", alvo: 6 },
  { passo: 2, linha: "  src/Pricing.tsx:6  en-hype", alvo: 6 },
  { passo: 3, linha: "[FAIL]  noise        (chrome)   3 finding(s)" },
  { passo: 3, linha: "  src/Pricing.tsx:5  italic-headline-word", alvo: 5 },
  { passo: 3, linha: "  src/Pricing.tsx:5  display-serif-tight", alvo: 5 },
  { passo: 3, linha: "  src/Pricing.tsx:4  opacity-ladder", alvo: 4 },
  { passo: 4, linha: "gates: 4/4 ran; none skipped" },
  { passo: 4, linha: "GATE CLOSED: 3 detector(s) with findings.", fecho: true },
  { passo: 4, linha: "A confirmed finding is a defect, not a taste call: list it and ask before editing." },
];

export const SAIDA_ABERTA: LinhaSaida[] = [
  { passo: 0, linha: "[OK]    impeccable   (AI tell)  zero" },
  { passo: 1, linha: "[OK]    audit:design (token)    zero" },
  { passo: 2, linha: "[OK]    copy         (tic)      zero (2 interface string(s))" },
  { passo: 3, linha: "[OK]    noise        (chrome)   zero" },
  { passo: 4, linha: "gates: 4/4 ran; none skipped" },
  { passo: 4, linha: "GATE INCOMPLETE: the detectors passed,", fecho: true },
  { passo: 4, linha: "but this is not an audit yet." },
];

/* ---- motion ----
 * Slop de propósito: é o "errado" que as demos mostram e o texto do que o lint
 * reprovaria. Cada linha leva a exceção, então o resto do arquivo segue vigiado. */

// motion-lint-disable-next-line ease-in-on-ui  demonstração do erro, nada disto é animação do site
// motion-lint-disable-next-line hardcoded-curve  demonstração do erro, nada disto é animação do site
export const CURVA_ERRADA = { css: "cubic-bezier(0.42, 0, 1, 1)", p: [0.42, 0, 1, 1] as const, nome: "ease-in" };
export const CURVA_CERTA = { css: "var(--ease-out)", p: [0.23, 1, 0.32, 1] as const, nome: "--ease-out" };

/** Duração errada de propósito: é a demonstração do que o motion-lint reprova. */
export const LENTO_MS = 700;
// motion-lint-disable-next-line scale-zero  demonstração do erro, nada disto é animação do site
export const ESCALA_ERRADA = "scale(0)";
export const TRANSICAO_ERRADA = `all ${LENTO_MS}ms ${CURVA_ERRADA.css}`;

/** Transição errada num só atributo: as cenas que empurram layout de verdade. */
export const erradaEm = (prop: string) => `${prop} ${LENTO_MS}ms ${CURVA_ERRADA.css}`;

export const CURVA_GAVETA = { css: "var(--ease-drawer)", p: [0.32, 0.72, 0, 1] as const, nome: "--ease-drawer" };

export type DadosCena = {
  nome: string;
  codigoErrado: string;
  /** Saída real do motion-lint sobre `codigoErrado`. Vazia: o erro é de comportamento, e o regex não enxerga. */
  lint: string[];
  codigoCerto: string;
  ms: number;
  /** Duração do lado errado. 0 é troca seca, e aí não há curva para desenhar. */
  msErrado: number;
  curvaCerta: { p: readonly [number, number, number, number] };
  /** Quando cada passo da cena dispara, em ms depois do começo. */
  tempos: number[];
  legenda: { errado: string; certo: string };
};

export const CENAS_MOTION = {
  gaveta: {
    nome: "Gaveta",
    // motion-lint-disable-next-line ease-in-on-ui  demonstração do erro, nada disto é animação do site
    // motion-lint-disable-next-line slow-ui-duration  demonstração do erro, nada disto é animação do site
    // motion-lint-disable-next-line layout-property-animation  demonstração do erro, nada disto é animação do site
    codigoErrado: 'className="transition-[width] duration-700 ease-in w-0 data-[open]:w-1/2"',
    lint: ["HIGH  ease-in-on-ui", "HIGH  slow-ui-duration", "HIGH  layout-property-animation"],
    codigoCerto: 'className="[transition-duration:var(--dur-slow)] [transition-timing-function:var(--ease-drawer)] translate-x-full"',
    ms: 300,
    msErrado: LENTO_MS,
    curvaCerta: CURVA_GAVETA,
    tempos: [0],
    legenda: { errado: "Espreme a lista", certo: "Lista fica parada" },
  },
  lista: {
    nome: "Lista",
    codigoErrado: "itens.filter((i) => i.id !== id).map((i) => <Linha key={i.id} />)",
    lint: [],
    codigoCerto: '<motion.li layout exit={{ opacity: 0 }} transition={{ duration: DUR.base, ease: EASE_OUT }} />',
    ms: 200,
    msErrado: 0,
    curvaCerta: CURVA_CERTA,
    tempos: [0, 450],
    legenda: { errado: "Abre buraco e salta", certo: "Os de baixo deslizam" },
  },
  espera: {
    nome: "Espera",
    // motion-lint-disable-next-line loader-without-guard  demonstração do erro, nada disto é animação do site
    codigoErrado: "isLoading ? <Spinner /> : <Lista />",
    lint: ["MEDIUM  loader-without-guard"],
    codigoCerto: 'className="[transition-duration:var(--dur-base)] [transition-timing-function:var(--ease-out)] skeleton h-11"',
    ms: 200,
    msErrado: 0,
    curvaCerta: CURVA_CERTA,
    tempos: [0, 1000],
    legenda: { errado: "Some tudo e salta", certo: "Espera com a mesma forma" },
  },
  avisos: {
    nome: "Avisos",
    // motion-lint-disable-next-line ease-in-on-ui  demonstração do erro, nada disto é animação do site
    // motion-lint-disable-next-line slow-ui-duration  demonstração do erro, nada disto é animação do site
    codigoErrado: 'className="transition-[top] duration-700 ease-in"',
    lint: ["HIGH  ease-in-on-ui", "HIGH  slow-ui-duration"],
    codigoCerto: 'className="[transition-duration:var(--dur-base)] [transition-timing-function:var(--ease-out)] -translate-y-3 scale-95"',
    ms: 200,
    msErrado: LENTO_MS,
    curvaCerta: CURVA_CERTA,
    tempos: [0, 650, 1300],
    legenda: { errado: "Novo empurra os antigos", certo: "Novo vai à frente" },
  },
  cartaz: {
    nome: "Cartaz",
    // motion-lint-disable-next-line ease-in-on-ui  demonstração do erro, nada disto é animação do site
    // motion-lint-disable-next-line scale-zero  demonstração do erro, nada disto é animação do site
    // motion-lint-disable-next-line slow-ui-duration  demonstração do erro, nada disto é animação do site
    // motion-lint-disable-next-line transition-all  demonstração do erro, nada disto é animação do site
    codigoErrado: 'className="transition-all duration-700 ease-in origin-center scale-0"',
    // motion-lint-disable-next-line transition-all  demonstração do erro, nada disto é animação do site
    lint: ["HIGH  ease-in-on-ui", "HIGH  scale-zero", "HIGH  slow-ui-duration", "MEDIUM  transition-all"],
    codigoCerto: 'className="[transition-duration:var(--dur-slow)] [transition-timing-function:var(--ease-out)] origin-top-left scale-50"',
    ms: 300,
    msErrado: LENTO_MS,
    curvaCerta: CURVA_CERTA,
    tempos: [0],
    legenda: { errado: "Nasce do centro", certo: "Cresce de onde tocou" },
  },

  menu: {
    nome: "Menu",
    // motion-lint-disable-next-line ease-in-on-ui  demonstração do erro, nada disto é animação do site
    // motion-lint-disable-next-line scale-zero  demonstração do erro, nada disto é animação do site
    // motion-lint-disable-next-line slow-ui-duration  demonstração do erro, nada disto é animação do site
    // motion-lint-disable-next-line transition-all  demonstração do erro, nada disto é animação do site
    codigoErrado: 'className="transition-all duration-700 ease-in scale-0"',
    // motion-lint-disable-next-line transition-all  demonstração do erro, nada disto é animação do site
    lint: ["HIGH  ease-in-on-ui", "HIGH  scale-zero", "HIGH  slow-ui-duration", "MEDIUM  transition-all"],
    codigoCerto: 'className="[transition-duration:var(--dur-base)] [transition-timing-function:var(--ease-out)] scale-95"',
    ms: 200,
    msErrado: LENTO_MS,
    curvaCerta: CURVA_CERTA,
tempos: [0],
    legenda: { errado: "Nasce do nada, demora", certo: "Sai do botão, na hora" },
  },
  modal: {
    nome: "Modal",
    // motion-lint-disable-next-line ease-in-on-ui  demonstração do erro, nada disto é animação do site
    // motion-lint-disable-next-line scale-zero  demonstração do erro, nada disto é animação do site
    // motion-lint-disable-next-line slow-ui-duration  demonstração do erro, nada disto é animação do site
    // motion-lint-disable-next-line transition-all  demonstração do erro, nada disto é animação do site
    codigoErrado: 'className="transition-all duration-700 ease-in scale-0"',
    // motion-lint-disable-next-line transition-all  demonstração do erro, nada disto é animação do site
    lint: ["HIGH  ease-in-on-ui", "HIGH  scale-zero", "HIGH  slow-ui-duration", "MEDIUM  transition-all"],
    codigoCerto: 'className="[transition-duration:var(--dur-slow)] [transition-timing-function:var(--ease-out)] scale-95"',
    ms: 300,
    msErrado: LENTO_MS,
    curvaCerta: CURVA_CERTA,
tempos: [0],
    legenda: { errado: "Nasce do nada, demora", certo: "Assenta no centro" },
  },
  botao: {
    nome: "Botão",
    // motion-lint-disable-next-line ease-in-on-ui  demonstração do erro, nada disto é animação do site
    // motion-lint-disable-next-line slow-ui-duration  demonstração do erro, nada disto é animação do site
    // motion-lint-disable-next-line transition-all  demonstração do erro, nada disto é animação do site
    codigoErrado: 'className="transition-all duration-700 ease-in active:scale-90"',
    // motion-lint-disable-next-line transition-all  demonstração do erro, nada disto é animação do site
    lint: ["HIGH  ease-in-on-ui", "HIGH  slow-ui-duration", "MEDIUM  transition-all"],
    codigoCerto: 'className="[transition-duration:var(--dur-press)] [transition-timing-function:var(--ease-out)] active:scale-[0.97]"',
    ms: 120,
    msErrado: LENTO_MS,
    curvaCerta: CURVA_CERTA,
tempos: [0, 240, 820],
    legenda: { errado: "Afunda devagar", certo: "Responde no toque" },
  },
} satisfies Record<string, DadosCena>;

/* ---- refine ---- */

/** Paleta de gráfico montado: uma cor por barra, sem função. Só existe no estado ruim. */
export const CORES_MONTADO = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6"];
export const TITULO_MONTADO = "RECEITA — TÁ VOANDO 🚀";
export const DELTA_MONTADO = "+4,2% este mês!!";

/* ---- frontend ---- */

export const SELO_MONTADO = "Novo ✨";
export const PROVA_MONTADA = "+10.000 felizes";
