"use client";

/**
 * O painel de propriedades de um editor, com um campo de cada tipo: pixel,
 * porcentagem, ângulo, múltiplo, contagem e cor. Arraste o rótulo ou o número na
 * horizontal; duplo clique digita o valor exato. O disco e a amostra de cor entram
 * pelo `icon`, e a contagem usa `stepper`.
 */

import * as React from "react";

import * as Popover from "@radix-ui/react-popover";

import { ColorPicker } from "../../../registry/visant/ui/color-picker";
import { ScrubInput } from "../../../registry/visant/ui/scrub-input";
import type { DemoProps } from "../catalog";

/* A matiz arrasta no número e a cor completa abre no seletor: os dois falam do mesmo valor. */
function hexDaMatiz(h: number) {
  const canal = (n: number) => {
    const k = (n + h / 30) % 12;
    const v = 0.55 - 0.8 * 0.45 * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255).toString(16).padStart(2, "0");
  };
  return `#${canal(0)}${canal(8)}${canal(4)}`;
}

function matizDoHex(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (!d) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round((h * 60 + 360) % 360);
}

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
  const [cor, setCor] = React.useState(() => hexDaMatiz(210));
  const matiz = matizDoHex(cor);

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
        <div className="flex items-center gap-1.5">
          <ScrubInput label="Matiz" kind="angle" value={matiz} min={0} max={360} {...props} onChange={(h: number) => setCor(hexDaMatiz(h))} className="min-w-0 flex-1" />
          <Popover.Root>
            <Popover.Trigger
              aria-label="Abrir o seletor de cor"
              data-abrir-cor
              className="relative size-8 shrink-0 rounded-[var(--r-control)] border border-border outline-none after:absolute after:-inset-1.5 focus-visible:[box-shadow:var(--focus)] pointer-coarse:size-11 pointer-coarse:after:inset-0"
              style={{ background: cor }}
            />
            <Popover.Portal>
              <Popover.Content
                side="top"
                align="end"
                sideOffset={8}
                collisionPadding={12}
                className="z-50 w-[272px] rounded-[var(--r-surface)] border border-border bg-card p-3 text-foreground [box-shadow:var(--e-raised)]"
              >
                <ColorPicker value={cor} onChange={setCor} />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </div>
    </div>
  );
}
