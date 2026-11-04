"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DUR, EASE_OUT, INSTANT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/ui/chip";
import { FilterMenu, type FilterGroup } from "@/components/ui/filter-menu";
import { SearchField } from "@/components/ui/search-field";

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
 * ── Busca e filtro numa peça só ──────────────────────────────────────────────
 * Com `query` e `groups`, a barra monta sozinha o `search-field`, o `filter-menu`
 * e os chips, e `size="lg"` junta os dois numa cápsula. Os slots continuam valendo
 * para quem precisa de outro controle, e os dois itens seguem instaláveis.
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
  /** Texto da busca. Com `onQueryChange`, a barra monta o campo sozinha. */
  query?: string;
  onQueryChange?: (query: string) => void;
  queryPlaceholder?: string;
  /** Facetas. Com `selected` e `onToggle`, a barra monta o menu e os chips sozinha. */
  groups?: FilterGroup[];
  selected?: Record<string, string[]>;
  onToggle?: (groupKey: string, optionId: string) => void;
  filtersLabel?: string;
  /** `lg` junta busca e filtro numa cápsula centrada. */
  size?: "md" | "lg";
}

// Dentro da cápsula quem desenha a borda e o foco é ela; o campo só leva o texto.
const CAMPO_DA_CAPSULA =
  "min-w-0 [&_input]:h-12 [&_input]:rounded-none [&_input]:border-0 [&_input]:bg-transparent [&_input]:pl-10 [&_input]:text-base [&_input:focus-visible]:[box-shadow:none] [&_svg:first-child]:left-3.5";
const FILTRO_DA_CAPSULA =
  "h-10 rounded-[var(--r-pill,9999px)] border-transparent bg-[var(--muted)] pointer-coarse:h-11";

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
  query,
  onQueryChange,
  queryPlaceholder = "Buscar...",
  groups,
  selected = {},
  onToggle,
  filtersLabel,
  size = "md",
  className,
  ...props
}: FilterBarProps) {
  // "48 de 48" é ruído: só informa quando os números divergem.
  const showCount =
    typeof filteredCount === "number" &&
    typeof totalCount === "number" &&
    filteredCount !== totalCount;

  const capsula = size === "lg";
  const campo =
    search ??
    (onQueryChange ? (
      <SearchField
        value={query ?? ""}
        onChange={onQueryChange}
        placeholder={queryPlaceholder}
        delay={120}
        className={capsula ? CAMPO_DA_CAPSULA : undefined}
      />
    ) : null);
  const menu =
    filters ??
    (groups && onToggle ? (
      <FilterMenu
        groups={groups}
        selected={selected}
        onToggle={onToggle}
        onClear={onClearAll}
        label={filtersLabel}
        className={capsula ? FILTRO_DA_CAPSULA : undefined}
      />
    ) : null);
  // Sem chips prontos, eles saem do que está marcado: o menu já sabe o rótulo de cada opção.
  const chipsVistos: FilterBarChip[] =
    chips.length > 0 || !groups || !onToggle
      ? chips
      : groups.flatMap((g) =>
          g.options
            .filter((o) => selected[g.key]?.includes(o.id))
            .map((o) => ({ key: `${g.key}-${o.id}`, label: o.label, onRemove: () => onToggle(g.key, o.id) })),
        );
  const hasChips = chipsVistos.length > 0;
  const reduzir = useReducedMotion();
  const passo = reduzir ? INSTANT : { duration: DUR.fast, ease: EASE_OUT };

  return (
    <div className={cn("flex w-full flex-col", className)} {...props}>
      <div
        className={cn(
          "flex items-center",
          capsula
            ? cn(
                "min-h-14 gap-1 rounded-[var(--r-pill,9999px)] border border-[var(--border)] bg-[var(--card,var(--background))] pr-2",
                "[box-shadow:var(--e-raised,0_8px_24px_-16px_rgb(0_0_0/0.35))]",
                "transition-[border-color,box-shadow] [transition-duration:var(--dur-base,200ms)] [transition-timing-function:var(--ease-out)]",
                "focus-within:border-[color-mix(in_oklab,var(--ring)_60%,var(--foreground))] focus-within:[box-shadow:0_0_0_3px_color-mix(in_oklab,var(--ring)_25%,transparent)]",
              )
            : "gap-2 sm:gap-3",
        )}
      >
        {/* A busca recebe texto de tamanho imprevisível — fica com a sobra. */}
        {campo ? <div className="min-w-0 flex-1">{campo}</div> : null}
        {menu}
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
          hasChips || showCount ? "grid-rows-[1fr]" : "pointer-events-none grid-rows-[0fr] opacity-0",
        )}
      >
        {/* `-m-1 p-1`: o recorte que dobra a linha não pode comer o anel de foco do chip. */}
        <div className="-m-1 min-h-0 overflow-hidden p-1">
          <div className={cn("flex flex-wrap items-center gap-1.5 pt-2", capsula && "justify-center pt-3")}>
            <AnimatePresence initial={false} mode="popLayout">
              {chipsVistos.map((chip) => (
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
                  "px-1.5 py-1 pointer-coarse:min-h-11 text-xs font-semibold text-[var(--muted-foreground)] underline-offset-4",
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
                className={cn("shrink-0 text-xs tabular-nums text-[var(--muted-foreground)]", !capsula && "ml-auto", capsula && "ml-2")}
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
