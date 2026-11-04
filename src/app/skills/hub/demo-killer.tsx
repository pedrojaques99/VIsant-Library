"use client";

/**
 * visant-killer: o cartão do README nasce sendo varrido, os achados caem em cima
 * do próprio elemento e o toque em cima diz qual é a regra. A saída inteira do
 * killer-scan fica na folha. Embaixo, cinco telas de arrastar com o dedo.
 */

import * as React from "react";
import { Check, X } from "lucide-react";
import { PhotoCompare } from "../../../../registry/visant/ui/photo-compare";
import { SAIDA_ABERTA, SAIDA_FECHADA, SLOP_CARTAO } from "./amostras";
import { Acao, ALTURA_LARGA, ANIMA_COR, ANIMA_OPACIDADE, cx, Dobra, LINK, Terminal, useAoEntrar, useMenosMovimento, useSequencia } from "./base";
import { foto, miniatura } from "./fotos";

/** O elemento do cartão e o que o portão diz dele (saída real, linha a linha). */
const ACHADOS = {
  rotulo: { passo: 2, regras: ["opacity-ladder"] },
  titulo: { passo: 2, regras: ["italic-headline-word", "display-serif-tight"] },
  lead: { passo: 1, regras: ["em-dash", "en-hype"] },
  preco: { passo: 0, regras: ["tailwind-palette"] },
};
type Alvo = keyof typeof ACHADOS;

function Marca({ alvo, passo, ativo, onToque }: { alvo: Alvo; passo: number; ativo: Alvo | null; onToque: (a: Alvo) => void }) {
  const a = ACHADOS[alvo];
  const visivel = passo >= a.passo;
  return (
    <button
      type="button"
      data-marca-achado={alvo}
      aria-label={`Ver achado: ${a.regras.join(", ")}`}
      disabled={!visivel}
      onClick={() => onToque(alvo)}
      className={cx(
        "absolute -right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-control outline-none focus-visible:[box-shadow:var(--focus)]",
        ANIMA_OPACIDADE,
        visivel ? "opacity-100" : "opacity-0",
      )}
    >
      <span
        className={cx(
          "grid size-6 place-items-center rounded-[6px] font-casa-mono text-casa-sm tabular-nums",
          ativo === alvo ? "bg-casa-fg text-casa-bg" : "bg-[color:var(--destructive)] text-casa-bg",
        )}
      >
        {a.regras.length}
      </span>
    </button>
  );
}

export function DemoKiller() {
  const [passo, setPasso] = React.useState(-1);
  const [limpo, setLimpo] = React.useState(false);
  const [ativo, setAtivo] = React.useState<Alvo | null>(null);
  const seq = useSequencia();
  const menos = useMenosMovimento();
  const total = Object.values(ACHADOS).filter((a) => passo >= a.passo).reduce((s, a) => s + a.regras.length, 0);

  const varrer = () => {
    seq.limpar();
    setAtivo(null);
    setLimpo(false);
    if (menos) return setPasso(2);
    setPasso(-1);
    [0, 1, 2].forEach((p) => seq.depois(500 + p * 700, () => setPasso(p)));
  };
  const palco = useAoEntrar<HTMLDivElement>(varrer);

  const corrigir = () => {
    seq.limpar();
    setAtivo(null);
    setLimpo(true);
  };

  const saida = limpo ? SAIDA_ABERTA : SAIDA_FECHADA;
  const fim = passo >= 2;

  return (
    <Dobra
      nome="visant-killer"
      faixa
      como={
        <>
          <p>Roda quatro detectores no seu código e, se achar slop, não deixa passar. Depois abre a tela, discute com o próprio veredito e dá uma nota.</p>
          <Terminal>{saida.map((l) => l.linha).join("\n")}</Terminal>
          <a href="/skills/killer" data-para-killer className={cx(LINK, "mt-3 inline-block text-casa-fg-2")}>
            Ver como o killer audita
          </a>
        </>
      }
    >
      <div ref={palco} className="flex min-w-0 flex-col gap-3 lg:mx-auto lg:w-full lg:max-w-4xl" data-demo="killer">
        <div className="relative min-w-0 overflow-hidden rounded-tile bg-casa-bg p-5 pr-12 lg:p-10 lg:pr-14">
          <div className="grid">
            <div data-cartao="limpo" aria-hidden={!limpo} className={cx("col-start-1 row-start-1 flex flex-col justify-between", ANIMA_OPACIDADE, !limpo && "invisible opacity-0")}>
              <div>
                <p className="text-[1.75rem] font-medium leading-tight lg:text-[2.5rem]">Pro</p>
                <p className="mt-2 text-casa-lg text-casa-fg-2">For studios with up to 5 people.</p>
              </div>
              <p className="text-[1.75rem] text-casa-fg lg:text-[2.25rem]">$49 per month</p>
            </div>
            <div data-cartao="slop" aria-hidden={limpo} className={cx("col-start-1 row-start-1 space-y-3", limpo && "invisible")}>
              <div className="relative">
                <p className="font-casa-mono text-casa-sm uppercase tracking-widest text-casa-fg-3">{SLOP_CARTAO.rotulo}</p>
                <Marca alvo="rotulo" passo={passo} ativo={ativo} onToque={setAtivo} />
              </div>
              <div className="relative">
                {/* EXCEPTION to noise-scan/display-serif-tight: é o cartão de slop que a demo reprova de propósito */}
                <p className="pr-6 font-serif text-[1.75rem] leading-tight tracking-tighter lg:text-[2.5rem]">
                  {SLOP_CARTAO.titulo} <em>{SLOP_CARTAO.enfase}</em>
                </p>
                <Marca alvo="titulo" passo={passo} ativo={ativo} onToque={setAtivo} />
              </div>
              <div className="relative">
                <p className="pr-6 text-casa-base text-casa-fg-2">{SLOP_CARTAO.lead}</p>
                <Marca alvo="lead" passo={passo} ativo={ativo} onToque={setAtivo} />
              </div>
              <div className="relative">
                <p className="rounded-control border border-casa-line p-3 text-casa-lg" style={{ color: SLOP_CARTAO.cor }}>
                  {SLOP_CARTAO.preco}
                </p>
                <Marca alvo="preco" passo={passo} ativo={ativo} onToque={setAtivo} />
              </div>
            </div>
          </div>
          {/* a varredura: atravessa uma vez por rodada */}
          {!limpo && !fim && !menos ? (
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-casa-fg"
              style={{ transform: `translateY(${(passo + 1) * 7}rem)`, transition: "transform 700ms linear" }}
            />
          ) : null}
        </div>
        <div className="flex min-h-11 items-center justify-between gap-3">
          <p className="flex min-w-0 items-center gap-2" aria-live="polite" data-gate>
            {limpo ? <Check className="size-6 shrink-0" /> : <X className="size-6 shrink-0 text-[color:var(--destructive)]" />}
            <span className="text-[2rem] font-medium leading-none tabular-nums" data-total>
              {limpo ? 0 : total}
            </span>
            {ativo ? (
              <span className={cx("min-w-0 font-casa-mono text-casa-sm text-casa-fg-2", ANIMA_COR)} data-regra>
                {ACHADOS[ativo].regras.join(", ")}
              </span>
            ) : null}
          </p>
          <Acao onClick={limpo ? varrer : corrigir} secundaria={limpo} data-acao="killer">
            {limpo ? "De novo" : "Corrigir"}
          </Acao>
        </div>
      </div>
    </Dobra>
  );
}

const TELAS = [
  { id: "mata", nome: "café" },
  { id: "pauta", nome: "agenda" },
  { id: "checkout", nome: "checkout" },
  { id: "landing", nome: "landing" },
  { id: "settings", nome: "configurações" },
];

const TAMANHOS = "(min-width: 1024px) 896px, 100vw";

/** Arrasta a cortina. As miniaturas trocam a tela, sem palavra nenhuma. */
export function TelasKiller() {
  const [id, setId] = React.useState(TELAS[0].id);
  const t = TELAS.find((x) => x.id === id) ?? TELAS[0];
  return (
    <section className="bg-casa-tile" data-demo="telas" aria-label="Antes e depois em cinco telas, com marcas inventadas">
      <div className={cx("shell flex min-w-0 flex-col justify-center gap-3 py-6 lg:py-8", ALTURA_LARGA)}>
        <div data-sobreposicao className="contents">
        <div className="w-full min-w-0 lg:mx-auto lg:max-w-4xl">
        <PhotoCompare
          key={t.id}
          ratio="880/580"
          label={`Antes e depois da tela de ${t.nome}`}
          beforeLabel={null}
          afterLabel={null}
          before={<img {...foto(`${t.id}-a`)} sizes={TAMANHOS} alt="" loading="lazy" decoding="async" />}
          after={<img {...foto(`${t.id}-d`)} sizes={TAMANHOS} alt="" loading="lazy" decoding="async" />}
          className="w-full overflow-hidden rounded-tile"
        />
        <p className="mt-1.5 flex justify-between px-1 text-casa-sm text-casa-fg-2">
          <span>depois</span>
          <span>antes</span>
        </p>
        </div>
        </div>
        <div className="flex justify-center gap-2" role="group" aria-label="Escolher a tela">
          {TELAS.map((x) => (
            <button
              key={x.id}
              type="button"
              data-tela={x.id}
              aria-pressed={x.id === id}
              aria-label={x.nome}
              onClick={() => setId(x.id)}
              className={cx(
                "h-11 w-14 overflow-hidden rounded-[8px] outline-none focus-visible:[box-shadow:var(--focus)]",
                ANIMA_OPACIDADE,
                x.id === id ? "opacity-100 [box-shadow:0_0_0_2px_var(--casa-fg)]" : "opacity-50",
              )}
            >
              <img src={miniatura(`${x.id}-d`)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} className="size-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
