/*
 * TOGGLE: an over-center toggle switch mounted on a brushed plate. Push the
 * knurled bat handle against its spring; cross the center cam and it snaps to
 * the opposite stop, throwing its shadow and specular ridge across the bezel.
 *
 * One normalized position u ∈ [−1, 1] drives the whole piece: bat foreshortening,
 * perspective taper, cast shadow, specular glint, and the pilot lens.
 */
import * as React from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { LabMeta } from "../types";

export const meta: LabMeta = {
  id: "2026-11-09-toggle",
  date: "2026-11-09",
  title: "Toggle",
  label: "TOGGLE",
  hint: "drag the toggle lever across the detent",
  hintTouch: "arraste a alavanca para armar",
  formula: "F = −k·sin(πu) · snap sign(u) · x = 32u · shadow = −24u · k 560 c 28",
  rules: ["one-input", "one-metaphor", "mono-labels", "formula", "born-in-best-state", "tactile-object", "real-ui-purpose", "no-new-deps", "tokens", "reduced-motion", "touch", "small", "only-transform", "mobile-hint", "mobile-no-hover", "mobile-perf"],
  status: "candidate",
  tags: { input: "drag", family: "mechanical", intensity: "medium", response: "snap" },
  rationale: "desvio: o lab:next sorteou pointer+fluid+inertia, mas após o descarte do GOVERNOR e do Alcance o dono pediu objeto físico com função real de UI em 2s + relevo/luz/textura; drag (71%), mechanical (67%), medium (63%) e snap (67%) entregam uma chave alavanca basculante real",
};

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E")`;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function Toggle() {
  const reduce = useReducedMotion();
  const uid = React.useId().replace(/:/g, "");
  const [armed, setArmed] = React.useState(false);
  const raw = useMotionValue(-1); // born in SAFE (-1): dragging right throws it over the cam into LIVE (+1)
  const sprung = useSpring(raw, { stiffness: 560, damping: 28 });
  const u = reduce ? raw : sprung;
  const drag = React.useRef<{ x: number; from: number; moved: boolean } | null>(null);

  useMotionValueEvent(raw, "change", (v) => setArmed(v >= 0));

  const tipX = useTransform(u, (v) => v * 32);
  const tipY = useTransform(u, (v) => -4 - (1 - Math.abs(v)) * 8);
  const shadowX = useTransform(u, (v) => 100 - v * 24);
  const glintX = useTransform(u, (v) => -3.2 + v * 2.8);
  const pilotOp = useTransform(u, [-0.15, 0.45], [0.22, 1]);
  const shaft = useTransform(u, (v) => {
    const tx = 100 + v * 32;
    const ty = 80 - (1 - Math.abs(v)) * 8;
    const nx = -ty + 84;
    const ny = tx - 100;
    const len = Math.hypot(nx, ny) || 1;
    const ux = nx / len;
    const uy = ny / len;
    return `M ${(100 - ux * 3.8).toFixed(1)} ${(84 - uy * 3.8).toFixed(1)} L ${(100 + ux * 3.8).toFixed(1)} ${(84 + uy * 3.8).toFixed(1)} L ${(tx + ux * 7.8).toFixed(1)} ${(ty + uy * 7.8).toFixed(1)} L ${(tx - ux * 7.8).toFixed(1)} ${(ty - uy * 7.8).toFixed(1)} Z`;
  });
  const ridge = useTransform(u, (v) => {
    const tx = 100 + v * 32;
    const ty = 80 - (1 - Math.abs(v)) * 8 - 2.2;
    return `M 100 82.5 L ${tx.toFixed(1)} ${ty.toFixed(1)}`;
  });

  const snapTo = (next: 1 | -1) => {
    if (reduce) raw.jump(next);
    else raw.set(next);
    navigator.vibrate?.(10);
  };

  return (
    <div
      role="switch"
      tabIndex={0}
      aria-checked={armed}
      aria-label="Chave geral de produção"
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); snapTo(armed ? -1 : 1); }
        if (e.key === "ArrowRight") { e.preventDefault(); snapTo(1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); snapTo(-1); }
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, from: raw.get(), moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.x;
        if (Math.abs(dx) > 3) d.moved = true;
        const lin = clamp(d.from + dx / 44, -1, 1);
        const cam = lin + 0.18 * Math.sin(lin * Math.PI);
        if (reduce) raw.jump(clamp(cam, -1, 1));
        else raw.set(clamp(cam, -1, 1));
      }}
      onPointerUp={() => {
        const d = drag.current;
        drag.current = null;
        if (!d) return;
        snapTo(!d.moved ? (armed ? -1 : 1) : raw.get() >= 0 ? 1 : -1);
      }}
      onPointerCancel={() => { drag.current = null; snapTo(raw.get() >= 0 ? 1 : -1); }}
      className="relative isolate h-full w-full cursor-grab touch-none select-none overflow-hidden rounded-tile bg-casa-tile-2 outline-none focus-visible:[box-shadow:var(--focus)] active:cursor-grabbing"
    >
      <svg aria-hidden viewBox="0 0 200 160" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id={`plate-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--casa-tile)" }} />
            <stop offset="1" style={{ stopColor: "var(--casa-bg)" }} />
          </linearGradient>
          <linearGradient id={`shaft-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--casa-fg)" }} />
            <stop offset="0.55" style={{ stopColor: "var(--casa-fg-2)" }} />
            <stop offset="1" style={{ stopColor: "var(--casa-bg)" }} />
          </linearGradient>
          <radialGradient id={`cap-${uid}`} cx="0.32" cy="0.28" r="0.72">
            <stop offset="0" style={{ stopColor: "var(--casa-fg)" }} />
            <stop offset="0.55" style={{ stopColor: "var(--casa-fg-2)" }} />
            <stop offset="0.88" style={{ stopColor: "var(--casa-fg-3)" }} />
            <stop offset="1" style={{ stopColor: "var(--casa-bg)" }} />
          </radialGradient>
        </defs>
        {/* Recessed brushed plate with top highlight and engraved throw track */}
        <rect x="22" y="20" width="156" height="120" rx="14" fill={`url(#plate-${uid})`} className="stroke-casa-line" strokeWidth="1" />
        <line x1="34" y1="21" x2="166" y2="21" strokeWidth="1" className="stroke-casa-fg opacity-20" />
        <rect x="58" y="75" width="84" height="18" rx="9" className="fill-casa-bg stroke-casa-line" strokeWidth="1" />
        {[-1, 1].map((sx) =>
          [-1, 1].map((sy) => (
            <g key={`${sx}${sy}`} transform={`translate(${100 + sx * 64} ${80 + sy * 46})`}>
              <circle r="3.2" className="fill-casa-bg stroke-casa-line" strokeWidth="0.8" />
              <line x1="-2" y1="-1" x2="2" y2="1" strokeWidth="0.8" className="stroke-casa-fg-3" />
            </g>
          )),
        )}
        {/* Pilot jewel indicator */}
        <circle cx="100" cy="39" r="5.5" className="fill-casa-bg stroke-casa-line" strokeWidth="1" />
        <motion.circle cx="100" cy="39" r="3.4" style={{ opacity: pilotOp }} className="fill-[var(--chart-2)]" />
        {/* Hex mounting nut and recessed socket */}
        <polygon points="100,59 121,70 121,96 100,107 79,96 79,70" className="fill-casa-tile stroke-casa-fg-3" strokeWidth="1" />
        <circle cx="100" cy="83" r="14.5" className="fill-casa-bg stroke-casa-line" strokeWidth="1" />
        <circle cx="100" cy="83" r="7.5" className="fill-casa-tile-2 stroke-casa-fg-3" strokeWidth="0.7" />
        {/* Cast shadow across the plate */}
        <motion.ellipse cx={shadowX} cy="93" rx="22" ry="7.5" className="fill-casa-bg opacity-80 blur-[2.5px]" />
        {/* Conical bat shaft + specular highlight ridge */}
        <motion.path d={shaft} fill={`url(#shaft-${uid})`} className="stroke-casa-bg" strokeWidth="0.9" />
        <motion.path d={ridge} strokeWidth="1.8" strokeLinecap="round" className="stroke-casa-fg opacity-80" />
        {/* Machined bat tip with knurled rings and crisp catchlight */}
        <motion.g style={{ x: tipX, y: tipY }}>
          <circle cx="100" cy="84" r="12" fill={`url(#cap-${uid})`} className="stroke-casa-bg" strokeWidth="1" />
          <circle cx="100" cy="84" r="9.2" fill="none" strokeWidth="0.75" strokeDasharray="1.8 1.8" className="stroke-casa-bg opacity-55" />
          <circle cx="100" cy="84" r="5.5" fill="none" strokeWidth="0.7" className="stroke-casa-fg opacity-45" />
          <motion.circle cx="100" cy="80.2" r="2.2" style={{ x: glintX }} className="fill-casa-fg opacity-90" />
        </motion.g>
      </svg>
      <div aria-hidden className="pointer-events-none absolute inset-x-9 top-1/2 flex -translate-y-1/2 justify-between font-casa-mono text-[10px] uppercase tracking-[0.14em]">
        <span className={armed ? "text-casa-fg-3 opacity-45" : "text-casa-fg"}>safe</span>
        <span className={armed ? "text-[var(--chart-2)]" : "text-casa-fg-3 opacity-45"}>live</span>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.24] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
    </div>
  );
}
