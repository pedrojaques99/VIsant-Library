"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./KanbanCard";
import type { KanbanColumn as Col, KanbanItem, KanbanRenderCardArgs } from "./types";

/**
 * Coluna droppable + SortableContext. Também aceita drop quando vazia (o
 * useDroppable no corpo inteiro), senão colunas sem card não seriam alvo.
 */
export function KanbanColumn<T, C>({
  column,
  items,
  enabled,
  isOver,
  landingId,
  render,
  renderHeader,
  renderEmpty,
  className,
  selectable = false,
  selectedIds,
  onSelectToggle,
}: {
  column: Col<C>;
  items: KanbanItem<T>[];
  enabled: boolean;
  isOver: boolean;
  /** Cartão ainda pousando: segue como buraco até o fantasma chegar. */
  landingId?: string | null;
  render: (args: KanbanRenderCardArgs<T>) => React.ReactNode;
  renderHeader?: (column: Col<C>) => React.ReactNode;
  renderEmpty?: (column: Col<C>) => React.ReactNode;
  className?: string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectToggle?: (id: string) => void;
}) {
  const droppable = enabled && !column.dropDisabled;
  const { setNodeRef } = useDroppable({ id: column.id, disabled: !droppable });

  // A MESMA referência enquanto a ordem não muda. O sortable compara os itens por
  // referência: array novo a cada render lia como "a lista mudou" e desligava o
  // deslize de todos os cartões, em todo render.
  const idsKey = items.map((i) => i.id).join("\n");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ids = useMemo(() => items.map((i) => i.id), [idsKey]);

  return (
    <div
      className={cn(
        "kanban-column flex flex-col",
        isOver && droppable && "is-drop-target",
        className
      )}
    >
      {renderHeader?.(column)}
      <SortableContext
        items={ids}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="kanban-column-body flex-1">
          {items.length === 0
            ? renderEmpty?.(column)
            : items.map((item) => (
                <KanbanCard
                  key={item.id}
                  item={item}
                  enabled={enabled}
                  landing={landingId === item.id}
                  render={render}
                  selectable={selectable}
                  selected={selectedIds?.has(item.id) ?? false}
                  onSelectToggle={onSelectToggle}
                />
              ))}
        </div>
      </SortableContext>
    </div>
  );
}
