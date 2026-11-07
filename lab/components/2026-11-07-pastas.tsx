/*
 * PASTAS: section tabs as hanging folders in a drawer. Drag up or down across
 * the stack to thumb through it; the folders in front drop forward until the
 * one you want stands open.
 *
 * Collision: a project archive where every section is a physical folder with its
 * own tab + the hanging file drawer, where you read a folder by tipping the ones
 * in front of it down. One position p runs the whole stack: folder k sits at its
 * rest height while k ≤ p and drops by the stack height as p passes it, so a
 * slow drag shows two folders mid-tip. On release p snaps to the nearest folder
 * on a spring. A tap on a tab picks it; a tablist, so arrows, Home and End work.
 */
import * as React from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import type { LabComponentMeta } from "../types";

export const meta: LabComponentMeta = {
  kind: "component",
  id: "2026-11-07-pastas",
  date: "2026-11-07",
  title: "Pastas",
  label: "FILES",
  hint: "drag through the folders · arrows work too",
  hintTouch: "arraste pelas pastas",
  formula: "p = p₀ − Δy / 36 · drop = clamp(k − p, 0, 1) · snap round(p) · k 380 c 34",
  rules: ["one-metaphor", "mono-labels", "formula", "born-in-best-state", "no-new-deps", "tokens", "reduced-motion", "touch", "only-transform", "mobile-hint", "mobile-no-hover", "mobile-perf"],
  status: "candidate",
  tags: { input: "drag", family: "material", intensity: "subtle", response: "snap" },
  rationale: "componente: trilho Behance (fora do lab:next); arrastar (melhor taxa, 75%) com metáfora nova de arquivo de pastas suspensas, diferente do traço de preço do Fechar posição",
  source: {
    title: "Mosby’s Files",
    url: "https://www.behance.net/gallery/257301831/Mosbys-Files",
    studio: "tubik studio",
    gallery: "ui-ux",
    refs: [
      "lab/.refs/2026-11-07-mosby-s-files/ref-1.png",
      "lab/.refs/2026-11-07-mosby-s-files/ref-2.png",
      "lab/.refs/2026-11-07-mosby-s-files/ref-3.png",
    ],
  },
  inspiration: "A navegação vira objeto: cada seção é uma pasta física com aba, e escolher uma é tirá-la da pilha, não clicar num menu.",
  sketches: [
    "abas de pasta que você aperta pra abrir: pressionar tem 0 de 3 aprovados e uma aba que só troca é um tabs comum com fantasia",
    "dossiê que você rola e as folhas descolam uma a uma: rolar já é do Leitor de fuso e da LOUVER de hoje, e folha descolando pede textura de papel que vira slop",
  ],
};

const FOLDERS = [
  { tab: "Briefing", line: "Site novo, 6 páginas, lançamento em março.", n: "6", unit: "páginas" },
  { tab: "Refs", line: "Moodboard aprovado, 3 direções descartadas.", n: "24", unit: "imagens" },
  { tab: "Entregas", line: "Home e Sobre prontas, faltam 4 páginas.", n: "2/6", unit: "prontas" },
  { tab: "Contrato", line: "Assinado, segunda parcela na entrega.", n: "50%", unit: "pago" },
];
const N = FOLDERS.length;
const TAB = 28; // px between folder tops
const PITCH = 36; // px of drag per folder
const START = 2;
const SNAP = { type: "spring", stiffness: 380, damping: 34 } as const;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function Folder({ k, p, drop, on, onPick }: { k: number; p: MotionValue<number>; drop: number; on: boolean; onPick: (k: number) => void }) {
  const f = FOLDERS[k];
  const y = useTransform(p, (v) => k * TAB + clamp(k - v, 0, 1) * drop);
  return (
    <motion.div style={{ y, zIndex: k }} className="absolute inset-x-0 top-0 h-full">
      <button
        type="button"
        role="tab"
        id={`pastas-tab-${k}`}
        aria-selected={on}
        aria-controls="pastas-panel"
        tabIndex={on ? 0 : -1}
        data-k={k}
        onClick={() => onPick(k)}
        style={{ marginLeft: `${k * 25}%` }}
        className={`relative h-7 w-[24%] truncate rounded-t-control border border-b-0 px-2 text-left font-casa-mono text-[10px] uppercase tracking-[0.02em] sm:px-3 sm:text-[11px] sm:tracking-[0.08em] outline-none focus-visible:[box-shadow:var(--focus)] ${
          on ? "border-casa-line bg-casa-bg text-casa-fg" : "border-casa-line bg-casa-tile text-casa-fg-3"
        }`}
      >
        {f.tab}
      </button>
      <div className={`h-full rounded-tile rounded-tl-none border border-casa-line shadow-[0_-6px_16px_-10px_color-mix(in_srgb,var(--casa-fg)_30%,transparent)] ${on ? "bg-casa-bg" : "bg-casa-tile"}`} />
    </motion.div>
  );
}

export default function Pastas() {
  const reduce = useReducedMotion();
  const box = React.useRef<HTMLDivElement>(null);
  const list = React.useRef<HTMLDivElement>(null);
  const [h, setH] = React.useState(240);
  const [i, setI] = React.useState(START);
  const p = useMotionValue(START);
  const drag = React.useRef<{ y: number; p: number; moved: boolean } | null>(null);
  const drop = Math.max(0, h - N * TAB - 8);
  const f = FOLDERS[i];

  React.useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setH(e.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const settle = (n: number) => {
    const k = clamp(Math.round(n), 0, N - 1);
    setI(k);
    if (reduce) p.jump(k);
    else animate(p, k, SNAP);
    return k;
  };

  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    p.stop();
    drag.current = { y: e.clientY, p: p.get(), moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y;
    if (Math.abs(dy) > 4) d.moved = true;
    if (!d.moved) return;
    const v = clamp(d.p - dy / PITCH, -0.3, N - 0.7);
    if (reduce) {
      p.jump(clamp(Math.round(v), 0, N - 1));
      setI(clamp(Math.round(v), 0, N - 1));
    } else {
      p.set(v);
      setI(clamp(Math.round(v), 0, N - 1));
    }
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.moved) return void settle(p.get());
    // A tap: the tab under the finger, if any.
    const t = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest<HTMLElement>("[data-k]");
    if (t) settle(Number(t.dataset.k));
    else settle(p.get());
  };

  const onKey = (e: React.KeyboardEvent) => {
    const map: Record<string, number> = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: N - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    const k = settle(map[e.key]);
    list.current?.querySelector<HTMLElement>(`[data-k="${k}"]`)?.focus();
  };

  return (
    <div className="flex flex-col">
      <div
        ref={box}
        data-lab-target
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="relative h-64 cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing"
      >
        <div ref={list} role="tablist" aria-label="Seções do projeto" onKeyDown={onKey} className="absolute inset-0">
          {FOLDERS.map((_, k) => (
            <Folder key={k} k={k} p={p} drop={drop} on={k === i} onPick={settle} />
          ))}
        </div>
        {/* What the open folder holds: one number, one line. */}
        <motion.div
          key={i}
          id="pastas-panel"
          role="tabpanel"
          aria-labelledby={`pastas-tab-${i}`}
          initial={reduce ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{ top: i * TAB + 48 }}
          className="pointer-events-none absolute inset-x-4 z-10 flex flex-col gap-2"
        >
          <div className="flex items-baseline gap-1.5">
            <span className="font-casa text-[clamp(2.25rem,10vw,3rem)] font-medium leading-none tracking-[-0.03em] tabular-nums text-casa-fg">{f.n}</span>
            <span className="font-casa text-casa-sm text-casa-fg-3">{f.unit}</span>
          </div>
          <span className="font-casa text-casa-sm text-casa-fg-2">{f.line}</span>
        </motion.div>
      </div>
      <span className="sr-only" aria-live="polite">{`${f.tab}: ${f.n} ${f.unit}. ${f.line}`}</span>
    </div>
  );
}
