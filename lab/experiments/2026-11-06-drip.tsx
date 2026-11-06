/*
 * DRIP: a drop of something thick hanging under a ledge you can tilt.
 *
 * The ledge is the phone, so tilting it turns gravity under the drop. The bead
 * follows on an underdamped spring and its neck stretches with the lean, so a
 * quick tilt arrives late and wobbles once before it settles, the way honey does.
 * The whole drop is one SVG path rebuilt from one number (the lean), with one
 * glint riding on it. On a phone the first tap asks for the gyroscope; drag is
 * the fallback, and left alone a slow draft keeps it alive.
 */
import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useCoarse, useIdle, useTilt } from "../hooks";
import type { LabMeta } from "../types";

export const meta: LabMeta = {
  id: "2026-11-06-drip",
  date: "2026-11-06",
  title: "Drip",
  label: "DRIP",
  hint: "drag sideways to tilt the ledge",
  hintTouch: "arraste ou incline o celular",
  formula: "φ = spring(θ) · k 90 · c 6 · L = 58 + |φ| · 1.4 · r 15",
  rules: ["one-input", "one-metaphor", "mono-labels", "formula", "born-in-best-state", "no-new-deps", "tokens", "reduced-motion", "touch", "small", "only-transform", "mobile-hint", "mobile-no-hover", "mobile-idle", "mobile-tilt", "mobile-perf"],
  status: "candidate",
  tags: { input: "tilt", family: "fluid", intensity: "medium", response: "spring" },
  rationale: "exploração: tilt 1/1, fluid 1/1, medium 4/6, spring 4/6",
};

const MAX = 30; // degrees of tilt
const AX = 100; // anchor on the ledge, in viewBox units
const AY = 34;
const R = 15; // bead radius
const W = 26; // half width of the film where it leaves the ledge
const rad = (d: number) => (d * Math.PI) / 180;
const len = (lean: number) => 58 + Math.abs(lean) * 1.4;
const f = (n: number) => n.toFixed(2);

/** The drop as one closed path: film on the ledge → neck → bead → back. */
function dropPath(lean: number) {
  const L = len(lean);
  const ux = Math.sin(rad(lean)); // down the neck
  const uy = Math.cos(rad(lean));
  const cx = AX + ux * L;
  const cy = AY + uy * L;
  const neck = R * (0.34 - Math.min(Math.abs(lean), MAX) * 0.004); // thins as it leans
  // a point `along` the neck axis and `across` it, measured from the bead center
  const at = (along: number, across: number) => `${f(cx + ux * along + uy * across)} ${f(cy + uy * along - ux * across)}`;
  return [
    `M ${f(AX - W)} ${AY}`,
    `C ${f(AX - W * 0.25)} ${AY} ${at(-L * 0.55, -neck)} ${at(-R * 0.78, -R * 0.6)}`,
    `A ${R} ${R} 0 1 0 ${at(-R * 0.78, R * 0.6)}`,
    `C ${at(-L * 0.55, neck)} ${f(AX + W * 0.25)} ${AY} ${f(AX + W)} ${AY}`,
    "Z",
  ].join(" ");
}

export default function Drip() {
  const box = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const coarse = useCoarse();
  const tilt = useMotionValue(9); // born leaning, mid-wobble
  const spring = useSpring(tilt, { stiffness: 90, damping: 6 });
  const lean = reduce ? tilt : spring;
  const d = useTransform(lean, dropPath);
  const glintX = useTransform(lean, (v) => AX + Math.sin(rad(v)) * len(v) - 5);
  const glintY = useTransform(lean, (v) => AY + Math.cos(rad(v)) * len(v) - 6);
  const drag = React.useRef<{ x: number; from: number } | null>(null);
  const clamp = (v: number) => Math.max(-MAX, Math.min(MAX, v));

  const poke = useIdle(box, () => tilt.set((Math.random() - 0.5) * 30), 3000);
  const gyro = useTilt((g) => {
    if (drag.current) return;
    poke();
    tilt.set(clamp(-g * 0.8));
  });
  const release = () => {
    drag.current = null;
    tilt.set(0); // let go: it swings back under the ledge and rings down
  };

  return (
    <div
      ref={box}
      role="img"
      aria-label="Uma gota espessa pendurada sob uma borda, que se inclina e balança quando a borda inclina"
      onPointerDown={(e) => {
        if (coarse) gyro.enable();
        poke();
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, from: tilt.get() };
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        poke();
        const half = box.current!.clientWidth / 2;
        tilt.set(clamp(drag.current.from + ((e.clientX - drag.current.x) / half) * MAX));
      }}
      onPointerUp={release}
      onPointerCancel={release}
      className="relative h-full w-full cursor-grab touch-none select-none overflow-hidden rounded-control bg-casa-tile-2 active:cursor-grabbing"
    >
      <svg aria-hidden viewBox="0 0 200 160" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
        <rect x="0" y="0" width="200" height={AY} className="fill-casa-tile" />
        <line x1="0" x2="200" y1={AY} y2={AY} strokeWidth="1" className="stroke-casa-line" />
        <motion.path d={d} className="fill-casa-fg" />
        <motion.ellipse cx={glintX} cy={glintY} rx="3.2" ry="2" className="fill-casa-bg opacity-60" />
      </svg>
    </div>
  );
}
