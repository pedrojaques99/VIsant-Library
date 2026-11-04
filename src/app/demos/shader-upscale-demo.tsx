"use client";

/**
 * A peça sozinha e grande sobre uma foto do acervo. Passar o mouse leva a
 * linha do comparador; à esquerda dela, o antes em vizinho mais próximo.
 */

import { ShaderUpscale } from "../../../registry/visant/ui/shader-upscale";
import type { DemoProps } from "../catalog";
import { PalcoDoShader, useImagemDoShader } from "./imagem-do-shader";

export default function ShaderUpscaleDemo({ props }: DemoProps) {
  const imagem = useImagemDoShader((props as { src?: unknown } | undefined)?.src);
  return (
    <PalcoDoShader>
      <ShaderUpscale
        alt={imagem.alt}
        className="h-full min-h-0 w-full"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
