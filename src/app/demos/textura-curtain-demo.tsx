"use client";

/**
 * A peça sozinha e grande: é um fundo, e qualquer texto por cima competiria
 * com a textura. Passe o mouse: a cortina ondula onde ele passa.
 */

import { TexturaCurtain } from "../../../registry/visant/ui/textura-curtain";
import type { DemoProps } from "../catalog";

export default function TexturaCurtainDemo({ props }: DemoProps) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <TexturaCurtain className="h-full min-h-0 w-full" {...props} />
    </div>
  );
}
