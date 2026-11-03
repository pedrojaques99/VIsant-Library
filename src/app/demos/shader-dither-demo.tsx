"use client";

/**
 * A peça sozinha e grande sobre uma foto do acervo. Os knobs trocam o
 * tamanho do pixel, quantos tons e o contraste antes de pontilhar.
 */

import { ShaderDither } from "../../../registry/visant/ui/shader-dither";
import type { DemoProps } from "../catalog";
import { PalcoDoShader, useImagemDoShader } from "./imagem-do-shader";

export default function ShaderDitherDemo({ props }: DemoProps) {
  const imagem = useImagemDoShader((props as { src?: unknown } | undefined)?.src);
  return (
    <PalcoDoShader>
      <ShaderDither
        alt={imagem.alt}
        className="w-[var(--shader-w,360px)] max-w-full rounded-[var(--r-surface)]"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
