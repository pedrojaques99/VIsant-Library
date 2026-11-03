"use client";

/**
 * A peça sozinha e grande sobre uma foto do acervo. Passar o mouse aponta
 * a separação das cores; no centro ela some.
 */

import { ShaderChromaticAberration } from "../../../registry/visant/ui/shader-chromatic-aberration";
import type { DemoProps } from "../catalog";
import { PalcoDoShader, useImagemDoShader } from "./imagem-do-shader";

export default function ShaderChromaticAberrationDemo({ props }: DemoProps) {
  const imagem = useImagemDoShader((props as { src?: unknown } | undefined)?.src);
  return (
    <PalcoDoShader>
      <ShaderChromaticAberration
        alt={imagem.alt}
        className="w-[var(--shader-w,360px)] max-w-full rounded-[var(--r-surface)]"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
