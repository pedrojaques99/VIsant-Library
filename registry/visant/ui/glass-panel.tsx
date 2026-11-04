"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Grão por cima do fosco: é o que tira a cara de CSS numa superfície grande. */
  grain?: boolean;
}

/**
 * Vidro fosco com borda em degradê: acesa num canto, quase apagada no meio, volta
 * no canto oposto. Só faz sentido sobre algo com forma e cor; sobre fundo liso o
 * blur não tem o que borrar e a peça vira um retângulo cinza.
 *
 * Sem refração de propósito: mapa de deslocamento numa superfície deste tamanho
 * pesa e distorce o conteúdo de trás. Para isso existe `liquid-glass`.
 *
 * A luz segue o ponteiro devagar e nasce acesa num canto: o hover intensifica, não
 * revela, e no toque ela fica parada. Nada se move além dela.
 *
 * Sem `backdrop-filter` no navegador, o tom do fundo segura a leitura sozinho.
 * Ajuste por `--glass-panel-filter` e `--glass-panel-fill`.
 */
export function GlassPanel({ grain = false, className, children, onPointerMove, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn("glass-panel", className)}
      data-grain={grain || undefined}
      onPointerMove={(e) => {
        onPointerMove?.(e);
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--glass-panel-x", `${((e.clientX - r.left) / r.width) * 100}%`);
        e.currentTarget.style.setProperty("--glass-panel-y", `${((e.clientY - r.top) / r.height) * 100}%`);
      }}
      {...props}
    >
      <span className="glass-panel-luz" aria-hidden />
      {children}
    </div>
  );
}
