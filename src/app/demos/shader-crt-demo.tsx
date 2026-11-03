"use client";

/**
 * A peça sozinha e grande sobre uma foto do acervo. A faixa de luz desce
 * sozinha; os knobs trocam linha, vinheta e curva da tela.
 */

import { ShaderCrt } from "../../../registry/visant/ui/shader-crt";
import type { DemoProps } from "../catalog";
import { PalcoDoShader, useImagemDoShader } from "./imagem-do-shader";

export default function ShaderCrtDemo({ props }: DemoProps) {
  const imagem = useImagemDoShader((props as { src?: unknown } | undefined)?.src);
  return (
    <PalcoDoShader>
      <ShaderCrt
        alt={imagem.alt}
        className="w-[var(--shader-w,360px)] max-w-full rounded-[var(--r-surface)]"
        {...props}
        src={imagem.src}
      />
    </PalcoDoShader>
  );
}
