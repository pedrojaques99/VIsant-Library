"use client";

/**
 * A peça sozinha e grande sobre uma foto do acervo. O grão corre sozinho;
 * os knobs trocam a força, o tamanho e o grão colorido.
 */

import { ShaderFilmGrain } from "../../../registry/visant/ui/shader-film-grain";
import type { DemoProps } from "../catalog";
import { PalcoDoShader, useImagemDoShader } from "./imagem-do-shader";

export default function ShaderFilmGrainDemo({ props }: DemoProps) {
  const imagem = useImagemDoShader((props as { src?: unknown } | undefined)?.src);
  return (
    <PalcoDoShader>
      <ShaderFilmGrain
        alt={imagem.alt}
        className="w-[var(--shader-w,360px)] max-w-full rounded-[var(--r-surface)]"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
