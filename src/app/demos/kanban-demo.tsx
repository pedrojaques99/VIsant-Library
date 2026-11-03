"use client";

/**
 * A demo do kanban mora sozinha porque ela é cara.
 *
 * O `@dnd-kit` são 185KB (60KB comprimidos) que serviam UM card do catálogo e
 * chegavam no primeiro carregamento, antes de qualquer pessoa rolar até ele.
 * Aqui o pedaço só é buscado quando o card entra na tela.
 *
 * Uma nota sobre o palco: o `FitStage` escala a demo com `transform` quando ela
 * não cabe, e o dnd-kit move o card em pixel de tela, sem saber da escala. No
 * ladrilho o fantasma anda um pouco mais rápido que o board; a ficha e a sala têm
 * escala maior. É limite do palco, não da peça.
 */

import * as React from "react";
import { CalendarDays } from "lucide-react";

import { useElementWidth } from "../stage";

import { Kanban } from "../../../registry/visant/blocks/kanban";
import type { KanbanItem } from "../../../registry/visant/blocks/kanban/types";

/*
 * Tamanhos do mesmo board. Na sala da mesa de trabalho o board É a tela, e ali
 * entram as quatro colunas; o ladrilho do catálogo tem o seu, mais abaixo.
 */
interface Tarefa {
  t: string;
  /** Pra quem é o trabalho. */
  cliente?: string;
  /** Iniciais de quem está com a tarefa. */
  quem: string;
  prazo?: string;
}

const ENXUTO = {
  columns: [
    { id: "fila", data: { label: "Fila" } },
    { id: "fazendo", data: { label: "Fazendo" } },
    { id: "pronto", data: { label: "Pronto" } },
  ],
  items: [
    { id: "a", columnId: "fila", data: { t: "Naming da linha nova", cliente: "Design", quem: "AR", prazo: "24 out" } },
    { id: "b", columnId: "fila", data: { t: "Tema escuro do app", cliente: "Vendas", quem: "CD", prazo: "28 out" } },
    { id: "c", columnId: "fazendo", data: { t: "Landing de lançamento", cliente: "Design", quem: "MA", prazo: "22 out" } },
    { id: "d", columnId: "fazendo", data: { t: "Embalagem da linha café", cliente: "Suporte", quem: "PJ", prazo: "30 out" } },
    { id: "e", columnId: "pronto", data: { t: "Rebrand completo", cliente: "Marketing", quem: "AR", prazo: "15 out" } },
  ],
};

const DENSO = {
  columns: [
    { id: "fila", data: { label: "Fila" } },
    { id: "fazendo", data: { label: "Fazendo" } },
    { id: "revisao", data: { label: "Revisão" } },
    { id: "pronto", data: { label: "Pronto" } },
  ],
  items: [
    ...ENXUTO.items.filter((it) => it.columnId !== "pronto"),
    { id: "f", columnId: "fila", data: { t: "Fotos do catálogo", cliente: "Produto", quem: "MA", prazo: "02 nov" } },
    { id: "g", columnId: "revisao", data: { t: "Manual de marca v2", cliente: "Vendas", quem: "CD", prazo: "21 out" } },
    { id: "h", columnId: "revisao", data: { t: "Cardápio impresso", cliente: "Suporte", quem: "PJ", prazo: "23 out" } },
    { id: "e", columnId: "pronto", data: { t: "Rebrand completo", cliente: "Marketing", quem: "AR", prazo: "15 out" } },
  ],
};

/*
 * O do ladrilho: três colunas estreitas e texto genérico, numa largura em que a
 * escala ainda deixa ler o título. Os dois de cima seguem servindo à sala.
 */
const LADRILHO = {
  columns: ENXUTO.columns,
  items: [
    { id: "a", columnId: "fila", data: { t: "Revisar o texto", quem: "AR" } },
    { id: "b", columnId: "fila", data: { t: "Ajustar o layout", quem: "CD" } },
    { id: "c", columnId: "fazendo", data: { t: "Testar no celular", quem: "MA" } },
    { id: "e", columnId: "pronto", data: { t: "Publicar a página", quem: "PJ" } },
  ],
};

/*
 * O celular é outro desenho, não o desktop apertado.
 *
 * Três colunas de 180px numa caixa de 320 escondiam a terceira, cortavam a segunda
 * no meio do título e obrigavam a rolar de lado pra ver o estado do quadro, que é
 * a única coisa que um kanban existe pra dizer. Empilhadas, as três aparecem de uma
 * vez, e o arraste continua valendo: de uma pilha pra outra é o mesmo gesto.
 */
const ESTREITO = 480;

export default function KanbanDemo({ denso = false }: { denso?: boolean }) {
  const base = denso ? DENSO : LADRILHO;
  const [caixa, largura] = useElementWidth<HTMLDivElement>();
  const empilhado = !denso && largura > 0 && largura < ESTREITO;
  const columns = React.useMemo(() => base.columns, [base]);
  const [items, setItems] = React.useState<KanbanItem<Tarefa>[]>(base.items as KanbanItem<Tarefa>[]);
  const contagem = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) m.set(it.columnId, (m.get(it.columnId) ?? 0) + 1);
    return m;
  }, [items]);
  // `overflow-hidden` no ladrilho: barra de rolagem dentro de card é defeito.
  return (
    <div
      ref={caixa}
      className={`w-full p-3 ${
        // No board denso a rolagem horizontal é o comportamento CERTO: board de
        // verdade tem mais coluna do que tela, e cortar a quarta a faca some com
        // ela. No card do catálogo continua `hidden` — lá a barra seria o palco
        // declarando largura menor que a peça, que é defeito.
        denso ? "h-full overflow-x-auto" : "overflow-hidden"
      }`}
    >
      <Kanban
        // Piso de coluna um pouco abaixo do padrão (320): com a faixa de fundo
        // e o respiro do palco, três colunas de 320 passavam da caixa e a
        // terceira saía cortada. `!` porque o kanban.css entra fora de camada.
        className={
          denso
            ? "[--kanban-col-min:296px]!"
            : empilhado
              ? "flex-col [--kanban-card-gap:0.5rem]! [--kanban-col-max:none]! [--kanban-col-min:0px]! [--kanban-column-min-h:40px]! [--kanban-gap:0.5rem]!"
              : "[--kanban-col-min:180px]!"
        }
        columns={columns}
        items={items}
        /*
         * A ordem que o componente devolve TEM que ser aplicada. Aqui estava o
         * pulo mais feio do arraste, e ele nascia nesta demo, não no primitivo.
         *
         * Antes esta função só trocava o `columnId` e jogava fora o
         * `columnOrder`. Só que o Kanban ressincroniza a ordem dele com as props
         * assim que o gesto acaba — então soltar o card na segunda posição
         * mostrava ele indo pra segunda posição e, um frame depois, VOLTANDO pra
         * primeira, porque as props diziam que nada tinha mudado de ordem. E
         * isso acontecia embaixo do overlay ainda pousando: o card ia e voltava
         * enquanto o fantasma descia. Era esse o "motion pulando de flicker".
         *
         * Reordenar só os itens da coluna de destino, no lugar deles dentro do
         * array, mantém as outras colunas intactas — é a mesma coisa que um
         * backend faria ao gravar a ordem de uma coluna só.
         */
        onMove={({ itemId, toColumnId, columnOrder }) =>
          setItems((prev) => {
            const movido = prev.map((it) =>
              it.id === itemId ? { ...it, columnId: toColumnId } : it,
            );
            const posicao = new Map(columnOrder.map((id, i) => [id, i]));
            const daColuna = movido
              .filter((it) => it.columnId === toColumnId)
              .sort((x, y) => (posicao.get(x.id) ?? 0) - (posicao.get(y.id) ?? 0));
            let k = 0;
            return movido.map((it) => (it.columnId === toColumnId ? daColuna[k++]! : it));
          })
        }
        // A coluna é uma faixa de fundo levemente mais escura que o palco: é o
        // que separa "lugar onde o card mora" de "card", sem borda nenhuma.
        columnClassName={`rounded-[var(--r-surface,1rem)] bg-[color-mix(in_oklab,var(--muted)_55%,transparent)] ${
          empilhado ? "flex-none! p-2.5" : "p-3"
        }`}
        renderColumnHeader={(c) => (
          <div className={`flex items-baseline justify-between px-1 ${empilhado ? "mb-2" : "mb-3"}`}>
            <span className="text-[13px] font-medium text-foreground">
              {(c.data as { label: string }).label}
            </span>
            <span className="text-[12px] tabular-nums text-muted-foreground">{contagem.get(c.id) ?? 0}</span>
          </div>
        )}
        // O `dragging` não pinta mais nada aqui. O `opacity-40` que ficava neste
        // cartão se multiplicava com o `opacity-40` que o KanbanCard já aplicava
        // no wrapper: 0.4 × 0.4 = 0.16 de opacidade real, medido no navegador. O
        // buraco de destino ficava invisível e arrastar virava chute. Quem
        // desenha o alvo agora é o componente (o slot tracejado); o cartão do
        // consumidor só precisa ser um cartão.
        // O card é óbvio porque é OBJETO: fundo de cartão, sombra baixa e
        // conteúdo em três níveis (o que, pra quem, quem e quando).
        renderCard={({ item }) =>
          empilhado ? (
            <div className="flex items-center justify-between gap-3 rounded-[var(--r-control,0.625rem)] border border-border bg-card px-3 py-2 [box-shadow:var(--e-flat)]">
              <span className="min-w-0 truncate text-[14px] font-medium leading-snug text-foreground">{item.data.t}</span>
              <span
                aria-label={`Com ${item.data.quem}`}
                className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-semibold text-foreground"
              >
                {item.data.quem}
              </span>
            </div>
          ) : (
          <div className="flex flex-col gap-3 rounded-[var(--r-control,0.625rem)] border border-border bg-card px-3.5 py-3 [box-shadow:var(--e-flat)]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[14px] font-medium leading-snug text-foreground">{item.data.t}</span>
              {item.data.cliente ? (
                <span className="text-[12px] leading-snug text-muted-foreground">{item.data.cliente}</span>
              ) : null}
            </div>
            <div className="flex items-center justify-between">
              <span
                aria-label={`Com ${item.data.quem}`}
                className="grid size-6 place-items-center rounded-full bg-muted text-[10px] font-semibold text-foreground"
              >
                {item.data.quem}
              </span>
              {item.data.prazo ? (
                <span className="inline-flex items-center gap-1 text-[12px] tabular-nums text-muted-foreground">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  {item.data.prazo}
                </span>
              ) : null}
            </div>
          </div>
          )
        }
      />
    </div>
  );
}
