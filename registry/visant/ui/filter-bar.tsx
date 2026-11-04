"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DUR, EASE_OUT, INSTANT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/ui/chip";

/**
 * FilterBar — o esqueleto de uma barra de filtro: controles em cima, filtros
 * aplicados embaixo.
 *
 * Colhido de uma barra que só servia ao produto de origem: recebia o objeto
 * `FilterState` inteiro, montava os chips lendo `statuses`/`priorities`/`labels`
 * e traduzia prioridade para português na mão. Trocar de domínio era reescrever.
 *
 * Aqui a barra **não sabe o que é um filtro**. Ela recebe chips já formados e
 * slots para os controles. Quem sabe de status e prioridade é a tela; quem sabe
 * de layout, foco e resumo é este arquivo. É a divisão que faz a peça viajar.
 *
 * ── Por que os controles são slots e não props de dados ─────────────────────
 * A tentação é receber `statuses`, `sortOptions`, `viewModes` e renderizar tudo.
 * Aí o primeiro cliente que precisa de um seletor de data no meio da fila força
 * uma prop nova, e em seis meses a barra tem doze props booleanas de arranjo.
 * Slot é a única API que não cresce: `<FilterBar filters={<FilterMenu …/>} />`.
 *
 * ── Detalhes que decidem se a barra é útil ──────────────────────────────────
 *
 * 1. **A contagem só aparece quando filtra.** "48 de 48" é uma linha de texto
 *    para dizer que nada aconteceu. Some quando os números batem.
 * 2. **A contagem é `aria-live="polite"`.** Filtrar é uma mudança que acontece
 *    longe do foco — sem isso, quem usa leitor de tela digita na busca e não
 *    recebe nenhum sinal de que a lista encolheu.
 * 3. **A segunda linha abre e fecha, não pula.** Sem chips ela tem altura zero, e
 *    o `grid-template-rows` de `0fr` para `1fr` empurra o conteúdo no mesmo
 *    compasso do chip que entra. Chip entra e sai com a mesma curva curta, e os
 *    vizinhos deslizam para o vão (`layout`), em vez de saltar.
 * 4. **A busca ocupa a sobra.** É o controle que recebe texto de tamanho
 *    imprevisível; os outros têm largura de rótulo.
 *
 * Compõe com `sticky-filterbar`, que resolve grudar e condensar e não sabe
 * montar nada: `<StickyFilterbar><FilterBar … /></StickyFilterbar>`.
 */

export interface FilterBarChip {
  key: string;
  label: string;
  onRemove: () => void;
}

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Filtros já aplicados. Já vêm formatados: a barra não traduz domínio. */
  chips?: FilterBarChip[];
  search?: React.ReactNode;
  filters?: React.ReactNode;
  sort?: React.ReactNode;
  view?: React.ReactNode;
  extras?: React.ReactNode;
  filteredCount?: number;
  totalCount?: number;
  onClearAll?: () => void;
  clearAllLabel?: string;
  /** `(filtrados, total) => texto`. Trocável para plural, idioma ou substantivo. */
  countLabel?: (filtered: number, total: number) => string;
}

export function FilterBar({
  chips = [],
  search,
  filters,
  sort,
  view,
  extras,
  filteredCount,
  totalCount,
  onClearAll,
  clearAllLabel = "Limpar tudo",
  countLabel = (filtered, total) => `${filtered} de ${total}`,
  className,
  ...props
}: FilterBarProps) {
  // "48 de 48" é ruído: só informa quando os números divergem.
  const showCount =
    typeof filteredCount === "number" &&
    typeof totalCount === "number" &&
    filteredCount !== totalCount;

  const hasChips = chips.length > 0;
  const reduzir = useReducedMotion();
  const passo = reduzir ? INSTANT : { duration: DUR.fast, ease: EASE_OUT };

  return (
    <div className={cn("flex w-full flex-col", className)} {...props}>
      <div className="flex items-center gap-2 sm:gap-3">
        {/* A busca recebe texto de tamanho imprevisível — fica com a sobra. */}
        {search ? <div className="min-w-0 flex-1">{search}</div> : null}
        {filters}
        {sort}
        {view}
        {extras}
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity]",
          "[transition-duration:var(--dur-base,200ms)]",
          "[transition-timing-function:var(--ease-out)]",
          "motion-reduce:transition-none",
          hasChips || showCount ? "grid-rows-[1fr]" : "grid-rows-[0fr] opacity-0",
        )}
      >
        {/* `-m-1 p-1`: o recorte que dobra a linha não pode comer o anel de foco do chip. */}
        <div className="-m-1 min-h-0 overflow-hidden p-1">
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <AnimatePresence initial={false} mode="popLayout">
              {chips.map((chip) => (
                <motion.span
                  key={chip.key}
                  layout={reduzir ? false : "position"}
                  className="inline-flex"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={passo}
                >
                  <Chip size="sm" pressed onRemove={chip.onRemove}>
                    {chip.label}
                  </Chip>
                </motion.span>
              ))}
            </AnimatePresence>

            {hasChips && onClearAll ? (
              <button
                type="button"
                onClick={onClearAll}
                className={cn(
                  "px-1.5 py-1 text-xs font-semibold text-[var(--muted-foreground)] underline-offset-4",
                  "hover:text-[var(--foreground)] hover:underline",
                  "outline-none focus-visible:[box-shadow:0_0_0_1px_color-mix(in_oklab,var(--ring)_60%,var(--foreground))]",
                  "rounded-[var(--r-control,0.375rem)]",
                )}
              >
                {clearAllLabel}
              </button>
            ) : null}

            {showCount ? (
              // Filtrar muda a lista longe do foco. Sem `aria-live`, quem usa
              // leitor de tela digita e não recebe sinal nenhum de que encolheu.
              <span
                aria-live="polite"
                className="ml-auto shrink-0 text-xs tabular-nums text-[var(--muted-foreground)]"
              >
                {countLabel(filteredCount as number, totalCount as number)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
