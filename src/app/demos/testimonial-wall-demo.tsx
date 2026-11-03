"use client";

/**
 * A parede em grade, ocupando a altura toda do palco, e fechada embaixo.
 *
 * `layout="bento"` divide a altura em linhas e o retrato em vídeo atravessa
 * as duas, então nenhuma coluna termina antes da outra. A faixa do `footer`
 * fecha a composição com uma frase e o caminho pros outros depoimentos:
 * sem ela a parede só parava, não terminava.
 */

import { ArrowRight } from "lucide-react";

import { Media } from "../media";
import { TestimonialWall } from "../../../registry/visant/blocks/testimonial-wall";
import type { DemoProps } from "../catalog";

export default function TestimonialWallDemo({ props }: DemoProps) {
  return (
    <TestimonialWall
      // O respiro é da demo: a parede ocupava a caixa inteira, e no ladrilho o
      // primeiro cartão e a estrela da faixa encostavam na borda arredondada.
      className="h-full w-full p-8"
      layout="bento"
      columns={3}
      items={[
        {
          id: "a",
          kind: "quote",
          headline: "Rápido e fácil de trabalhar junto",
          quote:
            "Entendeu o pedido e entregou no combinado.",
          author: "Ana",
          role: "Marketing",
          rating: 5,
        },
        {
          id: "c",
          kind: "portrait",
          media: <Media papel="video" indice={2} className="size-full" />,
          name: "Marina",
          role: "Produto",
          onPlay: () => {},
        },
        { id: "b", kind: "stat", tone: "brand", value: "00+", label: "O número que você pode provar" },
        {
          id: "d",
          kind: "quote",
          tone: "muted",
          quote: "Responde rápido e explica cada decisão.",
          author: "Caio",
          role: "Design",
        },
        {
          id: "e",
          kind: "quote",
          quote: "Saiu melhor do que a gente imaginava.",
          author: "Pedro",
          role: "Fundação",
        },
      ]}
      footer={
        <>
          <p className="text-[14px] text-muted-foreground">O que dizem de trabalhar junto</p>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-1.5 rounded-[var(--r-control,0.5rem)] text-[14px] font-medium text-foreground focus-visible:outline-none focus-visible:[box-shadow:var(--focus)]"
          >
            Ler todos os depoimentos
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </>
      }
      {...props}
    />
  );
}
