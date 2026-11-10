/*
 * DESPACHO: triage a pending operational queue by flicking physical index cards
 * left (hold) or right (approve), like a tactile review deck on a desk.
 *
 * Collision: an agent-ops workspace where every department surfaces one concrete
 * question at a time + a weighted paper card stack with a brass paper-clip notch,
 * raking edge shadow, and ink stamp that darkens as you pull past the threshold.
 * Drag past 32% of the card width and let go: the top card flies off into the
 * tray, the card underneath rises into focus with its shadow tightening, and the
 * queue counter ticks down. Arrows (Left/Right) and Backspace/Undo work too.
 */
import * as React from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import type { LabComponentMeta } from "../types";

export const meta: LabComponentMeta = {
  kind: "component",
  id: "2026-11-09-despacho",
  date: "2026-11-09",
  title: "Despacho",
  label: "DISPATCH",
  hint: "drag the card right to approve or left to hold · arrows work too",
  hintTouch: "arraste o cartão para aprovar ou reter",
  formula: "p = clamp(Δx / 96, −1, 1) · θ = 8p° · |p| > 0.45 ? commit(sign p) : spring(0) · k 440 c 32",
  rules: ["one-metaphor", "mono-labels", "formula", "born-in-best-state", "tactile-object", "real-ui-purpose", "no-new-deps", "tokens", "reduced-motion", "touch", "only-transform", "mobile-hint", "mobile-no-hover", "mobile-perf"],
  status: "candidate",
  tags: { input: "drag", family: "material", intensity: "subtle", response: "snap" },
  rationale: "componente: trilho Behance (Fractional); arrastar (71%) + objeto físico tátil (pilha de fichas com relevo, sombra reativa, textura de papel e carimbo progressivo) para uma função real e imediata de produto (aprovar ou reter itens da fila)",
  source: {
    title: "Fractional - Mano a Mano",
    url: "https://www.behance.net/gallery/257746843/Fractional",
    studio: "Mano a Mano",
    gallery: "ui-ux",
    refs: [
      "lab/.refs/2026-11-09-fractional-mano-a-mano/ref-1.png",
      "lab/.refs/2026-11-09-fractional-mano-a-mano/ref-2.png",
      "lab/.refs/2026-11-09-fractional-mano-a-mano/ref-3.png",
    ],
  },
  inspiration: "Operações de várias áreas deixam de ser painéis complexos quando cada pendência aparece como um único cartão acionável de pergunta e decisão.",
  sketches: [
    "dock de ícones que ampliam com a proximidade do ponteiro: cópia direta da imagem 3 da referência e clichê do macOS sem decisão de produto",
    "grade de cartões flutuando com paralaxe de inclinação: puramente decorativo, repete o layout da imagem 2 e não executa nenhuma ação",
  ],
};

const ITEMS = [
  { dept: "FINANCEIRO", code: "NF-408", title: "Liberar reembolso de viagem", meta: "R$ 1.840 · 2 comprovantes anexos" },
  { dept: "OPERAÇÕES", code: "PR-192", title: "Publicar pacote de tokens v2.4", meta: "3 arquivos · zero quebras de contrato" },
  { dept: "COMERCIAL", code: "CT-087", title: "Enviar aditivo de escopo", meta: "Renovação anual · +15% no contrato" },
  { dept: "PESSOAS", code: "RH-031", title: "Homologar férias de dezembro", meta: "12 dias úteis · cobertura confirmada" },
];
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E")`;
const SNAP = { type: "spring", stiffness: 440, damping: 32 } as const;
const THROW = 96; // px of drag for full stamp
const COMMIT = 0.45;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function Despacho() {
  const reduce = useReducedMotion();
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [decisions, setDecisions] = React.useState<Array<"aprovado" | "retido">>([]);
  const x = useMotionValue(36); // born cocked to the right so the underlying card stack, cast shadow and stamp already read
  const p = useTransform(x, (v) => clamp(v / THROW, -1, 1));
  const rotate = useTransform(p, (v) => v * 7.5);
  const liftY = useTransform(p, (v) => -Math.abs(v) * 4);
  const nextScale = useTransform(p, (v) => 0.94 + Math.abs(v) * 0.06);
  const nextY = useTransform(p, (v) => 12 - Math.abs(v) * 10);
  const approveOp = useTransform(p, [0.05, 0.45], [0, 1]);
  const holdOp = useTransform(p, [-0.05, -0.45], [0, 1]);
  const shadowX = useTransform(p, (v) => -v * 14);
  const drag = React.useRef<{ x: number; from: number; moved: boolean } | null>(null);

  const idx = decisions.length;
  const done = idx >= ITEMS.length;
  const cur = ITEMS[Math.min(idx, ITEMS.length - 1)];
  const next = ITEMS[Math.min(idx + 1, ITEMS.length - 1)];
  const approvedCount = decisions.filter((d) => d === "aprovado").length;

  const settle = (to = 0) => (reduce ? x.jump(to) : animate(x, to, SNAP));

  const commit = (dir: 1 | -1) => {
    if (done) return;
    const verdict = dir > 0 ? "aprovado" : "retido";
    navigator.vibrate?.(10);
    const finish = () => {
      x.jump(0);
      setDecisions((prev) => [...prev, verdict]);
    };
    if (reduce) finish();
    else animate(x, dir * 260, { duration: 0.18, ease: [0.22, 1, 0.36, 1], onComplete: finish });
  };

  const undo = () => {
    if (!decisions.length) return;
    setDecisions((prev) => prev.slice(0, -1));
    settle(0);
    cardRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-3.5 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 font-casa-mono text-[11px] uppercase tracking-[0.08em]">
        <span className="text-casa-fg-2">
          {done ? `fila zerada · ${approvedCount} aprovado(s)` : `pendente ${idx + 1} de ${ITEMS.length}`}
        </span>
        <button
          type="button"
          disabled={!decisions.length}
          onClick={undo}
          className="rounded-control px-2 py-1 text-casa-fg-2 underline underline-offset-4 outline-none transition-opacity disabled:pointer-events-none disabled:opacity-30 focus-visible:[box-shadow:var(--focus)]"
        >
          {done ? "reabrir pilha" : "desfazer"}
        </button>
      </div>

      <div className="relative h-44 select-none">
        {/* Recessed desk tray with subtle inner rim */}
        <div aria-hidden className="absolute inset-x-2 inset-y-1 rounded-tile border border-dashed border-casa-line bg-casa-bg/50" />

        {/* Underlying card in the stack */}
        {idx + 1 < ITEMS.length && (
          <motion.div
            aria-hidden
            style={{ scale: nextScale, y: nextY }}
            className="pointer-events-none absolute inset-0 flex flex-col justify-between rounded-tile border border-casa-line bg-casa-tile p-4 opacity-75"
          >
            <div className="flex items-center justify-between font-casa-mono text-[10px] uppercase tracking-[0.1em] text-casa-fg-3">
              <span>{next.dept}</span>
              <span>{next.code}</span>
            </div>
            <span className="truncate font-casa text-casa-base font-medium text-casa-fg-2">{next.title}</span>
          </motion.div>
        )}

        {/* Reactive cast shadow of the top card on the stack */}
        {!done && (
          <motion.div
            aria-hidden
            style={{ x: shadowX, rotate }}
            className="pointer-events-none absolute inset-1 translate-y-2 rounded-tile bg-casa-bg opacity-65 blur-[6px]"
          />
        )}

        {/* Active tactile card (or completion receipt) */}
        <motion.div
          ref={cardRef}
          data-lab-target
          role="group"
          tabIndex={0}
          aria-label={done ? "Fila concluída" : `${cur.dept}: ${cur.title}. Use seta direita para aprovar ou esquerda para reter`}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); commit(1); }
            else if (e.key === "ArrowLeft") { e.preventDefault(); commit(-1); }
            else if (e.key === "Backspace") { e.preventDefault(); undo(); }
          }}
          onPointerDown={(e) => {
            if (done) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            x.stop();
            drag.current = { x: e.clientX, from: x.get(), moved: false };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            const dx = e.clientX - d.x;
            if (Math.abs(dx) > 3) d.moved = true;
            x.set(clamp(d.from + dx, -THROW * 1.4, THROW * 1.4));
          }}
          onPointerUp={() => {
            const d = drag.current;
            drag.current = null;
            if (!d) return;
            if (Math.abs(p.get()) > COMMIT) commit(p.get() > 0 ? 1 : -1);
            else settle(0);
          }}
          onPointerCancel={() => { drag.current = null; settle(0); }}
          style={done ? undefined : { x, y: liftY, rotate }}
          className="relative isolate flex h-full cursor-grab touch-none flex-col justify-between overflow-hidden rounded-tile border border-casa-line bg-casa-tile-2 p-4 shadow-[0_1px_0_0_color-mix(in_srgb,var(--casa-fg)_16%,transparent)_inset] outline-none focus-visible:[box-shadow:var(--focus)] active:cursor-grabbing"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.2] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
          {/* Punched index-card tab notch at top center */}
          <span aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-1.5 w-10 -translate-x-1/2 rounded-b-full border border-t-0 border-casa-line bg-casa-bg" />

          {done ? (
            <div className="my-auto flex flex-col items-center gap-2 text-center">
              <span className="font-casa text-casa-lg font-medium text-casa-fg">4 de 4 despachados</span>
              <span className="font-casa-mono text-[11px] uppercase tracking-[0.08em] text-casa-fg-3">
                {`${approvedCount} aprovado(s) · ${ITEMS.length - approvedCount} retido(s)`}
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-control border border-casa-line bg-casa-tile px-2 py-0.5 font-casa-mono text-[10px] uppercase tracking-[0.1em] text-casa-fg-2">
                  {cur.dept} · {cur.code}
                </span>
                <div className="relative h-5 w-24">
                  <motion.span
                    style={{ opacity: approveOp }}
                    className="absolute right-0 top-0 rounded-control border border-[var(--chart-2)] px-1.5 py-0.5 font-casa-mono text-[10px] uppercase tracking-[0.1em] text-[var(--chart-2)]"
                  >
                    aprovar →
                  </motion.span>
                  <motion.span
                    style={{ opacity: holdOp }}
                    className="absolute right-0 top-0 rounded-control border border-[var(--destructive)] px-1.5 py-0.5 font-casa-mono text-[10px] uppercase tracking-[0.1em] text-[var(--destructive)]"
                  >
                    ← reter
                  </motion.span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-casa text-casa-lg font-medium leading-snug text-casa-fg">{cur.title}</span>
                <span className="font-casa-mono text-casa-sm tabular-nums text-casa-fg-2">{cur.meta}</span>
              </div>

              <div className="flex items-center justify-between border-t border-casa-line pt-2.5 font-casa-mono text-[10px] uppercase tracking-[0.1em] text-casa-fg-3">
                <button type="button" onClick={() => commit(-1)} className="text-casa-fg-2 focus-visible:underline">
                  ← reter
                </button>
                <span>arraste a ficha</span>
                <button type="button" onClick={() => commit(1)} className="text-casa-fg focus-visible:underline">
                  aprovar →
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
      <span className="sr-only" aria-live="polite">
        {decisions.length ? `Última decisão: ${decisions[decisions.length - 1]}.` : ""}
      </span>
    </div>
  );
}
