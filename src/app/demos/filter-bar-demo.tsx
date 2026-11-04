"use client";

/** Busca e filtro numa cápsula só, sobre uma fila de verdade: já nasce filtrando. */

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { FilterBar } from "../../../registry/visant/ui/filter-bar";
import { FILA, GRUPOS_FILTRO, useFilaFiltrada } from "./fila-filtro";
import { DUR, EASE_OUT, INSTANT } from "@/lib/motion";

export default function FilterBarKitDemo() {
  const { busca, setBusca, marcado, setMarcado, alternar, filtrada } = useFilaFiltrada({ status: ["producao"] });
  const reduzir = useReducedMotion();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-[560px] flex-col gap-3">
        <FilterBar
          size="lg"
          query={busca}
          onQueryChange={setBusca}
          groups={GRUPOS_FILTRO}
          selected={marcado}
          onToggle={alternar}
          onClearAll={() => setMarcado({})}
          filteredCount={filtrada.length}
          totalCount={FILA.length}
        />
        {/* Altura da fila inteira: a barra não anda quando a lista encolhe. */}
        <ul className="min-h-[13.5rem] space-y-1.5 px-1">
          <AnimatePresence initial={false} mode="popLayout">
            {filtrada.map((linha) => (
              <motion.li
                key={linha.id}
                layout={reduzir ? false : "position"}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={reduzir ? INSTANT : { duration: DUR.base, ease: EASE_OUT }}
                className="truncate rounded-[var(--r-control)] bg-muted px-4 py-2 text-sm"
              >
                {linha.nome}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
