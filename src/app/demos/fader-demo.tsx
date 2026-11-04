"use client";

/**
 * Uma coluna de parâmetros de efeito, onde o fader mora. É web component: o
 * mesmo `<visant-fader>` roda numa página sem framework. Arraste o trilho ou o
 * NOME na horizontal; duplo clique volta pro padrão. O som de dente é o mesmo dos
 * outros sliders, ligado aqui porque a peça não carrega o bus de som.
 */

import * as React from "react";

import { playSfx } from "@/lib/sfx-bus";
import { definirFader } from "../../../registry/visant/lib/fader";

definirFader();

const PARAMS = [
  { label: "pulso", value: 40, def: 25 },
  { label: "flash", value: 45, def: 10 },
  { label: "tremor", value: 20, def: 0 },
  { label: "grão", value: 18, def: 18 },
];

export default function FaderDemo() {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const dente = () => playSfx("focus");
    el.addEventListener("valuedetent", dente);
    return () => el.removeEventListener("valuedetent", dente);
  }, []);

  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div ref={ref} className="flex w-[280px] max-w-full flex-col gap-1">
        {PARAMS.map((p) =>
          React.createElement("visant-fader", { key: p.label, label: p.label, min: 0, max: 100, value: p.value, default: p.def, unit: "%" }),
        )}
      </div>
    </div>
  );
}
