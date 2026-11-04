"use client";

/** O volume sobre a cena da caixa de som: é ela que dá a mancha clara e a franja na lente. */

import { Volume, Volume1, Volume2, VolumeX } from "lucide-react";

import { GlassSlider } from "../../../registry/visant/ui/glass-slider";
import { CenaGranulada } from "./vidro-cenas";
import { PalcoDeVidro } from "./vidro-palco";

// Só o alto-falante é cheio; os arcos ficam em traço.
const Icone = (v: number) => {
  const I = v === 0 ? VolumeX : v < 12 ? Volume : v < 34 ? Volume1 : Volume2;
  return <I strokeWidth={2.2} className="[&_path:first-of-type]:fill-current" />;
};

export default function GlassSliderDemo() {
  return (
    <PalcoDeVidro cena={<CenaGranulada />}>
      <GlassSlider label="Volume" defaultValue={52} icon={Icone} className="max-w-[71%]" />
    </PalcoDeVidro>
  );
}
