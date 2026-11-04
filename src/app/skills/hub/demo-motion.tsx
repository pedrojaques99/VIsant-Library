"use client";

/**
 * visant-motion: a mesma interação duas vezes, lado a lado e no mesmo instante.
 *
 * As peças são blocos sem texto, porque o assunto é o movimento: o que mexe vai aceso e o
 * resto fica apagado. A saída do motion-lint fica na folha.
 */

import * as React from "react";
import { Check, X } from "lucide-react";
import { Trocador, useUmPorVez } from "../../demos/um-por-vez";
import { CENAS_MOTION, CURVA_ERRADA, ESCALA_ERRADA, erradaEm, TRANSICAO_ERRADA, type DadosCena } from "./amostras";
import { Acao, cx, Dobra, Terminal, useMenosMovimento, useNaTela, useSequencia } from "./base";

type Cena = keyof typeof CENAS_MOTION;
type Lado = { errado: boolean; fase: number; seco: boolean };

const CENAS = Object.keys(CENAS_MOTION) as Cena[];
const CICLO_MS = 2800;

const MIOLO = "absolute inset-4 lg:inset-x-[18%] lg:inset-y-10";
const QUIETO = "rounded-[6px] bg-casa-tile-2";
const ACESO = "rounded-[6px] bg-casa-fg";
const certoEm = (dur: string, curva = "--ease-out") => `transform var(${dur}) var(${curva}), opacity var(${dur}) var(${curva})`;

function Linhas({ className }: { className?: string }) {
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={cx("flex-1", QUIETO)} />
      ))}
    </div>
  );
}

function Gaveta({ errado, fase, seco }: Lado) {
  const aberta = fase >= 1;
  const transicao = seco ? "none" : errado ? `${erradaEm("width")}, ${erradaEm("right")}` : certoEm("--dur-slow", "--ease-drawer");
  return (
    <>
      <div className={MIOLO} style={errado ? { right: aberta ? "54%" : undefined, transition: transicao } : undefined}>
        <Linhas className="h-full" />
      </div>
      <div
        className={cx("absolute inset-y-0 right-0", ACESO)}
        style={errado ? { width: aberta ? "50%" : 0, transition: transicao } : { width: "50%", transform: aberta ? "none" : "translateX(100%)", transition: transicao }}
      />
    </>
  );
}

function Lista({ errado, fase, seco }: Lado) {
  const saiu = fase >= 1;
  const subiu = errado ? fase >= 2 : fase >= 1;
  return (
    <div className={cx(MIOLO, "flex flex-col gap-2")}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cx("flex-1", i === 1 ? ACESO : QUIETO)}
          style={{
            transition: seco || errado ? "none" : certoEm(i === 1 ? "--dur-fast" : "--dur-base"),
            opacity: i === 1 && saiu ? 0 : 1,
            transform: i === 1 && saiu ? "scale(0.96)" : i > 1 && subiu ? "translateY(calc(-100% - 0.5rem))" : undefined,
          }}
        />
      ))}
    </div>
  );
}

function Espera({ errado, fase, seco }: Lado) {
  const carregando = fase === 1;
  return (
    <>
      {errado && carregando ? (
        <div className="absolute left-1/2 top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-casa-fg-3 border-t-casa-fg" />
      ) : null}
      <div
        className={cx(MIOLO, "flex flex-col gap-2")}
        style={errado ? { opacity: carregando ? 0 : 1, transform: fase === 2 ? "translateY(2rem)" : undefined } : undefined}
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cx("relative flex-1", QUIETO, !errado && carregando && "motion-safe:animate-pulse")}>
            <div
              className={cx("absolute inset-y-[35%] left-3", ACESO)}
              style={{ width: `${55 - i * 8}%`, opacity: !errado && carregando ? 0 : 1, transition: seco || errado ? "none" : certoEm("--dur-base") }}
            />
          </div>
        ))}
      </div>
    </>
  );
}

function Avisos({ errado, fase, seco }: Lado) {
  return (
    <div className={MIOLO}>
      <div className={cx("absolute inset-0", QUIETO)} />
      {[0, 1, 2].map((i) => {
        const veio = i < fase;
        const atras = fase - 1 - i;
        return errado ? (
          <div
            key={i}
            className={cx("absolute inset-x-[6%] h-[22%]", ACESO)}
            style={{ opacity: veio ? 1 : 0, top: `calc(4% + ${Math.max(atras, 0) * 31}%)`, zIndex: i, transition: seco ? "none" : erradaEm("top") }}
          />
        ) : (
          <div
            key={i}
            className={cx("absolute inset-x-[6%] bottom-[4%] h-[22%]", ACESO)}
            style={{
              opacity: veio ? 1 - atras * 0.3 : 0,
              transform: veio ? `translateY(${-atras * 22}%) scale(${1 - atras * 0.06})` : "translateY(130%)",
              zIndex: i,
              transition: seco ? "none" : certoEm("--dur-base"),
            }}
          />
        );
      })}
    </div>
  );
}

function Cartaz({ errado, fase, seco }: Lado) {
  const aberto = fase >= 1;
  const transicao = seco ? "none" : errado ? TRANSICAO_ERRADA : certoEm("--dur-slow");
  return (
    <div className={MIOLO}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={cx("absolute size-[48%]", i === 0 ? ACESO : QUIETO, i % 2 ? "right-0" : "left-0", i > 1 ? "bottom-0" : "top-0")} />
      ))}
      <div
        className={cx("absolute inset-0 z-10 flex flex-col justify-end gap-2 p-3", ACESO)}
        style={{
          transformOrigin: errado ? "center" : "top left",
          transform: aberto ? "scale(1)" : errado ? ESCALA_ERRADA : "scale(0.48)",
          opacity: errado && !aberto ? 0 : 1,
          transition: transicao,
        }}
      >
        {[0, 1].map((i) => (
          <span
            key={i}
            className={cx("block h-2 rounded-[2px] bg-casa-bg", i === 0 ? "w-3/4" : "w-1/2")}
            style={{ opacity: aberto || errado ? 1 : 0, transition: seco || errado ? "none" : "opacity var(--dur-base) var(--ease-out) var(--dur-base)" }}
          />
        ))}
      </div>
    </div>
  );
}

function Surge({ errado, fase, seco, cena }: Lado & { cena: "menu" | "modal" }) {
  const aberto = fase >= 1;
  const transicao = seco ? "none" : errado ? TRANSICAO_ERRADA : certoEm(cena === "menu" ? "--dur-base" : "--dur-slow");
  return (
    <div className={MIOLO}>
      {cena === "menu" ? <div className={cx("absolute left-0 top-0 size-8", QUIETO)} /> : <Linhas className="absolute inset-0" />}
      <div
        data-painel={errado ? "errado" : "certo"}
        className={cx("absolute", ACESO, cena === "menu" ? "left-0 top-10 h-1/2 w-2/3" : "inset-x-[8%] top-1/4 h-1/2")}
        style={{
          transition: transicao,
          transform: aberto ? "scale(1)" : errado ? ESCALA_ERRADA : "scale(0.95)",
          opacity: aberto ? 1 : 0,
          transformOrigin: cena === "menu" && !errado ? "top left" : "center",
        }}
      />
    </div>
  );
}

function Botao({ errado, fase, seco }: Lado) {
  const apertado = errado ? fase === 1 || fase === 2 : fase === 1;
  return (
    <div className="grid h-full place-items-center">
      <div
        data-press={errado ? "errado" : "certo"}
        className={cx("h-14 w-2/3", ACESO)}
        style={{
          transition: seco ? "none" : errado ? TRANSICAO_ERRADA : "transform var(--dur-press) var(--ease-out)",
          transform: apertado ? `scale(${errado ? 0.9 : 0.97})` : "scale(1)",
        }}
      />
    </div>
  );
}

function Palco({ cena, ...lado }: Lado & { cena: Cena }) {
  switch (cena) {
    case "gaveta":
      return <Gaveta {...lado} />;
    case "lista":
      return <Lista {...lado} />;
    case "espera":
      return <Espera {...lado} />;
    case "avisos":
      return <Avisos {...lado} />;
    case "cartaz":
      return <Cartaz {...lado} />;
    case "botao":
      return <Botao {...lado} />;
    default:
      return <Surge {...lado} cena={cena} />;
  }
}

function Curva({ p }: { p: readonly [number, number, number, number] }) {
  const [a, b, c, d] = p;
  return (
    <svg viewBox="-1 -1 42 42" className="hidden size-6 shrink-0 sm:block" aria-hidden="true">
      <path d="M0 40H40M0 40V0" fill="none" stroke="var(--casa-fg-3)" />
      <path d={`M0 40 C${a * 40} ${40 - b * 40} ${c * 40} ${40 - d * 40} 40 0`} fill="none" stroke="var(--casa-fg)" strokeWidth="2" />
    </svg>
  );
}

export function DemoMotion() {
  const { atual: cena, rodada, passo, repetir } = useUmPorVez(CENAS);
  const [fase, setFase] = React.useState(0);
  const [seco, setSeco] = React.useState(true);
  const [mao, setMao] = React.useState(false);
  const seq = useSequencia();
  const menos = useMenosMovimento();
  const [palco, naTela] = useNaTela<HTMLDivElement>();
  const dados: DadosCena = CENAS_MOTION[cena];

  /* Volta ao zero sem animar e toca os dois juntos: a comparação é sempre do começo. */
  const disparar = React.useCallback(() => {
    seq.limpar();
    setSeco(true);
    setFase(0);
    seq.depois(60, () => {
      setSeco(false);
      dados.tempos.forEach((ms, i) => seq.depois(30 + ms, () => setFase(i + 1)));
    });
  }, [seq, dados]);

  /* Antes de pintar: a cena nova nunca aparece um quadro no estado final da anterior. */
  React.useLayoutEffect(() => {
    if (!naTela) return;
    if (menos) {
      seq.limpar();
      setSeco(true);
      setFase(dados.tempos.length);
      return;
    }
    disparar();
    if (mao) return;
    const id = setInterval(disparar, CICLO_MS);
    return () => clearInterval(id);
  }, [naTela, menos, mao, rodada, dados, disparar, seq]);

  const lados = [
    { errado: true, legenda: dados.legenda.errado, ms: dados.msErrado, curva: dados.msErrado ? CURVA_ERRADA.p : null },
    { errado: false, legenda: dados.legenda.certo, ms: dados.ms, curva: dados.curvaCerta.p },
  ];

  return (
    <Dobra
      nome="visant-motion"
      faixa
      como={
        <>
          {dados.lint.length ? (
            <>
              <p>A mesma interação feita errado e feita certo. O motion-lint reprova a primeira:</p>
              <Terminal className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                {dados.codigoErrado}
                {"\n\n"}
                {dados.lint.join("\n")}
              </Terminal>
            </>
          ) : (
            <>
              <p>A mesma interação feita errado e feita certo. Este erro o motion-lint deixa passar: quem pega é a regra da skill.</p>
              <Terminal className="whitespace-pre-wrap [overflow-wrap:anywhere]">{dados.codigoErrado}</Terminal>
            </>
          )}
          <p className="mt-3">E não acha nada na segunda:</p>
          <Terminal className="whitespace-pre-wrap [overflow-wrap:anywhere]">
            {dados.codigoCerto}
            {"\n\n"}
            motion-lint: clean
          </Terminal>
        </>
      }
    >
      <div ref={palco} className="flex min-w-0 flex-col gap-3" data-demo="motion" data-cena={cena}>
        <div className="grid min-w-0 grid-cols-2 gap-2 lg:gap-3">
          {lados.map((l) => (
            <div key={String(l.errado)} className="min-w-0">
              {/* O modo Analisar, sempre ligado: caixa e etiqueta nas cores dos filmes, por fora do que se move. */}
              <div
                aria-hidden="true"
                data-lado={l.errado ? "errado" : "certo"}
                className="relative isolate h-56 overflow-hidden rounded-tile bg-casa-bg sm:h-72 lg:h-[clamp(18rem,52svh,30rem)]"
              >
                <Palco key={cena} cena={cena} errado={l.errado} fase={fase} seco={seco} />
                <div className="pointer-events-none absolute inset-0 z-20 rounded-tile" style={{ boxShadow: `inset 0 0 0 1.5px var(${l.errado ? "--marca-antes" : "--marca-depois"})` }} />
              </div>
              <div className="mt-2 flex min-w-0 items-start justify-between gap-2 px-1 text-casa-sm text-casa-fg-2">
                <p className="flex min-w-0 items-start gap-1.5">
                  {l.errado ? <X className="mt-0.5 size-4 shrink-0 text-[color:var(--destructive)]" aria-label="Errada" /> : <Check className="mt-0.5 size-4 shrink-0 text-casa-fg" aria-label="Certa" />}
                  <span
                    data-marca-cena
                    className="min-w-0 rounded-[3px] px-1 font-casa-mono text-[10px] leading-[1.5] sm:text-xs"
                    style={{ background: `var(${l.errado ? "--marca-antes" : "--marca-depois"})`, color: "var(--marca-texto)" }}
                  >
                    {l.legenda}
                  </span>
                </p>
                <span className="flex shrink-0 items-center gap-2 font-casa-mono">
                  {l.curva ? <Curva p={l.curva} /> : null}
                  {l.ms} ms
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <Trocador
            nome={dados.nome}
            rotulo="cena"
            onPasso={(d) => {
              setMao(false);
              passo(d);
            }}
            onRepetir={repetir}
          />
          <Acao
            secundaria
            onClick={() => {
              setMao(true);
              repetir();
            }}
            data-acao="motion"
          >
            De novo
          </Acao>
        </div>
      </div>
    </Dobra>
  );
}
