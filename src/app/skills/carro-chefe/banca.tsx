"use client";

/**
 * A banca: o card na tela, o terminal ao lado, e o visitante consertando.
 *
 * Nada do terminal é escrito aqui. Cada estado do card tem a saída gravada pelo
 * `captura.mjs`, que rodou o killer-scan de verdade sobre aquele TSX. Consertar
 * um achado só troca de gravação: se o scanner mudar de ideia, o script regrava.
 */

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowDown, RotateCcw, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Aba, Icone } from "../../casa-ui";
import { TextMorph } from "../../../../registry/visant/ui/text-morph";
import scan from "./scan.generated.json";
import { ALVOS, cartao, chaveDe, fonte, type Conserto, type No } from "./reu";

type Gravacao = { codigo: number; linhas: number[] };
const GRAVADO = scan as unknown as {
  comando: string;
  comandoFinal: string;
  dicionario: string[];
  estados: Record<string, Gravacao>;
  julgado: Gravacao;
  aberto: Gravacao;
};

export const lerSaida = (g: Gravacao) => g.linhas.map((i) => GRAVADO.dicionario[i]);
export const SAIDA_ABERTA = lerSaida(GRAVADO.aberto);
export const COMANDO_FINAL = GRAVADO.comandoFinal;

const RE_ACHADO = /^\s+src\/Pricing\.tsx:(\d+)\s+(\S+)/;
/** O intervalo do terminal imprimindo: rápido o bastante pra caber no olhar da dobra. */
const PASSO_MS = 150;
/* O espelho em JS de --dur-fast, --dur-base e --ease-out: este repo não tem módulo de motion pra importar. */
const DUR_FAST = 0.16;
const DUR_BASE = 0.2;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const useHidratado = () => {
  const [ok, setOk] = React.useState(false);
  React.useEffect(() => setOk(true), []);
  return ok;
};

/* ------------------------------------------------------------------ o réu */

function NoDoReu({ no, aceso }: { no: No; aceso: ReadonlySet<string> }) {
  const texto = no.filhos.filter((f) => typeof f === "string").join("");
  const filhos = no.filhos.map((f, i) => (typeof f === "string" ? f : <NoDoReu key={f.id + i} no={f} aceso={aceso} />));
  /* A página já tem um h1. Na tela o título do réu vira heading de nível 3, com as mesmas classes. */
  const props: Record<string, unknown> = {
    className: cn(no.cls, "animate-in fade-in motion-reduce:animate-none [animation-duration:var(--dur-base)]"),
    "data-alvo": no.id,
    "data-aceso": aceso.has(no.id) ? "" : undefined,
    /* O réu tem borda na cor do texto (o padrão do Tailwind v4): é assim que o roxo aparece. */
    style: no.id === "caixa" && no.cls?.includes("border") ? { borderColor: "currentColor" } : undefined,
  };
  const chave = `${no.id}:${no.cls}:${texto}`;
  if (no.tag === "h1") return <div key={chave} role="heading" aria-level={3} {...props}>{filhos}</div>;
  if (no.tag === "button") return <button key={chave} type="button" tabIndex={-1} {...props}>{filhos}</button>;
  return React.createElement(no.tag === "section" ? "div" : no.tag, { key: chave, ...props }, ...filhos);
}

/**
 * O réu sempre em fundo escuro: o card pede `text-white`, então ele existe num palco
 * escuro nos dois temas. `--primary` não está no escopo `.casa`, por isso vem aqui.
 */
export function CartaoReu({
  no,
  aceso = new Set(),
  ativo,
  className,
}: {
  no: No;
  aceso?: ReadonlySet<string>;
  ativo?: { alvo: string; texto: string } | null;
  className?: string;
}) {
  const palco = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);

  React.useLayoutEffect(() => {
    const raiz = palco.current;
    if (!ativo || !raiz) {
      setPos(null);
      return;
    }
    const medir = () => {
      const alvo = raiz.querySelector(`[data-alvo="${ativo.alvo}"]`);
      if (!alvo) return setPos(null);
      const a = alvo.getBoundingClientRect();
      const r = raiz.getBoundingClientRect();
      setPos({ x: Math.max(8, a.left - r.left), y: Math.max(4, a.top - r.top - 24) });
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(raiz);
    return () => ro.disconnect();
  }, [ativo, no]);

  return (
    <div
      ref={palco}
      lang="en"
      style={{ "--primary": "var(--casa-fg)" } as React.CSSProperties}
      className={cn(
        "casa dark relative flex items-center justify-center bg-casa-tile text-casa-fg",
        "[&_[data-aceso]]:outline [&_[data-aceso]]:outline-1 [&_[data-aceso]]:outline-offset-2 [&_[data-aceso]]:outline-destructive",
        className,
      )}
    >
      <div className="w-full max-w-[440px] max-lg:[zoom:0.82]">
        <NoDoReu no={no} aceso={aceso} />
      </div>
      {pos && ativo ? (
        <span
          style={{ left: pos.x, top: pos.y, maxWidth: `calc(100% - ${pos.x + 8}px)` }}
          className="pointer-events-none absolute z-10 rounded-[4px] bg-destructive px-1.5 py-0.5 font-casa-mono text-casa-sm text-destructive-foreground"
        >
          {ativo.texto}
        </span>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------- a saída */

type Linha = { chave: string; texto: string; achado: { linha: number; regra: string } | null };

function indexar(saida: string[]): Linha[] {
  const vistos = new Map<string, number>();
  return saida.map((texto) => {
    const n = vistos.get(texto) ?? 0;
    vistos.set(texto, n + 1);
    const m = RE_ACHADO.exec(texto);
    return { chave: `${texto}#${n}`, texto, achado: m ? { linha: Number(m[1]), regra: m[2] } : null };
  });
}

function tomDaLinha(t: string) {
  if (/^\[FAIL\]|^GATE CLOSED/.test(t)) return "text-destructive";
  if (/^GATE (OPEN|INCOMPLETE)/.test(t)) return "text-casa-fg";
  if (/^\[OK\]/.test(t)) return "text-casa-fg-2";
  return "text-casa-fg-3";
}

/** Uma linha da saída, exatamente como veio. A régua de traços não quebra: corta. */
function TextoDaLinha({ texto }: { texto: string }) {
  const regua = /^-{20,}$/.test(texto);
  const recuo = /^\s/.test(texto);
  return (
    <span
      className={cn(
        "block min-h-5",
        regua ? "overflow-hidden whitespace-nowrap" : "whitespace-pre-wrap [overflow-wrap:anywhere]",
        recuo && "pl-[2ch] lg:pl-[12ch]",
        tomDaLinha(texto),
      )}
    >
      {recuo ? texto.trimStart() : texto}
    </span>
  );
}

/** A saída sem botões, para quando o terminal só mostra (o GATE OPEN do julgamento). */
export function SaidaGravada({ comando, saida }: { comando: string; saida: string[] }) {
  return (
    <div className="font-casa-mono text-casa-sm leading-5">
      <p className="mb-3 text-casa-fg [overflow-wrap:anywhere]">$ {comando}</p>
      {saida.map((t, i) => (
        <TextoDaLinha key={i} texto={t} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- a banca */

function primeiraDiferenca(antes: string, depois: string) {
  const a = antes.split("\n");
  const d = depois.split("\n");
  const pares: { linha: number; menos: string; mais: string }[] = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== d[i]) pares.push({ linha: i + 1, menos: a[i].trim(), mais: (d[i] ?? "").trim() });
  }
  return pares;
}

export function Banca({ aoLiberar }: { aoLiberar: () => void }) {
  const reduzir = useReducedMotion();
  const hidratado = useHidratado();
  const [consertos, setConsertos] = React.useState<ReadonlySet<Conserto>>(new Set());
  const [aba, setAba] = React.useState<"tela" | "codigo">("tela");
  const [ultimo, setUltimo] = React.useState<ReturnType<typeof primeiraDiferenca>>([]);
  const [sobre, setSobre] = React.useState<string | null>(null);

  const saida = React.useMemo(() => indexar(lerSaida(GRAVADO.estados[chaveDe(consertos)])), [consertos]);
  const no = React.useMemo(() => cartao(consertos), [consertos]);
  const tsx = React.useMemo(() => fonte(no), [no]);

  /* Quantas linhas já imprimiram. Começa cheio: sem JS, no prerender e em reduced-motion a resposta está lá. */
  const [impressas, setImpressas] = React.useState(Number.POSITIVE_INFINITY);
  const [rodada, setRodada] = React.useState(0);

  React.useEffect(() => {
    if (!hidratado || reduzir) return;
    setImpressas(0);
    const total = indexar(lerSaida(GRAVADO.estados[0])).length;
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      setImpressas(n);
      if (n >= total) {
        clearInterval(id);
        setImpressas(Number.POSITIVE_INFINITY);
      }
    }, PASSO_MS);
    return () => clearInterval(id);
  }, [hidratado, reduzir, rodada]);

  const imprimindo = Number.isFinite(impressas);
  const visiveis = imprimindo ? saida.slice(0, impressas) : saida;
  const achados = visiveis.flatMap((l) => (l.achado ? [l.achado] : []));
  const acesos = React.useMemo(() => {
    const s = new Set<string>();
    for (const a of achados) for (const alvo of ALVOS[a.regra]?.alvos ?? []) s.add(alvo);
    return s;
  }, [achados.map((a) => a.regra).join()]);

  /* O ponto em foco: o último achado impresso, ou o que o ponteiro está lendo. */
  const emFoco = sobre ?? (imprimindo ? achados[achados.length - 1]?.regra ?? null : null);
  const achadoEmFoco = achados.find((a) => a.regra === emFoco);
  const ativo =
    achadoEmFoco && aba === "tela"
      ? { alvo: ALVOS[achadoEmFoco.regra].alvos[0], texto: `:${achadoEmFoco.linha} ${achadoEmFoco.regra}` }
      : null;

  const veredito = imprimindo ? null : /GATE (CLOSED|INCOMPLETE|OPEN)/.exec(saida.map((l) => l.texto).join("\n"))?.[0] ?? null;
  const totalDeAchados = saida.filter((l) => l.achado).length;
  const fechado = veredito === "GATE CLOSED";

  const consertar = (regra: string) => {
    const alvo = ALVOS[regra];
    if (!alvo) return;
    const proximo = new Set(consertos);
    proximo.add(alvo.conserto);
    setUltimo(primeiraDiferenca(tsx, fonte(cartao(proximo))));
    setSobre(null);
    setConsertos(proximo);
  };

  const recomecar = () => {
    setConsertos(new Set());
    setUltimo([]);
    setSobre(null);
    setRodada((r) => r + 1);
  };

  const linhasDoCodigo = tsx.trimEnd().split("\n");
  const linhaEmFoco = achadoEmFoco?.linha;
  const linhasMarcadas = new Set(achados.map((a) => a.linha));

  return (
    <div className="casa dark bg-casa-tile text-casa-fg">
      <div className="shell flex flex-col gap-6 py-6 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 lg:py-10">
        <div className="max-lg:contents lg:flex lg:flex-col lg:gap-4">
          <div className="flex items-center gap-4">
            <Aba ativa={aba === "tela"} onClick={() => setAba("tela")}>Tela</Aba>
            <Aba ativa={aba === "codigo"} onClick={() => setAba("codigo")}>Código</Aba>
            <code className="ml-auto font-casa-mono text-casa-sm text-casa-fg-3">src/Pricing.tsx</code>
          </div>

          {aba === "tela" ? (
            <CartaoReu
              no={no}
              aceso={acesos}
              ativo={ativo}
              className="min-h-[300px] py-7 max-lg:sticky max-lg:top-[var(--shell-header-h)] max-lg:z-20 lg:min-h-[420px]"
            />
          ) : (
            <ol lang="en" className="min-h-[300px] font-casa-mono text-casa-sm leading-5 lg:min-h-[420px]">
              {linhasDoCodigo.map((l, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex gap-3 rounded-[4px] px-1 transition-colors [transition-duration:var(--dur-fast)]",
                    linhasMarcadas.has(i + 1) && "text-destructive",
                    linhaEmFoco === i + 1 && "bg-casa-tile-2",
                  )}
                >
                  <span className="w-5 shrink-0 text-right tabular-nums text-casa-fg-3">{i + 1}</span>
                  <span className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]">{l}</span>
                </li>
              ))}
            </ol>
          )}

          <div className="min-h-[60px] font-casa-mono text-casa-sm leading-5" lang="en">
            {ultimo.length ? (
              <>
                <p className="[overflow-wrap:anywhere] text-casa-fg-3">
                  {ultimo[0].linha}: - {ultimo[0].menos}
                </p>
                <p className="[overflow-wrap:anywhere] text-casa-fg">
                  {ultimo[0].linha}: + {ultimo[0].mais}
                </p>
                {ultimo.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setAba("codigo")}
                    className="alvo-toque text-casa-fg-2 underline underline-offset-2 hover:text-casa-fg"
                    lang="pt-BR"
                  >
                    e mais {ultimo.length - 1} linhas
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-5 flex items-center gap-3">
            <p role="status" className="text-casa-xl font-medium tabular-nums">
              <TextMorph className={veredito === null ? "text-casa-fg-3" : fechado ? "text-destructive" : "text-casa-fg"}>{veredito ?? "Rodando"}</TextMorph>
            </p>
            <p className="text-casa-base tabular-nums text-casa-fg-2">
              {imprimindo ? `${achados.length} até agora` : totalDeAchados === 1 ? "1 achado" : `${totalDeAchados} achados`}
            </p>
            <Icone rotulo="Voltar pro card original e rodar de novo" onClick={recomecar} className="ml-auto">
              <RotateCcw className="h-4 w-4" />
            </Icone>
          </div>

          <p className="mb-3 font-casa-mono text-casa-sm leading-5 text-casa-fg [overflow-wrap:anywhere]">$ {GRAVADO.comando}</p>

          <div className="font-casa-mono text-casa-sm leading-5" lang="en">
            <AnimatePresence initial={false}>
              {saida.map((l, i) => {
                const impressa = i < impressas;
                const regra = l.achado?.regra;
                return (
                  <motion.div
                    key={l.chave}
                    layout={reduzir ? false : "position"}
                    transition={{ duration: DUR_BASE, ease: EASE_OUT }}
                    exit={{ opacity: 0, transition: { duration: DUR_FAST } }}
                    style={{ opacity: impressa ? 1 : 0 }}
                  >
                    {regra && ALVOS[regra] ? (
                      <button
                        type="button"
                        disabled={imprimindo}
                        onClick={() => consertar(regra)}
                        onPointerEnter={() => setSobre(regra)}
                        onPointerLeave={() => setSobre(null)}
                        onFocus={() => setSobre(regra)}
                        onBlur={() => setSobre(null)}
                        aria-label={`Consertar ${regra}, linha ${l.achado?.linha}`}
                        className={cn(
                          "alvo-toque group -mx-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-[6px] px-2 py-0.5 text-left",
                          "transition-colors [transition-duration:var(--dur-fast)] hover:bg-casa-tile-2 focus-visible:bg-casa-tile-2",
                        )}
                      >
                        <span className="min-w-0 flex-1 whitespace-pre-wrap pl-[2ch] text-casa-fg [overflow-wrap:anywhere] lg:pl-[12ch]">{l.texto.trimStart()}</span>
                        <span className="flex shrink-0 items-center gap-1 font-casa text-casa-sm text-casa-fg-2 group-hover:text-casa-fg" lang="pt-BR">
                          <Wrench className="h-3 w-3" aria-hidden />
                          consertar
                        </span>
                      </button>
                    ) : (
                      <TextoDaLinha texto={l.texto} />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {veredito === "GATE INCOMPLETE" ? (
            <button
              type="button"
              onClick={aoLiberar}
              className="alvo-toque mt-6 flex items-center gap-2 rounded-control text-casa-lg text-casa-fg underline underline-offset-4 animate-in fade-in motion-reduce:animate-none"
            >
              Abrir o que o script não vê
              <ArrowDown className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

