"use client";

/**
 * Marca: o brand book da marca escolhida no seletor.
 *
 * Quem chega quer achar um valor da marca (uma cor, uma face, um raio) e levar
 * pro projeto. Por isso cada valor copia no clique e a busca filtra todos eles.
 *
 * Tudo aqui é lido de `brands.json` e do tema vivo. O que o índice público não
 * traz (voz, estratégia, personas) não aparece: `brands-sync.mjs` só publica o
 * que pode sair do vault, e seção inventada numa guideline é pior que seção
 * ausente.
 */

import * as React from "react";
import { Check } from "lucide-react";
import { useBrandTheme } from "@/lib/brand-theme";
import { onThemeChange, resolveCssColor, type RGB } from "@/lib/css-color";
import { cn } from "@/lib/utils";
import { SearchField } from "../../registry/visant/ui/search-field";
import { fold } from "./catalog";
import { CopyCommand, useCopy } from "./copy-command";
import { Trocador, useUmPorVez } from "./demos/um-por-vez";
import { DEFAULT_BRAND, installCommand } from "./registry-meta";

/* As demos da vitrine, lazy: só esta página paga por elas. */
const GaugeDemo = React.lazy(() => import("./demos/gauge-demo"));
const BillingDemo = React.lazy(() => import("./demos/billing-toggle-demo"));
const HeatmapDemo = React.lazy(() => import("./demos/activity-heatmap-demo"));

// --- o sistema, como dado -----------------------------------------------------

const TOKENS_DE_COR = [
  "background",
  "foreground",
  "card",
  "muted",
  "muted-foreground",
  "border",
  "brand",
  "brand-foreground",
  "accent-ink",
] as const;
const RAIOS = ["r-control", "r-surface", "r-pill"] as const;
const ELEVACOES = ["e-flat", "e-raised", "e-overlay", "e-modal"] as const;
const ESPACOS = ["control-h", "pad-card", "gap-zone"] as const;
const CURVAS = ["ease-out", "ease-in-out", "ease-drawer"] as const;
const DURACOES = ["dur-press", "dur-fast", "dur-base", "dur-slow"] as const;
const TAMANHOS = ["72px", "48px", "32px", "20px"] as const;
/* Superfície e divisória não carregam texto próprio: razão ali só faz ruído. */
const SEM_RAZAO = new Set(["background", "card", "muted", "border", "brand-foreground", "secondary"]);

const TODOS = [
  ...TOKENS_DE_COR,
  ...RAIOS,
  ...ELEVACOES,
  ...ESPACOS,
  ...CURVAS,
  ...DURACOES,
  "font-display",
  "font-sans",
];

const CAPITULOS = [
  { id: "identidade", titulo: "Identidade" },
  { id: "cor", titulo: "Cor" },
  { id: "tipografia", titulo: "Tipografia" },
  { id: "forma", titulo: "Forma" },
  { id: "movimento", titulo: "Movimento" },
  { id: "aplicacao", titulo: "Aplicação" },
  { id: "uso", titulo: "Uso" },
] as const;
type CapituloId = (typeof CAPITULOS)[number]["id"];

// --- leitura dos tokens vivos --------------------------------------------------

/**
 * Lê os tokens do `:root` DEPOIS de a folha da marca entrar. `getComputedStyle`
 * mostra o que o browser resolveu, não o que o JSON prometeu; `onThemeChange`
 * cobre a troca de claro/escuro, que não muda a marca.
 */
function useTokensVivos(marca: unknown) {
  const [valores, setValores] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    const ler = () => {
      const cs = getComputedStyle(document.documentElement);
      setValores(Object.fromEntries(TODOS.map((t) => [t, cs.getPropertyValue(`--${t}`).trim()])));
    };
    // Dois quadros: um para a folha entrar, outro para a View Transition acabar.
    const raf = requestAnimationFrame(() => requestAnimationFrame(ler));
    const t = setTimeout(ler, 320);
    const parar = onThemeChange(ler);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      parar();
    };
  }, [marca]);
  return valores;
}

/** Contraste WCAG entre duas cores sRGB 0..1. */
function contraste(a: RGB, b: RGB) {
  const lum = (c: RGB) => {
    const [r, g, bl] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [claro, escuro] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

function contrasteSobreFundo(cor: string, fundo: string) {
  if (!cor || !fundo) return null;
  try {
    return contraste(resolveCssColor(cor), resolveCssColor(fundo));
  } catch {
    return null;
  }
}

// --- peças da página -----------------------------------------------------------

function Capitulo({
  id,
  titulo,
  children,
}: {
  id: CapituloId;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} data-capitulo={id} className="scroll-mt-20 pb-20">
      <h2 className="casa mb-5 text-casa-lg font-medium">{titulo}</h2>
      {children}
    </section>
  );
}

/** O ladrilho onde a marca acontece. Fora dele, tudo é casa. */
function Palco({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("palco overflow-hidden rounded-tile", className)}>{children}</div>;
}

function Subtitulo({ children }: { children: React.ReactNode }) {
  return <h3 className="casa mb-3 mt-8 text-casa-sm text-casa-fg-2 first:mt-0">{children}</h3>;
}

/** Um valor da marca: clicar copia, e o valor continua legível o tempo todo. */
function Valor({ nome, valor }: { nome: string; valor: string }) {
  const { done, copy } = useCopy(valor);
  return (
    <button
      type="button"
      onClick={copy}
      disabled={!valor}
      aria-label={`Copiar ${nome}: ${valor}`}
      className="casa alvo-toque block w-full min-w-0 rounded-control px-4 py-3 text-left outline-none transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-casa-tile-2 focus-visible:[box-shadow:var(--focus)]"
    >
      <code className="block truncate text-casa-sm text-casa-fg">{nome}</code>
      <code className="flex items-start gap-1.5 text-casa-sm text-casa-fg-3">
        <span className="min-w-0 [overflow-wrap:anywhere]">{valor || "ausente"}</span>
        {done ? <Check className="size-3 shrink-0 text-casa-fg" aria-label="Copiado" /> : null}
      </code>
    </button>
  );
}

function Amostra({
  cor,
  nome,
  valor,
  papel,
  razao,
}: {
  cor: string;
  nome: string;
  valor: string;
  papel?: string | null;
  razao: number | null;
}) {
  return (
    <div className="overflow-hidden rounded-tile bg-casa-tile">
      <div className="h-24 w-full [box-shadow:inset_0_0_0_1px_var(--casa-line)]" style={{ background: cor }} />
      <Valor nome={nome} valor={valor} />
      <p className="casa px-4 pb-3 text-casa-sm text-casa-fg-3">
        {[
          papel,
          razao == null
            ? null
            : `${razao.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}:1 no fundo${razao < 4.5 ? ", não usar em texto" : ""}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </div>
  );
}

function TestadorDeTipo({ display, sans }: { display: string; sans: string }) {
  const [texto, setTexto] = React.useState("Uma decisão por tela");
  const tamanho = useUmPorVez(TAMANHOS);
  return (
    <>
      <Palco className="px-6 py-12 sm:px-10">
        {/* O espécime é o próprio campo: digitar aqui já é testar a face. */}
        <textarea
          rows={1}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-label="Texto de teste da face de títulos"
          className="block w-full min-w-0 resize-none bg-transparent leading-[1.05] tracking-[-0.03em] outline-none [field-sizing:content]"
          style={{ fontFamily: "var(--font-display, inherit)", fontSize: `min(${tamanho.atual}, 11vw)` }}
        />
        <p
          className="mt-5 max-w-xl leading-relaxed"
          style={{ fontFamily: "var(--font-sans, inherit)", color: "var(--muted-foreground)" }}
        >
          {texto || "Texto corrido"} é como esta frase soa na face de leitura, em tamanho de parágrafo.
        </p>
      </Palco>
      <div className="casa mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-casa-sm text-casa-fg-3">
          {display} nos títulos, {sans} no texto
        </p>
        <Trocador nome={tamanho.atual} onPasso={tamanho.passo} rotulo="tamanho" />
      </div>
    </>
  );
}

/** Uma curva ou duração, andando de verdade com o token dela. */
function Trilha({ nome, valor, curva, duracao }: { nome: string; valor: string; curva: string; duracao: string }) {
  const [fim, setFim] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* Parado, todo cartão mostra o mesmo ponto no fim. A diferença entre curvas e
       durações só existe em movimento, então a trilha roda enquanto está à vista. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let relogio: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(relogio);
      if (e.isIntersecting) {
        setFim(true);
        relogio = setInterval(() => setFim((v) => !v), 1600);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(relogio);
    };
  }, []);
  return (
    <div ref={ref} className="overflow-hidden rounded-tile bg-casa-tile">
      <button
        type="button"
        onClick={() => setFim((v) => !v)}
        aria-label={`Rodar ${nome}`}
        className="palco block w-full px-5 py-5 outline-none focus-visible:[box-shadow:var(--focus)]"
      >
        <span className="relative block h-3">
          <span
            // casa-lint/pilula: o ponto da trilha é um círculo, não um chip
            className="absolute top-0 size-3 rounded-full motion-reduce:transition-none"
            style={{
              // casa-lint/marca-na-casca: o ponto está no palco; a cor é a marca aplicada
              background: "var(--brand)",
              left: fim ? "calc(100% - 0.75rem)" : "0",
              transitionProperty: "left",
              transitionTimingFunction: `var(--${curva})`,
              transitionDuration: duracao,
            }}
          />
        </span>
      </button>
      <Valor nome={`--${nome}`} valor={valor} />
    </div>
  );
}

// --- o livro -------------------------------------------------------------------

export function BrandStudioBody() {
  const { active, brand, status } = useBrandTheme();
  const shown = active ?? brand;
  const tokens = useTokensVivos(active?.slug ?? "none");
  const [busca, setBusca] = React.useState("");
  const [atual, setAtual] = React.useState<CapituloId>("identidade");

  const termo = fold(busca.trim());
  const acha = (...partes: (string | null | undefined)[]) =>
    !termo || fold(partes.filter(Boolean).join(" ")).includes(termo);

  const paleta = (shown?.palette ?? []).filter((c) => acha("cor paleta", c.name, c.role, c.hex));
  const coresVivas = TOKENS_DE_COR.filter((t) => acha("cor token", t, tokens[t]));
  const raios = RAIOS.filter((t) => acha("forma raio", t, tokens[t]));
  const elevacoes = ELEVACOES.filter((t) => acha("forma elevação sombra", t, tokens[t]));
  const espacos = ESPACOS.filter((t) => acha("forma espaço", t, tokens[t]));
  const curvas = CURVAS.filter((t) => acha("movimento curva easing", t, tokens[t]));
  const duracoes = DURACOES.filter((t) => acha("movimento duração", t, tokens[t]));

  const visivel: Record<CapituloId, boolean> = {
    identidade: acha("identidade logo nome", shown?.name, shown?.tagline),
    cor: paleta.length + coresVivas.length > 0,
    tipografia: acha("tipografia fonte face tipo", shown?.fonts.display, shown?.fonts.sans),
    forma: raios.length + elevacoes.length + espacos.length > 0,
    movimento: curvas.length + duracoes.length > 0,
    aplicacao: acha("aplicação componentes"),
    uso: acha("uso instalar tema seletor comando"),
  };
  const capitulos = CAPITULOS.filter((c) => visivel[c.id]);
  const chaveDosCapitulos = capitulos.map((c) => c.id).join();

  /* O índice acompanha a leitura: marca o capítulo na faixa alta da tela. */
  React.useEffect(() => {
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) setAtual((e.target as HTMLElement).dataset.capitulo as CapituloId);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    document.querySelectorAll("[data-capitulo]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [chaveDosCapitulos]);

  const fundo = tokens.background ?? "";
  const fundoDaPaleta = shown?.palette.find((c) => c.role === "background")?.hex;

  return (
    <main className="shell pb-24 pt-10 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
      <aside className="casa mb-10 lg:sticky lg:top-20 lg:mb-0 lg:self-start">
        <SearchField
          value={busca}
          onChange={setBusca}
          delay={0}
          placeholder="Buscar na marca"
          aria-label="Buscar na marca"
        />
        <nav aria-label="Capítulos" className="mt-4 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {capitulos.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              aria-current={atual === c.id ? "location" : undefined}
              className={cn(
                "alvo-toque shrink-0 rounded-control px-2 py-1.5 text-casa-sm outline-none transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:text-casa-fg focus-visible:[box-shadow:var(--focus)]",
                atual === c.id ? "bg-casa-tile text-casa-fg" : "text-casa-fg-2",
              )}
            >
              {c.titulo}
            </a>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        {capitulos.length === 0 ? (
          <div className="casa py-16">
            <p className="text-casa-lg">Nada com “{busca.trim()}” em {shown?.name ?? "esta marca"}.</p>
            <button
              type="button"
              onClick={() => setBusca("")}
              className="alvo-toque mt-2 rounded-control text-casa-sm text-casa-fg-2 outline-none hover:text-casa-fg focus-visible:[box-shadow:var(--focus)]"
            >
              Limpar busca
            </button>
          </div>
        ) : null}

        {visivel.identidade ? (
          <Capitulo id="identidade" titulo="Identidade">
            <Palco className="px-6 py-16 sm:px-12 sm:py-24">
              {shown?.logo ? (
                /* O arquivo do logo é fixo e o tema muda: sobre o fundo da própria paleta ele
                   nunca some, e não precisa de filtro alterando a marca. */
                <div
                  className="mb-10 inline-block p-5"
                  // casa-lint/raio-da-marca: a placa está no palco e veste o raio da marca
                  style={{ background: fundoDaPaleta ?? "var(--card)", borderRadius: "var(--r-surface)" }}
                >
                  <img src={shown.logo.url} alt={`Logo ${shown.name}`} className="h-12 w-auto object-contain" />
                </div>
              ) : null}
              <h1
                className="text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.98] tracking-[-0.03em]"
                style={{ fontFamily: "var(--font-display, inherit)" }}
              >
                {status === "loading" ? "Lendo o vault" : (shown?.name ?? "Escolha uma marca")}
              </h1>
              {shown?.tagline ? (
                <p className="mt-5 max-w-xl text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {shown.tagline}
                </p>
              ) : null}
            </Palco>
          </Capitulo>
        ) : null}

        {visivel.cor ? (
          <Capitulo id="cor" titulo="Cor">
            {paleta.length ? (
              <>
                <Subtitulo>Paleta</Subtitulo>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  {paleta.map((c) => (
                    <Amostra
                      key={c.hex + c.name}
                      cor={c.hex}
                      nome={c.name ?? c.role ?? c.hex}
                      valor={c.hex}
                      papel={c.name ? c.role : null}
                      razao={SEM_RAZAO.has(c.role ?? "") ? null : contrasteSobreFundo(c.hex, fundoDaPaleta ?? fundo)}
                    />
                  ))}
                </div>
              </>
            ) : null}
            {coresVivas.length ? (
              <>
                <Subtitulo>Tokens no tema atual</Subtitulo>
                {/* A amostra fica FORA de `.casa`: lá dentro `--brand` é redeclarado com o
                    tom da casa, e a amostra mostraria a casca em vez da marca. */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  {coresVivas.map((t) => (
                    <Amostra
                      key={t}
                      cor={`var(--${t})`}
                      nome={`--${t}`}
                      valor={tokens[t] ?? ""}
                      razao={SEM_RAZAO.has(t) ? null : contrasteSobreFundo(tokens[t] ?? "", fundo)}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </Capitulo>
        ) : null}

        {visivel.tipografia ? (
          <Capitulo id="tipografia" titulo="Tipografia">
            <TestadorDeTipo display={shown?.fonts.display ?? "—"} sans={shown?.fonts.sans ?? "—"} />
          </Capitulo>
        ) : null}

        {visivel.forma ? (
          <Capitulo id="forma" titulo="Forma">
            {raios.length ? (
              <>
                <Subtitulo>Raio</Subtitulo>
                <div className="grid gap-3 sm:grid-cols-3">
                  {raios.map((t) => (
                    <div key={t} className="overflow-hidden rounded-tile bg-casa-tile">
                      <div className="palco grid h-28 place-items-center">
                        <div
                          className="h-14 w-24"
                          style={{ background: "var(--card)", boxShadow: "inset 0 0 0 1px var(--border)", borderRadius: `var(--${t})` }}
                        />
                      </div>
                      <Valor nome={`--${t}`} valor={tokens[t] ?? ""} />
                    </div>
                  ))}
                </div>
              </>
            ) : null}
            {elevacoes.length ? (
              <>
                <Subtitulo>Elevação</Subtitulo>
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {elevacoes.map((t) => (
                    <div key={t} className="overflow-hidden rounded-tile bg-casa-tile">
                      <div className="palco grid h-28 place-items-center">
                        <div
                          className="h-14 w-24"
                          // casa-lint/raio-da-marca: a amostra está no palco; vestir o raio da marca é a prova
                          style={{ background: "var(--card)", boxShadow: `var(--${t})`, borderRadius: "var(--r-surface)" }}
                        />
                      </div>
                      <Valor nome={`--${t}`} valor={tokens[t] ?? ""} />
                    </div>
                  ))}
                </div>
              </>
            ) : null}
            {espacos.length ? (
              <>
                <Subtitulo>Espaço</Subtitulo>
                <div className="grid gap-3 sm:grid-cols-3">
                  {espacos.map((t) => (
                    <div key={t} className="overflow-hidden rounded-tile bg-casa-tile">
                      <div className="palco grid h-20 place-items-center">
                        {/* casa-lint/marca-na-casca: a barra está no palco; a cor é a marca aplicada */}
                        <div className="h-2" style={{ width: `var(--${t})`, background: "var(--brand)" }} />
                      </div>
                      <Valor nome={`--${t}`} valor={tokens[t] ?? ""} />
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </Capitulo>
        ) : null}

        {visivel.movimento ? (
          <Capitulo id="movimento" titulo="Movimento">
            {curvas.length ? (
              <>
                <Subtitulo>Curvas, em 800ms pra ler a forma</Subtitulo>
                <div className="grid gap-3 sm:grid-cols-3">
                  {curvas.map((t) => (
                    <Trilha key={t} nome={t} valor={tokens[t] ?? ""} curva={t} duracao="800ms" />
                  ))}
                </div>
              </>
            ) : null}
            {duracoes.length ? (
              <>
                <Subtitulo>Durações</Subtitulo>
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {duracoes.map((t) => (
                    <Trilha key={t} nome={t} valor={tokens[t] ?? ""} curva="ease-out" duracao={`var(--${t})`} />
                  ))}
                </div>
              </>
            ) : null}
          </Capitulo>
        ) : null}

        {visivel.aplicacao ? (
          <Capitulo id="aplicacao" titulo="Aplicação">
            <Palco className="p-4 sm:p-6">
              <React.Suspense fallback={<div className="h-[420px]" aria-busy="true" />}>
                {/* casa-lint/raio-da-marca: estas superfícies estão no palco; vestir o raio da marca é a prova */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid h-60 place-items-center rounded-[var(--r-surface)] bg-card">
                    <GaugeDemo props={{}} />
                  </div>
                  <div className="grid h-60 place-items-center rounded-[var(--r-surface)] bg-card">
                    <BillingDemo props={{}} />
                  </div>
                  <div className="grid min-h-60 place-items-center overflow-x-auto rounded-[var(--r-surface)] bg-card p-4 md:col-span-2">
                    <HeatmapDemo props={{}} />
                  </div>
                </div>
              </React.Suspense>
            </Palco>
          </Capitulo>
        ) : null}

        {visivel.uso ? (
          <Capitulo id="uso" titulo="Uso">
            <div className="casa grid gap-3 md:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <CopyCommand variant="cta" text={installCommand(`theme-${shown?.slug ?? DEFAULT_BRAND}`)} />
                <p className="text-casa-sm text-casa-fg-2">
                  Escreve os tokens da marca no <code>globals.css</code>. É o caminho de quem tem um cliente só.
                </p>
              </div>
              <div className="min-w-0 space-y-2">
                <CopyCommand text={installCommand("brand-selector")} />
                <p className="text-casa-sm text-casa-fg-2">Instala o seletor e o runtime, pro app trocar de marca no ar.</p>
              </div>
            </div>
          </Capitulo>
        ) : null}
      </div>
    </main>
  );
}
