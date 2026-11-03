"use client";

/**
 * A peça sozinha e grande sobre uma foto do acervo. Passar o mouse por
 * cima abre a janela nítida; o knob troca o tamanho do bloco.
 */

import { ShaderPixelate } from "../../../registry/visant/ui/shader-pixelate";
import type { DemoProps } from "../catalog";
import { PalcoDoShader, useImagemDoShader } from "./imagem-do-shader";

export default function ShaderPixelateDemo({ props }: DemoProps) {
  const imagem = useImagemDoShader((props as { src?: unknown } | undefined)?.src);
  return (
    <PalcoDoShader>
      <ShaderPixelate
        alt={imagem.alt}
        className="w-[var(--shader-w,360px)] max-w-full rounded-[var(--r-surface)]"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
