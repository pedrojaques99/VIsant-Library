/*
 * HERBARIUM: a scrolling tray of pressed specimens. Anything outside the reading
 * band is only grain; what you stop on resolves into a drawing, and one tap pins
 * it to your collection.
 *
 * Principle (from the source): curiosity becomes a record the moment you frame
 * something. Collision: a herbarium sheet, where looking closely and keeping are
 * the same gesture. Each specimen is one superformula, drawn twice from the same
 * math: as text (a character per cell, denser toward the center) and as a line
 * drawing. Scroll distance to the band cross-fades the two, 1:1, with native
 * snapping. Saving flies the drawing into its tray slot; tapping a slot goes back.
 * Under reduced motion the slot simply fills and the jump is instant.
 */
import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import type { LabComponentMeta } from "../types";

export const meta: LabComponentMeta = {
  kind: "component",
  id: "2026-11-01-herbario",
  date: "2026-11-01",
  title: "Herbário",
  label: "HERBARIUM",
  hint: "scroll to focus · save what you like",
  hintTouch: "deslize · toque pra guardar",
  formula: "r(θ) = superfórmula(m, n₁₂₃) · nítido = 1 − 1.6·Δy / H",
  rules: ["one-metaphor", "mono-labels", "formula", "born-in-best-state", "no-new-deps", "tokens", "reduced-motion", "touch", "mobile-hint", "mobile-scroll", "mobile-perf", "only-transform"],
  status: "candidate",
  tags: { input: "scroll", family: "typography", intensity: "medium", response: "snap" },
  rationale: "componente: primeiro de scroll no quadro, metáfora nova (C5), fora do lab:next",
  source: {
    title: "Wildtrace | Discover Insects - Map Their World",
    url: "https://www.behance.net/gallery/255666935/Wildtrace-Discover-Insects-Map-Their-World",
    studio: "Tú Ngọc, Lam Doan +1",
    gallery: "ui-ux",
    refs: ["lab/.refs/2026-11-01-wildtrace-discover-insects-map-their-wor/ref-1.png", "lab/.refs/2026-11-01-wildtrace-discover-insects-map-their-wor/ref-2.png", "lab/.refs/2026-11-01-wildtrace-discover-insects-map-their-wor/ref-3.png"],
  },
  inspiration: "Um momento de curiosidade vira registro quando você enquadra o que estava olhando, e olhar de perto já é começar uma coleção.",
  sketches: [
    "obturador com anel de foco arrastável sobre um alvo: perto demais da tela da fonte e repete o arrasto do Fechar posição",
    "mapa de pinos revelado ao inclinar o celular: morto no desktop, e pede dados reais pra não parecer enfeite",
  ],
};

type Spec = { name: string; m: number; n1: number; n2: number; n3: number };
const SPECIES: Spec[] = [
  { name: "Folha", m: 2, n1: 0.55, n2: 1.1, n3: 1.5 },
  { name: "Flor", m: 5, n1: 0.7, n2: 1.2, n3: 1.2 },
  { name: "Concha", m: 3, n1: 0.32, n2: 0.9, n3: 1.7 },
  { name: "Estrela", m: 7, n1: 0.42, n2: 0.9, n3: 0.9 },
  { name: "Coral", m: 11, n1: 1.1, n2: 1.4, n3: 2.4 },
  { name: "Semente", m: 4, n1: 1.6, n2: 2.2, n3: 1.2 },
];

const H = 120; // one row
const WINDOW = 248; // the scroller: one row plus a peek above and below
const BOX = 104; // a specimen drawing
const COLS = 24;
const ROWS = 13;
const RAMP = "@%*+=-:";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const radius = ({ m, n1, n2, n3 }: Spec, t: number) =>
  (Math.abs(Math.cos((m * t) / 4)) ** n2 + Math.abs(Math.sin((m * t) / 4)) ** n3) ** (-1 / n1);

/** One specimen, drawn twice from the same math. Computed once, at module load. */
const PLATES = SPECIES.map((s) => {
  const N = 240;
  const samples = Array.from({ length: N }, (_, i) => radius(s, (i / N) * Math.PI * 2));
  const max = Math.max(...samples);
  const at = (t: number) => radius(s, t) / max;
  const d = samples.map((r, i) => {
    const t = (i / N) * Math.PI * 2;
    return `${i ? "L" : "M"}${(50 + (48 * r * Math.cos(t)) / max).toFixed(1)} ${(50 + (48 * r * Math.sin(t)) / max).toFixed(1)}`;
  }).join("") + "Z";
  const grain = Array.from({ length: ROWS }, (_, y) =>
    Array.from({ length: COLS }, (_, x) => {
      const px = ((x + 0.5) / COLS) * 2 - 1;
      const py = ((y + 0.5) / ROWS) * 2 - 1;
      const edge = at(Math.atan2(py, px));
      const depth = Math.hypot(px, py) / edge;
      if (depth > 1) return (x + y) % 3 === 0 ? "·" : " ";
      return RAMP[Math.min(RAMP.length - 1, Math.floor(depth * RAMP.length))];
    }).join(""),
  ).join("\n");
  return { d, grain };
});

function Drawing({ i, className, inked }: { i: number; className?: string; inked?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={className}>
      <path d={PLATES[i].d} strokeWidth="1.25" className={`stroke-casa-fg ${inked ? "fill-[color-mix(in_srgb,var(--chart-2)_34%,transparent)]" : "fill-none"}`} />
      {/* Growth lines: the same outline, smaller, like the rings of a pressed plant. */}
      {[0.72, 0.46, 0.2].map((k) => (
        <path key={k} d={PLATES[i].d} transform={`translate(50 50) scale(${k}) translate(-50 -50)`} strokeWidth={0.7 / k} className="fill-none stroke-casa-fg opacity-30" />
      ))}
    </svg>
  );
}

function Row({ i, y, kept }: { i: number; y: MotionValue<number>; kept: boolean }) {
  const off = useTransform(y, (v) => Math.abs(v - i * H) / H);
  const sharp = useTransform(off, (f) => clamp(1 - f * 1.6, 0, 1));
  const grain = useTransform(off, (f) => clamp(f * 1.6, 0.16, 0.95)); // the text never quite leaves
  const scale = useTransform(off, (f) => 1 - clamp(f, 0, 1) * 0.06);
  const s = SPECIES[i];
  return (
    <div className="flex shrink-0 snap-center items-center gap-4" style={{ height: H }}>
      <motion.div className="relative shrink-0" style={{ width: BOX, height: BOX, scale }}>
        <motion.pre aria-hidden style={{ opacity: grain }} className="absolute inset-0 grid place-items-center font-casa-mono text-[7px] leading-[8px] text-casa-fg">
          {PLATES[i].grain}
        </motion.pre>
        <motion.div style={{ opacity: sharp }} className="absolute inset-0">
          <Drawing i={i} className="size-full" inked={kept} />
        </motion.div>
      </motion.div>
      <motion.div style={{ opacity: sharp }} className="flex min-w-0 flex-col gap-1">
        <span className="text-casa-base text-casa-fg">{s.name}</span>
        <span className="font-casa-mono text-casa-sm tabular-nums text-casa-fg-3">
          n.º {String(i + 1).padStart(2, "0")} · m {s.m}
        </span>
      </motion.div>
    </div>
  );
}

export default function Herbario() {
  const reduce = useReducedMotion();
  const [framed, setFramed] = React.useState(2);
  const [kept, setKept] = React.useState<boolean[]>([true, false, false, true, false, false]);
  const [fly, setFly] = React.useState<{ i: number; x0: number; y0: number; x1: number; y1: number } | null>(null);
  const y = useMotionValue(2 * H); // born on a specimen, with grain on both sides
  const root = React.useRef<HTMLDivElement>(null);
  const scroller = React.useRef<HTMLDivElement>(null);
  const slots = React.useRef<(HTMLButtonElement | null)[]>([]);

  React.useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 2 * H;
  }, []);

  const set = (i: number, v: boolean) => setKept((k) => k.map((o, j) => (j === i ? v : o)));
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    y.set(top);
    setFramed(clamp(Math.round(top / H), 0, SPECIES.length - 1));
  };
  const goTo = (i: number) => scroller.current?.scrollTo({ top: i * H, behavior: reduce ? "auto" : "smooth" });

  const onSave = () => {
    navigator.vibrate?.(8);
    if (kept[framed]) return set(framed, false);
    const slot = slots.current[framed]?.getBoundingClientRect();
    const from = scroller.current?.getBoundingClientRect();
    const box = root.current?.getBoundingClientRect();
    if (reduce || !slot || !from || !box) return set(framed, true);
    setFly({
      i: framed,
      x0: from.left - box.left,
      y0: from.top - box.top + (WINDOW - BOX) / 2,
      x1: slot.left - box.left + (slot.width - 32) / 2,
      y1: slot.top - box.top + (slot.height - 32) / 2,
    });
  };

  const count = kept.filter(Boolean).length;
  const current = SPECIES[framed];
  return (
    <div ref={root} className="relative flex flex-col gap-3 rounded-tile bg-casa-tile-2 p-4">
      <div className="flex items-center justify-between font-casa-mono text-casa-sm text-casa-fg-2">
        <span>coleção</span>
        <span className="tabular-nums text-casa-fg">{count} de {SPECIES.length}</span>
      </div>

      <div className="relative" style={{ height: WINDOW }}>
        <div
          ref={scroller}
          data-lab-target
          tabIndex={0}
          role="group"
          aria-label="Espécimes. Role para focar um"
          onScroll={onScroll}
          className="h-full snap-y snap-mandatory touch-pan-y overflow-y-scroll rounded-control outline-none [scrollbar-width:none] focus-visible:[box-shadow:var(--focus)] [&::-webkit-scrollbar]:hidden"
        >
          <div style={{ paddingBlock: (WINDOW - H) / 2 }}>
            {SPECIES.map((s, i) => (
              <Row key={s.name} i={i} y={y} kept={kept[i]} />
            ))}
          </div>
        </div>
        {/* The reading band: two hairlines, and the neighbors fade out under them. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-casa-tile-2 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-casa-tile-2 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 border-y border-casa-line" style={{ top: (WINDOW - H) / 2, height: H }} />
      </div>

      <p aria-live="polite" className="sr-only">
        {current.name}, {kept[framed] ? "guardada" : "não guardada"}. {count} de {SPECIES.length} na coleção.
      </p>

      <motion.button
        type="button"
        whileTap={reduce ? undefined : { scale: 0.98 }}
        aria-pressed={kept[framed]}
        onClick={onSave}
        className={`alvo-toque h-11 rounded-control font-casa-mono text-casa-sm outline-none focus-visible:[box-shadow:var(--focus)] ${kept[framed] ? "bg-casa-tile text-casa-fg-2" : "bg-casa-cta text-casa-cta-fg"}`}
      >
        {kept[framed] ? `${current.name.toLowerCase()} guardada · tirar` : `guardar ${current.name.toLowerCase()}`}
      </motion.button>

      <div className="grid grid-cols-6 gap-1">
        {SPECIES.map((s, i) => (
          <button
            key={s.name}
            ref={(el) => {
              slots.current[i] = el;
            }}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Ir para ${s.name}, ${kept[i] ? "guardada" : "vazia"}`}
            aria-current={i === framed}
            className={`alvo-toque grid h-11 place-items-center rounded-control outline-none focus-visible:[box-shadow:var(--focus)] ${i === framed ? "bg-casa-tile" : ""}`}
          >
            {kept[i] ? <Drawing i={i} className="size-8" inked /> : <span className="size-1 rounded-full bg-casa-fg-3" />}
          </button>
        ))}
      </div>

      {fly ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-10"
          style={{ width: BOX, height: BOX, transformOrigin: "0 0" }}
          initial={{ x: fly.x0, y: fly.y0, scale: 1 }}
          animate={{ x: fly.x1, y: fly.y1, scale: 32 / BOX }}
          transition={{ type: "spring", stiffness: 420, damping: 38 }}
          onAnimationComplete={() => {
            set(fly.i, true);
            setFly(null);
          }}
        >
          <Drawing i={fly.i} className="size-full" inked />
        </motion.div>
      ) : null}
    </div>
  );
}
