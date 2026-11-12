"use client";

import * as React from "react";
import type { TimelineAction, TimelineRow } from "@xzdarcy/timeline-engine";
import "@xzdarcy/react-timeline-editor/dist/react-timeline-editor.css";
import { cn } from "@/lib/utils";
import type { Clock } from "./clock";
import { Overlay, RULER_HEIGHT, TRACKS_TOP, type OverlayHandle } from "./overlay";
import { rulerLabel, snapTo, timecode } from "./ruler";
import { TrackHeaders, type TrackHeader, type TrackHeaderLabels, type TrackState } from "./track-headers";
import type { MediaTimelineController } from "./use-media-timeline";
import { VisibleTimeline } from "./window";

// Timeline de mídia (som, vídeo, legenda, nota) no nível de uma ferramenta de edição: régua que
// vira quadros de perto, agulha com scrub e ímã, seleção por área, navalha, HUD do arrasto,
// cabeçalhos de faixa (renomear, grupos, esconder, calar, solo, travar), zoom em gesto e só os
// clipes à vista no DOM. Não sabe de onde vêm os dados nem de API: faixas e clipes entram por
// props, o desenho de cada clipe é de quem usa (`renderClip`) e toda mudança sai por callback.
// Arrastar e aparar são da lib `@xzdarcy/react-timeline-editor`; o resto é camada por cima.

export interface MediaClip {
  id: string;
  start: number;
  end: number;
  /** Tipo livre (som, vídeo, nota): vai para o `renderClip` e para a classe da lib. */
  kind?: string;
  /** Nome para a dica do clipe estreito (sem nome, sem dica). */
  name?: string;
  movable?: boolean;
  resizable?: boolean;
  selected?: boolean;
  /** A seleção por área e a navalha pegam este clipe (padrão: sim). */
  selectable?: boolean;
  /** Limites de arrasto (s). */
  min?: number;
  max?: number;
}

export interface MediaTrack extends Omit<TrackHeader, "height"> {
  height?: number;
  /** Os clipes. Mantenha o mesmo array enquanto nada mudar: a timeline só redesenha a faixa
   *  cujo array mudou. */
  clips: MediaClip[];
  /** Travada: não arrasta, não apara, a área e a navalha passam por cima. */
  locked?: boolean;
}

export interface ClipChange { clip: MediaClip; track: string; start: number; end: number }

export interface MediaTimelineProps {
  /** O estado de vista, de `useMediaTimeline`. */
  controller: MediaTimelineController;
  tracks: MediaTrack[];
  clock: Clock;
  renderClip: (clip: MediaClip, track: string, info: { px: number }) => React.ReactNode;
  /** Altura padrão de uma faixa (px). */
  trackHeight?: number;
  tool?: "select" | "razor";
  /** Ímã: a agulha, a navalha e o arrasto grudam nos pontos (começos e fins, marcas). */
  snap?: boolean;
  snapPoints?: number[];
  /** Distância do ímã (px). */
  snapPx?: number;
  formatTime?: (t: number) => string;
  /** Estado dos botões de cada faixa (solo, calar, travar). */
  trackState?: (id: string) => TrackState;
  selectedTracks?: Set<string>;
  editingTrack?: string | null;
  headerLabels?: Partial<TrackHeaderLabels>;
  onTrackEdit?: (id: string | null) => void;
  onTrackRename?: (id: string, name: string) => void;
  onTrackSelect?: (id: string, additive: boolean) => void;
  onTrackLock?: (id: string) => void;
  onTrackMute?: (id: string) => void;
  onTrackSolo?: (id: string) => void;
  onTrackCollapse?: (id: string) => void;
  onTrackHide?: (id: string) => void;
  onMove?: (c: ClipChange) => void;
  onResize?: (c: ClipChange & { edge: "left" | "right" }) => void;
  onClipClick?: (clip: MediaClip, track: string, e: React.MouseEvent) => void;
  /** Clique no vazio de uma faixa (não vem logo depois de uma seleção por área). */
  onEmptyClick?: (e: React.MouseEvent) => void;
  /** Ao soltar a seleção por área: os ids pegos e se Shift/Ctrl somava. */
  onAreaSelect?: (ids: Set<string>, info: { additive: boolean }) => void;
  /** O que a área marca enquanto arrasta, dado o que ela pega (ex.: o bloco inteiro). */
  expandArea?: (ids: Set<string>) => Set<string>;
  /** Navalha: corte no tempo `t` (já no quadro e no ímã). */
  onCut?: (clip: MediaClip, track: string, t: number) => void;
  onScrubStart?: () => void;
  onScrub?: (t: number) => void;
  onScrubEnd?: (t: number) => void;
  onScroll?: (p: { left: number; top: number }) => void;
  /** Frase nas faixas vazias. */
  emptyHints?: { track: string; text: string }[];
  /** Atalhos próprios: = e − (zoom), Shift+Z (caber), V e C (ferramenta). Desligue se a tela já
   *  tem um teclado. */
  keyboard?: boolean;
  onToolChange?: (tool: "select" | "razor") => void;
  /** Envolve os cabeçalhos e a área (menu de contexto, por exemplo). */
  wrapHeaders?: (node: React.ReactElement) => React.ReactNode;
  wrapArea?: (node: React.ReactElement) => React.ReactNode;
  className?: string;
  headersClassName?: string;
  areaClassName?: string;
}

const STATE_OFF: TrackState = { locked: false, muted: false, solo: false };
const nada = () => {};

export function MediaTimeline(props: MediaTimelineProps) {
  const {
    controller: tl, tracks, clock, renderClip, trackHeight = 34, tool = "select", snap = true, snapPoints = [], snapPx = 8,
    formatTime: fmt, trackState = () => STATE_OFF, selectedTracks, editingTrack = null, headerLabels,
    onMove, onResize, onClipClick, onEmptyClick, onAreaSelect, expandArea, onCut, onScrubStart, onScrub, onScrubEnd, onScroll,
    emptyHints, keyboard = true, onToolChange, wrapHeaders, wrapArea, className, headersClassName, areaClassName,
  } = props;
  const { startLeft, fps, pxPerSecond, ruler, width, duration } = tl;
  const formatTime = React.useMemo(() => fmt ?? ((t: number) => timecode(t, fps)), [fmt, fps]);
  const overlay = React.useRef<OverlayHandle>(null);
  const headers = React.useRef<HTMLDivElement>(null);
  const marqueeAt = React.useRef(0);
  // O que a seleção por área marca agora: o clipe que entra na janela no meio do gesto já nasce marcado.
  const inMarquee = React.useRef<Set<string>>(new Set());

  // ── Faixas e clipes → linhas da lib, com cache por array de clipes ──────────
  // A lib copia os dados para um estado e redesenha tudo quando o array muda; com o cache, um
  // render de quem usa que não mexeu em clipe nenhum não chega à lib.
  const cache = React.useRef(new WeakMap<MediaClip[], { row: TimelineRow; h: number; locked: boolean }>());
  const prevRows = React.useRef<TimelineRow[]>([]);
  const rows = React.useMemo(() => {
    const out = tracks.map((t) => {
      const h = t.height ?? trackHeight, locked = !!t.locked;
      const c = cache.current.get(t.clips);
      if (c && c.row.id === t.id && c.h === h && c.locked === locked) return c.row;
      const row: TimelineRow = {
        id: t.id, rowHeight: h,
        actions: t.clips.map((k) => ({
          id: k.id, start: k.start, end: k.end, effectId: k.kind ?? "clip", selected: k.selected,
          movable: !locked && k.movable !== false, flexible: !locked && k.resizable !== false,
          ...(k.min !== undefined ? { minStart: k.min } : {}), ...(k.max !== undefined ? { maxEnd: k.max } : {}),
        })),
      };
      cache.current.set(t.clips, { row, h, locked });
      return row;
    });
    const same = out.length === prevRows.current.length && out.every((r, i) => r === prevRows.current[i]);
    return same ? prevRows.current : (prevRows.current = out);
  }, [tracks, trackHeight]);
  const clipIndex = React.useMemo(() => {
    const m = new Map<string, { clip: MediaClip; track: MediaTrack }>();
    for (const t of tracks) for (const c of t.clips) m.set(c.id, { clip: c, track: t });
    return m;
  }, [tracks]);
  const kinds = [...new Set(tracks.flatMap((t) => t.clips.map((c) => c.kind ?? "clip")))].sort().join(",");
  const effects = React.useMemo(() => Object.fromEntries(kinds.split(",").map((k) => [k, { id: k }])), [kinds]);
  const geometry = React.useMemo(() => {
    let top = 0;
    return tracks.map((t) => { const h = t.height ?? trackHeight; const g = { id: t.id, top, h }; top += h; return g; });
  }, [tracks, trackHeight]);

  // ── Geometria e ímã ─────────────────────────────────────────────────────────
  const trackAtY = (y: number) => {
    const yy = y - TRACKS_TOP + tl.scrollTop.current;
    return geometry.find((g) => yy >= g.top && yy < g.top + g.h) ?? null;
  };
  const local = (e: { clientX: number; clientY: number }) => {
    const r = tl.box.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const snapped = (t: number, free: boolean, extra: number[] = []) => {
    if (!snap || free) return { t, snapped: false };
    const p = snapTo(t, extra.length ? [...snapPoints, ...extra] : snapPoints, snapPx / pxPerSecond);
    return p === null ? { t, snapped: false } : { t: p, snapped: true };
  };
  const onFrame = (t: number) => Math.round(t * fps) / fps;
  // A faixa sob o mouse acende também o cabeçalho dela.
  const markHeader = (id: string | null) => {
    headers.current?.querySelectorAll<HTMLElement>("[data-track]").forEach((el) => el.toggleAttribute("data-hover", el.dataset.track === id));
  };
  const clearHover = () => { overlay.current?.set({ ghost: null, hoverTrack: null, razor: null, tip: null }); markHeader(null); };

  // ── Agulha: arrastar na régua é scrub contínuo; Alt solta do ímã ─────────────
  const dragPlayhead = (e: React.PointerEvent) => {
    // Sem preventDefault: o clique na régua precisa tirar o foco de um campo, senão o Ctrl+Z
    // seguinte vai para o campo e não para a timeline.
    const focus = document.activeElement as HTMLElement | null;
    if (focus?.closest("input, textarea, [contenteditable=\"true\"]")) focus.blur();
    onScrubStart?.();
    let last = clock.get();
    overlay.current?.set({ ghost: null });
    const move = (ev: PointerEvent | React.PointerEvent) => {
      const g = snapped(tl.timeAtX(local(ev).x), ev.altKey);
      // Só o relógio anda: quem usa re-renderiza uma vez, ao soltar.
      last = Math.max(0, Math.min(duration, g.t));
      clock.set(last);
      overlay.current?.set({ scrub: { snapped: g.snapped } });
      onScrub?.(last);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      overlay.current?.set({ scrub: null });
      onScrubEnd?.(last);
    };
    move(e);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  // ── Seleção por área: pega, ao vivo, os clipes que o retângulo toca ───────────
  const selectByArea = (e: React.PointerEvent) => {
    // O começo fica no conteúdo (com a rolagem), para o retângulo crescer com a rolagem automática.
    const p0 = local(e);
    const ini = { x: p0.x + tl.scrollLeft.current, y: p0.y + tl.scrollTop.current };
    const additive = e.shiftKey || e.ctrlKey || e.metaKey;
    let moved = false, last = p0, frame = 0, dirty = false;
    let marked = new Set<string>();
    let picked: Set<string> | null = null;
    const box = tl.box.current!;
    const mark = (id: string, on: boolean) => box.querySelector(`[data-mt-clip="${CSS.escape(id)}"]`)?.toggleAttribute("data-in-marquee", on);
    const update = () => {
      const p = last;
      const ax = ini.x - tl.scrollLeft.current, ay = ini.y - tl.scrollTop.current;
      const x = Math.max(0, Math.min(ax, p.x)), y = Math.max(TRACKS_TOP, Math.min(ay, p.y));
      const r = { x, y, w: Math.max(0, Math.min(width, Math.max(ax, p.x)) - x), h: Math.max(0, Math.max(ay, p.y) - y) };
      overlay.current?.set({ marquee: r });
      // Acertos pela geometria (faixas e tempos), sem ler o layout de cada clipe.
      const ids = new Set<string>();
      const cx0 = r.x + tl.scrollLeft.current, cx1 = cx0 + r.w;
      const cy0 = r.y - TRACKS_TOP + tl.scrollTop.current, cy1 = cy0 + r.h;
      tracks.forEach((t, i) => {
        const g = geometry[i];
        if (g.top >= cy1 || g.top + g.h <= cy0 || t.locked) return;
        for (const c of t.clips) {
          if (c.selectable === false) continue;
          const x0 = startLeft + c.start * pxPerSecond, x1 = Math.max(x0 + 6, startLeft + c.end * pxPerSecond);
          if (x1 >= cx0 && x0 <= cx1) ids.add(c.id);
        }
      });
      // Durante o gesto, a seleção é só visual (atributo no DOM, trocando só o que mudou); quem usa
      // recebe uma vez, ao soltar. Antes, cada quadro re-renderizava todas as ações.
      const now = expandArea ? expandArea(ids) : ids;
      for (const k of marked) if (!now.has(k)) mark(k, false);
      for (const k of now) if (!marked.has(k)) mark(k, true);
      marked = now;
      inMarquee.current = now;
      picked = ids;
    };
    // Rolagem automática perto da borda. Rola o elemento da grade, não o estado da lib: rolagem
    // por código re-renderizava todas as ações a cada passo.
    const roll = () => {
      const p = last, edge = 28, high = box.clientHeight;
      const dx = p.x < edge ? p.x - edge : p.x > width - edge ? p.x - (width - edge) : 0;
      const dy = p.y < TRACKS_TOP + edge && p.y < ini.y - tl.scrollTop.current ? p.y - TRACKS_TOP - edge : p.y > high - edge ? p.y - (high - edge) : 0;
      const grid = box.querySelector<HTMLElement>(".timeline-editor-edit-area .ReactVirtualized__Grid");
      const step = (d: number) => Math.sign(d) * Math.max(1, Math.abs(d * 0.4));
      if (grid && dx) grid.scrollLeft = Math.max(0, grid.scrollLeft + step(dx));
      if (grid && dy) grid.scrollTop = Math.max(0, grid.scrollTop + step(dy));
      // No máximo uma conta por quadro, mesmo com o mouse mandando vários movimentos.
      if (dx || dy || dirty) { dirty = false; update(); }
      frame = requestAnimationFrame(roll);
    };
    const move = (ev: PointerEvent) => {
      last = local(ev);
      if (!moved && Math.hypot(last.x - p0.x, last.y - p0.y) < 4) return;
      if (!moved) { clearHover(); frame = requestAnimationFrame(roll); }
      moved = true;
      dirty = true;
    };
    const up = () => {
      cancelAnimationFrame(frame);
      if (dirty) update();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      overlay.current?.set({ marquee: null });
      inMarquee.current = new Set();
      for (const k of marked) mark(k, false);
      if (moved) marqueeAt.current = performance.now();
      if (moved && picked) onAreaSelect?.(picked, { additive });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  // ── Ponteiro na área: régua, vazio, navalha e hover ──────────────────────────
  const clipUnder = (el: HTMLElement) => {
    const id = el.closest<HTMLElement>("[data-mt-clip]")?.dataset.mtClip;
    return id ? clipIndex.get(id) ?? null : null;
  };
  const pointer = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const el = e.target as HTMLElement;
      if (el.closest(".timeline-editor-time-area")) { dragPlayhead(e); return; }
      const hit = clipUnder(el);
      if (tool === "razor") {
        if (hit && !hit.track.locked && hit.clip.selectable !== false) onCut?.(hit.clip, hit.track.id, snapped(onFrame(tl.timeAtX(local(e).x)), e.altKey, [clock.get()]).t);
        return;
      }
      if (el.closest(".timeline-editor-edit-area") && !el.closest(".timeline-editor-action")) selectByArea(e);
    },
    onPointerMove: (e: React.PointerEvent) => {
      const now = overlay.current?.get();
      if (e.buttons && (now?.scrub || now?.marquee || now?.hud)) return;
      const p = local(e);
      const onRuler = p.y < RULER_HEIGHT;
      const t = onRuler ? null : trackAtY(p.y);
      const hit = onRuler ? null : clipUnder(e.target as HTMLElement);
      // Clipe estreito (o nome não cabe): dica com nome, início e duração em cima dele.
      let tip = null;
      const action = hit?.clip.name ? (e.target as HTMLElement).closest<HTMLElement>(".timeline-editor-action") : null;
      if (hit && action && !e.buttons && action.offsetWidth < 64) {
        const r = action.getBoundingClientRect(), b = tl.box.current!.getBoundingClientRect();
        tip = { x: r.left - b.left + r.width / 2, y: r.top - b.top, name: hit.clip.name!, start: hit.clip.start, duration: hit.clip.end - hit.clip.start };
      }
      overlay.current?.set({
        ghost: onRuler ? tl.timeAtX(p.x) : null,
        hoverTrack: t?.id ?? null,
        razor: tool === "razor" && t && hit && hit.clip.selectable !== false ? { t: snapped(onFrame(tl.timeAtX(p.x)), e.altKey, [clock.get()]).t, track: t.id } : null,
        tip,
      });
      markHeader(t?.id ?? null);
    },
    onPointerLeave: clearHover,
  };

  // HUD do arrasto e do aparo: início, duração e o quanto andou desde que pegou.
  const showHud = (action: TimelineAction, track: string, start: number, end: number, edge?: "left" | "right") => {
    const o = clipIndex.get(action.id)?.clip;
    if (!o) return;
    const delta = edge === "right" ? (end - start) - (o.end - o.start) : start - o.start;
    overlay.current?.set({ hud: { track, start, duration: end - start, delta }, ghost: null, razor: null });
  };

  // ── Teclado próprio (opcional) ──────────────────────────────────────────────
  React.useEffect(() => {
    if (!keyboard) return;
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, [contenteditable=\"true\"], [role=dialog]") || e.ctrlKey || e.metaKey) return;
      const k = e.key.toLowerCase();
      if (e.key === "=" || e.key === "+") tl.zoomTo(tl.zoomTarget() * 1.5);
      else if (e.key === "-" || e.key === "_") tl.zoomTo(tl.zoomTarget() / 1.5);
      else if (k === "z" && e.shiftKey) tl.fit();
      else if (k === "v") onToolChange?.("select");
      else if (k === "c") onToolChange?.("razor");
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const head = (
    <TrackHeaders ref={headers} top={TRACKS_TOP} className={headersClassName} labels={headerLabels}
      tracks={tracks.map((t) => ({ ...t, height: t.height ?? trackHeight }))} state={trackState}
      selected={selectedTracks ?? new Set()} editing={editingTrack}
      onEdit={props.onTrackEdit ?? nada} onRename={props.onTrackRename ?? nada} onSelect={props.onTrackSelect ?? nada}
      onLock={props.onTrackLock ?? nada} onMute={props.onTrackMute ?? nada} onSolo={props.onTrackSolo ?? nada}
      onCollapse={props.onTrackCollapse ?? nada} onHide={props.onTrackHide} />
  );
  const area = (
    <div ref={tl.box} className={cn("mt-viewport", tool === "razor" && "is-razor", areaClassName)} {...pointer}>
      <VisibleTimeline ref={tl.timeline} anchor={tl.anchor.current} style={{ width: "100%", height: "100%" }} editorData={rows} effects={effects}
        // Régua que se adapta ao zoom: segundos longe, meio segundo, quadros de perto.
        scale={ruler.step} scaleWidth={pxPerSecond * ruler.step} scaleSplitCount={ruler.divisions} startLeft={startLeft} rowHeight={trackHeight}
        minScaleCount={ruler.count} maxScaleCount={ruler.count} autoScroll gridSnap={snap} dragLine={snap}
        // A agulha é a da camada por cima (arrasta pela régua, gruda, tem HUD).
        hideCursor disableDrag={tool === "razor"}
        getScaleRender={(s) => <span className="mt-num">{rulerLabel(s, fps)}</span>}
        getActionRender={(a, row) => {
          const hit = clipIndex.get(a.id);
          if (!hit) return null;
          return (
            <span className="mt-clip" data-mt-clip={a.id} data-in-marquee={inMarquee.current.has(a.id) ? "" : undefined}>
              {renderClip(hit.clip, row.id, { px: (a.end - a.start) * pxPerSecond })}
            </span>
          );
        }}
        onClickActionOnly={(e, { action, row }) => { const hit = clipIndex.get(action.id); if (hit) onClipClick?.(hit.clip, row.id, e); }}
        onClickRow={(e) => {
          // Clique no vazio da faixa (menos logo depois de uma seleção por área).
          if (performance.now() - marqueeAt.current < 300) return;
          if (!(e.target as HTMLElement).closest(".mt-clip")) onEmptyClick?.(e);
        }}
        onActionMoving={({ action, row, start, end }) => { showHud(action, row.id, start, end); }}
        onActionResizing={({ action, row, start, end, dir }) => { showHud(action, row.id, start, end, dir); }}
        onActionMoveEnd={({ action, row, start, end }) => {
          overlay.current?.set({ hud: null });
          const hit = clipIndex.get(action.id);
          if (hit) onMove?.({ clip: hit.clip, track: row.id, start, end });
        }}
        onActionResizeEnd={({ action, row, start, end, dir }) => {
          overlay.current?.set({ hud: null });
          const hit = clipIndex.get(action.id);
          if (hit) onResize?.({ clip: hit.clip, track: row.id, start, end, edge: dir });
        }}
        onScroll={({ scrollTop, scrollLeft }) => {
          tl.scrollLeft.current = scrollLeft; tl.scrollTop.current = scrollTop;
          overlay.current?.set({ left: scrollLeft, top: scrollTop });
          if (headers.current) headers.current.scrollTop = scrollTop;
          onScroll?.({ left: scrollLeft, top: scrollTop });
        }} />
      <Overlay ref={overlay} startLeft={startLeft} pxPerSecond={pxPerSecond} clock={clock} duration={duration} width={width} geometry={geometry}
        step={ruler.step} fps={fps} formatTime={formatTime} hints={emptyHints} />
    </div>
  );
  return (
    <div className={cn("mt", className)}>
      {wrapHeaders ? wrapHeaders(head) : head}
      {wrapArea ? wrapArea(area) : area}
    </div>
  );
}
