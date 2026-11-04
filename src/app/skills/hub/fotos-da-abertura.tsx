"use client";

import { cn } from "@/lib/utils";

/**
 * As duas fotos da abertura de /skills, paradas, enquanto a `PhotoCompare` viva não chega.
 *
 * As mesmas classes da peça, com a cortina no meio: quando o GSAP desce e a peça monta, nada sai
 * do lugar, ela só ganha a alça e o movimento. A peça pede 45 KB de GSAP para a espiada e o
 * arrasto, e em Slow 4G eles não podem vir antes das fotos.
 */
/* React 18 só conhece o atributo em minúsculas: em camelCase ele avisa e o descarta. */
const PRIORIDADE = { fetchpriority: "high" } as React.ImgHTMLAttributes<HTMLImageElement>;

export function FotosDoAntesDepois({
  antes,
  depois,
  sizes,
  ratio,
  className,
}: {
  antes: { src: string; srcSet?: string };
  depois: { src: string; srcSet?: string };
  sizes?: string;
  ratio: string;
  className?: string;
}) {
  return (
    <div className={cn("photo-compare", className)} style={{ "--ratio": ratio, "--p": "50%" } as React.CSSProperties}>
      <div className="photo-compare-layer">
        <img {...antes} {...PRIORIDADE} sizes={sizes} alt="" />
      </div>
      <div className="photo-compare-layer photo-compare-after" aria-hidden="true">
        <img {...depois} {...PRIORIDADE} sizes={sizes} alt="" />
      </div>
      <span aria-hidden="true" className="photo-compare-seam bg-[var(--background)]" />
    </div>
  );
}
