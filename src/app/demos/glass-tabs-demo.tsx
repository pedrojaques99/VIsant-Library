"use client";

/** A lente anda ao trocar de aba; o fundo com cor é o que aparece dobrado nela. */

import { GlassTabs } from "../../../registry/visant/ui/glass-tabs";
import { CenaGranulada } from "./vidro-cenas";
import { PalcoDeVidro } from "./vidro-palco";

const ITENS = [
  { value: "dia", label: "Dia" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
];

export default function GlassTabsDemo() {
  return (
    <PalcoDeVidro cena={<CenaGranulada />}>
      <GlassTabs label="Período" items={ITENS} defaultValue="semana" />
    </PalcoDeVidro>
  );
}
