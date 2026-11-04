"use client";

/**
 * A peça sozinha e grande: é um fundo, e qualquer texto por cima competiria
 * com a textura. Passe o mouse: a areia espalha e assenta de volta devagar.
 */

import { TexturaSettle } from "../../../registry/visant/ui/textura-settle";
import type { DemoProps } from "../catalog";

export default function TexturaSettleDemo({ props }: DemoProps) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <TexturaSettle className="h-full min-h-0 w-full" {...props} />
    </div>
  );
}
