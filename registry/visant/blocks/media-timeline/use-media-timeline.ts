import * as React from "react";
import type { TimelineState } from "@xzdarcy/react-timeline-editor";
import type { Clock } from "./clock";
import { rulerScale } from "./ruler";

// O estado de vista da timeline: zoom, px por segundo, régua, rolagem e a âncora do zoom. Fica num
// hook (e não dentro do componente) porque quem usa precisa dele fora da timeline: o play rola a
// vista, a tira de quadros mede pelo px por segundo, o slider de zoom mora numa barra.

export interface UseMediaTimelineOptions {
  /** Duração do filme (s). */
  duration: number;
  /** O relógio do play: o zoom sem ponteiro ancora na agulha. */
  clock: Clock;
  /** Folga à esquerda do tempo zero (px). */
  startLeft?: number;
  /** Mínimo de px por segundo, mesmo com o zoom de caber. */
  minPxPerSecond?: number;
  maxZoom?: number;
  fps?: number;
  /** Quanto o gesto espera depois do último passo para aplicar a escala (ms). */
  settleMs?: number;
}

export type MediaTimelineController = ReturnType<typeof useMediaTimeline>;

export function useMediaTimeline({ duration, clock, startLeft = 12, minPxPerSecond = 24, maxZoom = 48, fps = 30, settleMs = 140 }: UseMediaTimelineOptions) {
  const total = duration || 1;
  const timeline = React.useRef<TimelineState>(null);
  const box = React.useRef<HTMLDivElement>(null);
  const scrollLeft = React.useRef(0);
  const scrollTop = React.useRef(0);
  const anchor = React.useRef<{ t: number; x: number } | null>(null);
  const [width, setWidth] = React.useState(1200);
  const [zoom, setZoom] = React.useState(1);
  const pxPerSecond = Math.max(minPxPerSecond, ((width - 40) / total) * zoom);
  const ppsRef = React.useRef(pxPerSecond);
  ppsRef.current = pxPerSecond;
  const widthRef = React.useRef(width);
  widthRef.current = width;
  const zoomRef = React.useRef(zoom);
  zoomRef.current = zoom;
  const ruler = rulerScale(pxPerSecond, total, fps);
  const ppsAt = (z: number) => Math.max(minPxPerSecond, ((widthRef.current - 40) / total) * z);
  const setScroll = (x: number) => timeline.current?.setScrollLeft(Math.max(0, x));

  // Depois do zoom, rola para o tempo da âncora voltar ao mesmo x (mouse, agulha ou meio).
  React.useLayoutEffect(() => {
    const a = anchor.current;
    if (!a) return;
    anchor.current = null;
    setScroll(startLeft + a.t * pxPerSecond - a.x);
    stretch(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pxPerSecond]);

  // Zoom em gesto: durante a roda, as teclas ou o slider, a timeline estica por `transform` em
  // volta da âncora, sem re-renderizar as ações; a escala de verdade entra uma vez, `settleMs`
  // depois do último passo. Com 300 clipes, cada passo custava ~70 ms de render.
  const gesture = React.useRef<{ target: number; t: number; x: number; timer: number } | null>(null);
  const stretch = (s: number | null, x = 0) => {
    const el = box.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>(".ReactVirtualized__Grid__innerScrollContainer").forEach((a) => {
      a.style.transformOrigin = s === null ? "" : `${x + scrollLeft.current}px 0`;
      a.style.transform = s === null ? "" : `scaleX(${s})`;
    });
    const over = el.querySelector<HTMLElement>(".mt-overlay");
    if (over) { over.style.transformOrigin = s === null ? "" : `${x}px 0`; over.style.transform = s === null ? "" : `scaleX(${s})`; }
  };
  const gestureZoom = (z: number, at: { t: number; x: number }) => {
    const g = gesture.current ?? { target: zoomRef.current, ...at, timer: 0 };
    g.target = Math.max(1, Math.min(maxZoom, z));
    gesture.current = g;
    stretch(ppsAt(g.target) / ppsRef.current, g.x);
    window.clearTimeout(g.timer);
    g.timer = window.setTimeout(() => {
      const f = gesture.current;
      gesture.current = null;
      if (!f) return;
      if (Math.abs(ppsAt(f.target) - ppsRef.current) < 0.01) { stretch(null); return; }
      anchor.current = { t: f.t, x: f.x };
      setZoom(f.target);
    }, settleMs);
  };
  const gestureRef = React.useRef(gestureZoom);
  gestureRef.current = gestureZoom;
  /** O zoom para onde o gesto está indo (ou o atual): teclas e roda somam sobre ele. */
  const zoomTarget = () => gesture.current?.target ?? zoomRef.current;
  const zoomTargetRef = React.useRef(zoomTarget);
  zoomTargetRef.current = zoomTarget;
  /** Zoom em volta do x (px na vista); sem x, em volta da agulha (ou do meio, se ela está fora). */
  const zoomTo = (z: number, x?: number) => {
    const now = clock.get();
    const xA = startLeft + now * ppsRef.current - scrollLeft.current;
    gestureZoom(z, x !== undefined
      ? { t: (x + scrollLeft.current - startLeft) / ppsRef.current, x }
      : { t: now, x: xA >= 0 && xA <= widthRef.current ? xA : widthRef.current / 2 });
  };
  const fit = () => { anchor.current = { t: 0, x: startLeft }; setZoom(1); setScroll(0); };

  // Largura da área e Ctrl+roda (zoom em volta do mouse; listener não passivo para segurar o zoom
  // da página).
  React.useEffect(() => {
    const el = box.current;
    if (!el) return;
    const o = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    o.observe(el);
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const x = e.clientX - el.getBoundingClientRect().left;
      gestureRef.current(zoomTargetRef.current() * (e.deltaY < 0 ? 1.15 : 1 / 1.15), { t: (x + scrollLeft.current - startLeft) / ppsRef.current, x });
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => { o.disconnect(); el.removeEventListener("wheel", wheel); };
  }, [startLeft]);

  /** A agulha nunca some: saiu da vista, a timeline vira a página (como nos editores de vídeo). */
  const reveal = React.useCallback((t: number) => {
    const x = startLeft + t * ppsRef.current, left = scrollLeft.current, w = widthRef.current;
    if (x < left) setScroll(x - w * 0.85);
    else if (x > left + w - 16) setScroll(x - w * 0.15);
  }, [startLeft]);
  /** No play: a vista segue a agulha quando ela chega perto da borda. */
  const follow = React.useCallback((t: number) => {
    const x = startLeft + t * ppsRef.current;
    if (x > scrollLeft.current + widthRef.current - 80 || x < scrollLeft.current) setScroll(x - 80);
  }, [startLeft]);
  /** O tempo (s) num x da vista, dentro do filme. */
  const timeAtX = (x: number) => Math.max(0, Math.min(total, (x + scrollLeft.current - startLeft) / ppsRef.current));

  return {
    duration: total, startLeft, fps, maxZoom,
    zoom, zoomTo, zoomTarget, fit, pxPerSecond, ruler, width,
    reveal, follow, timeAtX, setScroll,
    /** Refs que a timeline preenche: quem usa lê, não escreve. */
    timeline, box, scrollLeft, scrollTop, anchor,
  };
}
