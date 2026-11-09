/*
 * ALCANCE: pick a plan by how much you need, not by its name.
 *
 * Collision: a dashboard where one choice recomposes everything around it + the
 * cursor of a slide rule or caliper. A hairline slides across a log scale of
 * capacities; every tier whose bar reaches the hairline can carry the load, the
 * smallest of them lights up, and the readout says how much headroom it leaves.
 * Let go and the hairline clamps onto the end of that bar, like a caliper locking.
 * One drag. The track is also a slider (arrows, Home, End step through tiers).
 */
import * as React from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from "motion/react";
import type { LabComponentMeta } from "../types";

export const meta: LabComponentMeta = {
  kind: "component",
  id: "2026-11-09-alcance",
  date: "2026-11-09",
  title: "Alcance",
  label: "CALIPER",
  hint: "drag the caliper across the scale · arrows work too",
  hintTouch: "arraste o cursor pela régua",
  formula: "v = 20 · 120^r · tier = min{ cap ≥ v } · release: r → ln(cap/20)/ln 120 · k 460 c 34",
  rules: ["one-metaphor", "mono-labels", "formula", "born-in-best-state", "no-new-deps", "tokens", "reduced-motion", "touch", "only-transform", "mobile-hint", "mobile-no-hover", "mobile-perf"],
  status: "candidate",
  tags: { input: "drag", family: "mechanical", intensity: "subtle", response: "snap" },
  rationale: "componente: trilho Behance (fora do lab:next); arrastar (83%) e mecânico (86%), com metáfora de paquímetro sobre régua logarítmica, diferente do canhoto (rasgar) e das pastas (pilha)",
  source: {
    title: "RIDGELINE – Golf Dashboard | Mobile App | Website",
    url: "https://www.behance.net/gallery/257747751/RIDGELINE-Golf-Dashboard-Mobile-App-Website",
    studio: "Mariia Tytarenko",
    gallery: "ui-ux",
    refs: [
      "lab/.refs/2026-11-09-ridgeline-golf-dashboard-mobile-app-webs/ref-1.png",
      "lab/.refs/2026-11-09-ridgeline-golf-dashboard-mobile-app-webs/ref-2.png",
      "lab/.refs/2026-11-09-ridgeline-golf-dashboard-mobile-app-webs/ref-3.png",
    ],
  },
  inspiration: "Um painel denso vira legível porque uma única escolha recompõe tudo ao redor dela, então a análise responde ao seu gesto em vez de esperar um relatório.",
  sketches: [
    "seletor rotativo de seis posições que recompõe o painel: girar já é do Arranjo, e um seletor de chips vira abas comuns",
    "alvo onde você espalha pontos com o dedo para ver a dispersão: bonito mas decorativo, não decide nada e depende de dados que a maioria das telas não tem",
  ],
};

const TIERS = [
  { name: "Piloto", cap: 40 },
  { name: "Estúdio", cap: 120 },
  { name: "Marca", cap: 300 },
  { name: "Rede", cap: 640 },
  { name: "Grupo", cap: 1200 },
  { name: "Escala", cap: 2400 },
];
const MIN = 20;
const MAX = 2400;
const SPAN = Math.log(MAX / MIN);
const at = (cap: number) => Math.log(cap / MIN) / SPAN; // position of a capacity on the scale
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const tierOf = (v: number) => Math.max(0, TIERS.findIndex((t) => t.cap >= v));
const SNAP = { type: "spring", stiffness: 460, damping: 34 } as const;

export default function Alcance() {
  const reduce = useReducedMotion();
  const track = React.useRef<HTMLDivElement>(null);
  const r = useMotionValue(0.5);
  const tw = useMotionValue(240);
  const [v, setV] = React.useState(MIN * Math.exp(0.5 * SPAN));
  const hair = useTransform([r, tw], ([a, b]: number[]) => a * b);
  const drag = React.useRef(false);
  const idx = tierOf(v);
  const tier = TIERS[idx];
  const spare = Math.round(((tier.cap - v) / tier.cap) * 100);

  useMotionValueEvent(r, "change", (x) => setV(MIN * Math.exp(clamp(x, 0, 1) * SPAN)));
  React.useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(() => tw.set(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [tw]);

  const lock = (i: number) => {
    const to = at(TIERS[clamp(i, 0, TIERS.length - 1)].cap);
    if (reduce) r.jump(to);
    else animate(r, to, SNAP);
  };
  const aim = (e: React.PointerEvent) => {
    const b = track.current!.getBoundingClientRect();
    r.set(clamp((e.clientX - b.left) / b.width, 0, 1));
  };
  const release = () => {
    if (!drag.current) return;
    drag.current = false;
    lock(tierOf(MIN * Math.exp(r.get() * SPAN)));
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-casa-mono text-[11px] uppercase tracking-[0.08em] text-casa-fg-3">entregas por mês</span>
          <span className="font-casa text-[2.5rem] font-medium leading-none tracking-[-0.03em] tabular-nums text-casa-fg">{Math.round(v)}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-casa text-casa-lg font-medium leading-tight text-casa-fg">{tier.name}</span>
          <span className="font-casa-mono text-[11px] uppercase tracking-[0.08em] tabular-nums text-casa-fg-3">
            até {tier.cap} · folga {spare}%
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <ul aria-hidden className="m-0 flex w-14 shrink-0 list-none flex-col p-0 sm:w-16">
          {TIERS.map((t, i) => (
            <li key={t.name} className={`flex h-9 items-center font-casa text-casa-sm ${i === idx ? "text-casa-fg" : "text-casa-fg-3"}`}>
              {t.name}
            </li>
          ))}
        </ul>
        <div
          ref={track}
          data-lab-target
          role="slider"
          tabIndex={0}
          aria-label="Entregas por mês"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={TIERS.length - 1}
          aria-valuenow={idx}
          aria-valuetext={`${tier.name}: até ${tier.cap} entregas por mês, ${Math.round(v)} pedidas`}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = true;
            r.stop();
            aim(e);
          }}
          onPointerMove={(e) => drag.current && aim(e)}
          onPointerUp={release}
          onPointerCancel={release}
          onKeyDown={(e) => {
            const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
            if (step) lock(idx + step);
            else if (e.key === "Home") lock(0);
            else if (e.key === "End") lock(TIERS.length - 1);
            else return;
            e.preventDefault();
          }}
          className="relative flex min-w-0 flex-1 cursor-ew-resize touch-none select-none flex-col rounded-control outline-none focus-visible:[box-shadow:var(--focus)]"
        >
          {TIERS.map((t, i) => (
            <div key={t.name} className="flex h-9 items-center">
              <div
                style={{ transform: `scaleX(${at(t.cap)})` }}
                className={`h-2.5 w-full origin-left rounded-full transition-[background-color,opacity] duration-200 ease-[var(--ease-out)] motion-reduce:transition-none ${
                  i === idx ? "bg-casa-fg" : i > idx ? "bg-casa-fg-3 opacity-50" : "bg-casa-line"
                }`}
              />
            </div>
          ))}
          <motion.div aria-hidden style={{ x: hair }} className="pointer-events-none absolute inset-y-0 left-0 w-px bg-casa-fg">
            <span className="absolute -left-2 -top-2 size-4 rounded-full border border-casa-fg bg-casa-bg shadow-[var(--casa-shadow)]" />
          </motion.div>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {`${tier.name}, até ${tier.cap} entregas por mês, folga de ${spare}%`}
      </span>
    </div>
  );
}
