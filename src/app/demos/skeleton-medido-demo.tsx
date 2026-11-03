"use client";

/**
 * O mesmo card nos dois estados: as setas trocam entre esperar e pronto, e nada
 * sai do lugar na troca. É a promessa inteira da peça.
 */

import * as React from "react";

import { SkeletonMedido } from "../../../registry/visant/ui/skeleton-medido";
import type { DemoProps } from "../catalog";
import { Trocador, useUmPorVez } from "./um-por-vez";

const ESTADOS = ["carregando", "pronto"] as const;

export default function SkeletonMedidoDemo(_: DemoProps) {
  const { atual, passo } = useUmPorVez(ESTADOS);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6">
      <SkeletonMedido loading={atual === "carregando"}>
        <article className="w-[300px] max-w-full rounded-[var(--r-surface)] bg-card p-[var(--pad-card)] text-card-foreground">
          <div className="aspect-[16/9] w-full rounded-[var(--r-control)] bg-muted" />
          <h3 className="mt-4 text-lg font-medium">Relatório do trimestre</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumo das entregas, com os números de cada equipe.
          </p>
          <button
            type="button"
            className="mt-4 h-[var(--control-h)] rounded-[var(--r-control)] bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Abrir
          </button>
        </article>
      </SkeletonMedido>
      <Trocador nome={atual} onPasso={passo} rotulo="estado" />
    </div>
  );
}
