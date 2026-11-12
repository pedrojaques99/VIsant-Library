/*
 * MERCURY: a mercury tilt switch for an alert setting. Tip the glass capsule and
 * the bead of liquid metal rolls to the other end; when it bridges the contacts
 * the alert is on, and it stays there when the capsule comes back to level.
 */
import * as React from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform, useVelocity } from "motion/react";
import { useTilt } from "../hooks";
import type { LabMeta } from "../types";

export const meta: LabMeta = {
  id: "2026-11-12-mercury",
  date: "2026-11-12",
  title: "Mercury switch",
  label: "MERCURY",
  hint: "drag sideways to tip the switch",
  hintTouch: "incline ou arraste pro lado",
  formula: "θ = clamp(Δx/4 | γ·0.6, ±18°) · on ⇐ θ > 6° · off ⇐ θ < −6° · bead x = ±R + θ·1.2 · k 180 c 12 · squash 1 + |v|/1800",
  rules: [
    "one-input", "one-metaphor", "mono-labels", "formula", "born-in-best-state",
    "tactile-object", "real-ui-purpose", "no-new-deps", "tokens", "reduced-motion",
    "touch", "small", "only-transform", "mobile-hint", "mobile-no-hover", "mobile-tilt", "mobile-perf",
  ],
  status: "candidate",
  tags: { input: "tilt", family: "fluid", intensity: "subtle", response: "spring" },
  rationale: "aposta: tilt 2/2, subtle 9/14, spring 5/8 · exploração: fluid 1/1",
  catalogo: {
    nome: "mercury-switch",
    titulo: "Interruptor de mercúrio",
    descricao: "Interruptor liga/desliga em forma de cápsula de vidro: incline ou arraste e a gota de metal líquido rola até os contatos.",
    tags: ["switch", "toggle", "interruptor", "inclinar", "giroscópio", "configuração"],
    familia: "controles",
    quando: "Uma preferência de liga/desliga com presença, como alertas ou modo silencioso, numa tela de ajustes com espaço.",
    evite: "Listas longas de ajustes, onde um switch comum é mais rápido de ler.",
  },
};

const MAX = 18; // degrees the capsule can tip
const FLIP = 6; // degrees past level that move the bead
const R = 60; // px from the centre to each end of the capsule
const mix = (c: string, p: number) => `color-mix(in srgb, var(${c}) ${p}%, transparent)`;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const BEZEL = `0 0 0 1px ${mix("--casa-bg", 70)}, inset 0 1px 0 ${mix("--casa-fg", 14)}, 0 2px 3px ${mix("--casa-bg", 70)}, 0 18px 30px -14px ${mix("--casa-bg", 95)}`;
const WELL = `inset 0 3px 6px ${mix("--casa-bg", 95)}, inset 0 -1px 0 ${mix("--casa-fg", 10)}`;
const GLASS = `inset 0 1px 0 ${mix("--casa-fg", 35)}, inset 0 -6px 10px ${mix("--casa-bg", 60)}, inset 0 0 0 1px ${mix("--casa-fg", 12)}, 0 6px 10px -4px ${mix("--casa-bg", 90)}`;

export default function Mercury() {
  const reduce = useReducedMotion();
  const raw = useMotionValue(0); // tip, degrees
  const tipSpring = useSpring(raw, { stiffness: 220, damping: 20 });
  const tip = reduce ? raw : tipSpring;
  const [on, setOn] = React.useState(false);
  const onRef = React.useRef(false);
  const start = React.useRef<number | null>(null);

  const rest = useMotionValue(-R); // which end the bead lies at
  const restSpring = useSpring(rest, { stiffness: 180, damping: 12 });
  const end = reduce ? rest : restSpring;
  const beadX = useTransform(() => end.get() + tip.get() * 1.2);
  const v = useVelocity(beadX);
  const sx = useTransform(v, (s) => (reduce ? 1 : 1 + Math.min(Math.abs(s) / 1800, 0.3)));
  const sy = useTransform(sx, (s) => 1 / s);
  const shine = useTransform(beadX, (x) => -x * 0.12); // the window light stays put
  const glow = useTransform(end, [-R, R], [0, 1]);

  const set = (next: boolean) => {
    if (next === onRef.current) return;
    onRef.current = next;
    setOn(next);
    if (reduce) rest.jump(next ? R : -R); else rest.set(next ? R : -R);
    navigator.vibrate?.(next ? [6, 30, 10] : 6);
  };
  useMotionValueEvent(raw, "change", (t) => {
    if (t > FLIP) set(true);
    if (t < -FLIP) set(false);
  });
  const lean = (t: number) => (reduce ? raw.jump(t) : raw.set(t));
  const gyro = useTilt((g) => { if (start.current === null) lean(clamp(g * 0.6, -MAX, MAX)); });
  const release = () => { start.current = null; if (!gyro.on) lean(0); };

  return (
    <div
      role="switch"
      tabIndex={0}
      aria-checked={on}
      aria-label="Alertas sonoros"
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); set(!onRef.current); }
        if (e.key === "ArrowRight") { e.preventDefault(); set(true); }
        if (e.key === "ArrowLeft") { e.preventDefault(); set(false); }
      }}
      onPointerDown={(e) => {
        gyro.enable();
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = e.clientX;
      }}
      onPointerMove={(e) => { if (start.current !== null) lean(clamp((e.clientX - start.current) / 4, -MAX, MAX)); }}
      onPointerUp={release}
      onPointerCancel={release}
      className="relative isolate flex h-full w-full cursor-grab touch-none select-none flex-col items-center justify-center gap-6 overflow-hidden rounded-tile bg-casa-tile outline-none focus-visible:[box-shadow:var(--focus)] active:cursor-grabbing"
    >
      {/* bezel → recessed well → glass capsule → mercury bead */}
      <div aria-hidden style={{ boxShadow: BEZEL }} className="rounded-[30px] p-2 [background:linear-gradient(180deg,var(--casa-tile-2),var(--casa-tile))]">
        <div style={{ boxShadow: WELL }} className="grid h-[86px] w-[214px] place-items-center rounded-[24px] bg-casa-bg">
          <motion.div
            style={{ rotate: tip, boxShadow: GLASS }}
            className="relative h-[48px] w-[188px] rounded-full [background:linear-gradient(180deg,color-mix(in_srgb,var(--casa-fg)_14%,var(--casa-tile)),color-mix(in_srgb,var(--casa-fg)_4%,var(--casa-bg))_80%)]"
          >
            {/* contacts at the right end; they glow when the bead bridges them */}
            {[-7, 7].map((dy) => (
              <span key={dy} style={{ transform: `translateY(${dy}px)` }} className="absolute right-[16px] top-[22px] h-[4px] w-[22px] rounded-full [background:linear-gradient(180deg,var(--casa-fg-2),var(--casa-fg-3))]" />
            ))}
            <motion.span style={{ opacity: glow }} className="absolute inset-y-1 right-1 w-16 rounded-full [background:radial-gradient(closest-side,color-mix(in_srgb,var(--chart-2)_55%,transparent),transparent)]" />
            <motion.div style={{ x: beadX, scaleX: sx, scaleY: sy }} className="absolute left-1/2 top-[7px] -ml-[22px] h-[34px] w-[44px]">
              <div className="absolute inset-0 rounded-[50%] [background:radial-gradient(70%_70%_at_40%_30%,var(--casa-fg)_0%,var(--casa-fg-2)_22%,var(--casa-fg-3)_55%,var(--casa-bg)_100%)] [box-shadow:0_4px_5px_-2px_color-mix(in_srgb,var(--casa-bg)_90%,transparent),inset_0_-3px_4px_color-mix(in_srgb,var(--casa-fg)_25%,transparent)]" />
              <motion.span style={{ x: shine }} className="absolute left-[11px] top-[5px] h-[7px] w-[13px] rounded-[50%] bg-casa-fg opacity-90 blur-[1px]" />
            </motion.div>
            {/* the glass: one long window highlight that never moves */}
            <span className="pointer-events-none absolute inset-x-5 top-[4px] h-[7px] rounded-full [background:linear-gradient(90deg,transparent,color-mix(in_srgb,var(--casa-fg)_35%,transparent)_30%,transparent)]" />
          </motion.div>
        </div>
      </div>

      <div aria-hidden className="flex items-center gap-2.5 font-casa-mono text-[10px] uppercase tracking-[0.14em]">
        <span className={`size-[7px] rounded-full transition-[background-color,box-shadow] duration-300 ${on ? "bg-[var(--chart-2)] [box-shadow:0_0_8px_var(--chart-2)]" : "bg-casa-line"}`} />
        <span className="text-casa-fg-3">alertas</span>
        <span className="text-casa-fg">{on ? "ligados" : "desligados"}</span>
      </div>
    </div>
  );
}
