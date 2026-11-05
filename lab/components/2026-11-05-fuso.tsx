/*
 * ZONE: pick a time zone by sliding a strip of film under a reader.
 *
 * Collision: a dense index as the whole interface + a microfiche reader, whose
 * window stays still while the film moves and shows what it reads in negative.
 * The list is a native scroller with snap, so a swipe, a wheel and momentum all
 * work without code. Over it sits a second, inverted copy of the list, clipped to
 * the window: a row passing through really is half positive, half negative. Fast
 * scrolling stretches the window's trailing edge. Tap a row, or use the keys.
 * Time and offset are live, from Intl, for real IANA zones.
 */
import * as React from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform, useVelocity } from "motion/react";
import { useCoarse, useInView } from "../hooks";
import type { LabComponentMeta } from "../types";

export const meta: LabComponentMeta = {
  kind: "component",
  id: "2026-11-05-fuso",
  date: "2026-11-05",
  title: "Leitor de fuso",
  label: "ZONE",
  hint: "scroll the film · arrows work too",
  hintTouch: "deslize a lista ou toque na cidade",
  formula: "i = round(scrollTop / R) · edge = min(|v| · 0.012, R) · k 300 · c 40",
  rules: ["one-metaphor", "mono-labels", "formula", "born-in-best-state", "no-new-deps", "tokens", "reduced-motion", "touch", "only-transform", "mobile-hint", "mobile-no-hover", "mobile-scroll", "mobile-perf"],
  status: "candidate",
  tags: { input: "scroll", family: "typography", intensity: "subtle", response: "snap" },
  rationale: "componente: trilho Behance (fora do lab:next), único do quadro com rolagem como entrada",
  source: {
    title: "Artemii Lebedev. Portfolio '26.",
    url: "https://www.behance.net/gallery/257630935/Artemii-Lebedev-Portfolio-26",
    studio: "Le:mma Studio",
    gallery: "ui-ux",
    refs: ["lab/.refs/2026-11-05-artemii-lebedev-portfolio-26/ref-1.png", "lab/.refs/2026-11-05-artemii-lebedev-portfolio-26/ref-2.png", "lab/.refs/2026-11-05-artemii-lebedev-portfolio-26/ref-3.png"],
  },
  inspiration: "Uma lista densa e monoespaçada é a interface inteira, e uma única linha invertida diz onde você está.",
  sketches: [
    "índice de arquivos com prévia que troca conforme a linha: repete o layout da fonte e não resolve nada que o catálogo não tenha",
    "seletor com máscara que abre ao segurar: segurar está 0/3 no placar e obturador já foi descartado",
  ],
};

const ZONES = [
  ["Honolulu", "Pacific/Honolulu"], ["Los Angeles", "America/Los_Angeles"], ["Cidade do México", "America/Mexico_City"],
  ["Nova York", "America/New_York"], ["São Paulo", "America/Sao_Paulo"], ["Lisboa", "Europe/Lisbon"], ["Londres", "Europe/London"],
  ["Berlim", "Europe/Berlin"], ["Lagos", "Africa/Lagos"], ["Joanesburgo", "Africa/Johannesburg"], ["Dubai", "Asia/Dubai"], ["Mumbai", "Asia/Kolkata"],
  ["Bangkok", "Asia/Bangkok"], ["Singapura", "Asia/Singapore"], ["Tóquio", "Asia/Tokyo"], ["Sydney", "Australia/Sydney"], ["Auckland", "Pacific/Auckland"],
].map(([city, tz]) => ({
  city,
  clock: new Intl.DateTimeFormat("pt-BR", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }),
  day: new Intl.DateTimeFormat("pt-BR", { timeZone: tz, weekday: "short" }),
  off: new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }),
}));
type Zone = (typeof ZONES)[number];
const START = 4; // São Paulo

/** Minutes east of UTC, from Intl's "GMT-3" / "GMT+5:30" / "GMT". */
function offsetOf(z: Zone, now: Date) {
  const name = z.off.formatToParts(now).find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = name.match(/GMT([+-])(\d+)(?::(\d+))?/);
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 0;
}
const pad = (n: number) => String(n).padStart(2, "0");
function offsetLabel(min: number) {
  const a = Math.abs(min);
  return `${min < 0 ? "−" : "+"}${pad(Math.floor(a / 60))}${a % 60 ? `:${pad(a % 60)}` : ""}`;
}
function diffLabel(z: Zone, now: Date) {
  const d = (offsetOf(z, now) + now.getTimezoneOffset()) / 60;
  const h = d === 0 ? "sua hora" : `${d > 0 ? "+" : "−"}${String(Math.abs(d)).replace(".", ",")} h`;
  return `${h} · ${z.day.format(now).replace(".", "")}`;
}

function Rows({ now, R, on, selected, onPick }: { now: Date; R: number; on?: boolean; selected?: number; onPick?: (i: number) => void }) {
  return (
    <>
      {ZONES.map((z, i) => (
        <div
          key={z.city}
          id={on ? undefined : `fuso-${i}`}
          role={on ? undefined : "option"}
          aria-selected={on ? undefined : selected === i}
          onClick={onPick && (() => onPick(i))}
          style={{ height: R }}
          className={`flex snap-center items-center justify-between gap-4 px-3 font-casa-mono text-casa-sm uppercase tabular-nums ${on ? "" : "cursor-pointer text-casa-fg-2"}`}
        >
          <span className="truncate">{z.city}</span>
          <span>{offsetLabel(offsetOf(z, now))}</span>
        </div>
      ))}
    </>
  );
}

export default function Fuso() {
  const reduce = useReducedMotion();
  const coarse = useCoarse();
  const R = coarse ? 44 : 32; // a finger needs the taller row; same window height either way
  const rows = coarse ? 5 : 7;
  const H = R * rows;
  const PAD = (R * (rows - 1)) / 2;

  const tile = React.useRef<HTMLDivElement>(null);
  const film = React.useRef<HTMLDivElement>(null);
  const inView = useInView(tile);
  const [i, setI] = React.useState(START);
  const [now, setNow] = React.useState(() => new Date());

  const scroll = useMotionValue(START * R);
  const shift = useTransform(scroll, (v) => -v);
  const speed = useSpring(useVelocity(scroll), { stiffness: 300, damping: 40 });
  const stretch = (v: number) => (reduce ? 0 : Math.min(Math.abs(v) * 0.012, R));
  const top = useTransform(speed, (v) => PAD - (v > 0 ? stretch(v) : 0));
  const bottom = useTransform(speed, (v) => PAD - (v < 0 ? stretch(v) : 0));
  const clip = useMotionTemplate`inset(${top}px 4px ${bottom}px 4px round var(--radius-control))`;

  React.useEffect(() => {
    if (!inView) return;
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, [inView]);

  // Rows change height with the pointer type: keep the same city in the window.
  React.useLayoutEffect(() => {
    const el = film.current;
    if (!el) return;
    el.scrollTop = i * R;
    scroll.set(i * R);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [R]);

  const go = (n: number) => {
    const next = Math.max(0, Math.min(ZONES.length - 1, n));
    film.current?.scrollTo({ top: next * R, behavior: reduce ? "auto" : "smooth" });
  };
  const onKey = (e: React.KeyboardEvent) => {
    const map: Record<string, number> = { ArrowDown: i + 1, ArrowUp: i - 1, PageDown: i + rows, PageUp: i - rows, Home: 0, End: ZONES.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    go(map[e.key]);
  };

  const zone = ZONES[i];
  const [hm, sec] = [zone.clock.format(now).slice(0, 5), zone.clock.format(now).slice(5)];

  return (
    <div ref={tile} className="flex h-full flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <motion.span
          key={zone.city}
          initial={reduce ? false : { y: 6, opacity: 0.4 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="font-casa text-[clamp(2.5rem,12vw,3.5rem)] font-medium leading-none tracking-[-0.03em] tabular-nums text-casa-fg"
        >
          {hm}
          <span className="text-casa-fg-3">{sec}</span>
        </motion.span>
        <span className="shrink-0 font-casa-mono text-casa-sm tabular-nums text-casa-fg-2">{diffLabel(zone, now)}</span>
      </div>
      <span className="sr-only" aria-live="polite">{`${zone.city}, ${hm}`}</span>

      <div className="relative overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_22%,black_78%,transparent)]" style={{ height: H }}>
        <div
          ref={film}
          data-lab-target
          role="listbox"
          tabIndex={0}
          aria-label="Fuso horário"
          aria-activedescendant={`fuso-${i}`}
          onKeyDown={onKey}
          onScroll={(e) => {
            const t = e.currentTarget.scrollTop;
            scroll.set(t);
            const n = Math.max(0, Math.min(ZONES.length - 1, Math.round(t / R)));
            if (n !== i) setI(n);
          }}
          style={{ height: H, paddingBlock: PAD }}
          className="snap-y snap-mandatory touch-pan-y select-none overflow-y-scroll rounded-control outline-none [scrollbar-width:none] focus-visible:[box-shadow:var(--focus)] [&::-webkit-scrollbar]:hidden"
        >
          <Rows now={now} R={R} selected={i} onPick={go} />
        </div>
        {/* The window: the same film, in negative, moved only by transform. */}
        <motion.div aria-hidden style={{ clipPath: clip }} className="pointer-events-none absolute inset-0 bg-casa-fg text-casa-bg">
          <motion.div style={{ y: shift, paddingBlock: PAD }}>
            <Rows now={now} R={R} on />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
