"use client";

/**
 * Um gesto por vez, sem caixa em volta.
 *
 * Três calibragens da mesma peça, e as setas trocam:
 *
 * · **selo** — força alta, raio curto: o gesto declarado, que a pessoa persegue.
 * · **campo** — força baixa em muitas instâncias: vira física de superfície.
 * · **foto** — força baixa e raio largo: a esquiva que quase não se nota.
 */

import * as React from "react";

import { Media } from "../media";
import { RepulsiveHover } from "../../../registry/visant/ui/repulsive-hover";
import { Trocador, useUmPorVez } from "./um-por-vez";

const USOS = ["selo", "campo", "foto"] as const;
const CAMPO = Array.from({ length: 50 }, (_, i) => i);

export default function RepulsiveHoverDemo() {
  const { atual, rodada, passo, repetir } = useUmPorVez(USOS);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <div key={`${atual}-${rodada}`} className="grid h-[200px] w-full place-items-center">
        {atual === "selo" ? (
          <RepulsiveHover strength={16} radius={120}>
            <span
              className="inline-block rounded-[var(--r-pill,9999px)] px-5 py-2.5 text-corpo font-medium"
              style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
            >
              Começar
            </span>
          </RepulsiveHover>
        ) : atual === "campo" ? (
          // Cada ponto é uma instância: o efeito só vira física de superfície
          // quando há muitos, e é aí que o raio curto importa.
          <div className="grid grid-cols-10 gap-5">
            {CAMPO.map((i) => (
              <RepulsiveHover key={i} strength={9} radius={80}>
                <span className="block size-2 rounded-full bg-foreground/55" />
              </RepulsiveHover>
            ))}
          </div>
        ) : (
          <RepulsiveHover strength={9} radius={190}>
            <Media
              papel="retrato"
              indice={5}
              ratio="4/5"
              className="w-[156px] rounded-[var(--r-control,0.5rem)]"
            />
          </RepulsiveHover>
        )}
      </div>
      <Trocador nome={atual} onPasso={passo} onRepetir={repetir} rotulo="uso" />
    </div>
  );
}
