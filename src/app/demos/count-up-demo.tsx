"use client";

/**
 * A dobra de prova em miniatura — que é o único lugar onde o contador existe.
 *
 * ── O que mudou, e por quê ─────────────────────────────────────────────────
 *
 * A demo anterior punha um travessão solto (`—`) ao lado dos dois números, para
 * demonstrar a regra 2 do componente: "o que não dá pra parsear não anima". A
 * intenção era boa e a leitura era outra — quem chega no card vê um traço no
 * meio de dois números e conclui que a peça quebrou. Foi exatamente o que o
 * report disse ("pq tem um traçado?"), com severidade de coisa quebrada.
 *
 * Regra que fica: **a demo mostra o que a peça faz, não o que ela se recusa a
 * fazer.** A recusa é comportamento defensivo, está documentada no componente e
 * não tem forma visual própria — um valor ausente e um valor ausente por bug
 * desenham o mesmo traço na tela.
 *
 * O rótulo embaixo de cada número entra pelo mesmo motivo: número sem unidade
 * nem nome é ornamento. Com rótulo, o card é a dobra de prova de verdade — que é
 * a cena em que alguém vai instalar isto.
 */

import * as React from "react";

import { RotateCcw } from "lucide-react";

import { CountUp } from "../../../registry/visant/ui/count-up";
import type { DemoProps } from "../catalog";

const NUMEROS = [
  { valor: "R$450", rotulo: "no carrinho", delay: 0 },
  { valor: "1.200", rotulo: "passos hoje", delay: 120 },
  { valor: "98%", rotulo: "de bateria", delay: 240 },
];

export default function CountUpDemo({ props }: DemoProps) {
  const [n, setN] = React.useState(0);

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* A remontagem por `key` é o único jeito de rever a entrada: a contagem
          acontece uma vez, quando o número entra em tela, e o componente
          publicado não expõe método imperativo nenhum. */}
      <div className="flex items-start justify-center gap-9" key={n}>
        {NUMEROS.map((item) => (
          <div key={item.rotulo} className="flex flex-col items-center gap-1">
            <CountUp
              className="text-[2rem] font-semibold leading-none tracking-tight"
              delay={item.delay}
              {...props}
            >
              {item.valor}
            </CountUp>
            <span className="text-rotulo uppercase tracking-[0.14em] text-muted-foreground">
              {item.rotulo}
            </span>
          </div>
        ))}
      </div>

      {/* No canto e fora do fluxo: os números ficam no centro exato, com ou sem botão. */}
      <button
        type="button"
        onClick={() => setN((x) => x + 1)}
        aria-label="Contar de novo"
        title="Contar de novo"
        className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-[var(--r-pill)] border border-border bg-card text-muted-foreground outline-none transition-[color,scale] [transition-duration:var(--dur-press)] [transition-timing-function:var(--ease-out)] hover:text-foreground focus-visible:[box-shadow:var(--focus)] active:scale-95 motion-reduce:active:scale-100 pointer-coarse:size-11"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
