import * as React from "react";
import { Timeline, type TimelineState } from "@xzdarcy/react-timeline-editor";
import type { TimelineRow } from "@xzdarcy/timeline-engine";

// Virtualização das ações. A lib (`@xzdarcy/react-timeline-editor`) só virtualiza as linhas
// (react-virtualized, overscan de 10): cada linha desenha todas as suas ações, e a cada mudança
// de escala ou de dados todas re-renderizam. Esta camada passa para a lib só as ações dentro da
// janela rolada, com uma tela de folga para cada lado, e só troca a janela quando a vista chega a
// meia tela da borda (histerese: rolar não pisca nem remonta a cada passo). Medido num filme de
// 300 clipes: zoom de 83 para 89 fps, rolagem de 89 para 92, 2.444 para 1.607 nós de perto.

/** O que está à vista: tempo em segundos e altura em px do conteúdo. */
export interface View { t0: number; t1: number; y0: number; y1: number }

export function viewOf(left: number, top: number, width: number, height: number, pxPerSecond: number, startLeft: number): View {
  return { t0: (left - startLeft) / pxPerSecond, t1: (left + width - startLeft) / pxPerSecond, y0: top, y1: top + height };
}

/** A janela desenhada: a vista com uma tela de folga para cada lado. */
export function windowOf(v: View): View {
  const dt = v.t1 - v.t0, dy = v.y1 - v.y0;
  return { t0: v.t0 - dt, t1: v.t1 + dt, y0: v.y0 - dy, y1: v.y1 + dy };
}

/** Troca quando a vista chega a meia tela da borda da janela, ou quando a janela ficou larga
 *  demais para a vista (depois de aproximar o zoom, ela desenharia o filme quase inteiro). */
export function needsNewWindow(w: View, v: View): boolean {
  const dt = v.t1 - v.t0, dy = v.y1 - v.y0;
  return v.t0 < w.t0 + dt / 2 || v.t1 > w.t1 - dt / 2 || w.t1 - w.t0 > dt * 6
    || v.y0 < w.y0 + dy / 2 || v.y1 > w.y1 - dy / 2 || w.y1 - w.y0 > dy * 6;
}

/** As linhas com só as ações da janela (e as fixas, como a que está sendo arrastada). Linha fora
 *  da janela fica, com a mesma altura, sem ações. Nada cortado devolve o mesmo array. */
export function cropRows(rows: TimelineRow[], w: View, defaultHeight: number, pinned: ReadonlySet<string>): TimelineRow[] {
  let top = 0, changed = false;
  const out = rows.map((r) => {
    const h = r.rowHeight ?? defaultHeight;
    const inside = top < w.y1 && top + h > w.y0;
    top += h;
    const actions = r.actions.filter((a) => pinned.has(a.id) || (inside && a.end >= w.t0 && a.start <= w.t1));
    if (actions.length === r.actions.length) return r;
    changed = true;
    return { ...r, actions };
  });
  return changed ? out : rows;
}

export type VisibleTimelineProps = React.ComponentProps<typeof Timeline> & {
  /** Depois de uma troca de escala, o tempo `t` fica no x `x` da vista (o zoom ancorado). A
   *  janela já nasce certa no mesmo render, sem desenhar primeiro a da escala velha. */
  anchor?: { t: number; x: number } | null;
};

/** A `Timeline` da lib com as ações fora da vista fora do DOM. Mesma API, mais `anchor`. */
export const VisibleTimeline = React.forwardRef<TimelineState, VisibleTimelineProps>(function VisibleTimeline({ anchor, ...props }, ref) {
  const { editorData, scale = 1, scaleWidth = 160, startLeft = 20, rowHeight = 32 } = props;
  const pps = scaleWidth / scale;
  const inner = React.useRef<TimelineState>(null);
  // Sem dependências: a lib refaz o objeto dela a cada render, e quem chama deve ver o atual.
  React.useImperativeHandle(ref, () => inner.current as TimelineState);
  const scroll = React.useRef({ left: 0, top: 0 });
  const size = React.useRef({ width: 0, height: 0 });
  const pinned = React.useRef(new Set<string>());
  const win = React.useRef<View | null>(null);
  const seenPps = React.useRef(pps);
  const [, refresh] = React.useReducer((n: number) => n + 1, 0);

  // Escala nova: a rolagem que vai valer é a da âncora (quem chama rola para lá logo depois).
  let newScale = false;
  if (pps !== seenPps.current) {
    seenPps.current = pps;
    newScale = true;
    if (anchor) scroll.current = { ...scroll.current, left: Math.max(0, startLeft + anchor.t * pps - anchor.x) };
  }
  const viewNow = () => viewOf(scroll.current.left, scroll.current.top, size.current.width, size.current.height, pps, startLeft);
  if (size.current.width > 0) {
    const v = viewNow();
    if (!win.current || newScale || needsNewWindow(win.current, v)) win.current = windowOf(v);
  }
  const w = win.current;
  const data = React.useMemo(() => (w ? cropRows(editorData, w, rowHeight, pinned.current) : editorData), [editorData, w, rowHeight]);

  // Medida da área: sem ela (1º render), desenha tudo, como a lib sozinha.
  React.useEffect(() => {
    const el = inner.current?.target;
    if (!el) return;
    const o = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.width === size.current.width && r.height === size.current.height) return;
      size.current = { width: r.width, height: r.height };
      refresh();
    });
    o.observe(el);
    return () => o.disconnect();
  }, []);

  const { onScroll, onActionMoveStart, onActionResizeStart, onActionMoveEnd, onActionResizeEnd } = props;
  return (
    <Timeline ref={inner} {...props} editorData={data}
      onScroll={(p) => {
        scroll.current = { left: p.scrollLeft, top: p.scrollTop };
        onScroll?.(p);
        if (win.current && size.current.width > 0 && needsNewWindow(win.current, viewNow())) refresh();
      }}
      // A ação arrastada fica desenhada até soltar, mesmo que a rolagem automática leve a janela
      // para longe do lugar original dela (a lib precisa dela nos dados para fechar o arrasto).
      onActionMoveStart={(d) => { pinned.current.add(d.action.id); return onActionMoveStart?.(d); }}
      onActionResizeStart={(d) => { pinned.current.add(d.action.id); return onActionResizeStart?.(d); }}
      onActionMoveEnd={(d) => { pinned.current.delete(d.action.id); return onActionMoveEnd?.(d); }}
      onActionResizeEnd={(d) => { pinned.current.delete(d.action.id); return onActionResizeEnd?.(d); }} />
  );
});
