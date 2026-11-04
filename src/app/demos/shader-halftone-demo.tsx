"use client";

/**
 * A peça sozinha e grande sobre uma foto do acervo. Passar o mouse por cima
 * abre a lupa; os knobs trocam célula, ângulo e forma do ponto.
 */

import { ShaderHalftone } from "../../../registry/visant/ui/shader-halftone";
import type { DemoProps } from "../catalog";
import { PalcoDoShader, useImagemDoShader } from "./imagem-do-shader";

export default function ShaderHalftoneDemo({ props }: DemoProps) {
  const imagem = useImagemDoShader((props as { src?: unknown } | undefined)?.src);
  return (
    <PalcoDoShader>
      <ShaderHalftone
        alt={imagem.alt}
        className="h-full min-h-0 w-full"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
