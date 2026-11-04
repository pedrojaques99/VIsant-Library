"use client";

import {
  defaultAnimateLayoutChanges,
  useSortable,
  type AnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { KanbanItem, KanbanRenderCardArgs } from "./types";

/*
 * Vizinhos deslizam também quando o cartão muda de coluna. O padrão da lib só anima
 * quem acabou de ser arrastado: ao entrar numa coluna, os de baixo saltavam 93px de
 * um quadro para o outro, enquanto dentro da coluna tudo deslizava.
 */
const animarVizinhos: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

/**
 * Card arrastável (useSortable). O card inteiro é a alça — a distância de
 * ativação do sensor (no <Kanban>) garante que um CLIQUE simples ainda passe
 * para o onClick do conteúdo; só vira arraste depois de mover alguns px.
 */
export function KanbanCard<T>({
  item,
  enabled,
  landing = false,
  render,
  selectable = false,
  selected = false,
  onSelectToggle,
}: {
  item: KanbanItem<T>;
  enabled: boolean;
  /** O fantasma ainda está descendo até aqui. */
  landing?: boolean;
  render: (args: KanbanRenderCardArgs<T>) => React.ReactNode;
  /** Seleção múltipla ligada — habilita o shift/ctrl/cmd-clique de toggle. */
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: (id: string) => void;
}) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !enabled, animateLayoutChanges: animarVizinhos });

  // O tempo e a curva do deslize moram em `.kanban-card` (kanban.css), nos tokens da
  // casa. Mas a lib também usa `transition` para DESLIGAR: `0ms` no quadro em que ela
  // reposiciona o cartão sem animar, e nada quando não há o que animar. Ignorar esses
  // dois fazia o CSS animar a correção, e ao soltar o vizinho saltava 93px para cima e
  // voltava deslizando. Era o último flicker do pouso.
  const transicao = !transition ? "none" : transition.includes(" 0ms") ? transition : undefined;

  return (
    <div
      ref={setNodeRef}
      // O marquee (Kanban) acha os cards por este atributo pra calcular o hit-test.
      data-kanban-card-id={item.id}
      data-selected={selectable && selected ? "" : undefined}
      aria-selected={selectable ? selected : undefined}
      style={{ transform: CSS.Translate.toString(transform), transition: transicao }}
      // Modifier-clique = toggle na seleção (não abre o card). Capture pra
      // interceptar ANTES do onClick do conteúdo (render do consumidor).
      onClickCapture={
        selectable
          ? (e) => {
              if (e.shiftKey || e.metaKey || e.ctrlKey) {
                e.preventDefault();
                e.stopPropagation();
                onSelectToggle?.(item.id);
              }
            }
          : undefined
      }
      className={cn(
        // `manipulation`, não `none`: o TouchSensor ativa por delay (150ms) e aí
        // preventDefault nos touchmove — `none` bloqueava o pan nativo que os
        // scrolls mobile (coluna interna + rail snap-x) precisam quando o gesto
        // começa em cima de um card, ou seja, quase sempre.
        "kanban-card touch-manipulation",
        enabled && "kanban-card-movel cursor-grab active:cursor-grabbing",
        // O card de origem vira o ALVO em vez de sumir. Era `opacity-40` aqui —
        // e como a demo pintava outro `.4` no conteúdo, dava 0.16 na tela: o
        // lugar de destino existia e ninguém enxergava. Agora ele se desenha
        // como buraco tracejado (ver `.is-drop-slot` no kanban.css), que é o
        // ponto exato onde o card cai e o que faz o gesto ter imã.
        (isDragging || landing) && "is-drop-slot"
      )}
      {...(enabled ? attributes : {})}
      {...(enabled ? listeners : {})}
    >
      {render({ item, dragging: isDragging, selected: selectable ? selected : undefined })}
    </div>
  );
}
