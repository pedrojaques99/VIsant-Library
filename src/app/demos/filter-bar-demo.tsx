"use client";

/** A barra inteira montada: busca, menu de facetas, chips aplicados e a contagem que some sem filtro. */

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { FilterBar } from "../../../registry/visant/ui/filter-bar";
import { SearchField } from "../../../registry/visant/ui/search-field";
import { FilterMenu } from "../../../registry/visant/ui/filter-menu";
import { FILA, GRUPOS_FILTRO, ROTULO_FILTRO, useFilaFiltrada } from "./fila-filtro";
import { DUR, EASE_OUT, INSTANT } from "@/lib/motion";

export default function FilterBarKitDemo() {
  const { busca, setBusca, marcado, setMarcado, alternar, filtrada } = useFilaFiltrada();
  const reduzir = useReducedMotion();

  const chips = Object.entries(marcado).flatMap(([grupo, ids]) =>
    ids.map((id) => ({
      key: `${grupo}-${id}`,
      label: ROTULO_FILTRO[id] ?? id,
      onRemove: () => alternar(grupo, id),
    })),
  );

  return (
    <div className="flex h-full w-full flex-col gap-3 p-3">
      <FilterBar
        chips={chips}
        search={<SearchField value={busca} onChange={setBusca} placeholder="Buscar..." />}
        filters={
          <FilterMenu
            groups={GRUPOS_FILTRO}
            selected={marcado}
            onToggle={alternar}
            onClear={() => setMarcado({})}
          />
        }
        filteredCount={filtrada.length}
        totalCount={FILA.length}
        onClearAll={() => setMarcado({})}
      />
      <ul className="space-y-1">
        <AnimatePresence initial={false} mode="popLayout">
          {filtrada.map((linha) => (
            <motion.li
              key={linha.id}
              layout={reduzir ? false : "position"}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={reduzir ? INSTANT : { duration: DUR.base, ease: EASE_OUT }}
              className="truncate rounded bg-muted px-2 py-1 text-apoio"
            >
              {linha.nome}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
