"use client";

/**
 * O controle sozinho, e as setas embaixo trocam a `animation`.
 *
 * O seletor de animação era um segundo segmented control logo abaixo do
 * primeiro, e lia como parte da peça. Agora é o mesmo seletor das outras demos.
 * Trocar já anda para a opção seguinte, porque animação só se vê em movimento.
 */

import * as React from "react";
import { Columns3, LayoutGrid, List } from "lucide-react";

import { SegmentedControl } from "../../../registry/visant/ui/segmented-control";
import type { DemoProps } from "../catalog";
import { Trocador, useUmPorVez } from "./um-por-vez";

const ANIMACOES = ["stretch", "spring", "slide", "fade"] as const;
const VISOES = ["grade", "lista", "quadro"] as const;
type Animacao = (typeof ANIMACOES)[number];
type Visao = (typeof VISOES)[number];

export default function SegmentedControlDemo({ props }: DemoProps) {
  const { animation: _a, ...resto } = (props ?? {}) as { animation?: Animacao } & Record<string, unknown>;
  const { atual, rodada, passo, repetir } = useUmPorVez(ANIMACOES, _a);
  const [visao, setVisao] = React.useState<Visao>("grade");

  // A `rodada` muda a cada troca e a cada repetição; a montagem não conta.
  React.useEffect(() => {
    if (rodada === 0) return;
    setVisao((v) => VISOES[(VISOES.indexOf(v) + 1) % VISOES.length]!);
  }, [rodada]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 p-6">
      <SegmentedControl
        value={visao}
        onChange={setVisao}
        aria-label="Visão"
        className="w-[320px] max-w-full"
        {...resto}
        animation={atual}
        options={[
          { value: "grade", label: "Grade", icon: LayoutGrid },
          { value: "lista", label: "Lista", icon: List },
          { value: "quadro", label: "Quadro", icon: Columns3 },
        ]}
      />
      <Trocador nome={atual} onPasso={passo} onRepetir={repetir} rotulo="animação" />
    </div>
  );
}
