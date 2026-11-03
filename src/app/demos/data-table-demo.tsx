"use client";

/**
 * A tabela de verdade, com uma lista de tarefas e nada em volta.
 *
 * Nasce ordenada pelo prazo: a seta no cabeçalho é o que diz, sem legenda, que a
 * coluna ordena. A seleção e a edição ficam a um clique: o título é editável, e o
 * status é ponto mais texto, porque a marca não pinta palavra.
 *
 * Cinco linhas cabem na caixa do ladrilho sem paginar. O seletor de página da peça
 * só conhece 20 a 50 por página, e paginar cinco linhas seria controle sem função.
 *
 * No celular a tabela é outra: só o título, com o ponto do status ao lado dele. As
 * colunas somem por `hideOnMobile`, a prop da própria peça, e `sm:hidden` no ponto
 * usa o mesmo corte de 640px.
 *
 * Na vitrine, `next-auth` e `next/navigation` são substituídos em `src/app/shims`
 * (ver `vite.config.ts`): a sessão é de administrador, senão a edição nem aparece,
 * e a ordenação não escreve na URL do catálogo.
 */

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "../../../registry/visant/ui/data-table";

interface Tarefa {
  id: string;
  titulo: string;
  status: "Fazendo" | "Revisão" | "Na fila" | "Pronta";
  quem: string;
  prazo: string;
  /** Mesma data de `prazo`, em ordem que ordena. */
  ordem: number;
}

const TAREFAS: Tarefa[] = [
  { id: "1", titulo: "Revisar o texto da página", status: "Fazendo", quem: "Ana", prazo: "12 mar", ordem: 312 },
  { id: "2", titulo: "Ajustar o layout do cartão", status: "Revisão", quem: "Caio", prazo: "14 mar", ordem: 314 },
  { id: "3", titulo: "Testar no celular", status: "Na fila", quem: "Marina", prazo: "18 mar", ordem: 318 },
  { id: "4", titulo: "Trocar as fotos da home", status: "Pronta", quem: "Pedro", prazo: "09 mar", ordem: 309 },
  { id: "5", titulo: "Publicar a nova versão", status: "Na fila", quem: "Bia", prazo: "24 mar", ordem: 324 },
];

const PONTO: Record<Tarefa["status"], string> = {
  Fazendo: "bg-[var(--brand)]",
  Revisão: "bg-foreground",
  "Na fila": "border border-border bg-transparent",
  Pronta: "bg-muted-foreground",
};

const COLUNAS: ColumnDef<Tarefa, unknown>[] = [
  {
    accessorKey: "titulo",
    header: "Tarefa",
    meta: { editable: true },
    cell: ({ row, getValue }) => (
      <span className="inline-flex items-center gap-2 font-medium text-foreground">
        <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full sm:hidden ${PONTO[row.original.status]}`} />
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: { hideOnMobile: true },
    cell: ({ getValue }) => {
      const status = getValue() as Tarefa["status"];
      return (
        <span className="inline-flex items-center gap-2 whitespace-nowrap text-muted-foreground">
          <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${PONTO[status]}`} />
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "quem",
    header: "Com",
    meta: { hideOnMobile: true },
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue() as string}</span>,
  },
  {
    id: "prazo",
    accessorFn: (t) => t.ordem,
    header: "Prazo",
    meta: { hideOnMobile: true },
    cell: ({ row }) => <span className="whitespace-nowrap tabular-nums text-muted-foreground">{row.original.prazo}</span>,
  },
];

const POR_PRAZO = [{ id: "prazo", desc: false }];

export default function DataTableDemo() {
  const [tarefas, setTarefas] = React.useState(TAREFAS);

  const atualizar = React.useCallback(async (linha: Tarefa, coluna: string, valor: unknown) => {
    setTarefas((atual) =>
      atual.map((t) => (t.id === linha.id ? { ...t, [coluna]: valor } : t)),
    );
  }, []);

  return (
    <div className="flex h-full w-full flex-col justify-center p-4">
      <DataTable
        columns={COLUNAS}
        data={tarefas}
        getRowId={(t) => t.id}
        enableRowSelection
        initialSorting={POR_PRAZO}
        onCellUpdate={atualizar}
      />
    </div>
  );
}
