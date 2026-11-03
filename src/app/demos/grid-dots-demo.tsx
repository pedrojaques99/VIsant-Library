"use client";

/**
 * A malha sozinha, de ponta a ponta do ladrilho.
 *
 * Sem os nós falsos e sem caixa: o que se julga aqui é o ponto e a luz. `--lit`,
 * `--gx` e `--gy` no invólucro são herdados pela camada acesa enquanto o ponteiro
 * não chega, então a peça já nasce com o halo aceso no centro.
 */

import * as React from "react";

import { GridDots } from "../../../registry/visant/ui/grid-dots";
import type { DemoProps } from "../catalog";

const HALO_INICIAL = { "--lit": 1, "--gx": "50%", "--gy": "50%" } as React.CSSProperties;

export default function GridDotsDemo({ props }: DemoProps) {
  return (
    <div className="relative h-full w-full" style={HALO_INICIAL}>
      <GridDots opacity={0.16} spacing={18} dotSize={1.4} spotlight={150} spotlightOpacity={0.9} {...props} />
    </div>
  );
}
