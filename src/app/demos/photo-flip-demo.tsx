"use client";

/**
 * Três fotos grandes: a passagem da grade para a tela cheia é a peça.
 *
 * A demo saiu do `catalog.tsx` porque ela puxa GSAP + Flip; mesmo trato do
 * marquee e da cena presa: a biblioteca chega quando o card chega.
 *
 * Os retratos ficam na mesma proporção 4/5, para a grade ser homogênea e a
 * passagem ser a única coisa que se move. Os índices escolhidos pulam o cartão
 * com texto do acervo, que aparecia cortado no meio da palavra.
 *
 * A caixa é elástica (`w-full` com teto), e não uma largura cravada: uma medida
 * fixa menor que o ladrilho deixa a peça encostada na esquerda.
 */

import * as React from "react";

import { Media } from "../media";
import { PhotoFlip } from "../../../registry/visant/ui/photo-flip";
import type { DemoProps } from "../catalog";

export default function PhotoFlipDemo({ props }: DemoProps) {
  const items = React.useMemo(
    () =>
      [2, 4, 5].map((i, n) => ({
        id: `f${i}`,
        media: <Media papel="retrato" indice={i} className="size-full" />,
        caption: `Retrato ${n + 1}`,
      })),
    [],
  );

  return (
    <div className="flex h-full w-full items-center justify-center px-6">
      <PhotoFlip
        items={items}
        ratio="4/5"
        className="grid w-full max-w-[560px] grid-cols-3 gap-3"
        {...props}
      />
    </div>
  );
}
