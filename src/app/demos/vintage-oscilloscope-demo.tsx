"use client";

/**
 * Um tubo, um programa por vez, e um som de verdade passando por ele.
 *
 * A cena anterior mostrava os quatro modos lado a lado comendo um buffer de
 * mentira: bonito, mas ninguém mexia em nada, e o traço não era de som nenhum.
 * Agora o PLAY liga um loop curto sintetizado aqui (bumbo, chimbau, baixo e um
 * arpejo), o loop passa por um `AnalyserNode`, e o tubo desenha ESSE sinal: o
 * que se ouve é o que se vê. As teclas embaixo trocam o programa do tubo.
 *
 * Sem som tocando o tubo fica no traço reto, que é o que um osciloscópio sem
 * entrada mostra. Card fora da tela (`useStageActive`) para o som e o relógio.
 *
 * `fft` fica fora das teclas: o modo lê magnitudes em dB, não amostras no
 * tempo, e o analisador aqui entrega amostras.
 */

import * as React from "react";

import { useStageActive } from "../stage";
import type { DemoProps } from "../catalog";
import {
  VintageOscilloscope,
  type VintageScopeMode,
} from "../../../registry/vintage/ui/vintage-oscilloscope";
import { VintageButton } from "../../../registry/vintage/ui/vintage-button";
import { useLoop } from "./vintage-loop";

const MODOS: VintageScopeMode[] = ["scope", "wave", "rings", "grid"];
const FOSFORO = "var(--vintage-light)";

export default function VintageOscilloscopeDemo({ props }: DemoProps) {
  const ativo = useStageActive();
  const [tocando, setTocando] = React.useState(false);
  const [modo, setModo] = React.useState<VintageScopeMode>("scope");
  const analyser = useLoop(tocando && ativo);

  // Sem entrada: traço reto, como um tubo ligado sem cabo.
  const silencio = React.useMemo(() => new Float32Array(256), []);

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div
        className="flex flex-col gap-3 rounded-[var(--r-control,10px)] p-3"
        style={{
          // O painel do kit: chapa escura, luz de cima, sombra que fecha embaixo.
          background: "linear-gradient(180deg, var(--vintage-surface-3), var(--vintage-surface-2))",
          border: "1px solid var(--vintage-surface-1)",
          boxShadow:
            "var(--vintage-panel-shadow)",
        }}
      >
        <VintageOscilloscope
          analyser={analyser}
          data={silencio}
          mode={modo}
          color={FOSFORO}
          width={380}
          height={180}
          active={ativo}
          {...props}
        />

        <div className="flex items-center justify-between gap-3">
          <div role="radiogroup" aria-label="Programa do tubo" className="flex gap-1.5">
            {MODOS.map((m) => {
              const sel = m === modo;
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  onClick={() => setModo(m)}
                  className="alvo-toque group flex items-center gap-1.5 rounded-[4px] px-2 py-1.5 font-vintage-mono text-[10px] font-semibold uppercase tracking-[0.14em] outline-none"
                  style={{
                    color: sel ? "var(--vintage-label)" : "var(--vintage-text-muted)",
                    // Tecla de rack: a escolhida fica travada, mais funda.
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
                      background: sel ? "var(--vintage-light)" : "var(--vintage-surface-1)",
                      boxShadow: sel ? "0 0 6px var(--vintage-light)" : "inset 0 1px 1px rgba(0,0,0,0.8)",
                    }}
                  />
                  {m}
                </button>
              );
            })}
          </div>

          <VintageButton
            label={tocando ? "STOP" : "PLAY"}
            active={tocando}
            onClick={() => setTocando((v) => !v)}
          />
        </div>
      </div>
    </div>
  );
}
