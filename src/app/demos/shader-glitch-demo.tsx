"use client";

/**
 * A peça sozinha e grande sobre uma foto do acervo. A falha corre
 * sozinha; passar o mouse rápido por cima piora o sinal.
 */

import { ShaderGlitch } from "../../../registry/visant/ui/shader-glitch";
import type { DemoProps } from "../catalog";
import { PalcoDoShader, useImagemDoShader } from "./imagem-do-shader";

export default function ShaderGlitchDemo({ props }: DemoProps) {
  const imagem = useImagemDoShader((props as { src?: unknown } | undefined)?.src);
  return (
    <PalcoDoShader>
      <ShaderGlitch
        alt={imagem.alt}
        className="w-[var(--shader-w,360px)] max-w-full rounded-[var(--r-surface)]"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
