"use client";

/**
 * A peça sozinha e grande sobre uma foto do acervo. Passar o mouse rápido agita a foto, que escorre e depois assenta; os knobs trocam o escorrer, os veios e a agitação.
 */

import { TexturaWarp } from "../../../registry/visant/ui/textura-warp";
import type { DemoProps } from "../catalog";
import { PalcoDoShader, useImagemDoShader } from "./imagem-do-shader";

export default function TexturaWarpDemo({ props }: DemoProps) {
  const imagem = useImagemDoShader((props as { src?: unknown } | undefined)?.src);
  return (
    <PalcoDoShader>
      <TexturaWarp
        alt={imagem.alt}
        strength={26}
        className="h-full min-h-0 w-full"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
