"use client";

/** Um botão só, no estado que mais mostra o vidro: o círculo aceso alterna ao clicar. */

import * as React from "react";
import { Podcast } from "lucide-react";

import { GlassButton } from "../../../registry/visant/ui/glass-button";
import { CenaGranulada } from "./vidro-cenas";
import { PalcoDeVidro } from "./vidro-palco";

export default function GlassButtonDemo() {
  const [ligado, setLigado] = React.useState(false);
  return (
    <PalcoDeVidro cena={<CenaGranulada />}>
      <GlassButton shape="circle" className="!size-28" aria-label="Transmitir" aria-pressed={ligado} onClick={() => setLigado(!ligado)}>
        <Podcast strokeWidth={2.2} />
      </GlassButton>
    </PalcoDeVidro>
  );
}
