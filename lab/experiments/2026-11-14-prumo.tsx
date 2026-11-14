/*
 * PRUMO: a machined brass plumb bob suspended inside an instrument well to calibrate
 * camera horizon. Tip the casing or drag sideways and the weighted bob swings against
 * gravity with damped spring inertia, settling into the reticle crosshair when level.
 */
import * as React from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useTilt } from "../hooks";
import type { LabMeta } from "../types";

export const meta: LabMeta = {
  id: "2026-11-14-prumo",
  date: "2026-11-14",
  title: "Prumo",
  label: "PRUMO",
  hint: "drag sideways or tilt to align the plumb",
  hintTouch: "incline ou arraste pra alinhar o prumo",
  formula: "θ = clamp(Δx·0.4 | γ·0.8, ±25°) · swing = -θ · k 220 c 16 · lock ⇐ |swing| < 1.5°",
  rules: [
    "one-input", "one-metaphor", "mono-labels", "formula", "born-in-best-state",
    "tactile-object", "real-ui-purpose", "no-new-deps", "tokens", "reduced-motion",
    "touch", "small", "only-transform", "mobile-hint", "mobile-no-hover", "mobile-tilt", "mobile-perf",
  ],
  status: "candidate",
  tags: { input: "tilt", family: "other", intensity: "medium", response: "spring" },
  rationale: "aposta: tilt 2/2, spring 5/8 · exploração: medium 5/8 · exploração: other nunca testado",
  catalogo: {
    nome: "plumb-bob-level",
    titulo: "Prumo de calibração",
    descricao: "Nivelador inercial em forma de prumo usinado: incline ou arraste para alinhar o eixo da câmera ao retículo central.",
    tags: ["prumo", "calibracao", "alinhamento", "nivel", "tilt", "giroscopio", "camera"],
    familia: "controles",
    quando: "Alinhamento de horizonte de câmera, calibração de perspectiva ou nivelamento de viewport 3D.",
    evite: "Controles com passos discretos ou formulários convencionais de texto.",
  },
};

const MAX = 25; // degrees of tilt
const mix = (c: string, p: number) => `color-mix(in srgb, var(${c}) ${p}%, transparent)`;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const BEZEL = `0 0 0 1px ${mix("--casa-bg", 70)}, inset 0 1px 0 ${mix("--casa-fg", 18)}, 0 4px 14px ${mix("--casa-bg", 85)}, 0 16px 28px -12px ${mix("--casa-bg", 95)}`;
const WELL = `inset 0 4px 12px ${mix("--casa-bg", 95)}, inset 0 0 0 1px ${mix("--casa-fg", 10)}`;
const BOB_SHADOW = `0 12px 16px -4px ${mix("--casa-bg", 90)}, 0 2px 4px ${mix("--casa-bg", 80)}`;

export default function Prumo() {
  const reduce = useReducedMotion();
  const rawTilt = useMotionValue(0);
  const tiltSpring = useSpring(rawTilt, { stiffness: 220, damping: 20 });
  const tilt = reduce ? rawTilt : tiltSpring;

  const targetSwing = useTransform(tilt, (t) => -t);
  const rawSwing = useMotionValue(0);
  const swingSpring = useSpring(rawSwing, { stiffness: 200, damping: 15 });
  const swing = reduce ? rawSwing : swingSpring;

  useMotionValueEvent(targetSwing, "change", (s) => (reduce ? rawSwing.jump(s) : rawSwing.set(s)));

  const [aligned, setAligned] = React.useState(true);
  const alignedRef = React.useRef(true);
  const start = React.useRef<number | null>(null);

  useMotionValueEvent(swing, "change", (s) => {
    const isNow = Math.abs(s) < 1.5;
    if (isNow !== alignedRef.current) {
      alignedRef.current = isNow;
      setAligned(isNow);
      if (isNow) navigator.vibrate?.([8, 20, 8]);
    }
  });

  const lean = (deg: number) => {
    const clamped = clamp(deg, -MAX, MAX);
    if (reduce) rawTilt.jump(clamped); else rawTilt.set(clamped);
  };

  const gyro = useTilt((g) => { if (start.current === null) lean(g * 0.8); });
  const release = () => { start.current = null; if (!gyro.on) lean(0); };
  const shadowX = useTransform(swing, (s) => Math.sin((s * Math.PI) / 180) * 18);
  const shadowScale = useTransform(swing, (s) => 1 - Math.abs(s) / 80);

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Calibração de prumo"
      aria-valuemin={-MAX}
      aria-valuemax={MAX}
      aria-valuenow={aligned ? 0 : Math.round(rawTilt.get())}
      aria-valuetext={aligned ? "Nivelado a 0°" : `${Math.round(rawTilt.get())}° de inclinação`}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); lean(0); }
        if (e.key === "ArrowRight") { e.preventDefault(); lean(rawTilt.get() + 5); }
        if (e.key === "ArrowLeft") { e.preventDefault(); lean(rawTilt.get() - 5); }
      }}
      onPointerDown={(e) => { gyro.enable(); e.currentTarget.setPointerCapture(e.pointerId); start.current = e.clientX; }}
      onPointerMove={(e) => { if (start.current !== null) lean((e.clientX - start.current) * 0.4); }}
      onPointerUp={release}
      onPointerCancel={release}
      className="relative isolate flex h-full w-full touch-none select-none flex-col items-center justify-center overflow-hidden rounded-tile bg-casa-tile"
    >
      <div style={{ boxShadow: BEZEL }} className="relative flex size-[180px] items-center justify-center rounded-full [background:linear-gradient(145deg,var(--casa-tile-2),var(--casa-bg))]">
        <div style={{ boxShadow: WELL }} className="relative flex size-[164px] items-center justify-center rounded-full overflow-hidden [background:radial-gradient(110%_110%_at_50%_30%,var(--casa-tile-2)_0%,var(--casa-bg)_80%)]">
          <svg aria-hidden viewBox="-80 -80 160 160" className="absolute inset-0 size-full pointer-events-none">
            <circle cx="0" cy="0" r="70" fill="none" stroke="currentColor" strokeWidth="1" className="text-casa-fg/10" />
            <circle cx="0" cy="0" r="48" fill="none" stroke="currentColor" strokeWidth="0.75" className="text-casa-fg/10" strokeDasharray="2 4" />
            <line x1="-70" y1="0" x2="70" y2="0" stroke="currentColor" strokeWidth="0.75" className="text-casa-fg/15" />
            <line x1="0" y1="-70" x2="0" y2="70" stroke="currentColor" strokeWidth="0.75" className="text-casa-fg/15" />
            <circle cx="0" cy="38" r="7" fill="none" stroke="currentColor" strokeWidth={aligned ? "1.5" : "1"} className={aligned ? "text-casa-fg transition-colors duration-200" : "text-casa-fg/20"} />
          </svg>
          <div className="absolute top-[10px] z-20 flex size-3.5 items-center justify-center rounded-full [background:linear-gradient(135deg,var(--casa-fg-3),var(--casa-bg))] [box-shadow:0_1px_3px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]">
            <span className="size-1 rounded-full bg-casa-fg/40" />
          </div>
          <motion.div style={{ x: shadowX, scaleX: shadowScale }} className="absolute top-[82px] z-0 h-3 w-7 rounded-full bg-casa-bg/80 blur-[3px]" />
          <motion.div style={{ rotate: swing, transformOrigin: "50% 12px" }} className="absolute top-[10px] z-10 flex flex-col items-center pointer-events-none">
            <div className="h-[64px] w-px [background:linear-gradient(180deg,var(--casa-fg-3)_0%,color-mix(in_srgb,var(--casa-fg)_40%,transparent)_100%)]" />
            <div style={{ boxShadow: BOB_SHADOW }} className="relative flex flex-col items-center rounded-b-[12px] rounded-t-[3px] p-[1px] [background:linear-gradient(120deg,var(--casa-fg-3),var(--casa-bg))]">
              <div className="h-1.5 w-4 rounded-t-[2px] [background:repeating-linear-gradient(90deg,var(--casa-fg-3)_0_1px,var(--casa-bg)_1px_2px)] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.2)]" />
              <div className="relative h-8 w-6 overflow-hidden rounded-b-[11px] [background:linear-gradient(105deg,color-mix(in_srgb,var(--chart-3)_75%,var(--casa-fg))_0%,color-mix(in_srgb,var(--chart-3)_85%,var(--casa-bg))_55%,color-mix(in_srgb,var(--chart-3)_50%,var(--casa-bg))_100%)]">
                <div className="absolute inset-y-0 left-1 w-1 bg-casa-fg/30 blur-[0.5px]" />
                <div className="absolute bottom-0 left-1/2 -ml-[1.5px] size-0 border-x-[1.5px] border-t-[5px] border-x-transparent border-t-casa-fg/70" />
              </div>
            </div>
          </motion.div>
          <div className={`absolute bottom-2.5 z-20 rounded-full px-2 py-0.5 font-casa-mono text-[9px] tracking-wider uppercase transition-opacity duration-300 ${aligned ? "bg-casa-fg/10 text-casa-fg opacity-100" : "opacity-0"}`}>
            0° locked
          </div>
        </div>
      </div>
    </div>
  );
}
