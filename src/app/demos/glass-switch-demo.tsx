"use client";

/** Nasce ligado: é assim que o --brand aparece refratado através do polegar. */

import { GlassSwitch } from "../../../registry/visant/ui/glass-switch";
import { CenaGranulada } from "./vidro-cenas";
import { PalcoDeVidro } from "./vidro-palco";

export default function GlassSwitchDemo() {
  return (
    <PalcoDeVidro cena={<CenaGranulada />}>
      <GlassSwitch aria-label="Notificações" defaultChecked />
    </PalcoDeVidro>
  );
}
