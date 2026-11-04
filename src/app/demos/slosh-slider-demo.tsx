"use client";

/**
 * A meta de água do dia, que é onde o peso da tinta faz sentido: o
 * preenchimento É líquido. Arrastar rápido e soltar mostra o balanço inteiro,
 * e as setas mostram que o teclado também chacoalha. A escala
 * fica em 0 a 100 (cada passo de 5 é 0,1 L) pra os knobs da vitrine não brigarem
 * com a demo. (Volume de som já mora no
 * Elastic Slider; aqui a cena é outra pra cada peça vender o seu gesto.)
 */

import * as React from "react";

import { SloshSlider } from "../../../registry/visant/ui/slosh-slider";
import type { DemoProps } from "../catalog";
import { useDonoDoKnob } from "./dono-do-knob";

export default function SloshSliderDemo({ props, onKnob }: DemoProps) {
  const [valor, setValor] = React.useState(60);
  const mudar = useDonoDoKnob<number>("value", 60, setValor, { props, onKnob });

  return (
    <div className="flex h-full w-full items-center justify-center">
      <SloshSlider
        label="Água hoje"
        step={5}
        format={(v) => `${(v / 50).toLocaleString("pt-BR", { minimumFractionDigits: 1 })} de 2 L`}
        className="max-w-[360px]"
        {...props}
        value={valor}
        onValueChange={mudar}
      />
    </div>
  );
}
