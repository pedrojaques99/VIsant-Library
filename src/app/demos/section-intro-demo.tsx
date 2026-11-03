"use client";

/**
 * A mesma abertura de dobra, uma composição por vez, e as setas trocam.
 *
 * A altura da peça é reservada para as setas não pularem de lugar: cada `layout`
 * tem uma altura, e seletor que anda sob o cursor faz errar o segundo clique.
 */

import * as React from "react";

import { SectionIntro, type SectionIntroLayout } from "../../../registry/visant/ui/section-intro";
import type { DemoProps } from "../catalog";
import { Trocador, useUmPorVez } from "./um-por-vez";

const ORDEM: readonly SectionIntroLayout[] = ["center", "split", "index", "editorial"];

export default function SectionIntroDemo({ props }: DemoProps) {
  const { layout: _l, ...resto } = (props ?? {}) as { layout?: SectionIntroLayout } & Record<string, unknown>;
  const { atual, passo, repetir } = useUmPorVez(ORDEM, _l);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6">
      <div className="flex h-[340px] w-full items-center">
        <SectionIntro
          className="w-full"
          eyebrow="Seção"
          index="02"
          title="Um título curto que diz o essencial."
          lead="Uma linha de contexto, em medida mais estreita que o título."
          {...resto}
          layout={atual}
        />
      </div>
      {/* Palco a 0,66 no ladrilho: sem isto as setas ficam miúdas demais. */}
      <div className="scale-125">
        <Trocador nome={atual} onPasso={passo} onRepetir={repetir} rotulo="composição" />
      </div>
    </div>
  );
}
