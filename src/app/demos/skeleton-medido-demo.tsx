"use client";

/**
 * Três cards de verdade, e o esqueleto de cada um é o dele: avatar redondo, mídia
 * quadrada, balão de conversa. Nasce esperando; a seta troca o card e espera de novo.
 */

import * as React from "react";

import { SkeletonMedido } from "../../../registry/visant/ui/skeleton-medido";
import type { DemoProps } from "../catalog";
import { Media } from "../media";
import { Trocador, useUmPorVez } from "./um-por-vez";

const FORMAS = ["perfil", "produto", "conversa"] as const;
const ESPERA_MS = 1800;
const CARTAO = "w-[320px] max-w-full rounded-[var(--r-surface)] bg-card p-[var(--pad-card)] text-card-foreground";

function Perfil() {
  return (
    <article className={CARTAO}>
      <div className="flex items-center gap-3">
        <Media papel="retrato" indice={1} className="size-14 shrink-0 rounded-[var(--r-pill)]" />
        <div className="min-w-0">
          <h3 className="text-base font-medium">Marina Costa</h3>
          <p className="text-sm text-muted-foreground">Direção de arte</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3">
        {[["128", "Projetos"], ["4,9", "Nota"], ["12", "Anos"]].map(([n, r]) => (
          <div key={r}>
            <dd className="text-lg font-medium tabular-nums">{n}</dd>
            <dt className="text-xs text-muted-foreground">{r}</dt>
          </div>
        ))}
      </dl>
    </article>
  );
}

function Produto() {
  return (
    <article className={CARTAO}>
      <Media papel="cena" indice={3} ratio="4/3" className="w-full rounded-[var(--r-control)]" />
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="text-base font-medium">Luminária de mesa</h3>
        <p className="font-mono text-sm tabular-nums">R$ 349</p>
      </div>
      <button type="button" className="mt-3 h-[var(--control-h)] w-full rounded-[var(--r-control)] bg-primary text-sm font-medium text-primary-foreground">
        Comprar
      </button>
    </article>
  );
}

function Conversa() {
  return (
    <article className={`${CARTAO} flex flex-col gap-2.5`}>
      <div className="flex items-end gap-2">
        <Media papel="retrato" indice={2} className="size-8 shrink-0 rounded-[var(--r-pill)]" />
        <p className="rounded-[var(--r-control)] bg-muted px-3 py-2 text-sm">A prova chegou hoje?</p>
      </div>
      <p className="self-end rounded-[var(--r-control)] bg-primary px-3 py-2 text-sm text-primary-foreground">Chegou, ficou ótima.</p>
      <div className="flex items-end gap-2">
        <Media papel="retrato" indice={2} className="size-8 shrink-0 rounded-[var(--r-pill)]" />
        <p className="rounded-[var(--r-control)] bg-muted px-3 py-2 text-sm">Fecho o pedido, então.</p>
      </div>
    </article>
  );
}

export default function SkeletonMedidoDemo(_: DemoProps) {
  const { atual, passo, rodada, repetir } = useUmPorVez(FORMAS);
  const [carregando, setCarregando] = React.useState(true);

  React.useEffect(() => {
    setCarregando(true);
    const id = window.setTimeout(() => setCarregando(false), ESPERA_MS);
    return () => window.clearTimeout(id);
  }, [rodada]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6">
      <SkeletonMedido key={atual} loading={carregando}>
        {atual === "perfil" ? <Perfil /> : atual === "produto" ? <Produto /> : <Conversa />}
      </SkeletonMedido>
      <Trocador nome={atual} onPasso={passo} onRepetir={repetir} rotulo="card" />
    </div>
  );
}
