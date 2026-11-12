/*
 * TRENA: a size picker for a framed print, run by a steel tape measure. Pull the
 * blade out and it clicks through the standard frame sizes, while the frame on
 * the wall grows above a sofa drawn to scale, so you see how big it really is.
 */
import * as React from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { LabComponentMeta } from "../types";

export const meta: LabComponentMeta = {
  id: "2026-11-12-trena",
  date: "2026-11-12",
  title: "Trena",
  label: "TRENA",
  hint: "pull the tape to size the frame",
  hintTouch: "puxe a fita pra escolher o tamanho",
  formula: "i = clamp(i₀ + Δx/36, 0, 4) · release → round(i), k 300 c 26 · blade = 52 + 34·i px · frame = (w/70, h/100) at 0.83 px/cm",
  rules: [
    "one-input", "one-metaphor", "mono-labels", "formula", "born-in-best-state",
    "tactile-object", "real-ui-purpose", "no-new-deps", "tokens", "reduced-motion",
    "touch", "only-transform", "mobile-hint", "mobile-no-hover", "mobile-perf",
  ],
  status: "candidate",
  tags: { input: "drag", family: "mechanical", intensity: "subtle", response: "spring" },
  rationale: "componente do dia a partir de um site de galeria de arte (behance/ui-ux): a pergunta do comprador é 'qual o tamanho?'. drag porque puxar a fita é o gesto da trena; mechanical (6/8) e spring (5/8) são os que mais passam; solta e assenta no tamanho com mola; metáfora nova, nenhum componente usa medida.",
  kind: "component",
  inspiration: "O site responde a pergunta que todo comprador faz por telefone, 'qual o tamanho?', mostrando cada obra em escala real num ambiente com móveis, em vez de uma foto recortada.",
  sketches: [
    "Lupa de escala que passa sobre a obra mostrando a textura em 1:1: perdeu porque lupa já foi descartada ('mt óbvio') e não escolhe nada, só mostra.",
    "Régua dobrável de carpinteiro que abre em gomos pra medir a parede: perdeu porque abrir gomos em ângulo é lento no celular e a parede não é a decisão, o tamanho do quadro é.",
  ],
  source: {
    title: "Chris Williams Art Gallery",
    url: "https://www.behance.net/gallery/257145321/Chris-Williams-Art-Gallery",
    studio: "Oleg Nikolaev",
    gallery: "ui-ux",
    refs: [
      "lab/.refs/2026-11-12-chris-williams-art-gallery-oleg-nikolaev/ref-1.png",
      "lab/.refs/2026-11-12-chris-williams-art-gallery-oleg-nikolaev/ref-2.png",
      "lab/.refs/2026-11-12-chris-williams-art-gallery-oleg-nikolaev/ref-3.png",
    ],
  },
  catalogo: {
    nome: "tape-size-picker",
    titulo: "Trena de tamanho",
    descricao: "Seletor de tamanho em forma de trena: puxe a fita e a peça muda de tamanho em escala ao lado de uma referência conhecida.",
    tags: ["tamanho", "medida", "trena", "seletor", "quadro", "e-commerce", "escala"],
    familia: "controles",
    quando: "Escolher o tamanho de um produto físico (quadro, pôster, tapete) em que a escala real decide a compra.",
    evite: "Tamanhos de roupa (P/M/G), onde a escala na parede não diz nada.",
  },
};

const SIZES = [[30, 40], [40, 60], [50, 70], [60, 90], [70, 100]] as const;
const LAST = SIZES.length - 1;
const STEP = 36; // px of drag per size
const OUT = (i: number) => 52 + 34 * i; // px of blade outside the case
const BLADE = 220;
const mix = (c: string, p: number) => `color-mix(in srgb, var(${c}) ${p}%, transparent)`;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (i: number, k: 0 | 1) => {
  const lo = Math.floor(clamp(i, 0, LAST));
  const hi = Math.min(lo + 1, LAST);
  return SIZES[lo][k] + (SIZES[hi][k] - SIZES[lo][k]) * (clamp(i, 0, LAST) - lo);
};

const BEZEL = `0 0 0 1px ${mix("--casa-bg", 70)}, inset 0 1px 0 ${mix("--casa-fg", 16)}, 0 2px 3px ${mix("--casa-bg", 70)}, 0 16px 26px -12px ${mix("--casa-bg", 95)}`;
const FRAME = `inset 0 1px 0 ${mix("--casa-fg", 30)}, inset 0 -1px 0 ${mix("--casa-bg", 80)}, 0 2px 2px ${mix("--casa-bg", 50)}, 0 10px 14px -6px ${mix("--casa-bg", 70)}`;
const BLADE_BG = `repeating-linear-gradient(90deg, ${mix("--casa-bg", 75)} 0 1px, transparent 1px 34px) 0 0 / 100% 70% no-repeat, repeating-linear-gradient(90deg, ${mix("--casa-bg", 55)} 0 1px, transparent 1px 3.4px) 0 0 / 100% 35% no-repeat, linear-gradient(180deg, color-mix(in srgb, var(--chart-3) 78%, var(--casa-fg)), color-mix(in srgb, var(--chart-3) 82%, var(--casa-bg)))`;

export default function Trena() {
  const reduce = useReducedMotion();
  const raw = useMotionValue(2); // born at 50 × 70, the size most people buy
  const sprung = useSpring(raw, { stiffness: 300, damping: 26 });
  const i = reduce ? raw : sprung;
  const [step, setStep] = React.useState(2);
  const start = React.useRef<{ x: number; from: number } | null>(null);
  useMotionValueEvent(raw, "change", (v) => {
    const s = clamp(Math.round(v), 0, LAST);
    setStep((prev) => { if (prev !== s) navigator.vibrate?.(5); return s; });
  });

  const bladeX = useTransform(i, (v) => OUT(clamp(v, 0, LAST)) - BLADE);
  const fw = useTransform(i, (v) => lerp(v, 0) / 70);
  const fh = useTransform(i, (v) => lerp(v, 1) / 100);
  const spin = useTransform(i, (v) => v * 90); // the spool turns as the tape pays out

  const go = (n: number) => { const v = clamp(n, 0, LAST); if (reduce) raw.jump(v); else raw.set(v); };
  const release = () => { if (start.current) go(Math.round(raw.get())); start.current = null; };
  const [w, h] = SIZES[step];

  return (
    <div className="relative isolate flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-tile bg-casa-tile">
      {/* the wall: a sofa drawn at 180 cm, the frame above it at the same scale */}
      <div aria-hidden className="relative h-[150px] w-[236px] overflow-hidden rounded-[14px] [background:radial-gradient(120%_90%_at_50%_0%,var(--casa-tile-2),var(--casa-bg))] [box-shadow:inset_0_1px_0_color-mix(in_srgb,var(--casa-fg)_8%,transparent),inset_0_-10px_20px_color-mix(in_srgb,var(--casa-bg)_60%,transparent)]">
        <motion.div style={{ scaleX: fw, scaleY: fh, boxShadow: FRAME }} className="absolute bottom-[50px] left-1/2 -ml-[29px] h-[83px] w-[58px] origin-bottom rounded-[2px] p-[3px] [background:linear-gradient(160deg,var(--casa-fg-3),var(--casa-bg))]">
          <div className="h-full w-full p-[5px] [background:color-mix(in_srgb,var(--casa-fg)_88%,var(--casa-tile))] [box-shadow:inset_0_1px_2px_color-mix(in_srgb,var(--casa-bg)_45%,transparent)]">
            <div className="h-full w-full [background:radial-gradient(18%_14%_at_68%_30%,color-mix(in_srgb,var(--chart-3)_70%,var(--casa-fg)),transparent),linear-gradient(180deg,var(--casa-fg-3)_0%,var(--casa-tile-2)_58%,var(--casa-bg)_60%,var(--casa-tile)_100%)]" />
          </div>
        </motion.div>
        <div className="absolute bottom-[10px] left-1/2 -ml-[75px] h-[38px] w-[150px]">
          <div className="absolute inset-x-[10px] top-0 h-[22px] rounded-t-[8px] [background:linear-gradient(180deg,var(--casa-line),var(--casa-tile-2))] [box-shadow:inset_0_1px_0_color-mix(in_srgb,var(--casa-fg)_12%,transparent)]" />
          <div className="absolute inset-x-0 bottom-[6px] h-[18px] rounded-[6px] [background:linear-gradient(180deg,var(--casa-line),var(--casa-tile))] [box-shadow:0_4px_6px_-2px_color-mix(in_srgb,var(--casa-bg)_90%,transparent)]" />
          <div className="absolute bottom-0 left-[14px] h-[6px] w-[3px] bg-casa-fg-3" />
          <div className="absolute bottom-0 right-[14px] h-[6px] w-[3px] bg-casa-fg-3" />
        </div>
        <div className="absolute inset-x-0 bottom-[10px] h-px bg-casa-line" />
      </div>

      <p aria-hidden className="font-casa-mono text-[11px] uppercase tracking-[0.14em] text-casa-fg-3">
        <span className="text-casa-fg">{w} × {h}</span> cm
      </p>

      {/* the tape: the case in its bezel, the blade paying out, the hook at the end */}
      <div
        role="slider"
        tabIndex={0}
        data-lab-target
        aria-label="Tamanho do quadro"
        aria-valuemin={0}
        aria-valuemax={LAST}
        aria-valuenow={step}
        aria-valuetext={`${w} por ${h} centímetros`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); go(step + 1); }
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); go(step - 1); }
        }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); start.current = { x: e.clientX, from: raw.get() }; }}
        onPointerMove={(e) => { const s = start.current; if (s) go(s.from + (e.clientX - s.x) / STEP); }}
        onPointerUp={release}
        onPointerCancel={release}
        className="relative flex h-[76px] w-[280px] cursor-grab touch-none select-none items-center rounded-[18px] outline-none focus-visible:[box-shadow:var(--focus)] active:cursor-grabbing"
      >
        <div className="absolute left-[70px] top-1/2 h-[24px] w-[206px] -translate-y-1/2 overflow-hidden">
          <motion.div style={{ x: bladeX, background: BLADE_BG }} className="absolute left-0 w-[220px] top-[3px] h-[18px] rounded-r-[2px] [box-shadow:inset_0_1px_0_color-mix(in_srgb,var(--casa-fg)_40%,transparent),0_2px_3px_color-mix(in_srgb,var(--casa-bg)_80%,transparent)]">
            <span className="absolute -right-[3px] -top-[2px] h-[22px] w-[5px] rounded-[1px] [background:linear-gradient(90deg,var(--casa-fg-2),var(--casa-fg-3))] [box-shadow:0_1px_2px_var(--casa-bg)]" />
          </motion.div>
        </div>
        <div style={{ boxShadow: BEZEL }} className="absolute left-0 top-0 grid size-[76px] place-items-center rounded-[22px] [background:linear-gradient(160deg,var(--casa-tile-2),var(--casa-tile))]">
          <div className="grid size-[56px] place-items-center rounded-full bg-casa-bg [box-shadow:inset_0_3px_6px_var(--casa-bg),inset_0_-1px_0_color-mix(in_srgb,var(--casa-fg)_12%,transparent)]">
            <motion.div style={{ rotate: spin }} className="relative grid size-[46px] place-items-center rounded-full [background:conic-gradient(from_200deg,var(--casa-fg-3),var(--casa-fg-2),var(--casa-fg-3),var(--casa-tile-2),var(--casa-fg-3))] [box-shadow:inset_0_1px_0_color-mix(in_srgb,var(--casa-fg)_45%,transparent),0_2px_4px_var(--casa-bg)]">
              <div className="size-[30px] rounded-full [background:radial-gradient(90%_90%_at_40%_30%,var(--casa-tile-2),var(--casa-bg))] [box-shadow:inset_0_2px_3px_var(--casa-bg)]" />
              <span className="absolute size-[6px] rounded-full bg-casa-fg-3 [box-shadow:inset_0_1px_0_var(--casa-fg-2)]" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
