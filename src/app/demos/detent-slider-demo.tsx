"use client";

/** A consequência em letra grande: um valor de exemplo que cresce com o quanto se fecha. */

import { DetentSlider } from "../../../registry/visant/ui/detent-slider";
import type { DemoProps } from "../catalog";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", signDisplay: "always" });

export default function DetentSliderDemo({ props }: DemoProps) {
  return (
    <div className="grid h-full w-full place-items-center p-4">
      <DetentSlider
        caption="Resultado ao fechar"
        label="Quanto fechar"
        format={(v) => moeda.format(12.5 * v)}
        action={(v) => `Fechar ${v}%`}
        {...props}
      />
    </div>
  );
}
