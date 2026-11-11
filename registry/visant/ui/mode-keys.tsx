"use client";

/*
 * MODE: pick how a home battery behaves with a bank of latching push keys.
 *
 * Collision: an energy dashboard that keeps each card to one calm number and one
 * trace against "normal" + the interlocking push-button bank of an old radio,
 * where pressing one key latches it down and the previous one pops back up.
 * The key latches on press (not on release), so it feels mechanical; the old one
 * springs up with a little overshoot. Above it, one number (the reserve kept for
 * an outage) and one trace with a tick where the default sits. A radiogroup:
 * arrows, Home and End move the latch from the keyboard.
 */
import * as React from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";

const MODES = [
  { name: "Sol", reserve: 10, hours: 2 },
  { name: "Misto", reserve: 40, hours: 9 },
  { name: "Noite", reserve: 65, hours: 15 },
  { name: "Backup", reserve: 95, hours: 22 },
];
const START = 1;
const NORMAL = MODES[START].reserve;
const LATCH = { type: "spring", stiffness: 700, damping: 32 } as const;
const POP = { type: "spring", stiffness: 520, damping: 13 } as const;

function Key({ i, on, focus, onPick }: { i: number; on: boolean; focus: boolean; onPick: (i: number) => void }) {
  const reduce = useReducedMotion();
  const m = MODES[i];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      tabIndex={focus ? 0 : -1}
      data-lab-target={i === 2 ? "" : undefined}
      data-key={i}
      onPointerDown={() => onPick(i)}
      onClick={() => onPick(i)}
      onContextMenu={(e) => e.preventDefault()}
      className="group relative h-14 min-w-0 flex-1 touch-none select-none rounded-[var(--r-control)] outline-none [-webkit-touch-callout:none] focus-visible:[box-shadow:var(--focus)]"
    >
      {/* the skirt: the side of the key you only see while it is up */}
      <span aria-hidden className="absolute inset-x-0 bottom-0 top-1 rounded-[var(--r-control)] bg-border" />
      <motion.span
        initial={false}
        animate={{ y: on ? 4 : 0 }}
        transition={reduce ? { duration: 0 } : on ? LATCH : POP}
        className={`absolute inset-x-0 bottom-1 top-0 flex flex-col items-start justify-between rounded-[var(--r-control)] border px-2.5 py-2 ${
          on ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"
        }`}
      >
        <span aria-hidden className={`size-1.5 rounded-full ${on ? "bg-primary-foreground" : "bg-border"}`} />
        <span className="truncate [font-family:var(--font-display,inherit)] text-xs">{m.name}</span>
      </motion.span>
    </button>
  );
}

export function ModeKeys() {
  const reduce = useReducedMotion();
  const [i, setI] = React.useState(START);
  const group = React.useRef<HTMLDivElement>(null);
  const reserve = useMotionValue(MODES[START].reserve);
  const shown = useTransform(reserve, (v) => Math.round(v));
  const fill = useTransform(reserve, (v) => v / 100);
  const m = MODES[i];

  React.useEffect(() => {
    const to = MODES[i].reserve;
    if (reduce) return void reserve.set(to);
    const c = animate(reserve, to, { type: "spring", stiffness: 260, damping: 30 });
    return () => c.stop();
  }, [i, reduce, reserve]);

  const pick = (n: number) => setI(Math.max(0, Math.min(MODES.length - 1, n)));
  const onKey = (e: React.KeyboardEvent) => {
    const map: Record<string, number> = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: MODES.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    const n = Math.max(0, Math.min(MODES.length - 1, map[e.key]));
    pick(n);
    group.current?.querySelector<HTMLElement>(`[data-key="${n}"]`)?.focus();
  };

  return (
    <div className="flex h-full flex-col justify-between gap-6">
      <div className="flex flex-col gap-3 px-1">
        <div className="flex items-baseline gap-1.5">
          <motion.span className="[font-family:var(--font-display,inherit)] text-[clamp(2.75rem,13vw,3.75rem)] font-medium leading-none tracking-[-0.03em] tabular-nums text-foreground">
            {shown}
          </motion.span>
          <span className="[font-family:var(--font-display,inherit)] text-base text-muted-foreground">%</span>
        </div>
        <span className="[font-family:var(--font-display,inherit)] text-xs text-muted-foreground">{`guardado pra queda de luz · ≈ ${m.hours} h`}</span>
        {/* the one trace: where the reserve sits, with a tick at the default */}
        <div className="relative h-1 overflow-visible rounded-full bg-border">
          <motion.div style={{ scaleX: fill }} className="absolute inset-0 origin-left rounded-full bg-foreground" />
          <span aria-hidden className="absolute -top-1 h-3 w-px bg-muted-foreground" style={{ left: `${NORMAL}%` }} />
        </div>
        <span className="sr-only" aria-live="polite">{`${m.name}: reserva de ${m.reserve}%, cerca de ${m.hours} horas`}</span>
      </div>

      <div ref={group} role="radiogroup" aria-label="Modo da bateria" onKeyDown={onKey} className="flex gap-1.5">
        {MODES.map((_, n) => (
          <Key key={n} i={n} on={n === i} focus={n === i} onPick={pick} />
        ))}
      </div>
    </div>
  );
}
