/*
 * DETENT: a steel ball in a tray with five dimples. Tilt the tray and the ball
 * leans against the wall of its dimple; tilt past the lip and it drops into the
 * next one with a click, never resting between two.
 *
 * One number drives it: the tilt θ. The notch n only changes when θ / 12 is more
 * than 0.65 away from it (hysteresis), so the ball holds, then goes. Between
 * clicks it strains up the dimple wall by a few units, which is what makes the
 * snap feel earned. The ball rolls: its mark turns by distance / radius. On a
 * phone the first tap asks for the gyroscope; drag is the fallback, and left
 * alone a slow draft tips it now and then.
 */
import * as React from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useCoarse, useIdle, useTilt } from "../hooks";
import type { LabMeta } from "../types";

export const meta: LabMeta = {
  id: "2026-11-08-detent",
  date: "2026-11-08",
  title: "Detent",
  label: "DETENT",
  hint: "drag sideways to tilt the tray",
  hintTouch: "arraste ou incline o celular",
  formula: "n′ = |θ/12 − n| > 0.65 ? round(θ/12) : n · x = 30n + 4(θ/12 − n) · k 520 c 26",
  rules: ["one-input", "one-metaphor", "mono-labels", "formula", "born-in-best-state", "no-new-deps", "tokens", "reduced-motion", "touch", "small", "only-transform", "mobile-hint", "mobile-no-hover", "mobile-idle", "mobile-tilt", "mobile-perf"],
  status: "candidate",
  tags: { input: "tilt", family: "mechanical", intensity: "subtle", response: "snap" },
  rationale: "aposta: mechanical 4/4, subtle 7/8, snap 5/7 · exploração: tilt 1/1",
};

const MAX = 30; // degrees of tilt
const STEP = 12; // degrees per notch
const PITCH = 30; // viewBox units between dimples
const R = 9; // ball radius
const CY = 80; // tray line
const NOTCHES = [-2, -1, 0, 1, 2];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function Detent() {
  const box = React.useRef<HTMLDivElement>(null);
  const uid = React.useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const coarse = useCoarse();
  const tilt = useMotionValue(7); // born leaning, straining toward the next dimple
  const [n, setN] = React.useState(0);
  const nRef = React.useRef(0);
  const target = useMotionValue(4 * (7 / STEP));
  const sprung = useSpring(target, { stiffness: 520, damping: 26 });
  const x = reduce ? target : sprung;
  const trayTilt = useTransform(tilt, (t) => t * 0.25);
  const roll = useTransform(x, (v) => ((v / R) * 180) / Math.PI);
  const shadowX = useTransform(x, (v) => 100 + v);
  const drag = React.useRef<{ x: number; from: number } | null>(null);

  useMotionValueEvent(tilt, "change", (t) => {
    const s = t / STEP;
    let k = nRef.current;
    if (Math.abs(s - k) > 0.65) k = clamp(Math.round(s), -2, 2);
    if (k !== nRef.current) {
      nRef.current = k;
      setN(k);
    }
    target.set(PITCH * k + 4 * clamp(s - k, -0.65, 0.65));
  });

  const poke = useIdle(box, () => tilt.set((Math.random() - 0.5) * 2 * MAX), 2800);
  const gyro = useTilt((g) => {
    if (drag.current) return;
    poke();
    tilt.set(clamp(g * 0.9, -MAX, MAX));
  });
  const release = () => {
    drag.current = null; // the tray stays where you left it; the ball stays in its dimple
  };

  return (
    <div
      ref={box}
      role="img"
      aria-label={`Uma esfera de aço numa bandeja com cinco cavidades, parada na cavidade ${n + 3} de 5`}
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
        tilt.set(clamp(drag.current.from + ((e.clientX - drag.current.x) / half) * MAX, -MAX, MAX));
      }}
      onPointerUp={release}
      onPointerCancel={release}
      className="relative h-full w-full cursor-grab touch-none select-none overflow-hidden rounded-control bg-casa-tile-2 active:cursor-grabbing"
    >
      <svg aria-hidden viewBox="0 0 200 160" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id={`steel-${uid}`} cx="0.36" cy="0.32" r="0.75">
            <stop offset="0" style={{ stopColor: "var(--casa-bg)" }} />
            <stop offset="0.35" style={{ stopColor: "var(--casa-fg-3)" }} />
            <stop offset="0.8" style={{ stopColor: "var(--casa-fg)" }} />
            <stop offset="1" style={{ stopColor: "var(--casa-fg-2)" }} />
          </radialGradient>
        </defs>
        <motion.g style={{ rotate: trayTilt, originX: "100px", originY: `${CY}px` }}>
          <rect x="18" y={CY - 2} width="164" height="16" rx="8" className="fill-casa-tile stroke-casa-line" strokeWidth="1" />
          {NOTCHES.map((k) => (
            <g key={k}>
              <ellipse cx={100 + k * PITCH} cy={CY + 4} rx="8" ry="3" className="fill-casa-line" />
              <line
                x1={100 + k * PITCH}
                x2={100 + k * PITCH}
                y1={CY + 22}
                y2={CY + (k === n ? 30 : 26)}
                strokeWidth="1"
                className={k === n ? "stroke-casa-fg" : "stroke-casa-fg-3"}
              />
            </g>
          ))}
          <motion.ellipse cx={shadowX} cy={CY + 5} rx="8" ry="2" className="fill-casa-fg opacity-25" />
          <motion.g style={{ x, originX: "100px", originY: `${CY - R + 3}px` }}>
            <circle cx="100" cy={CY - R + 3} r={R} fill={`url(#steel-${uid})`} />
            <motion.path
              d={`M 100 ${CY - R * 2 + 5} A ${R - 2} ${R - 2} 0 0 1 ${100 + R - 2} ${CY - R + 3}`}
              style={{ rotate: roll, originX: "100px", originY: `${CY - R + 3}px` }}
              strokeWidth="0.8"
              fill="none"
              className="stroke-casa-bg opacity-40"
            />
          </motion.g>
        </motion.g>
      </svg>
    </div>
  );
}
