"use client";

/**
 * Uma caixa de entrada curta com uma conversa já marcada: basta apertar
 * "Apagar 1" para ver o buraco. Os retratos vêm do acervo, então a lista tem
 * cara de produto e não de wireframe.
 */

import { Media } from "../media";
import { BlackHole } from "../../../registry/visant/ui/black-hole";
import type { DemoProps } from "../catalog";

const CONVERSAS = [
  { id: "1", nome: "Marina", assunto: "Copy da dobra, segunda passada", hora: "9:41" },
  { id: "2", nome: "Rafael", assunto: "Relatório da semana", hora: "9:12" },
  { id: "3", nome: "Júlia", assunto: "Revisão do layout mudou pra quinta", hora: "8:30" },
];

export default function BlackHoleDemo({ props }: DemoProps) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <BlackHole
        className="w-[380px] max-w-full"
        items={CONVERSAS}
        defaultSelected={["2"]}
        itemLabel={(c) => `${c.nome}: ${c.assunto}`}
        renderItem={(c) => (
          <span className="flex items-center gap-3">
            <Media
              papel="retrato"
              indice={Number(c.id)}
              className="size-8 shrink-0 rounded-[var(--r-pill)]"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">{c.nome}</span>
              <span className="block truncate text-xs text-muted-foreground">{c.assunto}</span>
            </span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{c.hora}</span>
          </span>
        )}
        {...props}
      />
    </div>
  );
}
