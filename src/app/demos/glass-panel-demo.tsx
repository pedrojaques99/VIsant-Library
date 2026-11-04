"use client";

/** Um saldo com o único gesto que um saldo pede: esconder o número. */

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { GlassButton } from "../../../registry/visant/ui/glass-button";
import { TextMorph } from "../../../registry/visant/ui/text-morph";
import { GlassPanel } from "../../../registry/visant/ui/glass-panel";
import { CenaGranulada } from "./vidro-cenas";
import { PalcoDeVidro } from "./vidro-palco";

export default function GlassPanelDemo() {
  const [oculto, setOculto] = React.useState(false);
  return (
    <PalcoDeVidro cena={<CenaGranulada />}>
      <GlassPanel className="flex w-full max-w-sm items-center justify-between gap-4 px-7 py-8 [--glass-panel-radius:2rem]">
        <div className="min-w-0">
          <p className="text-sm opacity-80">Saldo</p>
          <TextMorph as="p" className="mt-2 text-4xl font-medium tabular-nums">
            {oculto ? "R$ ••••" : "R$ 12.480"}
          </TextMorph>
        </div>
        <GlassButton
          shape="circle"
          className="!size-12 shrink-0 [&_svg]:!size-5"
          aria-label="Esconder saldo"
          aria-pressed={oculto}
          onClick={() => setOculto(!oculto)}
        >
          {oculto ? <EyeOff strokeWidth={2} /> : <Eye strokeWidth={2} />}
        </GlassButton>
      </GlassPanel>
    </PalcoDeVidro>
  );
}
