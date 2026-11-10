/*
 * ENCAIXE: a dovetail joint cut from one solid block. Two halves split along a
 * zigzag seam; drag the right half back and the teeth find their exact mates,
 * locking the joint — the same seam the NM monogram thickens into a mark.
 */
import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { LabComponentMeta } from "../types";

export const meta: LabComponentMeta = {
  id: "2026-11-10-encaixe",
  date: "2026-11-10",
  title: "Encaixe",
  label: "ENCAIXE",
  hint: "drag to lock the joint",
  hintTouch: "arraste pra travar o encaixe",
  formula: "gap = clamp(70 − Δx, 0, 70) · snap gap<14→0 | gap>56→70 · k 480 c 30",
  rules: [
    "one-input", "one-metaphor", "mono-labels", "formula", "born-in-best-state",
    "tactile-object", "real-ui-purpose", "no-new-deps", "tokens", "reduced-motion",
    "touch", "only-transform", "mobile-hint", "mobile-no-hover", "mobile-perf",
  ],
  status: "candidate",
  tags: { input: "drag", family: "material", intensity: "medium", response: "snap" },
  rationale: "componente do dia a partir de NM Art & Design (behance/ui-ux): metáfora de marcenaria (encaixe rabo-de-andorinha) pro mesmo princípio do projeto — a costura entre as duas peças é o próprio desenho. desvio: intensity subtle colidia com a combinação do Despacho (descartado em 2026-11-09); subiu pra medium, que combina com o clique firme do encaixe travando.",
  kind: "component",
  inspiration: "A marca NM grossa o traço diagonal que N e M dividem até ele virar a própria junta estrutural das letras, então o logotipo lê como objeto encaixado, não como tipografia chapada.",
  sketches: [
    "Pino descendo num furo (espiga e mortalha): perdeu por já soar parecido com o 'fechar posição' que já está no mural, e lia como montagem, não como confirmar uma fusão.",
    "Engrenagens se encaixando ao girar: perdeu por pedir dois gestos (girar + aproximar), o que quebra one-input, e lia como 'ligar uma máquina', não como mesclar dois registros.",
  ],
  source: {
    title: "NM Art & Design",
    url: "https://www.behance.net/gallery/253524325/NM-Art-Design",
    studio: "ESH Gruppa, Kirill Turygin +4",
    gallery: "ui-ux",
    refs: [
      "lab/.refs/2026-11-10-nm-art-design/ref-1.png",
      "lab/.refs/2026-11-10-nm-art-design/ref-2.png",
      "lab/.refs/2026-11-10-nm-art-design/ref-3.png",
    ],
  },
};

const H = 120;
const TEETH = 6;
const AMP = 9;
const OPEN = 70;
const SNAP_IN = 14;
const SNAP_OUT = 56;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// The seam both halves are cut from: one zigzag line, flush at top and bottom.
const SEAM = Array.from({ length: TEETH + 1 }, (_, i) => {
  const y = (i * H) / TEETH;
  const x = i === 0 || i === TEETH ? 0 : i % 2 === 1 ? AMP : -AMP;
  return [x, y] as const;
});
const seamLine = SEAM.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ");
const leftPath = `M -62 0 L ${seamLine} L -62 ${H} Z`;
const rightPath = `M ${seamLine} L 62 ${H} L 62 0 Z`;

export default function Encaixe() {
  const reduce = useReducedMotion();
  const uid = React.useId().replace(/:/g, "");
  const raw = useMotionValue(OPEN); // born ajar: the teeth already read as two halves
  const sprung = useSpring(raw, { stiffness: 480, damping: 30 });
  const gap = reduce ? raw : sprung;
  const [locked, setLocked] = React.useState(false);
  const start = React.useRef<{ x: number; from: number } | null>(null);

  const rightX = useTransform(gap, (g) => 80 + g);
  const shadowOpacity = useTransform(gap, (g) => clamp(g / 40, 0, 1));
  const shadowWidth = useTransform(gap, (g) => 6 + g * 0.3);
  const seamGlow = useTransform(gap, (g) => 1 - clamp(g / 8, 0, 1));

  const settle = (g: number) => {
    const next = g < SNAP_IN ? 0 : g > SNAP_OUT ? OPEN : g < OPEN / 2 ? 0 : OPEN;
    setLocked(next === 0);
    navigator.vibrate?.(8);
    if (reduce) raw.jump(next); else raw.set(next);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={locked}
      aria-label="Mesclar os dois registros"
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); settle(locked ? OPEN : 0); }
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = { x: e.clientX, from: raw.get() };
      }}
      onPointerMove={(e) => {
        const s = start.current;
        if (!s) return;
        const next = clamp(s.from - (e.clientX - s.x), 0, OPEN);
        if (reduce) raw.jump(next); else raw.set(next);
      }}
      onPointerUp={() => { if (start.current) settle(raw.get()); start.current = null; }}
      onPointerCancel={() => { start.current = null; }}
      className="relative isolate grid h-full w-full cursor-grab touch-none select-none place-items-center overflow-hidden rounded-tile bg-casa-tile outline-none focus-visible:[box-shadow:var(--focus)] active:cursor-grabbing"
    >
      <svg aria-hidden viewBox="0 0 160 120" className="pointer-events-none h-[72%] w-[72%]">
        <defs>
          <linearGradient id={`wood-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--casa-fg-2)" }} />
            <stop offset="0.5" style={{ stopColor: "var(--casa-fg-3)" }} />
            <stop offset="1" style={{ stopColor: "var(--casa-bg)" }} />
          </linearGradient>
          <pattern id={`grain-${uid}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(4)">
            <rect width="7" height="7" className="fill-casa-tile-2" />
            <line x1="0" y1="3.5" x2="7" y2="3.5" className="stroke-casa-bg" strokeWidth="1" opacity="0.5" />
          </pattern>
        </defs>
        <g transform="translate(18 0)">
          <path d={leftPath} fill={`url(#grain-${uid})`} className="stroke-casa-line" strokeWidth="1" />
          <path d={leftPath} fill={`url(#wood-${uid})`} opacity="0.35" className="stroke-none" />
          <motion.path style={{ x: rightX }} d={rightPath} fill={`url(#grain-${uid})`} className="stroke-casa-line" strokeWidth="1" />
          <motion.path style={{ x: rightX }} d={rightPath} fill={`url(#wood-${uid})`} opacity="0.35" className="stroke-none" />
          <motion.rect x="-4" y="0" width="8" height={H} style={{ opacity: shadowOpacity, scaleX: shadowWidth }} className="fill-casa-bg blur-[3px]" />
          <motion.path d={`M ${seamLine}`} style={{ opacity: seamGlow }} className="fill-none stroke-[var(--chart-2)]" strokeWidth="2" />
        </g>
      </svg>
      <div aria-hidden className="pointer-events-none absolute bottom-3 font-casa-mono text-[10px] uppercase tracking-[0.14em] text-casa-fg-3">
        {locked ? "mesclado" : "arraste pra travar"}
      </div>
    </div>
  );
}
