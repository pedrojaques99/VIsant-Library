/*
 * GOVERNOR: a flyball governor, the brass regulator on a steam engine. Two heavy
 * balls hang from a spinning shaft; spin it faster and they swing out, lifting a
 * collar along the shaft. Slow it down and they fall back.
 *
 * The pointer sets the engine's target speed (left slow, right fast; a finger
 * drags it). The shaft has a flywheel's lag: ω chases the target on a soft,
 * slightly underdamped spring, so the balls keep rising after you stop and settle
 * with a small overshoot. Arm angle is the real balance, cos φ = ω₀² / ω², so
 * the arms hang until ω passes ω₀ and then fly out fast, then flatten. Left
 * alone, the engine wanders between speeds by itself.
 */
import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useIdle, useInView } from "../hooks";
import type { LabMeta } from "../types";

export const meta: LabMeta = {
  id: "2026-11-09-governor",
  date: "2026-11-09",
  title: "Governor",
  label: "GOVERNOR",
  hint: "move the pointer to spin it up",
  hintTouch: "arraste para acelerar",
  formula: "φ = acos(min(1, ω₀²/ω²)) · ω₀ 1 · ω′ = k(target − ω) · k 38 c 7",
  rules: ["one-input", "one-metaphor", "mono-labels", "formula", "born-in-best-state", "no-new-deps", "tokens", "reduced-motion", "touch", "small", "only-transform", "mobile-hint", "mobile-no-hover", "mobile-idle", "mobile-perf"],
  status: "candidate",
  tags: { input: "pointer", family: "mechanical", intensity: "subtle", response: "inertia" },
  rationale: "aposta: mechanical 5/5, subtle 9/10 · exploração: pointer 3/4, inertia 1/1",
};

const PX = 100; // shaft x in the viewBox
const PY = 28; // pivot y
const L = 52; // arm length
const W0 = 1; // speed below which the arms just hang
const lo = 0.8;
const hi = 2.2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const speedAt = (r: number) => lo + (hi - lo) * clamp(r, 0, 1);

export default function Governor() {
  const box = React.useRef<HTMLDivElement>(null);
  const uid = React.useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const inView = useInView(box);
  const target = useMotionValue(speedAt(0.62)); // born spinning, balls well out
  const sprung = useSpring(target, { stiffness: 38, damping: 7 });
  const w = reduce ? target : sprung;
  const phase = useMotionValue(0);
  const dragging = React.useRef(false);

  const phi = useTransform(w, (v) => Math.acos(Math.min(1, (W0 * W0) / Math.max(v * v, 0.01))));
  const deg = useTransform(phi, (p) => (p * 180) / Math.PI);
  const negDeg = useTransform(deg, (d) => -d);
  const mxR = useTransform(phi, (p) => PX + (L / 2) * Math.sin(p));
  const mxL = useTransform(phi, (p) => PX - (L / 2) * Math.sin(p));
  const midY = useTransform(phi, (p) => PY + (L / 2) * Math.cos(p));
  const collarY = useTransform(phi, (p) => PY + L * Math.cos(p));
  const collarTop = useTransform(collarY, (y) => y - 3);
  const dash = useTransform(phase, (p) => -(p * 9));
  const needle = useTransform(w, (v) => ((v - lo) / (hi - lo)) * 120 - 60);

  // The shaft's hatching turns with ω. One rAF, cancelled, paused off screen.
  React.useEffect(() => {
    if (!inView || reduce) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      phase.set(phase.get() + w.get() * Math.min(now - last, 50) * 0.02);
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, w, phase]);

  const poke = useIdle(box, () => target.set(speedAt(Math.random())), 2800);
  const aim = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    poke();
    target.set(speedAt((e.clientX - r.left) / r.width));
  };

  const arm = (rot: typeof deg, shine: number) => (
    <motion.g style={{ rotate: rot, originX: `${PX}px`, originY: `${PY}px` }}>
      <line x1={PX} y1={PY} x2={PX} y2={PY + L} strokeWidth="1.6" strokeLinecap="round" className="stroke-casa-fg-2" />
      <circle cx={PX} cy={PY + L + 7} r="8" fill={`url(#brass-${uid})`} />
      <circle cx={PX + shine} cy={PY + L + 4.4} r="1.6" className="fill-casa-bg opacity-60" />
    </motion.g>
  );

  return (
    <div
      ref={box}
      role="img"
      aria-label="Um regulador de esferas girando: as bolas sobem quanto mais rápido gira o eixo"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        dragging.current = true;
        aim(e);
      }}
      onPointerMove={(e) => (dragging.current || e.pointerType === "mouse") && aim(e)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
      className="relative h-full w-full cursor-ew-resize touch-none select-none overflow-hidden rounded-control bg-casa-tile-2"
    >
      <svg aria-hidden viewBox="0 0 200 160" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id={`brass-${uid}`} cx="0.34" cy="0.3" r="0.8">
            <stop offset="0" style={{ stopColor: "var(--casa-bg)" }} />
            <stop offset="0.3" style={{ stopColor: "var(--casa-fg-3)" }} />
            <stop offset="0.85" style={{ stopColor: "var(--casa-fg)" }} />
            <stop offset="1" style={{ stopColor: "var(--casa-fg-2)" }} />
          </radialGradient>
        </defs>
        <rect x="70" y="128" width="60" height="8" rx="3" className="fill-casa-tile stroke-casa-line" strokeWidth="1" />
        <motion.line x1={PX} x2={PX} y1={PY - 8} y2="128" strokeWidth="5" strokeDasharray="1.2 3" strokeDashoffset={dash} className="stroke-casa-fg-3" />
        <line x1={PX} x2={PX} y1={PY - 8} y2="128" strokeWidth="1" className="stroke-casa-fg-2" />
        <motion.line x1={mxR} y1={midY} x2={PX} y2={collarY} strokeWidth="1.2" className="stroke-casa-fg-3" />
        <motion.line x1={mxL} y1={midY} x2={PX} y2={collarY} strokeWidth="1.2" className="stroke-casa-fg-3" />
        {arm(deg, -2.4)}
        {arm(negDeg, 2.4)}
        <motion.rect x={PX - 6} y={collarTop} width="12" height="6" rx="2" className="fill-casa-tile stroke-casa-fg-2" strokeWidth="1" />
        <circle cx={PX} cy={PY - 8} r="2.6" className="fill-casa-fg" />
        <g className="stroke-casa-line" strokeWidth="1">
          {[-60, -30, 0, 30, 60].map((t) => (
            <line key={t} x1={PX + t} x2={PX + t} y1="146" y2={t === 0 ? 152 : 149} />
          ))}
        </g>
        <motion.line x1={PX} x2={PX} y1="144" y2="153" strokeWidth="1.6" style={{ x: needle }} className="stroke-casa-fg" />
      </svg>
    </div>
  );
}
