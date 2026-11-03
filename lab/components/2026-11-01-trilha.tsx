/*
 * TRAIL: a step-by-step flow where only one step is open at a time, finished
 * steps slide aside like abacus beads, and nothing is ever lost.
 *
 * Principle (from the source): progressive disclosure, one action at a time,
 * and you can always go back without losing progress. Collision: an abacus,
 * where a counted bead slides along its wire and stays put until you push it
 * back. The open step is a glass sheet (chart-2 mixed into the tile, no blur:
 * blur costs a phone frames); you HOLD to finish it, a ring fills while you
 * hold, and the step collapses into a bead that drifts down the diagonal,
 * staggered like a cascade. Tap any bead to reopen that step; the others keep
 * their state. All four done, the check draws itself.
 */
import * as React from "react";
import { AnimatePresence, MotionConfig, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import type { LabComponentMeta } from "../types";

export const meta: LabComponentMeta = {
  kind: "component",
  id: "2026-11-01-trilha",
  date: "2026-11-01",
  title: "Trilha",
  label: "TRAIL",
  hint: "hold to finish a step · click a bead to go back",
  hintTouch: "segure · toque pra voltar",
  formula: "hold 600ms → done · bead x = 14px · i · open = first not done",
  rules: ["one-metaphor", "mono-labels", "formula", "born-in-best-state", "no-new-deps", "tokens", "reduced-motion", "touch", "mobile-hint", "mobile-press", "mobile-perf"],
  status: "candidate",
  tags: { input: "press", family: "material", intensity: "medium", response: "spring" },
  rationale: "componente: trilho Behance, terceiro do teste (fora do lab:next)",
  source: {
    title: "Neobank web & mobile app UX/UI design | Emerald24",
    url: "https://www.behance.net/gallery/256834293/Neobank-web-mobile-app-UXUI-design-Emerald24",
    studio: "Goodface Agency",
    gallery: "ui-ux",
    refs: ["lab/.refs/2026-11-01-emerald24/ref-1.jpg", "lab/.refs/2026-11-01-emerald24/ref-2.jpg", "lab/.refs/2026-11-01-emerald24/ref-3.jpg"],
  },
  inspiration: "Divulgação progressiva: uma ação por vez, e você pode voltar a qualquer etapa sem perder nada do que já fez.",
  sketches: [
    "notificação de vidro 'aprovar este acesso?' que se arrasta pra aprovar: repete o arrasto do Fechar posição e é um momento só",
    "carrossel de cartões de pagamento empilhados: padrão comum demais, pouca originalidade",
  ],
};

const STEPS = [
  { t: "Seus dados", d: "nome e data de nascimento" },
  { t: "Documento", d: "foto da frente e do verso" },
  { t: "Endereço", d: "onde você mora hoje" },
  { t: "Revisão", d: "confira e envie" },
];
const HOLD = 600;
const GLASS =
  "bg-[color-mix(in_srgb,var(--chart-2)_12%,var(--casa-tile))] ring-1 ring-[color-mix(in_srgb,var(--chart-2)_30%,transparent)]";

function HoldButton({ onDone }: { onDone: () => void }) {
  const p = useMotionValue(0);
  const dash = useTransform(p, (v) => 1 - v);
  const raf = React.useRef(0);
  const start = React.useRef<number | null>(null);
  const stop = () => {
    cancelAnimationFrame(raf.current);
    start.current = null;
    p.set(0);
  };
  React.useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const tick = () => {
    if (start.current === null) return;
    const v = Math.min((performance.now() - start.current) / HOLD, 1);
    p.set(v);
    if (v < 1) raf.current = requestAnimationFrame(tick);
    else {
      navigator.vibrate?.(10);
      stop();
      onDone();
    }
  };
  return (
    <button
      type="button"
      data-lab-target
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = performance.now();
        raf.current = requestAnimationFrame(tick);
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onDone())}
      className="alvo-toque flex h-11 touch-none select-none items-center gap-2 rounded-control bg-casa-cta px-4 font-casa-mono text-casa-sm text-casa-cta-fg outline-none focus-visible:[box-shadow:var(--focus)]"
    >
      <svg viewBox="0 0 20 20" aria-hidden className="size-4 -rotate-90">
        <circle cx="10" cy="10" r="8" fill="none" strokeWidth="2" className="stroke-current opacity-30" />
        <motion.circle cx="10" cy="10" r="8" fill="none" strokeWidth="2" pathLength={1} strokeDasharray="1 1" style={{ strokeDashoffset: dash }} className="stroke-current" />
      </svg>
      segure pra concluir
    </button>
  );
}

export default function Trilha() {
  const reduce = useReducedMotion();
  // Born mid-way: one bead already counted, the second step open.
  const [done, setDone] = React.useState<boolean[]>([true, false, false, false]);
  const [open, setOpen] = React.useState(1);
  const all = done.every(Boolean);
  const count = done.filter(Boolean).length;

  const finish = (i: number) => {
    const next = done.map((v, j) => (j === i ? true : v));
    setDone(next);
    const after = next.findIndex((v) => !v);
    setOpen(after); // −1 when every step is done
  };
  const spring = { type: "spring", stiffness: 420, damping: 36 } as const;

  return (
    <MotionConfig reducedMotion="user" transition={spring}>
      <div
        onContextMenu={(e) => e.preventDefault()}
        className="relative isolate flex h-full flex-col gap-3 overflow-hidden rounded-tile bg-casa-tile-2 p-4 [-webkit-touch-callout:none] [background-image:radial-gradient(80%_60%_at_100%_100%,color-mix(in_srgb,var(--chart-2)_22%,transparent),transparent)]"
      >
        <div className="flex items-center justify-between font-casa-mono text-casa-sm">
          <span className="text-casa-fg-2">conta nova</span>
          <span className={`rounded-control px-2 py-1 tabular-nums text-casa-fg ${GLASS}`} aria-live="polite">
            {count} de {STEPS.length}
          </span>
        </div>
        <ol className="flex flex-col gap-2">
          {STEPS.map((s, i) => {
            const isOpen = i === open;
            return (
              <motion.li key={s.t} layout animate={{ x: isOpen ? 0 : i * 14 }} className="flex">
                {isOpen ? (
                  <motion.div layout className={`flex w-full flex-col gap-3 rounded-tile p-3 ${GLASS}`}>
                    <div className="flex items-center gap-3">
                      <span className="grid size-7 place-items-center rounded-full bg-casa-fg font-casa-mono text-casa-sm text-casa-bg">{i + 1}</span>
                      <div className="flex flex-col">
                        <span className="text-casa-base text-casa-fg">{s.t}</span>
                        <span className="font-casa-mono text-casa-sm text-casa-fg-3">{s.d}</span>
                      </div>
                    </div>
                    <HoldButton onDone={() => finish(i)} />
                  </motion.div>
                ) : (
                  <motion.button
                    layout
                    type="button"
                    onClick={() => setOpen(i)}
                    aria-label={`${s.t}, ${done[i] ? "concluída" : "pendente"}. Abrir`}
                    className={`alvo-toque flex h-11 items-center gap-2 rounded-control pl-1.5 pr-3 font-casa-mono text-casa-sm outline-none focus-visible:[box-shadow:var(--focus)] ${done[i] ? `${GLASS} text-casa-fg` : "bg-casa-tile text-casa-fg-3"}`}
                  >
                    <span className={`grid size-7 place-items-center rounded-full ${done[i] ? "bg-[var(--chart-2)] text-casa-bg" : "bg-casa-tile-2"}`}>
                      {done[i] ? "✓" : i + 1}
                    </span>
                    {s.t}
                  </motion.button>
                )}
              </motion.li>
            );
          })}
        </ol>
        <AnimatePresence>
          {all ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-auto flex items-center justify-between gap-3"
            >
              <span className="flex items-center gap-2 text-casa-base text-casa-fg">
                <svg viewBox="0 0 24 24" aria-hidden className="size-6">
                  <motion.path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    fill="none"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="stroke-[var(--chart-2)]"
                    initial={{ pathLength: reduce ? 1 : 0 }}
                    animate={{ pathLength: 1 }}
                  />
                </svg>
                tudo pronto
              </span>
              <button
                type="button"
                onClick={() => (setDone([false, false, false, false]), setOpen(0))}
                className="alvo-toque h-11 rounded-control px-3 font-casa-mono text-casa-sm text-casa-fg-2 outline-none focus-visible:[box-shadow:var(--focus)]"
              >
                recomeçar
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
