"use client";

/**
 * A demo é um seletor de status de tarefa, o tipo de campo que mora numa
 * barra de propriedades apertada. Aberto, cresce por cima do que está embaixo
 * sem empurrar nada.
 */

import * as React from "react";
import { CircleCheck, CircleDashed, CircleDot, CirclePause, CircleX } from "lucide-react";

import { MorphSelect } from "../../../registry/visant/ui/morph-select";
import type { DemoProps } from "../catalog";
import { useDonoDoKnob } from "./dono-do-knob";

const STATUS = [
  { value: "rascunho", label: "Rascunho", icon: <CircleDashed /> },
  { value: "andamento", label: "Em andamento", icon: <CircleDot />, meta: "3" },
  { value: "pausado", label: "Pausado", icon: <CirclePause /> },
  { value: "entregue", label: "Entregue", icon: <CircleCheck />, meta: "12" },
  { value: "cancelado", label: "Cancelado", icon: <CircleX />, disabled: true },
];

export default function MorphSelectDemo({ props, onKnob }: DemoProps) {
  const [status, setStatus] = React.useState("andamento");
  const mudar = useDonoDoKnob<string>("value", "andamento", setStatus, { props, onKnob });

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      {/* A caixa tem a largura da lista aberta (260) e a altura dela inteira:
          aberta, a superfície cresce pra direita e pra baixo e cabe no palco
          sem corte. Fechado, o gatilho fica no terço de cima, onde a lista
          vai precisar do espaço embaixo. */}
      <div className="flex h-[290px] w-[260px] max-w-full flex-col pt-4">
        <MorphSelect label="Status" items={STATUS} {...props} value={status} onValueChange={mudar} />
      </div>
    </div>
  );
}
