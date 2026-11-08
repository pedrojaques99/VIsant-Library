/*
 * CANHOTO: confirm attendance by tearing the stub off a ticket.
 *
 * Collision: an event identity whose content lives in pieces you keep (tickets,
 * tags, keychains) + the perforated stub of a paper ticket, where the act of
 * tearing IS the commitment. It is a slide-to-confirm with a reason to exist:
 * the stub follows the finger along the perforation, tipping from its bottom
 * corner as it tears from the top; past 55% of its width it comes off and the
 * ticket reads "confirmado"; short of it, it springs back into the perforation.
 * One drag. A button underneath, so Enter or Space confirm too, and an undo.
 */
import * as React from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import type { LabComponentMeta } from "../types";

export const meta: LabComponentMeta = {
  kind: "component",
  id: "2026-11-08-canhoto",
  date: "2026-11-08",
  title: "Canhoto",
  label: "STUB",
  hint: "drag the stub off to confirm · enter works too",
  hintTouch: "arraste o canhoto para o lado",
  formula: "p = clamp(Δx / w, 0, 1) · θ = 9p° · p > 0.55 ? tear : back · k 420 c 32",
  rules: ["one-metaphor", "mono-labels", "formula", "born-in-best-state", "no-new-deps", "tokens", "reduced-motion", "touch", "only-transform", "mobile-hint", "mobile-no-hover", "mobile-perf"],
  status: "candidate",
  tags: { input: "drag", family: "material", intensity: "subtle", response: "snap" },
  rationale: "componente: trilho Behance (fora do lab:next); arrastar (melhor taxa, 80%) com metáfora nova de canhoto picotado, diferente do traço de preço do Fechar posição e da pilha das Pastas",
  source: {
    title: "Chande Bootcamp 2026",
    url: "https://www.behance.net/gallery/257768777/Chande-Bootcamp-2026",
    studio: "Lumen Studio",
    gallery: "ui-ux",
    refs: [
      "lab/.refs/2026-11-08-chande-bootcamp-2026/ref-1.gif",
      "lab/.refs/2026-11-08-chande-bootcamp-2026/ref-2.png",
      "lab/.refs/2026-11-08-chande-bootcamp-2026/ref-3.png",
    ],
  },
  inspiration: "O evento mora em peças físicas que você guarda (ingresso, etiqueta, chaveiro), então a interface trata participar como pegar um objeto, não marcar um campo.",
  sketches: [
    "chaveiro de etiquetas de interesse que você gira com o ponteiro: girar já é do Arranjo e etiqueta em pílula vira um filtro comum com fantasia",
    "crachá pendurado no cordão que balança ao inclinar: inclinar já é do Perfil de rota e da DETENT de hoje, e um crachá não decide nada",
  ],
};

const SNAP = { type: "spring", stiffness: 420, damping: 32 } as const;
const TEAR = 0.55;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
// Two half-circle notches where the perforation meets the edges (alpha-only mask).
const notch = (side: "left" | "right") =>
  `radial-gradient(circle 8px at ${side === "right" ? "100%" : "0"} 0, transparent 97%, var(--casa-fg)) top / 100% 51% no-repeat, radial-gradient(circle 8px at ${side === "right" ? "100%" : "0"} 100%, transparent 97%, var(--casa-fg)) bottom / 100% 51% no-repeat`;

export default function Canhoto() {
  const reduce = useReducedMotion();
  const stub = React.useRef<HTMLButtonElement>(null);
  const [torn, setTorn] = React.useState(false);
  const x = useMotionValue(0);
  const w = React.useRef(96);
  const p = useTransform(x, (v) => clamp(v / w.current, 0, 1));
  const rotate = useTransform(p, (v) => v * 9);
  const cue = useTransform(p, [0, 0.4], [1, 0]);
  const drag = React.useRef<{ x: number; moved: boolean } | null>(null);

  const tear = () => {
    setTorn(true);
    if (reduce) x.jump(w.current * 2);
    else animate(x, w.current * 2.2, { type: "spring", stiffness: 260, damping: 30 });
  };
  const back = () => (reduce ? x.jump(0) : animate(x, 0, SNAP));
  const refocus = React.useRef(false);
  const undo = () => {
    refocus.current = true;
    setTorn(false);
    back();
  };
  React.useEffect(() => {
    if (!torn && refocus.current) stub.current?.focus(); // undo hands focus back to the stub
    refocus.current = false;
  }, [torn]);

  const onDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (torn) return;
    w.current = e.currentTarget.offsetWidth;
    e.currentTarget.setPointerCapture(e.pointerId);
    x.stop();
    drag.current = { x: e.clientX - x.get(), moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = clamp(e.clientX - d.x, 0, w.current * 1.2);
    if (dx > 4) d.moved = true;
    x.set(dx);
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.moved) return;
    if (p.get() > TEAR) tear();
    else back();
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex h-36 select-none">
        {/* The ticket: what you are confirming, and nothing else. */}
        <div style={{ mask: notch("right"), WebkitMask: notch("right") }} className="flex flex-1 flex-col justify-between rounded-l-tile border border-r-0 border-casa-line bg-casa-bg p-4">
          <div className="flex flex-col gap-1">
            <span className="font-casa text-casa-lg font-medium leading-tight text-casa-fg">Encontro de design</span>
            <span className="font-casa-mono text-[11px] uppercase tracking-[0.08em] text-casa-fg-3">sáb 14 nov · 19h</span>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-casa text-[2.5rem] font-medium leading-none tracking-[-0.03em] tabular-nums text-casa-fg">03</span>
              <span className="font-casa text-casa-sm text-casa-fg-3">mesa</span>
            </div>
            <motion.div
              initial={false}
              animate={{ opacity: torn ? 1 : 0, y: torn ? 0 : 4 }}
              transition={{ duration: reduce ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-end gap-1"
            >
              <span className="font-casa-mono text-[11px] uppercase tracking-[0.08em] text-casa-fg">confirmado</span>
              <button
                type="button"
                tabIndex={torn ? 0 : -1}
                aria-hidden={!torn}
                onClick={undo}
                className="font-casa text-casa-sm text-casa-fg-3 underline underline-offset-4 outline-none focus-visible:[box-shadow:var(--focus)]"
              >
                desfazer
              </button>
            </motion.div>
          </div>
        </div>
        {/* The perforation the stub tears along. */}
        <div aria-hidden className="w-px border-l border-dashed border-casa-line" />
        <motion.button
          ref={stub}
          type="button"
          data-lab-target
          disabled={torn}
          aria-label="Confirmar presença: arraste o canhoto ou pressione Enter"
          onClick={(e) => {
            if (e.detail === 0) tear(); // keyboard: Enter / Space
          }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          style={{ x, rotate, originX: 0, originY: 1, mask: notch("left"), WebkitMask: notch("left") }}
          className="flex w-24 cursor-grab touch-none flex-col items-center justify-between rounded-r-tile border border-l-0 border-casa-line bg-casa-tile py-4 outline-none focus-visible:[box-shadow:var(--focus)] active:cursor-grabbing disabled:cursor-default sm:w-28"
        >
          <span className="font-casa-mono text-[10px] uppercase tracking-[0.12em] text-casa-fg-3">entrada</span>
          <span className="font-casa text-casa-lg font-medium tabular-nums text-casa-fg">0128</span>
          <motion.span style={{ opacity: cue }} className="font-casa-mono text-[10px] uppercase tracking-[0.12em] text-casa-fg-3">
            rasgue →
          </motion.span>
        </motion.button>
      </div>
      <span className="sr-only" aria-live="polite">
        {torn ? "Presença confirmada. Encontro de design, sábado 14 de novembro às 19h, mesa 03." : ""}
      </span>
    </div>
  );
}
