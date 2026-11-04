"use client";

/**
 * A árvore parada no palco, arrastável — sem scroll, sem texto e sem moldura.
 *
 * O modo `scroll` precisa de uma seção de página inteira para ter o que rolar;
 * num card ele não teria comprimento nenhum. Aqui o progresso fica fixo no meio
 * da caminhada (a árvore inteira no quadro, a névoa já abrindo).
 *
 * A tinta sai da marca escolhida no seletor, com um quarto de `--foreground` para
 * segurar o contraste também no tema claro.
 */

import * as React from "react";

import { FogTree } from "../../../registry/visant/ui/fog-tree";
import type { DemoProps } from "../catalog";

export default function FogTreeDemo({ props }: DemoProps) {
  return (
    <FogTree
      // min-h: na rota solo o palco não tem altura, e com min-h-0 a cena virava uma faixa achatada
      className="h-full"
      progress={0.35}
      draggable
      ink="color-mix(in oklch, var(--brand, var(--foreground)) 75%, var(--foreground))"
      {...props}
    />
  );
}
