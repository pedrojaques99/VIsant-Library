"use client";

/**
 * visant-motion: a mesma interação duas vezes. A diferença entre os dois lados
 * é só o que `amostras.ts` declara, e a lista embaixo é a saída real do
 * motion-lint para cada um dos dois trechos de código.
 */

import * as React from "react";
import { SegmentedControl } from "../../../../registry/visant/ui/segmented-control";
import { CENAS_MOTION, CURVA_CERTA, CURVA_ERRADA, ESCALA_ERRADA, LENTO_MS, TRANSICAO_ERRADA } from "./amostras";
import { Acao, cx, Terminal, useMenosMovimento, useSequencia } from "./base";

type Cena = keyof typeof CENAS_MOTION;

function caminho(p: readonly [number, number, number, number]) {
  const [a, b, c, d] = p;
  return `M0 40 C${a * 40} ${40 - b * 40} ${c * 40} ${40 - d * 40} 40 0`;
}

/** A curva desenhada: o eixo do tempo é a base, o do valor é a altura. */
function Curva({ pontos }: { pontos: readonly [number, number, number, number] }) {
  return (
    <svg viewBox="-1 -1 42 42" className="size-10 shrink-0" aria-hidden="true">
      <path d="M0 40H40M0 40V0" fill="none" stroke="var(--casa-line)" />
      <path d={caminho(pontos)} fill="none" stroke="var(--casa-fg)" strokeWidth="1.5" />
    </svg>
  );
}

function Palco({ cena, errado, aberto, seco, onAlternar }: { cena: Cena; errado: boolean; aberto: boolean; seco: boolean; onAlternar: () => void }) {
  const dados = CENAS_MOTION[cena];
  const transicao = seco
    ? "none"
    : errado
    ? TRANSICAO_ERRADA
    : `transform ${dados.ms}ms var(--ease-out), opacity ${dados.ms}ms var(--ease-out)`;

  if (cena === "botao") {
    return (
      <div className="grid h-full place-items-center">
        <button
          type="button"
          data-press={errado ? "errado" : "certo"}
          onClick={onAlternar}
          style={{ transition: transicao, transform: aberto ? `scale(${errado ? 0.9 : 0.97})` : "scale(1)" }}
          className="alvo-toque h-11 rounded-control bg-casa-cta px-6 text-casa-base font-medium text-casa-cta-fg outline-none focus-visible:[box-shadow:var(--focus)]"
        >
          Salvar
        </button>
      </div>
    );
  }

  const surge = (
    <div
      aria-hidden={!aberto}
      data-painel={errado ? "errado" : "certo"}
      style={{
        transition: transicao,
        transform: aberto ? "scale(1)" : errado ? ESCALA_ERRADA : "scale(0.95)",
        opacity: aberto ? 1 : 0,
        transformOrigin: cena === "modal" || errado ? "center" : "top left",
      }}
      className={cx(
        "rounded-control bg-casa-tile-2 [box-shadow:var(--casa-shadow)]",
        cena === "menu" ? "absolute left-4 top-[4.25rem] w-44 p-1.5 sm:left-6" : "absolute inset-x-6 top-1/2 -mt-16 h-32 p-4",
      )}
    >
      {cena === "menu" ? (
        ["Renomear", "Duplicar", "Excluir"].map((t) => (
          <p key={t} className="rounded-[6px] px-2.5 py-1.5 text-casa-base text-casa-fg">
            {t}
          </p>
        ))
      ) : (
        <>
          <p className="text-casa-base font-medium text-casa-fg">Excluir o projeto?</p>
          <p className="mt-1 text-casa-sm text-casa-fg-2">Some da lista e dos links públicos.</p>
        </>
      )}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={aberto}
        className="alvo-toque absolute left-4 top-4 h-10 rounded-control bg-casa-tile-2 px-3.5 text-casa-base text-casa-fg outline-none focus-visible:[box-shadow:var(--focus)] sm:left-6"
      >
        {cena === "menu" ? "Opções" : "Excluir"}
      </button>
      {surge}
    </>
  );
}

export function DemoMotion({ cabeca }: { cabeca: React.ReactNode }) {
  const [cena, setCena] = React.useState<Cena>("menu");
  const [errado, setErrado] = React.useState(true);
  const [certo, setCerto] = React.useState(true);
  const [seco, setSeco] = React.useState(false);
  const [rodada, setRodada] = React.useState(0);
  const seq = useSequencia();
  const menos = useMenosMovimento();
  const dados = CENAS_MOTION[cena];

  const trocar = (c: Cena) => {
    seq.limpar();
    setCena(c);
    const aberto = c !== "botao";
    setErrado(aberto);
    setCerto(aberto);
  };

  /* Volta ao zero sem animar e toca a entrada dos dois juntos: a comparação é sempre do começo. */
  const disparar = () => {
    seq.limpar();
    setRodada((r) => r + 1);
    if (cena === "botao") {
      setErrado(true);
      setCerto(true);
      seq.depois(dados.ms + 120, () => setCerto(false));
      seq.depois(LENTO_MS + 120, () => setErrado(false));
      return;
    }
    setSeco(true);
    setErrado(false);
    setCerto(false);
    seq.depois(60, () => {
      setSeco(false);
      seq.depois(30, () => {
        setErrado(true);
        setCerto(true);
      });
    });
  };

  const lados = [
    { chave: "errado", titulo: "Curva errada", curva: CURVA_ERRADA, ms: LENTO_MS, aberto: errado, alternar: () => setErrado((v) => !v) },
    { chave: "certo", titulo: "Curva certa", curva: CURVA_CERTA, ms: dados.ms, aberto: certo, alternar: () => setCerto((v) => !v) },
  ];

  return (
    <div data-demo="motion" data-rodada={rodada}>
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        {cabeca}
        <div className="flex flex-wrap items-center gap-3">
        <Acao onClick={disparar} data-acao="motion">
          Disparar os dois
        </Acao>
        <SegmentedControl
          aria-label="Escolher a interação"
          value={cena}
          onChange={trocar}
          options={(Object.keys(CENAS_MOTION) as Cena[]).map((c) => ({ value: c, label: CENAS_MOTION[c].nome }))}
          size="sm"
          className="w-full max-w-xs sm:w-72"
        />
        </div>
      </div>
      {menos ? (
        <p className="mt-3 text-casa-sm text-casa-fg-2">
          Seu sistema pede menos movimento, então os dois lados abrem sem animar. Compare pelo código.
        </p>
      ) : null}
      <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">
        {lados.map((l) => {
          const eErrado = l.chave === "errado";
          return (
            <div key={l.chave} className="min-w-0">
              <div className="relative h-64 overflow-hidden rounded-tile bg-casa-bg">
                <Palco cena={cena} errado={eErrado} aberto={l.aberto} seco={seco} onAlternar={l.alternar} />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Curva pontos={l.curva.p} />
                <div className="min-w-0">
                  <p className="text-casa-base font-medium">{l.titulo}</p>
                  <p className="font-casa-mono text-casa-sm text-casa-fg-2">
                    {l.curva.nome}, {l.ms} ms{eErrado ? "" : ` (${dados.token})`}
                  </p>
                </div>
              </div>
              <Terminal className="mt-3 min-h-[9.5rem] whitespace-pre-wrap [overflow-wrap:anywhere]">
                <code className="text-casa-fg-3">{eErrado ? dados.codigoErrado : dados.codigoCerto}</code>
                {"\n\n"}
                {eErrado ? (
                  dados.lint.map((s) => `${s}\n`).join("") + `${dados.lint.length} finding(s)`
                ) : (
                  <span className="text-casa-fg">motion-lint: clean</span>
                )}
              </Terminal>
            </div>
          );
        })}
      </div>
    </div>
  );
}
