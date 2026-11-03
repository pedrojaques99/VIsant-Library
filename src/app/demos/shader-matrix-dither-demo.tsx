"use client";

/**
 * A peça sozinha e grande sobre uma foto do acervo. Os knobs trocam a
 * matriz de Bayer, o viés do limiar e o tamanho do ponto.
 */

import { ShaderMatrixDither } from "../../../registry/visant/ui/shader-matrix-dither";
import type { DemoProps } from "../catalog";
import { PalcoDoShader, useImagemDoShader } from "./imagem-do-shader";

export default function ShaderMatrixDitherDemo({ props }: DemoProps) {
  const imagem = useImagemDoShader((props as { src?: unknown } | undefined)?.src);
  return (
    <PalcoDoShader>
      <ShaderMatrixDither
        alt={imagem.alt}
        className="w-[var(--shader-w,360px)] max-w-full rounded-[var(--r-surface)]"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
