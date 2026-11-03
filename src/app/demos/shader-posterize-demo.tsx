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
        className="w-[var(--shader-w,360px)] max-w-full rounded-[var(--r-surface)]"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
