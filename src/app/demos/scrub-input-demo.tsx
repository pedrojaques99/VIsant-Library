"use client";

/**
 * O painel de propriedades de um editor, com um campo de cada tipo: pixel,
 * porcentagem, ângulo, múltiplo, contagem e cor. Arraste o rótulo ou o número na
 * horizontal; duplo clique digita o valor exato. O disco e a amostra de cor entram
 * pelo `icon`, e a contagem usa `stepper`.
 */

import * as React from "react";

import { ScrubInput } from "../../../registry/visant/ui/scrub-input";
import type { DemoProps } from "../catalog";

function Disco({ graus }: { graus: number }) {
  return (
    <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true">
      <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" />
      <line x1="6" y1="6" x2="6" y2="1.5" stroke="currentColor" strokeWidth="1.5" transform={`rotate(${graus} 6 6)`} />
    </svg>
  );
}

export default function ScrubInputDemo({ props }: DemoProps) {
  const [largura, setLargura] = React.useState(320);
  const [opacidade, setOpacidade] = React.useState(64);
  const [angulo, setAngulo] = React.useState(45);
  const [escala, setEscala] = React.useState(1.5);
  const [colunas, setColunas] = React.useState(12);
  const [matiz, setMatiz] = React.useState(210);

  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="grid w-[340px] max-w-full grid-cols-2 gap-2.5">
        <ScrubInput label="Largura" kind="px" value={largura} min={0} max={1440} {...props} onChange={setLargura} />
        <ScrubInput label="Opacidade" kind="percent" value={opacidade} min={0} max={100} {...props} onChange={setOpacidade} />
        <ScrubInput
          label="Rotação"
          kind="angle"
          icon={<Disco graus={angulo} />}
          value={angulo}
          min={0}
          max={360}
          {...props}
          onChange={setAngulo}
        />
        <ScrubInput label="Escala" kind="multiple" value={escala} min={0.1} max={4} {...props} onChange={setEscala} />
        <ScrubInput label="Colunas" kind="number" stepper value={colunas} min={1} max={24} {...props} onChange={setColunas} />
        <ScrubInput
          label="Matiz"
          kind="angle"
          icon={<span className="block size-3 rounded-[var(--r-pill)]" style={{ background: `hsl(${matiz} 80% 55%)` }} />}
          value={matiz}
          min={0}
          max={360}
          {...props}
          onChange={setMatiz}
        />
      </div>
    </div>
  );
}
