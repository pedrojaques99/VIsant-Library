/*
 * POSITION: close part of a trading position by dragging, and watch the result
 * roll into place before you commit.
 *
 * Collision: that principle + a ratchet's DETENT (lab tags: drag, snap). Three
 * ideas from the reference, rebuilt from our tokens: the partial-close
 * slider that SNAPS at 25/50/75/100 (a tick you can feel: vibrate where the
 * phone allows, a pulse on the stop everywhere), the result as tabular digits
 * that roll instead of jump, and a holographic sheen across the tile (chart
 * tokens in a conic gradient) that follows the pointer, the thumb, or the tilt
 * of the phone. The live price ticks only while the card is on screen.
 */
import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useCoarse, useIdle, useInView, useTilt } from "../hooks";
import type { LabComponentMeta } from "../types";

export const meta: LabComponentMeta = {
  kind: "component",
  id: "2026-11-01-fechar-posicao",
  date: "2026-11-01",
  title: "Fechar posição",
  label: "POSITION",
  hint: "drag to close part · arrows work too",
  hintTouch: "arraste pra fechar parte",
  formula: "P&L = (bid − entry) · lots · p · snap 25/50/75/100 ±3",
  rules: ["mono-labels", "formula", "born-in-best-state", "no-new-deps", "tokens", "reduced-motion", "touch", "only-transform", "mobile-hint", "mobile-idle", "mobile-tilt", "mobile-perf"],
  status: "candidate",
  tags: { input: "drag", family: "light", intensity: "medium", response: "snap" },
  rationale: "componente: primeiro do trilho Behance (fora do lab:next)",
  source: {
    title: "CFI",
    url: "https://www.behance.net/gallery/239914091/CFI",
    studio: "Fireart Studio",
    gallery: "ui-ux",
    refs: ["lab/.refs/2026-11-01-cfi/ref-1.png", "lab/.refs/2026-11-01-cfi/ref-2.png", "lab/.refs/2026-11-01-cfi/ref-3.png"],
  },
  inspiration: "Confiança pela clareza: você vê a consequência exata (o resultado) antes de se comprometer com ela.",
  sketches: [
    "cards de cotação em vidro orbitando com paralaxe do ponteiro: bonito, mas decorativo, não mostra consequência de nada",
    "blocos iridescentes numerados que mudam de tom com a inclinação: só superfície, pouca profundidade de ofício",
  ],
};

const LOTS = 25;
const ENTRY = 231.4;
const STOPS = [25, 50, 75, 100];
const MAGNET = 3;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", signDisplay: "always" });
const price = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const clamp = (v: number) => Math.max(1, Math.min(100, Math.round(v)));
const snap = (v: number) => STOPS.find((s) => Math.abs(s - v) <= MAGNET) ?? v;
const SPRING = { stiffness: 420, damping: 34 };

/** One digit as a 0–9 column that rolls to its value. */
function Digit({ d }: { d: number }) {
  const reduce = useReducedMotion();
  const v = useSpring(d, { stiffness: 260, damping: 28 });
  React.useEffect(() => (reduce ? v.jump(d) : v.set(d)), [d, reduce, v]);
  const y = useTransform(v, (n) => `${-n}em`);
  return (
    <span className="inline-block h-[1em] overflow-hidden">
      <motion.span style={{ y }} className="flex flex-col">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="h-[1em]">{i}</span>
        ))}
      </motion.span>
    </span>
  );
}

/** Tabular, right-anchored: columns keep their place as the value changes. */
function Rolling({ text }: { text: string }) {
  const chars = [...text].reverse();
  return (
    <span aria-hidden className="inline-flex flex-row-reverse leading-none tabular-nums">
      {chars.map((c, i) => (/\d/.test(c) ? <Digit key={`d${i}`} d={Number(c)} /> : <span key={`c${i}`}>{c}</span>))}
    </span>
  );
}

export default function FecharPosicao() {
  const reduce = useReducedMotion();
  const coarse = useCoarse();
  const tile = React.useRef<HTMLDivElement>(null);
  const track = React.useRef<HTMLDivElement>(null);
  const inView = useInView(tile);
  const [pct, setPct] = React.useState(50);
  const [bid, setBid] = React.useState(236.4);
  const [flash, setFlash] = React.useState<"up" | "down" | null>(null);
  const [done, setDone] = React.useState(false);
  const pv = useSpring(50, SPRING);
  const pulse = useSpring(1, { stiffness: 600, damping: 18 });
  const sheen = useMotionValue(0); // −1..1, where the light sits
  const sx = useSpring(sheen, { stiffness: 80, damping: 20 });
  const sheenX = useTransform(sx, (v) => `${v * 22}%`);
  const fill = useTransform(pv, (v) => v / 100);
  const thumbX = useTransform(pv, (v) => `${v}%`);

  const set = (next: number, dragging = false) => {
    const v = clamp(dragging ? snap(next) : next);
    if (v === pct) return;
    if (STOPS.includes(v)) {
      if (!reduce) {
        pulse.jump(1.7);
        pulse.set(1);
      }
      navigator.vibrate?.(8);
    }
    setPct(v);
    setDone(false);
    if (reduce) pv.jump(v);
    else pv.set(v);
    sheen.set(v / 50 - 1);
  };

  // Idle light drift and the live price: only on screen (useIdle / useInView).
  const poke = useIdle(tile, () => sheen.set(Math.random() * 2 - 1), 3200);
  const gyro = useTilt((g) => sheen.set(Math.max(-1, Math.min(1, g / 30))));
  React.useEffect(() => {
    if (!inView) return;
    const t = window.setInterval(() => {
      const step = Math.round((Math.random() - 0.48) * 30) / 100;
      setBid((b) => Math.round((b + step) * 100) / 100);
      setFlash(step >= 0 ? "up" : "down");
      window.setTimeout(() => setFlash(null), 700);
    }, 2200);
    return () => window.clearInterval(t);
  }, [inView]);

  const fromX = (x: number) => {
    const r = track.current!.getBoundingClientRect();
    return ((x - r.left) / r.width) * 100;
  };
  const onDown = (e: React.PointerEvent) => {
    if (coarse) gyro.enable();
    poke();
    e.currentTarget.setPointerCapture(e.pointerId);
    set(fromX(e.clientX), true);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    poke();
    set(fromX(e.clientX), true);
  };
  const onKey = (e: React.KeyboardEvent) => {
    const nextStop = STOPS.find((s) => s > pct) ?? 100;
    const prevStop = [...STOPS].reverse().find((s) => s < pct) ?? 1;
    const map: Record<string, number> = {
      ArrowRight: pct + 1, ArrowUp: pct + 1, ArrowLeft: pct - 1, ArrowDown: pct - 1,
      PageUp: nextStop, PageDown: prevStop, Home: 1, End: 100,
    };
    if (!(e.key in map)) return;
    e.preventDefault();
    set(map[e.key]);
  };

  const lots = (LOTS * pct) / 100;
  const pnl = (bid - ENTRY) * LOTS * 10 * (pct / 100);
  const result = money.format(pnl);
  const tone = pnl >= 0 ? "text-[var(--chart-2)]" : "text-[var(--destructive)]";
  const btn =
    "alvo-toque grid size-11 place-items-center rounded-control bg-casa-tile font-casa-mono text-casa-lg text-casa-fg-2 active:scale-95 transition-transform [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] focus-visible:[box-shadow:var(--focus)]";

  return (
    <div ref={tile} className="relative isolate flex h-full flex-col gap-4 overflow-hidden rounded-tile bg-casa-tile-2 p-4">
      {/* The sheen: chart tokens in a conic sweep, moved by transform only. */}
      <motion.div
        aria-hidden
        style={{ x: sheenX }}
        className="pointer-events-none absolute -inset-1/2 -z-10 opacity-40 mix-blend-screen [background:conic-gradient(from_200deg_at_50%_50%,transparent_0deg,color-mix(in_srgb,var(--chart-1)_60%,transparent)_70deg,color-mix(in_srgb,var(--chart-4)_45%,transparent)_130deg,color-mix(in_srgb,var(--chart-2)_40%,transparent)_190deg,transparent_260deg)] motion-reduce:opacity-25"
      />
      <div className="flex items-center justify-between gap-3 font-casa-mono text-casa-sm">
        <span className="text-casa-fg-2">ORBT · {LOTS} lotes</span>
        <span
          className={`rounded-control px-2 py-1 tabular-nums text-casa-fg transition-colors [transition-duration:var(--dur-slow)] [transition-timing-function:var(--ease-out)] ${flash === "up" ? "bg-[color-mix(in_srgb,var(--chart-2)_30%,transparent)]" : flash === "down" ? "bg-[color-mix(in_srgb,var(--destructive)_30%,transparent)]" : "bg-casa-tile"}`}
        >
          venda {price.format(bid)}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-casa-mono text-casa-sm text-casa-fg-3">resultado ao fechar</span>
        <span className={`font-casa text-[clamp(2rem,9vw,2.75rem)] font-medium tracking-[-0.02em] ${tone}`}>
          <Rolling text={result} />
          <span className="sr-only">{result}</span>
        </span>
        <span className="font-casa-mono text-casa-sm tabular-nums text-casa-fg-2">
          fecha {price.format(lots)} de {LOTS} lotes
        </span>
      </div>

      <div
        data-lab-target
        role="slider"
        tabIndex={0}
        aria-label="Fechamento parcial"
        aria-valuemin={1}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${pct}%, fecha ${price.format(lots)} lotes, resultado ${result}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onKeyDown={onKey}
        className="relative h-11 cursor-grab touch-none select-none rounded-control outline-none focus-visible:[box-shadow:var(--focus)] active:cursor-grabbing"
      >
        <div ref={track} className="absolute inset-x-3 top-1/2 h-1 -translate-y-1/2 rounded-control bg-casa-tile">
          <motion.div style={{ scaleX: fill }} className="absolute inset-0 origin-left rounded-control bg-casa-fg" />
          {STOPS.map((s) => (
            <motion.span
              key={s}
              style={{ left: `${s}%`, scale: s === pct ? pulse : 1 }}
              className={`absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-control ${s <= pct ? "bg-casa-bg" : "bg-casa-fg-3"}`}
            />
          ))}
          <motion.div style={{ x: thumbX }} className="pointer-events-none absolute inset-0">
            <span className="absolute left-0 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-control bg-casa-fg shadow-[var(--casa-shadow)]" />
          </motion.div>
        </div>
      </div>
      {/* Labels sit under their stops; 100% hangs from the right edge so it never clips. */}
      <div aria-hidden className="relative mx-3 -mt-3 h-5 font-casa-mono text-casa-sm tabular-nums text-casa-fg-3">
        {STOPS.map((s) => (
          <span
            key={s}
            style={{ left: `${s}%` }}
            className={`absolute top-0 ${s === 100 ? "-translate-x-full" : "-translate-x-1/2"} ${s === pct ? "text-casa-fg" : ""}`}
          >
            {s}%
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center gap-2">
        <button type="button" aria-label="Menos 5%" onClick={() => set(pct - 5)} className={btn}>−</button>
        <span className="w-12 text-center font-casa-mono text-casa-base tabular-nums text-casa-fg">{pct}%</span>
        <button type="button" aria-label="Mais 5%" onClick={() => set(pct + 5)} className={btn}>+</button>
        <button
          type="button"
          onClick={() => setDone(true)}
          className="alvo-toque ml-auto h-11 rounded-control bg-casa-cta px-4 font-casa-mono text-casa-sm text-casa-cta-fg active:scale-[0.98] transition-transform [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] focus-visible:[box-shadow:var(--focus)]"
        >
          {done ? "fechado" : `Fechar ${pct}%`}
        </button>
      </div>
      <p aria-live="polite" className="sr-only">{done ? `Posição fechada em ${pct}%, ${result}` : ""}</p>
    </div>
  );
}
