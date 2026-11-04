"use client";

/**
 * A parede em grade, ocupando a altura toda do palco, e fechada embaixo.
 *
 * `layout="bento"` divide a altura em linhas e `span` diz o que cada item ocupa,
 * então nenhuma coluna termina antes da outra. As setas trocam a malha: os mesmos
 * tipos de item, quatro desenhos, sempre em três colunas e duas linhas.
 *
 * No celular a grade tem uma trilha só e cinco cartões não cabem na caixa: a parede
 * mostra os três primeiros e cresce até a altura deles, e a página rola.
 */

import { ArrowRight } from "lucide-react";

import { Media } from "../media";
import { useElementWidth } from "../stage";
import { Trocador, useUmPorVez } from "./um-por-vez";
import { TestimonialWall, type TestimonialItem } from "../../../registry/visant/blocks/testimonial-wall";
import type { DemoProps } from "../catalog";

/** Abaixo disto a grade do bento tem uma trilha só (o dobro do piso de coluna). */
const UMA_TRILHA = 496;

const ANA: TestimonialItem = {
  id: "ana",
  kind: "quote",
  headline: "Rápido e fácil de trabalhar junto",
  quote: "Entendeu o pedido e entregou no combinado.",
  author: "Ana",
  role: "Marketing",
  rating: 5,
};
const CAIO: TestimonialItem = {
  id: "caio",
  kind: "quote",
  tone: "muted",
  quote: "Responde rápido e explica cada decisão.",
  author: "Caio",
  role: "Design",
};
const PEDRO: TestimonialItem = {
  id: "pedro",
  kind: "quote",
  quote: "Saiu melhor do que a gente imaginava.",
  author: "Pedro",
  role: "Fundação",
};
const NUMERO: TestimonialItem = {
  id: "numero",
  kind: "stat",
  tone: "brand",
  value: "00+",
  label: "O número que você pode provar",
};
const MARINA: TestimonialItem = {
  id: "marina",
  kind: "portrait",
  media: <Media papel="video" indice={2} className="size-full" />,
  name: "Marina",
  role: "Produto",
  onPlay: () => {},
};

const MALHAS = {
  retrato: [ANA, MARINA, NUMERO, CAIO, PEDRO],
  destaque: [{ ...MARINA, span: { col: 2, row: 2 } }, NUMERO, ANA],
  faixa: [{ ...MARINA, span: { col: 2, row: 1 } }, NUMERO, ANA, CAIO, PEDRO],
  coluna: [{ ...NUMERO, span: { row: 2 } }, { ...ANA, span: { col: 2 } }, { ...MARINA, span: { row: 1 } }, CAIO],
} satisfies Record<string, TestimonialItem[]>;

const NOMES = Object.keys(MALHAS) as (keyof typeof MALHAS)[];

export default function TestimonialWallDemo({ props }: DemoProps) {
  const { atual, passo } = useUmPorVez(NOMES);
  const [ref, largura] = useElementWidth<HTMLDivElement>();
  const estreita = largura > 0 && largura < UMA_TRILHA;
  const itens: TestimonialItem[] = MALHAS[atual];

  return (
    <div
      ref={ref}
      // O respiro é da demo: a parede ocupava a caixa inteira, e no ladrilho o
      // primeiro cartão e a estrela da faixa encostavam na borda arredondada.
      className={estreita ? "flex w-full flex-col gap-2 p-4" : "flex h-full w-full flex-col gap-2 overflow-hidden p-8"}
    >
      <TestimonialWall
        className="min-h-0 w-full flex-1"
        layout="bento"
        columns={3}
        items={estreita ? itens.slice(0, 3) : itens}
        footer={
          estreita ? undefined : (
            <>
              <p className="text-[14px] text-muted-foreground">O que dizem de trabalhar junto</p>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="alvo-toque inline-flex items-center gap-1.5 rounded-[var(--r-control,0.5rem)] text-[14px] font-medium text-foreground focus-visible:outline-none focus-visible:[box-shadow:var(--focus)]"
              >
                Ler todos os depoimentos
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </>
          )
        }
        {...props}
      />
      <div className="flex shrink-0 justify-center">
        <Trocador nome={atual} onPasso={passo} rotulo="malha" />
      </div>
    </div>
  );
}
