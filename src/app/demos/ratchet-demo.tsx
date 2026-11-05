"use client";

/** A catraca sozinha: gire o dedo em volta do eixo, role ou use as setas. Só o sentido horário conta. */

import { Ratchet } from "../../../registry/visant/ui/ratchet";
import type { DemoProps } from "../catalog";

export default function RatchetDemo({ props }: DemoProps) {
  return (
    <div className="grid h-full w-full place-items-center p-4">
      <Ratchet {...props} />
    </div>
  );
}
