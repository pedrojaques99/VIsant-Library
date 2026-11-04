"use client";

/**
 * A peça sozinha e grande sobre uma foto do acervo. A fita corre sozinha;
 * os knobs dosam cada defeito separado.
 */

import { ShaderVhs } from "../../../registry/visant/ui/shader-vhs";
import type { DemoProps } from "../catalog";
import { PalcoDoShader, useImagemDoShader } from "./imagem-do-shader";

export default function ShaderVhsDemo({ props }: DemoProps) {
  const imagem = useImagemDoShader((props as { src?: unknown } | undefined)?.src);
  return (
    <PalcoDoShader>
      <ShaderVhs
        alt={imagem.alt}
        className="h-full min-h-0 w-full"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
