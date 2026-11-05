/*
 * ARRANGE: one word, five arrangements, turned like a kaleidoscope barrel.
 *
 * Principle (from the source): a mark that stays itself while its layout
 * changes, in quiet symmetry. Collision: a kaleidoscope, where turning the
 * barrel re-sorts the SAME pieces into a new symmetric figure. Here the pieces
 * are the four letters of NOVA (and their reflection, which only shows when the
 * word meets itself in the mirror). Each detent of the dial is an arrangement:
 * line, stack, ring, cross, mirror. Between detents the figure leans with the
 * turn, and the letters' foil (chart tokens mixed into the foreground, as a
 * clipped gradient) catches the light as you rotate. Left alone it turns by
 * itself, slowly, so a phone without hover still sees it breathe.
 */
import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useIdle } from "../hooks";
import type { LabComponentMeta } from "../types";

export const meta: LabComponentMeta = {
  kind: "component",
  id: "2026-11-01-arranjo",
  date: "2026-11-01",
  title: "Arranjo",
  label: "ARRANGE",
  hint: "turn the dial · click to step",
  hintTouch: "gire ou toque",
  formula: "layout = round(θ / 72°) mod 5 · lean = (θ − 72k) · 0.25",
  rules: ["one-metaphor", "mono-labels", "formula", "born-in-best-state", "no-new-deps", "tokens", "reduced-motion", "touch", "only-transform", "mobile-hint", "mobile-idle", "mobile-perf"],
  status: "kept",
  tags: { input: "pointer", family: "typography", intensity: "subtle", response: "spring" },
  rationale: "componente: trilho Behance, segundo do teste (fora do lab:next)",
  source: {
    title: "AYNI Andean Boutique Hotel",
    url: "https://www.behance.net/gallery/248693823/AYNI-Andean-Boutique-Hotel",
    studio: "Katherine Dodds",
    gallery: "graphic-design",
    refs: ["lab/.refs/2026-11-01-ayni/ref-1.jpg", "lab/.refs/2026-11-01-ayni/ref-2.jpg", "lab/.refs/2026-11-01-ayni/ref-3.jpg"],
  },
  inspiration: "Uma marca que continua ela mesma enquanto o arranjo muda: a mesma palavra em linha, anel, pilha, cruz e espelho, em simetria quieta.",
  sketches: [
    "cartão-chave que desliza da capa com peso: arrastar repetiria o input do Fechar posição, e a metáfora é mais fraca",
    "selo de foil prensado em papel texturizado: perto demais do STAMP que já está no lab (anti-repeat)",
  ],
};

const WORD = ["N", "O", "V", "A"];
const NAMES = ["linha", "pilha", "anel", "cruz", "espelho"];
const DETENT = 360 / NAMES.length;
type Spot = { x: number; y: number; r: number; o: number; sy: number };

/** Where letter i sits in layout k (em from the centre). `mirror` = the reflection. */
function spot(k: number, i: number, mirror: boolean): Spot {
  const line = { x: (i - 1.5) * 1.05, y: 0, r: 0, o: 1, sy: 1 };
  if (mirror) {
    if (k === 4) return { x: line.x, y: 0.62, r: 0, o: 0.55, sy: -1 };
    return { ...spot(k, i, false), o: 0, sy: 1 };
  }
  if (k === 1) return { x: (i % 2 - 0.5) * 1.1, y: (Math.floor(i / 2) - 0.5) * 1.15, r: 0, o: 1, sy: 1 };
  if (k === 2) {
    const a = (-90 + i * 90) * (Math.PI / 180);
    return { x: Math.cos(a) * 1.25, y: Math.sin(a) * 1.25, r: i * 90, o: 1, sy: 1 };
  }
  if (k === 3) return [{ x: 0, y: -1.3 }, { x: 1.3, y: 0 }, { x: 0, y: 1.3 }, { x: -1.3, y: 0 }].map((p) => ({ ...p, r: 0, o: 1, sy: 1 }))[i];
  if (k === 4) return { ...line, y: -0.55 };
  return line;
}

const FOIL =
  "linear-gradient(110deg, color-mix(in srgb, var(--chart-3) 45%, var(--casa-bg)) 0%, color-mix(in srgb, var(--chart-3) 75%, var(--casa-fg)) 30%, var(--casa-fg) 45%, color-mix(in srgb, var(--chart-3) 75%, var(--casa-fg)) 60%, color-mix(in srgb, var(--chart-3) 45%, var(--casa-bg)) 100%)";

function Letter({ ch, to, foil }: { ch: string; to: Spot; foil: ReturnType<typeof useTransform<number, string>> }) {
  const reduce = useReducedMotion();
  const cfg = { stiffness: 170, damping: 22 };
  const x = useSpring(to.x, cfg);
  const y = useSpring(to.y, cfg);
  const r = useSpring(to.r, cfg);
  const o = useSpring(to.o, cfg);
  const sy = useSpring(to.sy, cfg);
  React.useEffect(() => {
    const pairs: [typeof x, number][] = [[x, to.x], [y, to.y], [r, to.r], [o, to.o], [sy, to.sy]];
    for (const [mv, v] of pairs) reduce ? mv.jump(v) : mv.set(v);
  }, [to.x, to.y, to.r, to.o, to.sy, reduce, x, y, r, o, sy]);
  const tx = useTransform(x, (v) => `${v}em`);
  const ty = useTransform(y, (v) => `${v}em`);
  return (
    <motion.span
      aria-hidden
      style={{ x: tx, y: ty, rotate: r, opacity: o, scaleY: sy, backgroundImage: FOIL, backgroundSize: "300% 100%", backgroundPositionX: foil }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-clip-text leading-none text-transparent"
    >
      {ch}
    </motion.span>
  );
}

export default function Arranjo() {
  const reduce = useReducedMotion();
  const dial = React.useRef<HTMLDivElement>(null);
  const turn = useMotionValue(0); // degrees, unbounded
  const [k, setK] = React.useState(0);
  const drag = React.useRef<{ a: number; from: number; moved: boolean } | null>(null);
  const smooth = useSpring(turn, { stiffness: 120, damping: 20 });
  const barrel = useTransform(reduce ? turn : smooth, (t) => t);
  const lean = useTransform(barrel, (t) => (t - Math.round(t / DETENT) * DETENT) * 0.25);
  const foil = useTransform(barrel, (t) => `${50 + Math.sin((t * Math.PI) / 180) * 50}%`);

  const goTo = (deg: number) => {
    turn.set(deg);
    setK(((Math.round(deg / DETENT) % 5) + 5) % 5);
  };
  const step = (dir: number) => goTo((Math.round(turn.get() / DETENT) + dir) * DETENT);
  const poke = useIdle(dial, () => step(1), 3400);

  const angle = (e: React.PointerEvent) => {
    const r = dial.current!.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };
  const onDown = (e: React.PointerEvent) => {
    poke();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { a: angle(e), from: turn.get(), moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    poke();
    const d = ((angle(e) - drag.current.a + 540) % 360) - 180;
    if (Math.abs(d) > 4) drag.current.moved = true;
    if (!drag.current.moved) return;
    drag.current.a = angle(e);
    drag.current.from += d;
    goTo(drag.current.from);
  };
  const onUp = () => {
    if (!drag.current) return;
    // A tap steps; a turn settles on the nearest detent, like a click-stop barrel.
    if (!drag.current.moved) step(1);
    else goTo(Math.round(turn.get() / DETENT) * DETENT);
    drag.current = null;
  };
  const onKey = (e: React.KeyboardEvent) => {
    const dir = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    poke();
    step(dir);
  };

  return (
    <div className="relative isolate flex h-full flex-col items-center justify-between gap-3 overflow-hidden rounded-tile bg-casa-tile-2 p-4 [background-image:radial-gradient(60%_50%_at_50%_45%,color-mix(in_srgb,var(--chart-3)_14%,transparent),transparent)]">
      <div
        ref={dial}
        data-lab-target
        role="slider"
        tabIndex={0}
        aria-label="Arranjo da palavra"
        aria-valuemin={1}
        aria-valuemax={NAMES.length}
        aria-valuenow={k + 1}
        aria-valuetext={`${NAMES[k]}, ${k + 1} de ${NAMES.length}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
        className="relative grid aspect-square w-full max-w-64 cursor-grab touch-none select-none place-items-center rounded-control outline-none focus-visible:[box-shadow:var(--focus)] active:cursor-grabbing"
      >
        {/* The barrel: a thin ring with five click-stops, turning with you. */}
        <motion.div aria-hidden style={{ rotate: barrel }} className="absolute inset-[6%] rounded-full border border-casa-line">
          {NAMES.map((n, i) => (
            <span key={n} style={{ transform: `rotate(${i * DETENT}deg)` }} className="absolute inset-0 flex justify-center">
              <span className={`-mt-1 h-2 w-px ${i === 0 ? "bg-casa-fg-2" : "bg-casa-fg-3"}`} />
            </span>
          ))}
        </motion.div>
        <motion.div style={{ rotate: lean }} className="relative size-full font-casa text-[clamp(2rem,9vw,2.75rem)] font-medium tracking-[0.04em]">
          {WORD.map((ch, i) => <Letter key={`l${i}`} ch={ch} to={spot(k, i, false)} foil={foil} />)}
          {WORD.map((ch, i) => <Letter key={`m${i}`} ch={ch} to={spot(k, i, true)} foil={foil} />)}
        </motion.div>
        <span className="sr-only">NOVA</span>
      </div>
      <div className="flex w-full items-center justify-between font-casa-mono text-casa-sm text-casa-fg-3" aria-hidden>
        <span className="text-casa-fg-2">{NAMES[k]}</span>
        <span className="tabular-nums">{k + 1}/{NAMES.length}</span>
      </div>
    </div>
  );
}
