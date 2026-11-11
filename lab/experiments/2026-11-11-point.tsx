/*
 * POINT: a metal type sort riding in a recessed brass channel. Slide it along
 * the channel and the engraved "Aa" grows or shrinks to the next point size,
 * the same object a printer swapped to change the size of the text.
 */
import * as React from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform, useVelocity } from "motion/react";
import type { LabMeta } from "../types";

export const meta: LabMeta = {
  id: "2026-11-11-point",
  date: "2026-11-11",
  title: "Point",
  label: "POINT",
  hint: "drag sideways to set the text size",
  hintTouch: "arraste pro lado pra mudar o tamanho do texto",
  formula: "i = clamp(i₀ + Δx/30, 0, 5) · pt = [12 14 16 18 20 24][round i] · tilt ∝ di/dt · k 260 c 18",
  rules: [
    "one-input", "one-metaphor", "mono-labels", "formula", "born-in-best-state",
    "tactile-object", "real-ui-purpose", "no-new-deps", "tokens", "reduced-motion",
    "touch", "small", "only-transform", "mobile-hint", "mobile-no-hover", "mobile-perf",
  ],
  status: "candidate",
  tags: { input: "drag", family: "typography", intensity: "subtle", response: "spring" },
  rationale: "aposta: subtle 9/13, spring 5/7 · exploração: drag 5/7, typography 2/3",
};

const SIZES = [12, 14, 16, 18, 20, 24];
const LAST = SIZES.length - 1;
const STEP = 30; // px of drag per point size
const SLOT = 22; // px between notches in the channel
const mix = (c: string, p: number) => `color-mix(in srgb, var(${c}) ${p}%, transparent)`;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ptAt = (i: number) => {
  const v = clamp(i, 0, LAST);
  const lo = Math.floor(v);
  const hi = Math.min(lo + 1, LAST);
  return SIZES[lo] + (SIZES[hi] - SIZES[lo]) * (v - lo);
};

// Layered like a keycap: rim light, chamfer, a contact shadow and a soft long one.
const WELL = `inset 0 2px 4px ${mix("--casa-bg", 90)}, inset 0 -1px 0 ${mix("--casa-fg", 10)}, 0 1px 0 ${mix("--casa-fg", 8)}`;
const BEZEL = `0 0 0 1px ${mix("--casa-bg", 70)}, inset 0 1px 0 ${mix("--casa-fg", 14)}, 0 14px 28px -14px ${mix("--casa-bg", 90)}`;
const CAP = `inset 0 1px 0 ${mix("--casa-fg", 55)}, inset 0 -3px 0 ${mix("--casa-bg", 45)}, 0 1px 0 ${mix("--casa-bg", 80)}, 0 4px 6px -1px ${mix("--casa-bg", 70)}, 0 12px 18px -6px ${mix("--casa-bg", 80)}`;

export default function Point() {
  const reduce = useReducedMotion();
  const raw = useMotionValue(2); // born at 16 pt, the default body size
  const sprung = useSpring(raw, { stiffness: 260, damping: 18 });
  const i = reduce ? raw : sprung;
  const [step, setStep] = React.useState(2);
  const start = React.useRef<{ x: number; from: number } | null>(null);
  useMotionValueEvent(raw, "change", (v) => setStep(clamp(Math.round(v), 0, LAST)));

  const velocity = useVelocity(i);
  const tilt = useTransform(velocity, (v) => clamp(v * -2.5, -12, 12));
  const capX = useTransform(i, (v) => (v - LAST / 2) * SLOT);
  const glyph = useTransform(i, (v) => 0.55 + (ptAt(v) - 12) / 26);
  const sample = useTransform(i, (v) => ptAt(v) / 16);
  const shineX = useTransform(i, (v) => (v / LAST - 0.5) * 36);

  const go = (next: number) => {
    const v = clamp(next, 0, LAST);
    if (reduce) raw.jump(v); else raw.set(v);
  };
  const settle = () => { go(Math.round(raw.get())); navigator.vibrate?.(6); };
  const release = () => { if (start.current) settle(); start.current = null; };

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Tamanho do texto"
      aria-valuemin={SIZES[0]}
      aria-valuemax={SIZES[LAST]}
      aria-valuenow={SIZES[step]}
      aria-valuetext={`${SIZES[step]} pontos`}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); go(step + 1); }
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); go(step - 1); }
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = { x: e.clientX, from: raw.get() };
      }}
      onPointerMove={(e) => { const s = start.current; if (s) go(s.from + (e.clientX - s.x) / STEP); }}
      onPointerUp={release}
      onPointerCancel={release}
      className="relative isolate flex h-full w-full cursor-grab touch-none select-none flex-col items-center justify-center gap-6 overflow-hidden rounded-tile bg-casa-tile outline-none [perspective:700px] focus-visible:[box-shadow:var(--focus)] active:cursor-grabbing"
    >
      {/* bezel → recessed channel → the sort */}
      <div aria-hidden style={{ boxShadow: BEZEL }} className="rounded-[22px] bg-casa-tile-2 p-[7px] [background-image:linear-gradient(180deg,var(--casa-tile-2),var(--casa-tile))]">
        <div style={{ boxShadow: WELL }} className="relative flex h-[84px] w-[190px] items-center justify-center rounded-[16px] bg-casa-bg">
          {SIZES.map((s, k) => (
            <span
              key={s}
              style={{ transform: `translateX(${(k - LAST / 2) * SLOT}px)` }}
              className={`absolute bottom-[7px] h-[5px] w-[2px] rounded-full transition-colors duration-200 ${k === step ? "bg-casa-fg-2" : "bg-casa-line"}`}
            />
          ))}
          <motion.div
            style={{ x: capX, rotateY: tilt, boxShadow: CAP }}
            className="relative grid size-[62px] place-items-center overflow-hidden rounded-[13px] [background:linear-gradient(170deg,var(--casa-fg-2),var(--casa-fg-3)_70%)]"
          >
            <div className="absolute inset-[5px] rounded-[9px] [background:radial-gradient(120%_90%_at_50%_15%,color-mix(in_srgb,var(--casa-fg)_30%,transparent),transparent_70%)] [box-shadow:inset_0_1px_1px_color-mix(in_srgb,var(--casa-bg)_25%,transparent)]" />
            <motion.div style={{ x: shineX }} className="absolute -inset-4 opacity-40 mix-blend-overlay [background:linear-gradient(105deg,transparent_40%,var(--casa-fg)_50%,transparent_60%)]" />
            <motion.span
              style={{ scale: glyph }}
              className="relative text-[30px] font-medium leading-none tracking-tight text-casa-tile [text-shadow:0_1px_0_color-mix(in_srgb,var(--casa-fg)_50%,transparent),0_-1px_0_color-mix(in_srgb,var(--casa-bg)_60%,transparent)]"
            >
              Aa
            </motion.span>
          </motion.div>
        </div>
      </div>

      <div aria-hidden className="flex flex-col items-center gap-2.5">
        <motion.p style={{ scale: sample }} className="text-[13px] leading-snug text-casa-fg">
          a leitura cabe no seu olho
        </motion.p>
        <span className="font-casa-mono text-[10px] uppercase tracking-[0.14em] text-casa-fg-3">{SIZES[step]} pt</span>
      </div>
    </div>
  );
}
