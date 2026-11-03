"use client";

/**
 * A marca condensando da fumaça, um efeito por vez.
 *
 * No site a condensação vem do scroll (o rodapé chega e a tinta assenta). Num
 * card de vitrine não há o que rolar, então a demo usa a prop `progress` e
 * dirige o mesmo caminho por tempo. A marca é sempre VISANT® em Manrope Bold
 * maiúscula, a assinatura da casa, para a comparação ser só do efeito: as setas
 * trocam `fx` e a tinta se desfaz e condensa de novo na voz nova.
 */

import * as React from "react";
import { animate, useMotionValue, useReducedMotion } from "framer-motion";

import { InkWordmark, type InkWordmarkFx } from "../../../registry/visant/ui/ink-wordmark";
import type { DemoProps } from "../catalog";
import { Trocador, useUmPorVez } from "./um-por-vez";

const EFEITOS: readonly InkWordmarkFx[] = ["tinta", "escorrer", "fatias", "gota", "grao", "neon"];

export default function InkWordmarkDemo({ props }: DemoProps) {
  const { fx: externo, ...resto } = (props ?? {}) as { fx?: InkWordmarkFx };
  const { atual, rodada, passo, repetir } = useUmPorVez(EFEITOS, externo);
  // Nasce já formando (0,3), não em branco: a grade e o primeiro quadro mostram a marca.
  const progresso = useMotionValue(0.3);
  const reduce = useReducedMotion();

  React.useEffect(() => {
    if (reduce) {
      progresso.set(1);
      return;
    }
    let vivo = true;
    let atualAnim: ReturnType<typeof animate> | undefined;
    let espera = 0;
    const ciclo = async () => {
      progresso.jump(0.3);
      while (vivo) {
        // Longo e em `in-out`: o efeito precisa ser visto; com `ease-out` ele já tinha acabado.
        atualAnim = animate(progresso, 1, { duration: 2.6, ease: [0.77, 0, 0.175, 1] });
        await atualAnim;
        if (!vivo) break;
        await new Promise<void>((r) => {
          espera = window.setTimeout(r, 3200);
        });
        if (!vivo) break;
        atualAnim = animate(progresso, 0.3, { duration: 1.4, ease: [0.77, 0, 0.175, 1] });
        await atualAnim;
      }
    };
    void ciclo();
    return () => {
      vivo = false;
      window.clearTimeout(espera);
      atualAnim?.stop();
    };
  }, [progresso, reduce, rodada]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 overflow-hidden px-8">
      <InkWordmark
        progress={progresso}
        aria-label="Visant"
        className="w-full max-w-[34rem] text-foreground"
        text="Visant"
        mark="®"
        font="manrope"
        weight={700}
        textCase="upper"
        tracking={-0.02}
        fx={atual}
        {...resto}
      />
      <Trocador nome={atual} onPasso={passo} onRepetir={repetir} rotulo="efeito" />
    </div>
  );
}
