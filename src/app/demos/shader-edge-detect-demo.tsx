"use client";

/**
 * A peça sozinha e grande sobre uma foto do acervo. Os knobs trocam o
 * limiar, a força do traço e quanto da foto aparece por baixo.
 */

import { ShaderEdgeDetect } from "../../../registry/visant/ui/shader-edge-detect";
import type { DemoProps } from "../catalog";
import { PalcoDoShader, useImagemDoShader } from "./imagem-do-shader";

export default function ShaderEdgeDetectDemo({ props }: DemoProps) {
  const imagem = useImagemDoShader((props as { src?: unknown } | undefined)?.src);
  return (
    <PalcoDoShader>
      <ShaderEdgeDetect
        alt={imagem.alt}
        className="w-[var(--shader-w,360px)] max-w-full rounded-[var(--r-surface)]"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
