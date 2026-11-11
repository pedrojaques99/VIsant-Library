/*
 * RECIBO: hold-to-pay as a hardware key over a receipt printer. While the key
 * is held down in its well the slip feeds out of the slot; let go early and it
 * rolls back in, hold to the end and the payment is sent with the receipt out.
 */
import * as React from "react";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { LabComponentMeta } from "../types";

export const meta: LabComponentMeta = {
  id: "2026-11-11-recibo",
  date: "2026-11-11",
  title: "Recibo",
  label: "RECIBO",
  hint: "hold the key to pay",
  hintTouch: "segure a tecla pra pagar",
  formula: "p = t/1.1s while held · release p<1 → spring to 0.34 · key y = 4·held · k 420 c 32",
  rules: [
    "one-input", "one-metaphor", "mono-labels", "formula", "born-in-best-state",
    "tactile-object", "real-ui-purpose", "no-new-deps", "tokens", "reduced-motion",
    "touch", "only-transform", "mobile-hint", "mobile-no-hover", "mobile-press", "mobile-perf",
  ],
  status: "candidate",
  tags: { input: "press", family: "material", intensity: "subtle", response: "spring" },
  rationale: "componente do dia a partir de Budgetly (behance/ui-ux): segurar pra pagar, a ação de dinheiro a um gesto do valor. desvio: press (1/3) em vez de drag porque os componentes já têm 4 de arrastar e só 1 de pressionar; segurar é o gesto real de confirmar um pagamento irreversível.",
  kind: "component",
  inspiration: "O saldo se lê num relance porque os centavos recuam em cinza e as ações de mover dinheiro ficam a um toque logo abaixo do número, sem menu no caminho.",
  sketches: [
    "Contador de rolos (odômetro) pra digitar o valor rolando cada dígito: perdeu porque rolar já é a entrada do 'Leitor de fuso' e digitar valor por rolo é mais lento que o teclado numérico.",
    "Três teclas Gastar/Entrada/Transferir num trilho: perdeu porque é a mesma metáfora das 'Teclas de modo', já aprovadas, e só troca modo sem executar a ação.",
  ],
  source: {
    title: "Budgetly — Personal Financial App Assistant (UX Case)",
    url: "https://www.behance.net/gallery/256295889/Budgetly-Personal-Financial-App-Assistant-(UX-Case)",
    studio: "Dmytro Kalyta, Deep Digital Co — Worldwide +1",
    gallery: "ui-ux",
    refs: [
      "lab/.refs/2026-11-11-budgetly-personal-financial-app-assistan/ref-1.png",
      "lab/.refs/2026-11-11-budgetly-personal-financial-app-assistan/ref-2.png",
      "lab/.refs/2026-11-11-budgetly-personal-financial-app-assistan/ref-3.png",
    ],
  },
};

const HOLD = 1.1; // seconds to commit
const PEEK = 0.34; // born with the slip's head already out of the slot
const SLIP = 132; // px of paper
const mix = (c: string, p: number) => `color-mix(in srgb, var(${c}) ${p}%, transparent)`;

const BEZEL = `0 0 0 1px ${mix("--casa-bg", 70)}, inset 0 1px 0 ${mix("--casa-fg", 16)}, 0 18px 30px -16px ${mix("--casa-bg", 95)}`;
const SLOT = `inset 0 2px 3px ${mix("--casa-bg", 95)}, 0 1px 0 ${mix("--casa-fg", 10)}`;
const capShadow = (d: number) =>
  `inset 0 1px 0 ${mix("--casa-fg", 45)}, inset 0 -${3 - d * 2}px 0 color-mix(in srgb, var(--chart-3) 50%, var(--casa-bg)), 0 ${1 + 3 * (1 - d)}px ${2 + 6 * (1 - d)}px ${mix("--casa-bg", 85)}`;

export default function Recibo() {
  const reduce = useReducedMotion();
  const p = useMotionValue(PEEK);
  const down = useMotionValue(0);
  const depth = useSpring(down, { stiffness: 420, damping: 32 });
  const [paid, setPaid] = React.useState(false);
  const run = React.useRef<ReturnType<typeof animate> | null>(null);
  const wasPaid = React.useRef(false); // a tap undoes only if the press began on a paid slip
  const statusId = React.useId();

  const slipY = useTransform(p, (v) => (1 - v) * SLIP);
  const shade = useTransform(p, (v) => 0.35 - v * 0.3);
  const capY = useTransform(depth, (d) => d * 4);
  const capGlow = useTransform(depth, capShadow);

  const settle = (to: number) => {
    run.current?.stop();
    if (reduce) p.jump(to); else run.current = animate(p, to, { type: "spring", stiffness: 260, damping: 24 });
  };
  const press = () => {
    down.set(1);
    wasPaid.current = paid;
    if (paid) return;
    run.current?.stop();
    run.current = animate(p, 1, {
      duration: HOLD * (1 - p.get()) / (1 - PEEK),
      ease: "linear",
      onComplete: () => { setPaid(true); navigator.vibrate?.([8, 40, 14]); },
    });
  };
  const lift = () => {
    if (!down.get()) return;
    down.set(0);
    if (!paid) settle(PEEK);
  };
  const undo = () => { setPaid(false); settle(PEEK); };
  React.useEffect(() => () => run.current?.stop(), []);

  return (
    <div className="relative isolate flex h-full w-full flex-col items-center justify-center gap-5 overflow-hidden rounded-tile bg-casa-tile">
      {/* printer: bezel, slot, and the slip feeding up out of it */}
      <div aria-hidden className="relative flex flex-col items-center">
        <div className="relative h-[132px] w-[150px] overflow-hidden">
          <motion.div
            style={{ y: slipY }}
            className="absolute inset-x-[9px] bottom-0 flex h-[132px] flex-col gap-1.5 px-3 [background:linear-gradient(180deg,color-mix(in_srgb,var(--casa-fg)_94%,var(--casa-tile)),color-mix(in_srgb,var(--casa-fg)_86%,var(--casa-tile)))] pb-3 pt-4 font-casa-mono text-[9.5px] uppercase tracking-[0.08em] text-casa-bg"
          >
            <div className="absolute inset-x-0 -top-[5px] h-[5px] [background:linear-gradient(-45deg,color-mix(in_srgb,var(--casa-fg)_94%,var(--casa-tile))_3.5px,transparent_0)_left_bottom/7px_5px_repeat-x,linear-gradient(45deg,color-mix(in_srgb,var(--casa-fg)_94%,var(--casa-tile))_3.5px,transparent_0)_left_bottom/7px_5px_repeat-x]" />
            <span className="opacity-60">transferência</span>
            <span className="flex justify-between"><span className="opacity-60">para</span><span>Marina S.</span></span>
            <span className="flex justify-between border-t border-dashed border-current pt-1.5">
              <span className="opacity-60">valor</span>
              <span className="text-[12px] tracking-tight">R$ 1.250<span className="opacity-45">,20</span></span>
            </span>
            <span className="mt-auto text-center opacity-60">{paid ? "✓ enviado" : "· · ·"}</span>
          </motion.div>
          <motion.div style={{ opacity: shade }} className="pointer-events-none absolute inset-x-0 bottom-0 h-10 [background:linear-gradient(transparent,var(--casa-bg))]" />
        </div>
        <div style={{ boxShadow: BEZEL }} className="relative z-10 -mt-px flex h-[22px] w-[168px] items-center rounded-[11px] px-2 [background:linear-gradient(180deg,var(--casa-tile-2),var(--casa-tile))]">
          <div style={{ boxShadow: SLOT }} className="h-[5px] w-full rounded-full bg-casa-bg" />
        </div>
      </div>

      {/* the key: bezel → dark gap → orange cap with a dished face */}
      <div style={{ boxShadow: BEZEL }} className="rounded-[20px] p-[6px] [background:linear-gradient(180deg,var(--casa-tile-2),var(--casa-tile))]">
        <div className="rounded-[15px] bg-casa-bg p-[3px] [box-shadow:inset_0_2px_3px_var(--casa-bg)]">
          <motion.button
            type="button"
            data-lab-target
            aria-label={paid ? "Pagamento enviado. Toque pra desfazer" : "Segure pra pagar R$ 1.250,20"}
            aria-describedby={statusId}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); press(); }}
            onPointerUp={lift}
            onPointerCancel={lift}
            onClick={() => { if (wasPaid.current) { wasPaid.current = false; undo(); } }}
            onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); press(); } }}
            onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); lift(); } }}
            onContextMenu={(e) => e.preventDefault()}
            style={{ y: capY, boxShadow: capGlow }}
            className="relative grid h-[58px] w-[148px] cursor-pointer touch-none select-none place-items-center overflow-hidden rounded-[12px] outline-none [-webkit-touch-callout:none] [background:linear-gradient(175deg,color-mix(in_srgb,var(--chart-3)_82%,var(--casa-fg)),color-mix(in_srgb,var(--chart-3)_86%,var(--casa-bg))_70%)] focus-visible:[box-shadow:var(--focus)]"
          >
            <span className="absolute inset-[5px] rounded-[9px] [background:radial-gradient(120%_100%_at_50%_10%,color-mix(in_srgb,var(--casa-fg)_22%,transparent),transparent_70%)] [box-shadow:inset_0_1px_2px_color-mix(in_srgb,var(--casa-bg)_25%,transparent)]" />
            <span className="relative font-casa-mono text-[11px] lowercase tracking-[0.06em] text-casa-bg [text-shadow:0_1px_0_color-mix(in_srgb,var(--casa-fg)_35%,transparent)]">
              {paid ? "desfazer" : "segure pra pagar"}
            </span>
          </motion.button>
        </div>
      </div>
      <span id={statusId} role="status" className="sr-only">{paid ? "Pagamento de R$ 1.250,20 enviado" : ""}</span>
    </div>
  );
}
