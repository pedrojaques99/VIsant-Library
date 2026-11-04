"use client";

/**
 * visant-motion: a mesma interação duas vezes, repetindo sozinha enquanto está na
 * tela. A diferença se vê sem ler. A saída do motion-lint fica na folha.
 */

import * as React from "react";
import { Check, X } from "lucide-react";
import { SegmentedControl } from "../../../../registry/visant/ui/segmented-control";
import { CENAS_MOTION, CURVA_CERTA, CURVA_ERRADA, ESCALA_ERRADA, LENTO_MS, TRANSICAO_ERRADA } from "./amostras";
import { Acao, cx, Dobra, Terminal, useMenosMovimento, useNaTela, useSequencia } from "./base";

type Cena = keyof typeof CENAS_MOTION;

function Curva({ p }: { p: readonly [number, number, number, number] }) {
  const [a, b, c, d] = p;
  return (
    <svg viewBox="-1 -1 42 42" className="size-7 shrink-0" aria-hidden="true">
      <path d="M0 40H40M0 40V0" fill="none" stroke="var(--casa-fg-3)" />
      <path d={`M0 40 C${a * 40} ${40 - b * 40} ${c * 40} ${40 - d * 40} 40 0`} fill="none" stroke="var(--casa-fg)" strokeWidth="2" />
    </svg>
  );
}

function Palco({ cena, errado, aberto, seco, onAlternar }: { cena: Cena; errado: boolean; aberto: boolean; seco: boolean; onAlternar: () => void }) {
  const dados = CENAS_MOTION[cena];
  const transicao = seco ? "none" : errado ? TRANSICAO_ERRADA : `transform ${dados.ms}ms var(--ease-out), opacity ${dados.ms}ms var(--ease-out)`;

  if (cena === "botao") {
    return (
      <div className="grid h-full place-items-center">
        <button
          type="button"
          data-press={errado ? "errado" : "certo"}
          onClick={onAlternar}
          style={{ transition: transicao, transform: aberto ? `scale(${errado ? 0.9 : 0.97})` : "scale(1)" }}
          className="h-11 rounded-control bg-casa-cta px-6 text-casa-base font-medium text-casa-cta-fg outline-none focus-visible:[box-shadow:var(--focus)]"
        >
          Salvar
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={aberto}
        aria-label={cena === "menu" ? "Abrir o menu" : "Abrir o modal"}
        className="absolute left-3 top-3 grid size-11 place-items-center rounded-control bg-casa-tile-2 text-casa-fg outline-none focus-visible:[box-shadow:var(--focus)]"
      >
        <span aria-hidden="true" className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1 rounded-[1px] bg-casa-fg" />
          ))}
        </span>
      </button>
      <div
        aria-hidden="true"
        data-painel={errado ? "errado" : "certo"}
        style={{
          transition: transicao,
          transform: aberto ? "scale(1)" : errado ? ESCALA_ERRADA : "scale(0.95)",
          opacity: aberto ? 1 : 0,
          transformOrigin: cena === "modal" || errado ? "center" : "top left",
        }}
        className={cx(
          "rounded-control bg-casa-tile-2 p-2 [box-shadow:var(--casa-shadow)]",
          cena === "menu" ? "absolute left-16 top-3 w-36" : "absolute inset-x-6 top-1/2 h-24 -translate-y-1/2",
        )}
      >
        {[0, 1, 2].map((i) => (
          <span key={i} className={cx("my-2 block h-2 rounded-[2px] bg-casa-fg-3", i === 1 ? "w-3/4" : i === 2 ? "w-1/2" : "w-full")} />
        ))}
      </div>
    </>
  );
}

export function DemoMotion() {
  const [cena, setCena] = React.useState<Cena>("menu");
  const [errado, setErrado] = React.useState(false);
  const [certo, setCerto] = React.useState(false);
  const [seco, setSeco] = React.useState(false);
  const [mao, setMao] = React.useState(false);
  const seq = useSequencia();
  const menos = useMenosMovimento();
  const [palco, naTela] = useNaTela<HTMLDivElement>();
  const dados = CENAS_MOTION[cena];

  /* Volta ao zero sem animar e toca os dois juntos: a comparação é sempre do começo. */
  const disparar = React.useCallback(
    (c: Cena) => {
      seq.limpar();
      if (c === "botao") {
        setErrado(true);
        setCerto(true);
        seq.depois(CENAS_MOTION.botao.ms + 120, () => setCerto(false));
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
    },
    [seq],
  );

  /* Repete sozinha enquanto a pessoa só olha. Encostou, a mão manda. */
  React.useEffect(() => {
    if (!naTela || mao) return;
    if (menos) {
      setErrado(true);
      setCerto(true);
      return;
    }
    disparar(cena);
    const id = setInterval(() => disparar(cena), 2200);
    return () => clearInterval(id);
  }, [naTela, mao, menos, cena, disparar]);

  const lados = [
    { chave: "errado", curva: CURVA_ERRADA, ms: LENTO_MS, aberto: errado, alternar: () => { setMao(true); setErrado((v) => !v); } },
    { chave: "certo", curva: CURVA_CERTA, ms: dados.ms, aberto: certo, alternar: () => { setMao(true); setCerto((v) => !v); } },
  ];

  return (
    <Dobra
      nome="visant-motion"
      faixa
      como={
        <>
          <p>A mesma interação com a curva errada e com a certa. O motion-lint reprova a primeira:</p>
          <Terminal className="whitespace-pre-wrap [overflow-wrap:anywhere]">
            {dados.codigoErrado}
            {"\n\n"}
            {dados.lint.join("\n")}
          </Terminal>
          <p className="mt-3">E não acha nada na segunda:</p>
          <Terminal className="whitespace-pre-wrap [overflow-wrap:anywhere]">
            {dados.codigoCerto}
            {"\n\n"}
            motion-lint: clean
          </Terminal>
        </>
      }
    >
      <div ref={palco} className="flex min-w-0 flex-col gap-3" data-demo="motion">
        <div className="grid min-w-0 gap-3 lg:grid-cols-2">
          {lados.map((l) => {
            const eErrado = l.chave === "errado";
            return (
              <div key={l.chave} className="relative h-40 min-w-0 overflow-hidden rounded-tile bg-casa-bg lg:h-80">
                <Palco cena={cena} errado={eErrado} aberto={l.aberto} seco={seco} onAlternar={l.alternar} />
                <div className="absolute bottom-2 right-3 flex items-center gap-2 font-casa-mono text-casa-sm text-casa-fg-2">
                  {eErrado ? <X className="size-4 text-[color:var(--destructive)]" aria-label="Errada" /> : <Check className="size-4 text-casa-fg" aria-label="Certa" />}
                  <Curva p={l.curva.p} />
                  {l.ms} ms
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <SegmentedControl
            aria-label="Escolher a interação"
            value={cena}
            onChange={(c) => {
              setCena(c);
              setErrado(false);
              setCerto(false);
            }}
            options={(Object.keys(CENAS_MOTION) as Cena[]).map((c) => ({ value: c, label: CENAS_MOTION[c].nome }))}
            className="min-w-0 max-w-xs flex-1 [&_button]:min-h-11"
          />
          <Acao onClick={() => { setMao(true); disparar(cena); }} data-acao="motion">
            De novo
          </Acao>
        </div>
      </div>
    </Dobra>
  );
}
