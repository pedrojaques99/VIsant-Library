"use client";

import * as React from "react";
import { Plus, Search, Trash2 } from "lucide-react";

import { GlassPanel } from "@/components/ui/glass-panel";
import { cn } from "@/lib/utils";

export interface GlassBoardCard {
  name: string;
  line: string;
  /** Avatar, tempo e linha de apoio são opcionais: o cartão pede pouco para nascer. */
  initials?: string;
  when?: string;
  detail?: string;
  /** Pontinho de não lido. */
  fresh?: boolean;
}
export interface GlassBoardStage {
  id: string;
  title: string;
}
export interface GlassBoardRow {
  id: string;
  stage: string;
  card: GlassBoardCard;
}

type Coluna = { id: string; data?: unknown };
type Item = { id: string; columnId: string; data: GlassBoardCard | null };
type Movimento = { itemId: string; toColumnId: string; columnOrder: string[] };

/** O pedaço do bloco `kanban` que o quadro usa. */
export interface GlassBoardKanbanProps {
  columns: Coluna[];
  items: Item[];
  onMove?: (m: Movimento) => void;
  renderColumnHeader?: (c: Coluna) => React.ReactNode;
  renderCard: (a: { item: Item; overlay?: boolean }) => React.ReactNode;
}

export interface GlassBoardProps {
  /**
   * O `Kanban` do bloco `@visant/kanban`, importado do lugar onde ele foi instalado.
   * Vem por prop porque o bloco cai em `~/components/kanban`, e o alias `@/` muda de
   * projeto para projeto: um import fixo aqui não compilaria em quem usa `src/`.
   */
  kanban: React.ComponentType<GlassBoardKanbanProps>;
  title?: string;
  stages: GlassBoardStage[];
  /** Estado inicial. O quadro cuida da lista dali em diante; `onChange` entrega cada mudança. */
  initial: GlassBoardRow[];
  onChange?: (rows: GlassBoardRow[]) => void;
  /** Cria o rascunho de "Adicionar". Sem isto, o botão não aparece. */
  newCard?: (stage: string) => GlassBoardCard;
  /** Cartão que nasce no ar, pra tela dizer "isto arrasta" antes de alguém tocar. */
  liftedId?: string;
  addLabel?: string;
  /** Com rótulo, o quadro ganha o campo de busca. */
  searchLabel?: string;
  /** Mostra a lixeira que esvazia a coluna; aparece só ao passar por ela. */
  clearable?: boolean;
  /** Slots do topo e da barra lateral: o quadro não sabe navegar nem importar nada. */
  actions?: React.ReactNode;
  rail?: React.ReactNode;
  /** Canto inferior direito, para o botão de assistente ou equivalente. */
  corner?: React.ReactNode;
  className?: string;
}

/**
 * Quadro em vidro fosco sobre foto. O arraste é o bloco `kanban`, sem uma linha
 * alterada: aqui só a roupa (`renderCard`, cabeçalho e os `--kanban-*`).
 *
 * "Adicionar" é um item que nunca sai do fim da coluna e engole o gesto, porque o
 * Kanban ainda não tem rodapé. Com um `renderColumnFooter` no bloco, ele some.
 */
export function GlassBoard({
  kanban: Kanban,
  title,
  stages,
  initial,
  onChange,
  newCard,
  liftedId,
  addLabel = "Adicionar",
  searchLabel,
  clearable = false,
  actions,
  rail,
  corner,
  className,
}: GlassBoardProps) {
  const [rows, setRowsCru] = React.useState(initial);
  const setRows = (next: (r: GlassBoardRow[]) => GlassBoardRow[]) => {
    const n = next(rows);
    setRowsCru(n);
    onChange?.(n);
  };
  const [busca, setBusca] = React.useState("");
  const [lifted, setLifted] = React.useState(liftedId);
  const proximo = React.useRef(0);

  const adicionar = (stage: string) => {
    if (newCard) setRows((rs) => [...rs, { id: `novo-${++proximo.current}`, stage, card: newCard(stage) }]);
  };

  const q = busca.trim().toLowerCase();
  const vistos = rows.filter((r) => !q || `${r.card.name} ${r.card.line}`.toLowerCase().includes(q));
  const items: Item[] = stages.flatMap((s) => [
    ...vistos.filter((r) => r.stage === s.id).map((r) => ({ id: r.id, columnId: s.id, data: r.card as GlassBoardCard | null })),
    ...(newCard ? [{ id: `add:${s.id}`, columnId: s.id, data: null }] : []),
  ]);

  const onMove = (m: Movimento) =>
    setRows((rs) => {
      const movidos = rs.map((r) => (r.id === m.itemId ? { ...r, stage: m.toColumnId } : r));
      const ordem = m.columnOrder.filter((id) => !id.startsWith("add:"));
      return [...movidos.filter((r) => r.stage !== m.toColumnId), ...ordem.flatMap((id) => movidos.filter((r) => r.id === id))];
    });

  return (
    <GlassPanel grain className={cn("glass-board", className)} onPointerDownCapture={() => setLifted(undefined)}>
      {rail ? <aside className="glass-board-lateral">{rail}</aside> : null}
      <div className="glass-board-corpo">
        {searchLabel || actions ? (
          <header className="glass-board-topo">
            {searchLabel ? (
              <label className="glass-board-busca">
                <Search size={13} aria-hidden />
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={searchLabel} aria-label={searchLabel} />
              </label>
            ) : null}
            {actions}
          </header>
        ) : null}
        {title ? <h1 className="glass-board-titulo">{title}</h1> : null}
        <div className="glass-board-rolagem">
          <Kanban
            columns={stages.map((s) => ({ id: s.id, data: s }))}
            items={items}
            onMove={onMove}
            renderColumnHeader={(c) => {
              const n = vistos.filter((r) => r.stage === c.id).length;
              const nome = (c.data as GlassBoardStage).title;
              return (
                <div className="glass-board-coluna">
                  <h2>{nome}</h2>
                  <span>{n}</span>
                  {clearable ? (
                    <button
                      type="button"
                      aria-label={`Limpar ${nome}`}
                      disabled={n === 0}
                      onClick={() => setRows((rs) => rs.filter((r) => r.stage !== c.id))}
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>
              );
            }}
            renderCard={({ item, overlay }) =>
              item.data ? (
                <article className="glass-board-cartao" data-no-ar={overlay || item.id === lifted || undefined}>
                  <header>
                    {item.data.initials ? <i aria-hidden>{item.data.initials}</i> : null}
                    <b>{item.data.name}</b>
                    {item.data.when ? <time>{item.data.when}</time> : null}
                    {item.data.fresh ? <em aria-label="Novo" /> : null}
                  </header>
                  <p>{item.data.line}</p>
                  {item.data.detail ? <small>{item.data.detail}</small> : null}
                </article>
              ) : (
                <button
                  type="button"
                  className="glass-board-adicionar"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  onClick={() => adicionar(item.columnId)}
                >
                  <Plus size={15} aria-hidden />
                  {addLabel}
                </button>
              )
            }
          />
        </div>
        {corner ? <div className="glass-board-canto">{corner}</div> : null}
      </div>
    </GlassPanel>
  );
}
