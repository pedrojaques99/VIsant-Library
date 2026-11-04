"use client";

/**
 * O medidor numa cena de cota: espaço do plano, com as três faixas nomeadas.
 *
 * Os botões mostram a regra que a peça defende: a faixa troca quando a contagem
 * CRUZA o limite, no meio da mola. O valor tem um dono só, o estado daqui: o knob
 * `value` entra nele e os botões avisam o painel.
 */

import * as React from "react";
import { Minus, Plus } from "lucide-react";

import { Gauge } from "../../../registry/visant/ui/gauge";
import type { DemoProps } from "../catalog";
import { useDonoDoKnob } from "./dono-do-knob";

const FAIXAS = [
  { from: 0, label: "Tranquilo" },
  { from: 70, label: "Quase cheio" },
  { from: 90, label: "Lotado", alert: true },
];
const PASSO = 8;
const botao =
  "alvo-toque inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--r-control)] border border-border bg-card text-foreground [transition:background-color_var(--dur-fast)_var(--ease-out)] hover:bg-muted focus-visible:outline-none focus-visible:[box-shadow:var(--focus)] disabled:opacity-40";

export default function GaugeDemo({ props, onKnob }: DemoProps) {
  const [pct, setPct] = React.useState(84);
  const mudar = useDonoDoKnob<number>("value", 84, setPct, { props, onKnob });

  return (
    <div className="flex h-full w-full items-center justify-center gap-4">
      <button type="button" className={botao} aria-label="Liberar espaço" disabled={pct <= 0} onClick={() => mudar(Math.max(0, pct - PASSO))}>
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <Gauge
        className="w-52"
        size={208}
        label="Espaço do plano"
        detail="de 500 GB"
        bands={FAIXAS}
        {...props}
        value={pct}
      />
      <button type="button" className={botao} aria-label="Ocupar espaço" disabled={pct >= 100} onClick={() => mudar(Math.min(100, pct + PASSO))}>
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
