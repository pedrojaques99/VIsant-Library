"use client";

/**
 * A TV com programa no ar, e o seletor de canal fazendo o que um seletor faz.
 *
 * A demo anterior punha a palavra "NO SIGNAL" dentro do tubo — uma moldura de
 * TV provando que sabe emoldurar texto. Agora o tubo toca um dos visualizadores
 * do `vintage-oscilloscope`, e trocar de canal troca o programa: é o mesmo
 * chassi mostrando que a tela é uma tela.
 *
 * O PLAY liga o mesmo loop do osciloscópio, e o programa passa a desenhar esse som.
 * Antes do gesto o programa roda num sinal sintético, mudo: nenhum canal abre reto.
 *
 * O botão de força continua sendo o da peça: desligar apaga o tubo com a
 * animação de CRT; ligar acende com o estalo e o chiado de um tubo de verdade
 * (se o som da casa estiver ligado).
 */

import * as React from "react";

import { useStageActive } from "../stage";
import { VintageTvFrame } from "../../../registry/vintage/ui/vintage-tv-frame";
import { VintageButton } from "../../../registry/vintage/ui/vintage-button";
import type { VintageScopeMode } from "../../../registry/vintage/ui/vintage-oscilloscope";
import { SINAL_DE_REPOUSO, useLoop } from "./vintage-loop";

const CANAIS: { n: string; modo: VintageScopeMode }[] = [
  { n: "02", modo: "scope" },
  { n: "05", modo: "rings" },
  { n: "07", modo: "grid" },
  { n: "11", modo: "wave" },
];

export default function VintageTvFrameDemo() {
  const ativo = useStageActive();
  const [canal, setCanal] = React.useState(1);
  const [tocando, setTocando] = React.useState(false);
  const [ligada, setLigada] = React.useState(true);
  const analyser = useLoop(tocando && ligada && ativo);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-2">
      <div className="w-[260px]">
        <VintageTvFrame
          title="VISANT TV"
          width={260}
          showTimecode="00:12:34"
          program={CANAIS[canal].modo}
          programActive={ativo}
          programAnalyser={analyser ?? SINAL_DE_REPOUSO}
          onPowerToggle={(v) => {
            setLigada(v);
            if (!v) setTocando(false);
          }}
        />
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-3">
      <div role="radiogroup" aria-label="Canal" className="flex gap-1.5">
        {CANAIS.map((c, i) => {
          const sel = i === canal;
          return (
            <button
              key={c.n}
              type="button"
              role="radio"
              aria-checked={sel}
              onClick={() => setCanal(i)}
              className="alvo-toque group flex items-center gap-1.5 rounded-[4px] px-2 py-1.5 font-vintage-mono text-[10px] font-semibold tabular-nums tracking-[0.14em] outline-none"
              style={{
                color: sel ? "var(--vintage-label)" : "var(--vintage-text-muted)",
                // Tecla de rack: a do canal no ar fica travada, mais funda.
                background: sel
                  ? "linear-gradient(180deg, var(--vintage-surface-2), var(--vintage-surface-3))"
                  : "linear-gradient(180deg, var(--vintage-surface-4), var(--vintage-surface-3))",
                boxShadow: sel
                  ? "inset 0 1px 3px rgba(0,0,0,0.7), 0 0 0 1px var(--vintage-edge)"
                  : "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px var(--vintage-edge), 0 2px 3px rgba(0,0,0,0.5)",
                transition:
                  "color var(--dur-fast,160ms) var(--ease-out,ease), box-shadow var(--dur-press,120ms) var(--ease-out,ease)",
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-px rounded-[inherit] group-focus-visible:[box-shadow:var(--focus,0_0_0_2px_var(--vintage-value))]"
              />
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: sel ? "var(--vintage-value)" : "var(--vintage-surface-1)",
                  boxShadow: sel ? "0 0 6px var(--vintage-value)" : "inset 0 1px 1px rgba(0,0,0,0.8)",
                }}
              />
              CH {c.n}
            </button>
          );
        })}
      </div>
      <VintageButton label={tocando ? "STOP" : "PLAY"} active={tocando} onClick={() => setTocando((v) => !v)} />
      </div>
    </div>
  );
}
