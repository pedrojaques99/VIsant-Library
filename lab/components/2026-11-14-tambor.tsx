/*
 * TAMBOR: a rotary appointment drum for clinical scheduling. Drag the machined cylinder
 * sideways to click through available consultation slots; each detent locks in with a tactile
 * snap, showing time, procedure duration and preparation without switching screens.
 */
import * as React from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { LabComponentMeta } from "../types";

export const meta: LabComponentMeta = {
  id: "2026-11-14-tambor",
  date: "2026-11-14",
  title: "Tambor de agendamento",
  label: "TAMBOR",
  hint: "drag sideways to rotate the schedule drum",
  hintTouch: "arraste pro lado pra girar os horários",
  formula: "i = clamp(i₀ + Δx/44, 0, 4) · snap → round(i) · k 320 c 28 · scale = 1 - |Δi|·0.14",
  rules: [
    "one-input", "one-metaphor", "mono-labels", "formula", "born-in-best-state",
    "tactile-object", "real-ui-purpose", "no-new-deps", "tokens", "reduced-motion",
    "touch", "only-transform", "mobile-hint", "mobile-no-hover", "mobile-perf",
  ],
  status: "candidate",
  tags: { input: "drag", family: "mechanical", intensity: "medium", response: "snap" },
  rationale: "componente do dia a partir de web design de clínica odontológica (behance/ui-ux): agendamento sem ansiedade; drag porque girar o cilindro de atendimento é mecânico e tátil; mechanical (6/8) e snap (8/13) são os favoritos do lab; intensidade medium pelo peso e inércia do tambor cilíndrico.",
  kind: "component",
  inspiration: "O projeto reduz o atrito e a ansiedade do agendamento clínico integrando a escolha do procedimento a uma visualização imediata do tempo, custo e preparo necessário em uma só superfície fluida.",
  sketches: [
    "Escala de cor dental (shade guide): perdeu porque escala de cor é aferição clínica passiva do profissional, não decisão de agendamento pelo paciente no site.",
    "Calendário sanfona dobrável em origami: perdeu porque dobrar faces em 3D no celular fica lento e confuso na vertical de 375px, exigindo muitos toques em vez de um gesto direto e fluido.",
  ],
  source: {
    title: "↗️ NOVA DENTAL – DENTAL CLINIC WEB DESIGN",
    url: "https://www.behance.net/gallery/256915511/-NOVA-DENTAL-DENTAL-CLINIC-WEB-DESIGN",
    studio: "Phenomenon Studio",
    gallery: "ui-ux",
    refs: [
      "lab/.refs/2026-11-14-nova-dental-dental-clinic-web-design/ref-1.png",
      "lab/.refs/2026-11-14-nova-dental-dental-clinic-web-design/ref-2.png",
      "lab/.refs/2026-11-14-nova-dental-dental-clinic-web-design/ref-3.png",
    ],
  },
  catalogo: {
    nome: "schedule-drum",
    titulo: "Tambor de agendamento",
    descricao: "Seletor de procedimentos e horários em tambor rotativo mecânico com detents: arraste para alternar horários com duração e preparo integrados.",
    tags: ["agendamento", "clinica", "horario", "procedimento", "tambor", "seletor", "booking"],
    familia: "controles",
    quando: "Agendamento rápido de serviços com slots pré-definidos (consultórios, barbearias, atendimentos).",
    evite: "Seletores de data em calendário mensal amplo, onde a visão de grade é necessária.",
  },
};

const SLOTS = [
  { time: "09:30", name: "Checkup & Profilaxia", dur: "30 min", prep: "Jejum 1h prévio", fee: "R$ 180" },
  { time: "11:00", name: "Limpeza Ultrassônica", dur: "45 min", prep: "Sem restrições", fee: "R$ 250" },
  { time: "14:15", name: "Restauração Estética", dur: "60 min", prep: "Anestesia local", fee: "R$ 380" },
  { time: "16:00", name: "Clareamento LED", dur: "45 min", prep: "Evitar pigmentos", fee: "R$ 520" },
  { time: "17:30", name: "Ortodontia Alinhador", dur: "30 min", prep: "Trazer molde", fee: "R$ 220" },
] as const;

const LAST = SLOTS.length - 1;
const STEP = 44; // px per slot drag
const CARD_W = 168; // px width of slot card
const mix = (c: string, p: number) => `color-mix(in srgb, var(${c}) ${p}%, transparent)`;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const BEZEL = `0 0 0 1px ${mix("--casa-bg", 70)}, inset 0 1px 0 ${mix("--casa-fg", 18)}, 0 4px 14px ${mix("--casa-bg", 85)}, 0 18px 30px -14px ${mix("--casa-bg", 95)}`;
const WELL = `inset 0 6px 14px ${mix("--casa-bg", 95)}, inset 0 0 0 1px ${mix("--casa-fg", 10)}`;
const CARD_SHADOW = `0 8px 16px -4px ${mix("--casa-bg", 90)}, inset 0 1px 0 ${mix("--casa-fg", 22)}, inset 0 -1px 0 ${mix("--casa-bg", 70)}`;

export default function Tambor() {
  const reduce = useReducedMotion();
  const raw = useMotionValue(2); // born at slot 2 (14:15 Restauração)
  const sprung = useSpring(raw, { stiffness: 320, damping: 28 });
  const index = reduce ? raw : sprung;

  const [active, setActive] = React.useState(2);
  const start = React.useRef<{ x: number; from: number } | null>(null);

  useMotionValueEvent(raw, "change", (v) => {
    const s = clamp(Math.round(v), 0, LAST);
    setActive((prev) => {
      if (prev !== s) navigator.vibrate?.(6);
      return s;
    });
  });

  const snapTo = (n: number) => {
    const target = clamp(n, 0, LAST);
    if (reduce) raw.jump(target); else raw.set(target);
  };

  const release = () => {
    if (start.current) snapTo(Math.round(raw.get()));
    start.current = null;
  };

  const cur = SLOTS[active];

  return (
    <div className="relative isolate flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-tile bg-casa-tile p-3 select-none">
      {/* Outer Chassis */}
      <div
        style={{ boxShadow: BEZEL }}
        className="relative flex w-[270px] flex-col items-center rounded-[18px] p-3 [background:linear-gradient(160deg,var(--casa-tile-2),var(--casa-bg))]"
      >
        {/* Header: slot count + status */}
        <div className="flex w-full items-center justify-between px-1 pb-2 font-casa-mono text-[10px] uppercase tracking-wider text-casa-fg-3">
          <span>Consulta Dental</span>
          <span className="text-casa-fg">Slot {active + 1} de {SLOTS.length}</span>
        </div>

        {/* Cylinder Chamber */}
        <div
          data-lab-target
          role="slider"
          tabIndex={0}
          aria-label="Seletor de horário de atendimento"
          aria-valuemin={0}
          aria-valuemax={LAST}
          aria-valuenow={active}
          aria-valuetext={`${cur.time} - ${cur.name}, ${cur.dur}`}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); snapTo(active + 1); }
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); snapTo(active - 1); }
            if (e.key === "Home") { e.preventDefault(); snapTo(0); }
            if (e.key === "End") { e.preventDefault(); snapTo(LAST); }
          }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            start.current = { x: e.clientX, from: raw.get() };
          }}
          onPointerMove={(e) => {
            if (start.current) {
              const dx = (e.clientX - start.current.x) / STEP;
              const next = clamp(start.current.from - dx, -0.3, LAST + 0.3);
              if (reduce) raw.jump(next); else raw.set(next);
            }
          }}
          onPointerUp={release}
          onPointerCancel={release}
          style={{ boxShadow: WELL }}
          className="relative flex h-[106px] w-full touch-none items-center justify-center overflow-hidden rounded-[12px] [background:radial-gradient(110%_120%_at_50%_0%,var(--casa-tile-2),var(--casa-bg))]"
        >
          {/* Side detent gears (visual cues) */}
          <div aria-hidden className="pointer-events-none absolute left-0 inset-y-0 w-3 [background:repeating-linear-gradient(180deg,var(--casa-fg-3)_0_2px,transparent_2px_6px)] opacity-20" />
          <div aria-hidden className="pointer-events-none absolute right-0 inset-y-0 w-3 [background:repeating-linear-gradient(180deg,var(--casa-fg-3)_0_2px,transparent_2px_6px)] opacity-20" />

          {/* Cards carousel */}
          <div className="relative flex h-full items-center justify-center pointer-events-none">
            {SLOTS.map((slot, i) => {
              const offset = useTransform(index, (v) => i - v);
              const x = useTransform(offset, (o) => o * (CARD_W + 12));
              const scale = useTransform(offset, (o) => 1 - Math.min(Math.abs(o), 2) * 0.12);
              const opacity = useTransform(offset, (o) => 1 - Math.min(Math.abs(o), 2) * 0.45);
              const isSelected = i === active;

              return (
                <motion.div
                  key={slot.time}
                  style={{ x, scale, opacity }}
                  className="absolute flex h-[82px] w-[168px] flex-col justify-between rounded-[8px] p-2.5 [background:linear-gradient(140deg,var(--casa-tile-2),var(--casa-bg))]"
                >
                  <div style={{ boxShadow: CARD_SHADOW }} className="absolute inset-0 rounded-[8px] pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="font-casa-mono text-xs font-semibold text-casa-fg">{slot.time}</span>
                    <span className={`rounded px-1.5 py-0.5 font-casa-mono text-[9px] ${isSelected ? "bg-casa-fg text-casa-bg" : "bg-casa-fg/10 text-casa-fg-3"}`}>
                      {slot.dur}
                    </span>
                  </div>
                  <div className="text-[11px] font-medium leading-tight text-casa-fg truncate">
                    {slot.name}
                  </div>
                  <div className="flex items-center justify-between font-casa-mono text-[9px] text-casa-fg-3">
                    <span className="truncate max-w-[95px]">{slot.prep}</span>
                    <span className="text-casa-fg font-semibold">{slot.fee}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer: Quick confirm action */}
        <div className="mt-2.5 flex w-full items-center justify-between px-1">
          <div className="flex flex-col font-casa-mono">
            <span className="text-[9px] text-casa-fg-3">Confirmar Vaga</span>
            <span className="text-[11px] font-semibold text-casa-fg">{cur.time} · {cur.fee}</span>
          </div>
          <button
            type="button"
            onClick={() => navigator.vibrate?.([10, 30, 10])}
            className="flex h-7 items-center rounded-control px-3 font-casa-mono text-[10px] font-medium uppercase tracking-wider text-casa-bg bg-casa-fg [box-shadow:0_1px_2px_rgba(0,0,0,0.4)] active:scale-95 transition-transform"
          >
            Agendar
          </button>
        </div>
      </div>
    </div>
  );
}
