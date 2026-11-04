"use client";

/**
 * A peça sozinha e grande sobre uma foto do acervo. O knob troca quantos
 * tons sobram por canal.
 */

import { ShaderPosterize } from "../../../registry/visant/ui/shader-posterize";
import type { DemoProps } from "../catalog";
import { PalcoDoShader, useImagemDoShader } from "./imagem-do-shader";

export default function ShaderPosterizeDemo({ props }: DemoProps) {
  const imagem = useImagemDoShader((props as { src?: unknown } | undefined)?.src);
  return (
    <PalcoDoShader>
      <ShaderPosterize
        alt={imagem.alt}
        className="h-full min-h-0 w-full"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
