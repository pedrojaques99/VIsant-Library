"use client";

/**
 * A peça sozinha e grande sobre uma foto do acervo. Os knobs dosam o
 * quanto do duotone cobre a foto, o contraste e o brilho.
 */

import { ShaderDuotone } from "../../../registry/visant/ui/shader-duotone";
import type { DemoProps } from "../catalog";
import { PalcoDoShader, useImagemDoShader } from "./imagem-do-shader";

export default function ShaderDuotoneDemo({ props }: DemoProps) {
  const imagem = useImagemDoShader((props as { src?: unknown } | undefined)?.src);
  return (
    <PalcoDoShader>
      <ShaderDuotone
        alt={imagem.alt}
        className="w-[var(--shader-w,360px)] max-w-full rounded-[var(--r-surface)]"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
