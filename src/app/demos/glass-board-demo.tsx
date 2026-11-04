"use client";

/**
 * O quadro sobre a costa. Chega por chunk próprio, como a demo do kanban: o dnd-kit
 * pesa e só deve descer quando o card entra na tela.
 */

import type * as React from "react";

import { Kanban } from "../../../registry/visant/blocks/kanban";
import { GlassBoard, type GlassBoardKanbanProps, type GlassBoardRow } from "../../../registry/visant/ui/glass-board";
import { CenaGranulada } from "./vidro-cenas";
import { PalcoDeVidro } from "./vidro-palco";

const ETAPAS = [
  { id: "entrada", title: "Entrada" },
  { id: "analise", title: "Análise" },
];
const LINHAS: GlassBoardRow[] = [
  { id: "a", stage: "entrada", card: { name: "Ana Souza", line: "R$ 1,2 mi" } },
  { id: "b", stage: "entrada", card: { name: "Bruno Lima", line: "R$ 420 mil" } },
  { id: "d", stage: "analise", card: { name: "Davi Melo", line: "R$ 500 mil" } },
];

export default function GlassBoardDemo() {
  return (
    <PalcoDeVidro cena={<CenaGranulada />}>
      <GlassBoard
        kanban={Kanban as React.ComponentType<GlassBoardKanbanProps>}
        className="max-h-full w-full max-w-[520px]"
        stages={ETAPAS}
        initial={LINHAS}
      />
    </PalcoDeVidro>
  );
}
