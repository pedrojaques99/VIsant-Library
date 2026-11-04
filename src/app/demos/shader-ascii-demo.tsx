"use client";

/**
 * A peça sozinha e grande sobre uma foto do acervo. O cursor é uma lupa; os knobs trocam o jogo de
 * caracteres, a célula e o contraste.
 */

import { ShaderAscii } from "../../../registry/visant/ui/shader-ascii";
import type { DemoProps } from "../catalog";
import { PalcoDoShader, useImagemDoShader } from "./imagem-do-shader";

export default function ShaderAsciiDemo({ props }: DemoProps) {
  const imagem = useImagemDoShader((props as { src?: unknown } | undefined)?.src);
  return (
    <PalcoDoShader>
      <ShaderAscii
        alt={imagem.alt}
        className="h-full min-h-0 w-full"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
