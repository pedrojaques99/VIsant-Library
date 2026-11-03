"use client";

/**
 * A demo da cortina mora sozinha porque ela puxa GSAP + ScrollTrigger (a
 * espiada de descoberta) — mesmo trato do marquee e da cena presa: a biblioteca
 * chega quando o card chega.
 *
 * A MESMA foto nos dois lados, em dois tratamentos, com o antes à esquerda: é o
 * que a peça compara na vida real. Duas cenas diferentes (já foi um globo contra
 * um rádio) não comparam nada, e o olho não tem o que procurar na costura.
 *
 * A caixa cresceu de 440px para 620px pelo mesmo motivo: comparar duas fotos é
 * o produto da peça, e numa faixa de 293px de altura o "antes" e o "depois"
 * viram duas miniaturas. O punho, que era o bug reportado, também só se julga
 * em tamanho de foto — 28px sobre 440px e sobre 620px são duas leituras
 * diferentes do mesmo controle.
 *
 * ── "Descentralizado": onde estava, de fato ────────────────────────────────
 *
 * Não estava aqui dentro. A peça sempre esteve no meio do próprio palco — o
 * palco é que era mais estreito que o ladrilho. O `FitStage` desenha a demo na
 * largura declarada em `preview.w` e só escala PRA BAIXO, com origem no canto
 * superior esquerdo: com `w: 660` num ladrilho de duas colunas (~690px), sobra
 * uma faixa de trinta e poucos pixels sempre do lado direito, e o olho lê a
 * peça encostada na esquerda. Centrar mais o conteúdo não corrigiria nada,
 * porque o conteúdo já estava centrado.
 *
 * A correção é o `preview` cobrir o ladrilho inteiro e a peça ser ELÁSTICA
 * dentro dele: `w-full` com `max-w`, em vez de largura cravada. Assim a caixa
 * preenche o palco, o teto mantém a foto no tamanho em que ela se julga, e o
 * `justify-center` centra o que sobra — nas três larguras da grade e também na
 * página solo, onde não há palco nenhum.
 */

import * as React from "react";

import { Media } from "../media";
import { PhotoCompare } from "../../../registry/visant/ui/photo-compare";
import type { DemoProps } from "../catalog";

export default function PhotoCompareDemo({ props }: DemoProps) {
  return (
    <div className="flex h-full w-full items-center justify-center px-4">
      <PhotoCompare
        className="mx-auto w-full max-w-[620px] rounded-[var(--r-surface,0.875rem)] border border-border"
        ratio="3/2"
        before={<Media papel="cena" indice={5} className="size-full [&_img]:[filter:grayscale(1)_contrast(0.9)]" />}
        after={<Media papel="cena" indice={5} className="size-full" />}
        beforeSide="left"
        beforeLabel="antes"
        afterLabel="depois"
        {...props}
      />
    </div>
  );
}
