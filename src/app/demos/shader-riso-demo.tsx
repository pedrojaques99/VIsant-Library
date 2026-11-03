"use client";

/**
 * A peça sozinha e grande sobre uma foto do acervo. O cursor puxa a folha; os knobs trocam o modo da
 * tinta, a célula e o quanto o registro escorrega.
 */

import { ShaderRiso } from "../../../registry/visant/ui/shader-riso";
import type { DemoProps } from "../catalog";
import { PalcoDoShader, useImagemDoShader } from "./imagem-do-shader";

export default function ShaderRisoDemo({ props }: DemoProps) {
  const imagem = useImagemDoShader((props as { src?: unknown } | undefined)?.src);
  return (
    <PalcoDoShader>
      <ShaderRiso
        alt={imagem.alt}
        className="w-[var(--shader-w,360px)] max-w-full rounded-[var(--r-surface)]"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
