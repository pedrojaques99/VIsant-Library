/*
 * IRIS: a camera aperture stopped down over a redacted number. Drag to spread
 * the blades and the light they let through brings the hidden value into
 * focus — the same gesture a lens uses to let more of the scene in.
 */
import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { LabMeta } from "../types";

export const meta: LabMeta = {
  id: "2026-11-10-iris",
  date: "2026-11-10",
  title: "Iris",
  label: "IRIS",
  hint: "drag to open the iris",
  hintTouch: "arraste pra abrir a íris",
  formula: "t = clamp(0.5 + Δx/140, 0, 1) · reach = 6 + t·48 · glow ∝ t · k 170 c 20",
  rules: [
    "one-input", "one-metaphor", "mono-labels", "formula", "born-in-best-state",
    "tactile-object", "real-ui-purpose", "no-new-deps", "tokens", "reduced-motion",
    "touch", "small", "only-transform", "mobile-hint", "mobile-no-hover", "mobile-perf",
  ],
  status: "candidate",
  tags: { input: "drag", family: "light", intensity: "subtle", response: "spring" },
  rationale: "aposta: light 3/3, subtle 9/13, spring 5/7 · exploração: drag 5/7",
};

const BLADES = 8;
const CENTER = 80;
const MOUNT = 60; // ring the blades pivot from
const HALF = 15; // half-width of a blade at its mount
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E")`;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function bladePath(angle: number, reach: number) {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const mx = CENTER + cos * MOUNT;
  const my = CENTER + sin * MOUNT;
  const tx = CENTER + cos * reach;
  const ty = CENTER + sin * reach;
  const px = -sin * HALF;
  const py = cos * HALF;
  return `M ${(mx + px).toFixed(1)} ${(my + py).toFixed(1)} L ${tx.toFixed(1)} ${ty.toFixed(1)} L ${(mx - px).toFixed(1)} ${(my - py).toFixed(1)} Z`;
}

export default function Iris() {
  const reduce = useReducedMotion();
  const uid = React.useId().replace(/:/g, "");
  const raw = useMotionValue(0.5); // born half open: the number already half reads
  const sprung = useSpring(raw, { stiffness: 170, damping: 20 });
  const t = reduce ? raw : sprung;
  const start = React.useRef<{ x: number; from: number } | null>(null);

  const reach = useTransform(t, (v) => 6 + v * 48);
  const paths = Array.from({ length: BLADES }, (_, i) => {
    const angle = i * (360 / BLADES);
    return useTransform(reach, (r) => bladePath(angle, r));
  });
  const glowScale = useTransform(t, (v) => 0.5 + v * 0.7);
  const glowOpacity = useTransform(t, (v) => v * 0.9);
  const sharpOpacity = useTransform(t, (v) => clamp((v - 0.35) / 0.4, 0, 1));
  const dimOpacity = useTransform(sharpOpacity, (v) => 1 - v * 0.85);
  const ringShadow = useTransform(t, (v) => 0.45 - v * 0.35);

  const move = (clientX: number, from: number) => {
    const next = clamp(from + (clientX - start.current!.x) / 140, 0, 1);
    if (reduce) raw.jump(next);
    else raw.set(next);
  };

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Revelar valor"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(raw.get() * 100)}
      aria-valuetext={`${Math.round(raw.get() * 100)}% aberto`}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); raw.set(clamp(raw.get() + 0.1, 0, 1)); }
        if (e.key === "ArrowLeft") { e.preventDefault(); raw.set(clamp(raw.get() - 0.1, 0, 1)); }
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = { x: e.clientX, from: raw.get() };
      }}
      onPointerMove={(e) => start.current && move(e.clientX, start.current.from)}
      onPointerUp={() => { start.current = null; }}
      onPointerCancel={() => { start.current = null; }}
      className="relative isolate grid h-full w-full cursor-grab touch-none select-none place-items-center overflow-hidden rounded-tile bg-casa-tile outline-none focus-visible:[box-shadow:var(--focus)] active:cursor-grabbing"
    >
      <motion.div
        aria-hidden
        style={{ opacity: glowOpacity, scale: glowScale }}
        className="pointer-events-none absolute size-24 rounded-full blur-xl [background:radial-gradient(circle,color-mix(in_srgb,var(--chart-2)_55%,transparent),transparent_70%)]"
      />
      <div aria-hidden className="pointer-events-none absolute grid place-items-center font-casa-mono text-[15px] tracking-tight">
        <motion.span style={{ opacity: dimOpacity }} className="col-start-1 row-start-1 text-casa-fg-3 blur-[3px]">
          R$ •••,••
        </motion.span>
        <motion.span style={{ opacity: sharpOpacity }} className="col-start-1 row-start-1 text-casa-fg">
          R$ 12.480,00
        </motion.span>
      </div>
      <svg aria-hidden viewBox="0 0 160 160" className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id={`blade-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "var(--casa-fg-2)" }} />
            <stop offset="0.6" style={{ stopColor: "var(--casa-fg-3)" }} />
            <stop offset="1" style={{ stopColor: "var(--casa-bg)" }} />
          </linearGradient>
        </defs>
        <circle cx={CENTER} cy={CENTER} r={MOUNT + 10} className="fill-none stroke-casa-line" strokeWidth="1" />
        <motion.circle cx={CENTER} cy={CENTER} r={MOUNT + 4} style={{ opacity: ringShadow }} className="fill-none stroke-casa-fg" strokeWidth="5" />
        {paths.map((d, i) => (
          <motion.path key={i} d={d} fill={`url(#blade-${uid})`} className="stroke-casa-bg" strokeWidth="0.75" />
        ))}
      </svg>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
    </div>
  );
}
