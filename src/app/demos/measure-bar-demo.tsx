"use client";

/**
 * Três réguas lado a lado, cada uma num estado: proporção medida, piso sem
 * denominador (sem régua, de propósito) e dado que não chegou (trilha
 * tracejada). É a mesma dobra de números que a página de venda usa.
 */

import { MeasureBar } from "../../../registry/visant/ui/measure-bar";
import type { DemoProps } from "../catalog";

export default function MeasureBarDemo({ props }: DemoProps) {
  return (
    <div className="grid h-full w-full grid-cols-3 content-center items-start gap-10 px-8">
      <MeasureBar label="Orçamento" value="R$ 450" qualifier="de um teto de R$ 600" ratio={0.75} {...props} />
      <MeasureBar label="Reservas" value="20+" qualifier="piso, não proporção" />
      <MeasureBar label="Entregas" value="sem dado" qualifier="a API não respondeu" state="unknown" />
    </div>
  );
}
