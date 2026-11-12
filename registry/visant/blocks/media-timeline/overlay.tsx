import * as React from "react";
import { cn } from "@/lib/utils";
import { useClockTime, type Clock } from "./clock";
import { formatSeconds, rulerLabel } from "./ruler";

// A camada por cima da timeline da lib: agulha própria, agulha fantasma da régua, faixa sob o
// mouse, linha da navalha, HUD do arrasto e dica do clipe estreito.
// A lib continua dona dos clipes (arrastar, aparar); isto só desenha. Guarda o próprio estado e
// muda por `set`, sem renderizar quem usa a timeline a cada movimento do mouse.

/** Altura da régua da lib (32) mais a margem de cima da área das faixas (10). */
export const TRACKS_TOP = 42;
export const RULER_HEIGHT = 32;
/** Largura que um rótulo da régua ocupa (para não cortar na borda direita). */
const LABEL_PX = 34;

export interface OverlayState {
  left: number; top: number;
  ghost: number | null;
  hoverTrack: string | null;
  scrub: { snapped: boolean } | null;
  razor: { t: number; track: string } | null;
  hud: { track: string; start: number; duration: number; delta: number } | null;
  /** Dica do clipe estreito sob o mouse (nome, início, duração), presa no topo dele. */
  tip: { x: number; y: number; name: string; start: number; duration: number } | null;
}
export interface OverlayHandle { set: (p: Partial<OverlayState>) => void; get: () => OverlayState }
export interface TrackGeometry { id: string; top: number; h: number }
const EMPTY: OverlayState = { left: 0, top: 0, ghost: null, hoverTrack: null, scrub: null, razor: null, hud: null, tip: null };

export const Overlay = React.forwardRef<OverlayHandle, {
  startLeft: number; pxPerSecond: number; duration: number; width: number; geometry: TrackGeometry[];
  clock: Clock;
  /** Intervalo entre dois números da régua (s). */
  step: number;
  fps: number;
  formatTime: (t: number) => string;
  /** Frase das faixas vazias, no começo da área visível. */
  hints?: { track: string; text: string }[];
}>(function Overlay({ startLeft, pxPerSecond, clock, duration, width, geometry, step, fps, formatTime, hints = [] }, ref) {
  const [s, setS] = React.useState<OverlayState>(EMPTY);
  const current = React.useRef(s);
  current.current = s;
  React.useImperativeHandle(ref, () => ({
    set: (p) => setS((v) => {
      const n = { ...v, ...p };
      return (Object.keys(p) as (keyof OverlayState)[]).every((k) => v[k] === n[k]) ? v : n;
    }),
    get: () => current.current,
  }), []);
  const xOf = (t: number) => startLeft + t * pxPerSecond - s.left;
  const inView = (x: number) => x >= 0 && x <= width;
  const g = (id: string | null) => (id ? geometry.find((x) => x.id === id) ?? null : null);
  const topOf = (l: TrackGeometry) => TRACKS_TOP + l.top - s.top;
  const hover = g(s.hoverTrack);
  const razorTrack = s.razor ? g(s.razor.track) : null;
  const hudTrack = s.hud ? g(s.hud.track) : null;
  const hudY = hudTrack ? topOf(hudTrack) - 26 : 0;
  const below = hudTrack ? hudY < TRACKS_TOP : false;
  // Régua: o número fica logo à direita da marca (nada corta na borda esquerda) e some antes de
  // cortar na direita. Em quadros, o segundo inteiro vem em destaque e um rótulo fixo à esquerda
  // diz em que segundo se está, para nenhum "15f" ficar sem contexto.
  const tStart = Math.max(0, (s.left - startLeft) / pxPerSecond), tEnd = Math.min(duration, (s.left + width - startLeft) / pxPerSecond);
  const marks: { k: number; t: number; x: number; whole: boolean }[] = [];
  for (let k = Math.floor(tStart / step); k * step <= tEnd + 1e-6; k++) {
    const t = k * step, x = xOf(t) + 4;
    if (x < 0 || x + LABEL_PX > width) continue;
    marks.push({ k, t, x, whole: Math.abs(t - Math.round(t)) < 1e-6 });
  }
  const firstWhole = marks.find((m) => m.whole)?.x ?? Infinity;
  const context = step < 1 && firstWhole > LABEL_PX + 12 ? Math.floor(tStart + 1e-6) : null;
  const labels = marks.filter((m) => context === null || m.x > LABEL_PX + 4).map((m) => (
    <span key={m.k} className={cn("mt-ruler-label mt-num", m.whole && "is-whole")} style={{ transform: `translateX(${m.x}px)` }}>{rulerLabel(m.t, fps)}</span>
  ));
  return (
    <div aria-hidden className="mt-overlay">
      <div className="mt-ruler-labels">
        {labels}
        {context !== null ? <span className="mt-ruler-context mt-num">{rulerLabel(context, fps)}</span> : null}
      </div>
      {hints.map((h) => { const l = g(h.track); return l ? <span key={h.track} className="mt-empty-hint" style={{ transform: `translateY(${topOf(l)}px)`, height: l.h }}>{h.text}</span> : null; })}
      <div className="mt-overlay-tracks">
        {hover ? <div className="mt-hover-track" style={{ transform: `translateY(${hover.top - s.top}px)`, height: hover.h }} /> : null}
      </div>
      {s.ghost !== null && !s.scrub && inView(xOf(s.ghost)) ? (
        <div className="mt-ghost" style={{ transform: `translateX(${xOf(s.ghost)}px)` }}>
          <span className="mt-ghost-time mt-num">{formatTime(s.ghost)}</span>
        </div>
      ) : null}
      {s.razor && razorTrack && inView(xOf(s.razor.t)) ? (
        <div className="mt-razor" style={{ transform: `translate(${xOf(s.razor.t)}px, ${topOf(razorTrack)}px)`, height: razorTrack.h }}>
          <span className="mt-razor-time mt-num">{formatTime(s.razor.t)}</span>
        </div>
      ) : null}
      <Playhead clock={clock} x={xOf} width={width} duration={duration} scrub={s.scrub} formatTime={formatTime} />
      {s.tip && !s.scrub && !s.hud ? (
        <div className="mt-clip-tip" style={{ transform: `translate(${s.tip.x}px, ${s.tip.y}px)` }}>
          <span className="mt-clip-tip-name">{s.tip.name}</span>
          <span className="mt-num">{formatTime(s.tip.start)} · {formatSeconds(s.tip.duration)}</span>
        </div>
      ) : null}
      {s.hud && hudTrack ? (
        <div className="mt-hud mt-num" style={{ transform: `translate(${Math.max(4, xOf(s.hud.start))}px, ${below ? topOf(hudTrack) + hudTrack.h + 4 : hudY}px)` }}>
          <span>{formatTime(s.hud.start)}</span>
          <span className="mt-hud-sep" />
          <span>{formatSeconds(s.hud.duration)}</span>
          {Math.abs(s.hud.delta) > 0.0005 ? <><span className="mt-hud-sep" /><span className="mt-hud-delta">{formatSeconds(s.hud.delta, true)}</span></> : null}
        </div>
      ) : null}
    </div>
  );
});

/** A agulha é a única parte que redesenha a cada quadro do play (assina o relógio sozinha). */
function Playhead({ clock, x, width, duration, scrub, formatTime }: { clock: Clock; x: (t: number) => number; width: number; duration: number; scrub: { snapped: boolean } | null; formatTime: (t: number) => string }) {
  const time = useClockTime(clock);
  const xA = x(time);
  if (xA < 0 || xA > width || time > duration) return null;
  return (
    <div className={cn("mt-playhead", scrub && "is-dragging", scrub?.snapped && "is-snapped")} style={{ transform: `translateX(${xA}px)` }}>
      <span className="mt-playhead-head">{scrub ? <span className="mt-num">{formatTime(time)}</span> : null}</span>
    </div>
  );
}
