"use client";

/**
 * A peça sozinha e grande sobre uma foto do acervo. Passar o mouse belisca a foto e puxa a pele para o cursor; os knobs trocam força e raio.
 */

import { TexturaPinch } from "../../../registry/visant/ui/textura-pinch";
import type { DemoProps } from "../catalog";
import { PalcoDoShader, useImagemDoShader } from "./imagem-do-shader";

export default function TexturaPinchDemo({ props }: DemoProps) {
  const imagem = useImagemDoShader((props as { src?: unknown } | undefined)?.src);
  return (
    <PalcoDoShader>
      <TexturaPinch
        alt={imagem.alt}
        resting
        className="w-[var(--shader-w,360px)] max-w-full rounded-[var(--r-surface)]"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
