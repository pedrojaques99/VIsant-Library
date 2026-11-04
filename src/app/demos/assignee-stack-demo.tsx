"use client";

/**
 * A pilha vive numa linha, encostada à direita do nome da tarefa.
 *
 * Três linhas e uma caixa pequena no catálogo: quatro linhas com rótulo em
 * 620px encolhiam até o avatar virar ponto no ladrilho pequeno. Cada linha mostra
 * um caso: gente demais (o "+N"), gente que cabe, e time novo sem foto, que é
 * onde as iniciais se julgam. Passar o ponteiro abre a pilha e diz o nome.
 */

import * as React from "react";

import { midia, useWireframe } from "../media";
import { PEOPLE } from "../demo-fixtures";
import { AssigneeStack, type Assignee } from "../../../registry/visant/ui/assignee-stack";
import type { DemoProps } from "../catalog";

/** Mais gente do que cabe: o excedente é a parte da peça que se quer ver. */
const EQUIPE = [
  ...PEOPLE,
  { id: "6", name: "Bia Nogueira" },
  { id: "7", name: "Téo Sampaio" },
];

const FILA = [
  { titulo: "Rebrand", pessoas: [0, 1, 2, 3, 4], foto: true },
  { titulo: "Landing nova", pessoas: [1, 5], foto: true },
  { titulo: "Naming", pessoas: [4, 6, 3], foto: false },
];

export default function AssigneeStackDemo({ props }: DemoProps) {
  const { wireframe } = useWireframe();

  // O avatar sai do banco de mídia da vitrine, mas respeita o interruptor de
  // wireframe: sem foto, a peça cai nas iniciais tonalizadas — que é o caminho
  // que precisa ser julgável.
  const comFoto = React.useCallback(
    (indices: number[], foto: boolean): Assignee[] =>
      indices.map((i) => ({
        ...EQUIPE[i % EQUIPE.length],
        // A foto é da pessoa: a mesma em todas as linhas, e nunca duas iguais na pilha.
        avatarUrl: foto && !wireframe ? midia("retrato", i)?.src : undefined,
      })),
    [wireframe],
  );

  return (
    <div className="flex h-full w-full items-center justify-center p-3">
      <ul className="w-full max-w-md divide-y divide-border rounded-[var(--r-surface,0.875rem)] border border-border bg-card">
        {FILA.map((t) => (
          <li key={t.titulo} className="flex items-center gap-3 px-4 py-2.5">
            <span className="min-w-0 truncate text-corpo font-medium">{t.titulo}</span>
            {/* `ml-auto` e não `justify-between`: o nome da tarefa é quem pode
                crescer; a pilha tem largura própria e fica ancorada na borda. */}
            <div className="ml-auto shrink-0">
              <AssigneeStack assignees={comFoto(t.pessoas, t.foto)} max={3} size="lg" {...props} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
