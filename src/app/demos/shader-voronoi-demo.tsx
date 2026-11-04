"use client";

/**
 * A peça sozinha e grande: é um fundo, e qualquer texto por cima competiria
 * com o shader. Passar o mouse rápido injeta energia.
 */

import { ShaderVoronoi } from "../../../registry/visant/ui/shader-voronoi";
import type { DemoProps } from "../catalog";

export default function ShaderVoronoiDemo({ props }: DemoProps) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <ShaderVoronoi className="h-full min-h-0 w-full" {...props} />
    </div>
  );
}
