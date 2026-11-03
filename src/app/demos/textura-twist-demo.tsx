"use client";

/**
 * A peça sozinha e grande sobre uma foto do acervo. Passar o mouse torce a foto em redemoinho; ao sair ele se desfaz. Os knobs trocam o giro e o raio.
 */

import { TexturaTwist } from "../../../registry/visant/ui/textura-twist";
import type { DemoProps } from "../catalog";
import { PalcoDoShader, useImagemDoShader } from "./imagem-do-shader";

export default function TexturaTwistDemo({ props }: DemoProps) {
  const imagem = useImagemDoShader((props as { src?: unknown } | undefined)?.src);
  return (
    <PalcoDoShader>
      <TexturaTwist
        alt={imagem.alt}
        resting
        className="w-[var(--shader-w,360px)] max-w-full rounded-[var(--r-surface)]"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
