"use client";

/**
 * A peça sozinha e grande sobre uma foto do acervo. Passar o mouse leva uma bolha de vidro que amplia a foto; os knobs trocam o aumento e o raio.
 */

import { TexturaSphere } from "../../../registry/visant/ui/textura-sphere";
import type { DemoProps } from "../catalog";
import { PalcoDoShader, useImagemDoShader } from "./imagem-do-shader";

export default function TexturaSphereDemo({ props }: DemoProps) {
  const imagem = useImagemDoShader((props as { src?: unknown } | undefined)?.src);
  return (
    <PalcoDoShader>
      <TexturaSphere
        alt={imagem.alt}
        resting
        className="h-full min-h-0 w-full"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
