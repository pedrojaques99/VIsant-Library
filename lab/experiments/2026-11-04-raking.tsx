/*
 * RAKE: a lamp held low over blind-embossed paper, where a raised word is only
 * ever visible as the shadow and the highlight the light gives it.
 *
 * The word has the same color as the paper. Behind it, a shadow copy slides away
 * from the lamp and a highlight copy slides toward it, both by transform, so the
 * relief is one normalized lamp position L on a spring. The lower (farther) the
 * lamp, the longer the shadow, like a real raking light. Left alone, the lamp
 * wanders by itself; on a phone the finger carries it as a drag.
 */
import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useIdle } from "../hooks";
import type { LabMeta } from "../types";

export const meta: LabMeta = {
  id: "2026-11-04-raking",
  date: "2026-11-04",
  title: "Raking light",
  label: "RAKE",
  hint: "move the lamp across the paper",
  hintTouch: "arraste pra mover a luz",
  formula: "shadow = −L · 6px · highlight = +L · 2px · k 120 · c 20",
  rules: ["one-input", "one-metaphor", "mono-labels", "formula", "born-in-best-state", "no-new-deps", "tokens", "reduced-motion", "touch", "small", "only-transform", "mobile-hint", "mobile-no-hover", "mobile-idle", "mobile-perf"],
  status: "kept",
  tags: { input: "pointer", family: "light", intensity: "subtle", response: "spring" },
  rationale: "exploração: pointer, light, subtle, spring nunca testados",
};

const SPRING = { stiffness: 120, damping: 20 };
const SHADOW = 6; // px of shadow per unit of L
const LIGHT = 2; // px of highlight per unit of L
const WORD = "relevo";
const TYPE = "col-start-1 row-start-1 font-casa text-[clamp(3rem,11vw,5rem)] font-medium leading-none tracking-[-0.03em]";

export default function Raking() {
  const reduce = useReducedMotion();
  const box = React.useRef<HTMLDivElement>(null);
  // Born raking in from the top left: the relief already reads in a screenshot.
  const tx = useMotionValue(-0.9);
  const ty = useMotionValue(-0.8);
  const sx = useSpring(tx, SPRING);
  const sy = useSpring(ty, SPRING);
  const lx = reduce ? tx : sx;
  const ly = reduce ? ty : sy;

  const farX = useTransform(lx, (v) => -v * SHADOW);
  const farY = useTransform(ly, (v) => -v * SHADOW);
  const nearX = useTransform(lx, (v) => (-v * SHADOW) / 2);
  const nearY = useTransform(ly, (v) => (-v * SHADOW) / 2);
  const hiX = useTransform(lx, (v) => v * LIGHT);
  const hiY = useTransform(ly, (v) => v * LIGHT);
  // The pool of light is 200% of the card, so 25% of itself is half the card.
  const glowX = useTransform(lx, (v) => `${v * 25}%`);
  const glowY = useTransform(ly, (v) => `${v * 25}%`);

  const poke = useIdle(box, () => {
    const a = Math.random() * Math.PI * 2;
    tx.set(Math.cos(a));
    ty.set(Math.sin(a) * 0.8);
  }, 3000);

  const track = (e: React.PointerEvent) => {
    poke();
    const r = box.current!.getBoundingClientRect();
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    tx.set(clamp(((e.clientX - r.left) / r.width) * 2 - 1));
    ty.set(clamp(((e.clientY - r.top) / r.height) * 2 - 1));
  };

  return (
    <div
      ref={box}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        track(e);
      }}
      onPointerMove={track}
      className="relative isolate grid h-full w-full cursor-crosshair touch-none select-none place-items-center overflow-hidden rounded-tile bg-casa-tile"
    >
      <motion.div
        aria-hidden
        style={{ x: glowX, y: glowY }}
        className="pointer-events-none absolute -inset-1/2 -z-10 [background:radial-gradient(closest-side,color-mix(in_srgb,var(--casa-fg)_10%,transparent),transparent)]"
      />
      <div role="img" aria-label={`A palavra ${WORD} em relevo seco`} className="grid">
        <motion.span aria-hidden style={{ x: farX, y: farY }} className={`${TYPE} text-casa-bg opacity-60 blur-[2px]`}>{WORD}</motion.span>
        <motion.span aria-hidden style={{ x: nearX, y: nearY }} className={`${TYPE} text-casa-bg opacity-80 blur-[0.5px]`}>{WORD}</motion.span>
        <motion.span aria-hidden style={{ x: hiX, y: hiY }} className={`${TYPE} text-casa-fg opacity-30`}>{WORD}</motion.span>
        <span aria-hidden className={`${TYPE} relative text-casa-tile`}>{WORD}</span>
      </div>
    </div>
  );
}
