/*
 * SWAY: a hanging mobile in a room you can tilt.
 *
 * Arms balance on threads, each arm hung from the end of the one above. Threads
 * follow gravity, arms answer to it at their own rate: every level is one
 * underdamped spring, softer the lower it hangs, so a single tilt arrives as a
 * ripple down the piece. A hard shadow on the wall slides against the tilt, which
 * is all the depth it needs. On a phone the first tap asks for the gyroscope;
 * drag is the fallback, and left alone a slow draft keeps it moving.
 */
import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { useCoarse, useIdle, useTilt } from "../hooks";
import type { LabMeta } from "../types";

export const meta: LabMeta = {
  id: "2026-11-05-sway",
  date: "2026-11-05",
  title: "Hanging arms",
  label: "SWAY",
  hint: "drag sideways to tilt the room",
  hintTouch: "arraste ou incline o celular",
  formula: "θᵢ = base + tilt · gainᵢ · k 150→60 · c 7→4",
  rules: ["one-input", "one-metaphor", "mono-labels", "formula", "born-in-best-state", "no-new-deps", "tokens", "reduced-motion", "touch", "small", "only-transform", "mobile-hint", "mobile-no-hover", "mobile-idle", "mobile-tilt", "mobile-perf"],
  status: "candidate",
  tags: { input: "tilt", family: "other", intensity: "medium", response: "spring" },
  rationale: "exploração: tilt 1/1, medium 4/6, spring 4/6 · exploração: other nunca testado",
};

const MAX = 24; // degrees of tilt
const ARMS = [
  { left: 88, right: 52, dropL: 52, dropR: 34, base: -5, gain: 0.5, k: 150, c: 7, size: 42 },
  { left: 42, right: 58, dropL: 44, dropR: 26, base: 7, gain: -0.7, k: 100, c: 5, size: 30 },
  { left: 26, right: 30, dropL: 28, dropR: 40, base: -9, gain: 0.9, k: 60, c: 4, size: 18 },
];
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")`;

function Plate({ size, tone }: { size: number; tone: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 32" width={size} height={size * 1.33} className={`absolute top-0 -translate-x-1/2 ${tone}`}>
      <path d="M12 0C20 5 24 13 22 21 20 28 15 32 10 31 4 30 0 24 1 16 2 9 7 3 12 0Z" fill="currentColor" />
    </svg>
  );
}

function Drop({ x, len, rotate, children }: { x: number; len: number; rotate: MotionValue<number>; children: React.ReactNode }) {
  return (
    <motion.div style={{ x, rotate }} className="absolute left-0 top-0 size-0">
      <span className="absolute left-0 top-0 w-px bg-current" style={{ height: len }} />
      <div className="absolute left-0" style={{ top: len }}>{children}</div>
    </motion.div>
  );
}

function Level({ depth, tilt, parent }: { depth: number; tilt: MotionValue<number>; parent: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const a = ARMS[depth];
  const spring = useSpring(tilt, { stiffness: a.k, damping: a.c });
  const t = reduce ? tilt : spring;
  const arm = useTransform(t, (v) => a.base + v * a.gain);
  const thread = useTransform(t, (v) => v * 0.7);
  const local = useTransform([arm, parent], ([w, p]) => (w as number) - (p as number));
  const hang = useTransform([thread, arm], ([s, w]) => (s as number) - (w as number));
  const last = depth === ARMS.length - 1;
  return (
    <motion.div style={{ rotate: local }} className="absolute left-0 top-0 size-0">
      <span className="absolute top-0 h-px bg-current" style={{ left: -a.left, width: a.left + a.right }} />
      <Drop x={-a.left} len={a.dropL} rotate={hang}>
        <Plate size={a.size} tone="text-casa-fg" />
      </Drop>
      <Drop x={a.right} len={a.dropR} rotate={hang}>
        {last ? <Plate size={a.size + 6} tone="text-casa-fg-2" /> : <Level depth={depth + 1} tilt={tilt} parent={thread} />}
      </Drop>
    </motion.div>
  );
}

function Piece({ tilt }: { tilt: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const spring = useSpring(tilt, { stiffness: 180, damping: 9 });
  const top = useTransform(reduce ? tilt : spring, (v) => v * 0.25);
  return (
    <motion.div style={{ rotate: top }} className="absolute left-0 top-0 size-0 text-casa-fg-3">
      <span className="absolute left-0 top-0 h-16 w-px bg-current" />
      <div className="absolute left-0 top-16">
        <Level depth={0} tilt={tilt} parent={top} />
      </div>
    </motion.div>
  );
}

export default function Sway() {
  const box = React.useRef<HTMLDivElement>(null);
  const coarse = useCoarse();
  const tilt = useMotionValue(7); // born mid-swing, already asymmetrical
  const drag = React.useRef<{ x: number; from: number } | null>(null);
  const clamp = (v: number) => Math.max(-MAX, Math.min(MAX, v));
  const shadowX = useTransform(tilt, (v) => 16 - v * 0.7);

  const poke = useIdle(box, () => tilt.set((Math.random() - 0.5) * 18), 2800);
  const gyro = useTilt((g) => {
    if (drag.current) return;
    poke();
    tilt.set(clamp(g * 0.7));
  });
  const release = () => {
    drag.current = null;
    tilt.set(0); // let go: it rings down on its own springs
  };

  return (
    <div
      ref={box}
      role="img"
      aria-label="Um móbile pendurado que balança quando o ambiente inclina"
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
      {/* Mounted left of center: the long arm balances the heavier short side. */}
      <motion.div aria-hidden style={{ x: shadowX, y: 20 }} className="absolute inset-0 opacity-70 mix-blend-multiply [&_svg]:text-casa-fg-3">
        <div className="absolute left-[42%] top-0 scale-[1.03]">
          <Piece tilt={tilt} />
        </div>
      </motion.div>
      <div aria-hidden className="absolute left-[42%] top-0">
        <Piece tilt={tilt} />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
    </div>
  );
}
