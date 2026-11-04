"use client";

/**
 * A peça sozinha e grande: é um fundo, e qualquer texto por cima competiria
 * com a textura. Passe o mouse: a limalha se alinha ao campo do ímã.
 */

import { TexturaMagnet } from "../../../registry/visant/ui/textura-magnet";
import type { DemoProps } from "../catalog";

export default function TexturaMagnetDemo({ props }: DemoProps) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <TexturaMagnet className="h-full min-h-0 w-full" {...props} />
    </div>
  );
}
