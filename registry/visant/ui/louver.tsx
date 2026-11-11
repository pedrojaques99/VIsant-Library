"use client";

/*
 * LOUVER: scrolling turns the slats of a window blind, and the bars of sunlight
 * they let onto the wall widen and narrow.
 *
 * The scroller has five native snap detents (CSS scroll-snap), one per 22.5° of
 * slat. Edge-on, a closed slat stands upright and an open one lies flat; the
 * light through each gap is 1 − cos θ of the pitch, so the first turn barely
 * lets anything in and the last one floods the wall. Under reduced motion the
 * slats and the light land on the nearest detent instead of travelling with
 * the finger.
 */
import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";

const STEP = 48; // px of scroll per detent (h-12)
const DETENTS = 5; // 0°, 22.5°, 45°, 67.5°, 90°
const PER = 90 / (DETENTS - 1);
const BORN = 3; // born at 67.5°: the bars already read in a screenshot
const SLATS = 9;
const BANDS = 7;

function Slat({ theta }: { theta: MotionValue<number> }) {
  // Edge-on: 0° stands upright (closed), 90° lies flat (open).
  const rotate = useTransform(theta, (t) => 90 - t);
  return <motion.span style={{ rotate }} className="block h-px w-4 rounded-full bg-muted-foreground" />;
}

function Band({ open }: { open: MotionValue<number> }) {
  const scaleY = useTransform(open, (o) => Math.max(o, 0.02));
  const opacity = useTransform(open, (o) => 0.35 + o * 0.65);
  return (
    <motion.div
      style={{ scaleY, opacity }}
      className="h-full w-full rounded-[2px] blur-[3px] [background:linear-gradient(90deg,transparent,color-mix(in_srgb,var(--foreground)_14%,transparent)_30%,color-mix(in_srgb,var(--foreground)_8%,transparent))]"
    />
  );
}

export function Louver() {
  const reduce = useReducedMotion();
  const scroller = React.useRef<HTMLDivElement>(null);
  const theta = useMotionValue(BORN * PER);
  const open = useTransform(theta, (t) => 1 - Math.cos((t * Math.PI) / 180));

  React.useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollTop = BORN * STEP;
  }, []);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const d = Math.max(0, Math.min(DETENTS - 1, e.currentTarget.scrollTop / STEP));
    theta.set((reduce ? Math.round(d) : d) * PER);
  };

  return (
    <div className="relative isolate h-full w-full select-none overflow-hidden rounded-[var(--r-surface)] bg-card">
      {/* The wall: bars of light, cast at the sun's slant. */}
      <div aria-hidden className="pointer-events-none absolute -inset-x-6 inset-y-6 -z-10 flex -skew-y-6 flex-col justify-between">
        {Array.from({ length: BANDS }, (_, i) => (
          <div key={i} className="h-[9%]">
            <Band open={open} />
          </div>
        ))}
      </div>
      {/* The blind, edge-on, down the left side. */}
      <div aria-hidden className="pointer-events-none absolute inset-y-6 left-5 flex flex-col justify-between">
        {Array.from({ length: SLATS }, (_, i) => (
          <Slat key={i} theta={theta} />
        ))}
      </div>
      {/* The input: a short native scroller with five snap detents, so wheel,
          trackpad and finger all work and the page takes over at either end. */}
      <div
        ref={scroller}
        onScroll={onScroll}
        className="absolute inset-0 snap-y snap-mandatory touch-pan-y overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {Array.from({ length: DETENTS - 1 }, (_, i) => (
          <div key={i} aria-hidden className="h-12 snap-start" />
        ))}
        <div aria-hidden className="h-full snap-start" />
      </div>
    </div>
  );
}
