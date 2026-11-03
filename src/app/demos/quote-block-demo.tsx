"use client";

/**
 * A demo mostra UM depoimento, em tamanho de dobra, e nada mais.
 *
 * A tentação era mostrar dois tons lado a lado — e seria o mesmo erro que a
 * parede de depoimentos comete quando encolhe: o que esta peça vende é o PESO
 * da citação, e peso não sobrevive a duas colunas de metade da largura. Um
 * depoimento, no corpo em que ele é entregue.
 *
 * O retrato é o recorte do rosto no retrato-01 do acervo, em tamanho pequeno:
 * os outros retratos do banco são cenas de grupo ou de mesa, sem uma pessoa
 * que pudesse ser quem fala, e ampliar qualquer um deles borra. Aqui o recorte
 * é grande na fonte e pequeno na tela, então continua nítido.
 *
 * O logo do "cliente" é desenhado aqui, não é arquivo: o acervo da vitrine não
 * tem marca de terceiro, e um retângulo cinza no lugar do logo esconderia
 * justamente a parte que a peça normaliza.
 */

import * as React from "react";

import { Media } from "../media";
import { QuoteBlock } from "../../../registry/visant/ui/quote-block";
import type { DemoProps } from "../catalog";

function LogoCliente() {
  return (
    <svg viewBox="0 0 112 24" aria-hidden="true" fill="currentColor">
      <text x="0" y="20" fontSize="24" fontWeight="700" letterSpacing="2">LOGO</text>
    </svg>
  );
}

export default function QuoteBlockDemo({ props }: DemoProps) {
  return (
    <div className="flex h-full w-full items-center px-4">
      <QuoteBlock
        tone="muted"
        quote="Uma frase curta sobre como foi trabalhar junto, no tom de quem contrataria de novo."
        author="Nome da pessoa"
        role="Cargo"
        company="Empresa"
        logo={<LogoCliente />}
        source="https://exemplo.com"
        portraitWidth={7.5}
        ratio="1/1"
        portrait={
          <Media
            papel="retrato"
            indice={0}
            className="size-full [&_img]:origin-[49%_45%] [&_img]:scale-[2.45]"
          />
        }
        {...props}
      />
    </div>
  );
}
