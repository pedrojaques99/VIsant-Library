/*
 * PROFILE: read a route off the shape of its terrain, with a clinometer that
 * hangs from the cursor and swings to the grade under it.
 *
 * Collision: the terrain as interface + a clinometer, the hanging needle that
 * surveyors read slope from. Scrub the profile and the needle swings by gravity
 * (an underdamped spring), so steepness is felt before it is read; next to it
 * sit the numbers people actually plan with: altitude, grade, and how much climb
 * is still ahead. On a phone the first tap asks for the gyroscope, and tilting
 * rolls the cursor along the route with inertia; drag and keys are always there.
 */
import * as React from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useCoarse, useIdle, useInView, useTilt } from "../hooks";
import type { LabComponentMeta } from "../types";

export const meta: LabComponentMeta = {
  kind: "component",
  id: "2026-11-04-perfil-rota",
  date: "2026-11-04",
  title: "Perfil de rota",
  label: "PROFILE",
  hint: "drag along the route · arrows work too",
  hintTouch: "arraste ou incline o celular",
  formula: "θ = atan(Δalt/Δkm) · 4 · a = γ/30 · v·0.94 · k 120 · c 9",
  rules: ["one-metaphor", "mono-labels", "formula", "born-in-best-state", "no-new-deps", "tokens", "reduced-motion", "touch", "only-transform", "mobile-hint", "mobile-idle", "mobile-tilt", "mobile-perf"],
  status: "kept",
  tags: { input: "tilt", family: "mechanical", intensity: "medium", response: "inertia" },
  rationale: "componente: trilho Behance (fora do lab:next), único do quadro com inclinação como entrada",
  source: {
    title: "TheTrail App – Travel Dashboard & UX UI Design",
    url: "https://www.behance.net/gallery/236308597/TheTrail-App-Travel-Dashboard-UX-UI-Design",
    studio: "Rondesignlab",
    gallery: "ui-ux",
    refs: ["lab/.refs/2026-11-04-thetrail-app-travel-dashboard-ux-ui-desi/ref-1.png", "lab/.refs/2026-11-04-thetrail-app-travel-dashboard-ux-ui-desi/ref-2.png", "lab/.refs/2026-11-04-thetrail-app-travel-dashboard-ux-ui-desi/ref-3.png"],
  },
  inspiration: "O relevo é a própria interface: distância, subida e esforço se leem na forma do terreno, não em colunas de números.",
  sketches: [
    "cartão de trilha com uma montanha que gira em 3D com a inclinação: lindo, mas decorativo, e o 3D pesa no celular",
    "filtro de desnível com histograma em forma de cordilheira e dois cursores: útil, mas repete o arrasto com paradas do Fechar posição",
  ],
};

// Example route: a smooth, deterministic terrain, 18 km sampled every 150 m.
const N = 120;
const KM = 18;
const LOW = 620;
const SPAN = 1040;
const ALT = Array.from({ length: N + 1 }, (_, i) => {
  const t = i / N;
  return LOW + SPAN * (0.72 * Math.sin(Math.PI * t) ** 1.4 + 0.16 * (1 + Math.sin(t * 13)) / 2 + 0.1 * (1 + Math.sin(t * 29 + 1)) / 2);
});
const TOP = Math.max(...ALT);
const BOTTOM = Math.min(...ALT);
const yAt = (alt: number) => 0.1 + (0.8 * (TOP - alt)) / (TOP - BOTTOM);
const gradeAt = (i: number) => {
  const a = Math.max(0, i - 1);
  const b = Math.min(N, i + 1);
  return (ALT[b] - ALT[a]) / (((b - a) * KM) / N) / 10; // m per km → %
};
const AHEAD = ALT.map((_, i) => ALT.slice(i).reduce((sum, v, j, rest) => sum + (j ? Math.max(0, v - rest[j - 1]) : 0), 0));
const LINE = ALT.map((a, i) => `${i ? "L" : "M"}${((i / N) * 320).toFixed(1)} ${(yAt(a) * 120).toFixed(1)}`).join(" ");
const summit = ALT.indexOf(TOP);
const STOPS = [
  { name: "Portão", i: 0 },
  { name: "Mirante", i: Math.round(summit / 2) },
  { name: "Cume", i: summit },
  { name: "Refúgio", i: N },
];
const DIAL = [-20, -10, 0, 10, 20];
const angle = (g: number) => Math.max(-62, Math.min(62, (Math.atan(g / 100) * 180 * 4) / Math.PI));
const int = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const dec = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export default function PerfilRota() {
  const reduce = useReducedMotion();
  const coarse = useCoarse();
  const tile = React.useRef<HTMLDivElement>(null);
  const inView = useInView(tile);
  const start = 0.2; // born on the climb, needle already leaning
  const raw = useMotionValue(start);
  const eased = useSpring(raw, { stiffness: 260, damping: 32 });
  const p = reduce ? raw : eased;
  const [i, setI] = React.useState(Math.round(start * N));
  const needle = useSpring(angle(gradeAt(Math.round(start * N))), { stiffness: 120, damping: 9 });
  const touched = React.useRef(false);
  const dragging = React.useRef(false);
  const gamma = React.useRef(0);

  const x = useTransform(p, (v) => `${v * 100}%`);
  const y = useTransform(p, (v) => `${yAt(ALT[Math.round(clamp01(v) * N)]) * 100}%`);
  const rest = useTransform(p, (v) => 1 - v);

  useMotionValueEvent(p, "change", (v) => setI(Math.round(clamp01(v) * N)));
  React.useEffect(() => {
    const a = angle(gradeAt(i));
    if (reduce) needle.jump(a);
    else needle.set(a);
  }, [i, reduce, needle]);

  // Tilt: the phone's roll accelerates the cursor, friction bleeds it off.
  const gyro = useTilt((g) => (gamma.current = g));
  React.useEffect(() => {
    if (!gyro.on || !inView) return;
    let raf = 0;
    let v = 0;
    const loop = () => {
      const g = Math.abs(gamma.current) < 6 ? 0 : gamma.current;
      v = (v + (g / 30) * 0.0004) * 0.94;
      if (!dragging.current && Math.abs(v) > 0.00001) raw.set(clamp01(raw.get() + v));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gyro.on, inView, raw]);

  // Idle: only until someone takes over, so it never moves a spot you chose.
  const poke = useIdle(tile, () => {
    if (!touched.current) raw.set((raw.get() + 0.13) % 1);
  }, 2800);
  const take = () => {
    touched.current = true;
    poke();
  };

  const fromX = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    raw.set(clamp01((e.clientX - r.left) / r.width));
  };
  const onDown = (e: React.PointerEvent) => {
    if (coarse) gyro.enable();
    take();
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    fromX(e);
  };
  const onMove = (e: React.PointerEvent) => {
    if (dragging.current) fromX(e);
  };
  const onUp = () => {
    dragging.current = false;
  };
  const onKey = (e: React.KeyboardEvent) => {
    const now = Math.round(raw.get() * N);
    const next = STOPS.find((s) => s.i > now)?.i ?? N;
    const prev = [...STOPS].reverse().find((s) => s.i < now)?.i ?? 0;
    const map: Record<string, number> = {
      ArrowRight: now + 1, ArrowUp: now + 1, ArrowLeft: now - 1, ArrowDown: now - 1,
      PageUp: next, PageDown: prev, Home: 0, End: N,
    };
    if (!(e.key in map)) return;
    e.preventDefault();
    take();
    raw.set(clamp01(map[e.key] / N));
  };

  const grade = gradeAt(i);
  const size = Math.abs(grade);
  const word = size < 2 ? "plano" : grade > 0 ? "subindo" : "descendo";
  const steep = size >= 15;
  const km = (i / N) * KM;
  const summary = `km ${dec.format(km)}, ${int.format(ALT[i])} metros, ${word} ${int.format(size)}%, faltam ${int.format(AHEAD[i])} metros de subida`;

  return (
    <div ref={tile} className="relative isolate flex h-full flex-col gap-3 overflow-hidden rounded-tile bg-casa-tile-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-casa-mono text-casa-sm tabular-nums text-casa-fg-3">km {dec.format(km)} de {KM}</span>
          <span className="font-casa text-[clamp(1.75rem,8vw,2.5rem)] font-medium leading-none tracking-[-0.02em] tabular-nums text-casa-fg">
            {int.format(ALT[i])} m
          </span>
          <span className={`font-casa-mono text-casa-sm tabular-nums ${steep ? "text-[var(--destructive)]" : "text-casa-fg-2"}`}>
            {word} {int.format(size)}%
          </span>
        </div>
        {/* The clinometer: a fixed scale, one needle hanging from the pivot. */}
        <div aria-hidden className="relative h-14 w-24 shrink-0 overflow-hidden rounded-t-full bg-casa-tile">
          {DIAL.map((g) => (
            <span
              key={g}
              style={{ transform: `rotate(${angle(g)}deg)` }}
              className="absolute bottom-0 left-1/2 h-12 w-px origin-bottom"
            >
              <span className={`absolute left-0 top-0 h-2 w-px ${g === 0 ? "bg-casa-fg" : "bg-casa-fg-3"}`} />
            </span>
          ))}
          <motion.span
            style={{ rotate: needle, x: "-50%" }}
            className={`absolute bottom-0 left-1/2 h-11 w-0.5 origin-bottom rounded-control ${steep ? "bg-[var(--destructive)]" : "bg-[var(--chart-2)]"}`}
          />
          <span className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-casa-fg" />
        </div>
      </div>

      <div
        data-lab-target
        role="slider"
        tabIndex={0}
        aria-label="Posição na rota"
        aria-valuemin={0}
        aria-valuemax={KM}
        aria-valuenow={Number(km.toFixed(1))}
        aria-valuetext={summary}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
        className="relative min-h-28 flex-1 cursor-grab touch-none select-none overflow-hidden rounded-control bg-casa-tile outline-none focus-visible:[box-shadow:var(--focus)] active:cursor-grabbing"
      >
        <svg viewBox="0 0 320 120" preserveAspectRatio="none" aria-hidden className="absolute inset-0 size-full">
          <path d={`${LINE} L320 120 L0 120 Z`} className="fill-[color-mix(in_srgb,var(--chart-2)_24%,transparent)]" />
          <path d={LINE} fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" className="stroke-[var(--chart-2)]" />
        </svg>
        {/* What is still ahead sits under a veil; only transform moves it. */}
        <motion.div style={{ scaleX: rest }} className="pointer-events-none absolute inset-0 origin-right bg-[color-mix(in_srgb,var(--casa-tile)_62%,transparent)]" />
        <motion.div style={{ x }} className="pointer-events-none absolute inset-0">
          <span className="absolute inset-y-0 left-0 w-px bg-casa-fg" />
          <motion.span style={{ y }} className="absolute inset-0">
            <span className="absolute left-0 top-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-casa-fg shadow-[var(--casa-shadow)]" />
          </motion.span>
        </motion.div>
      </div>

      <p className="font-casa-mono text-casa-sm tabular-nums text-casa-fg-2">
        {AHEAD[i] < 1 ? "sem mais subida à frente" : `faltam ${int.format(AHEAD[i])} m de subida`}
      </p>
      <div className="grid grid-cols-4 gap-1">
        {STOPS.map((s) => (
          <button
            key={s.name}
            type="button"
            aria-pressed={i === s.i}
            onClick={() => {
              take();
              raw.set(s.i / N);
            }}
            className={`alvo-toque h-11 rounded-control font-casa-mono text-casa-sm outline-none focus-visible:[box-shadow:var(--focus)] ${i === s.i ? "bg-casa-fg text-casa-bg" : "bg-casa-tile text-casa-fg-2"}`}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
