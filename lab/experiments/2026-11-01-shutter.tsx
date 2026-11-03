/*
 * SHUTTER: a lens iris. Pressing snaps the blades shut; letting go opens them one
 * stop tighter than before, and the light behind pays for it.
 *
 * Each blade's edge runs through its own pivot on the rim, so it sits
 * a = R · sin β from the center: one angle sets the opening. Each stop halves the
 * area. Closing is a 60 ms cut; opening is a stiff spring plus a flash of exposure.
 * Under reduced motion the blades just land at the new stop, with no flash.
 */
import * as React from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react";
import type { LabMeta } from "../types";

export const meta: LabMeta = {
  id: "2026-11-01-shutter",
  date: "2026-11-01",
  title: "Shutter",
  label: "SHUTTER",
  hint: "press · each click stops down",
  hintTouch: "toque · fecha um ponto",
  formula: "a = 84 / √2ⁿ · β = asin(a / R) · close 60ms · open k 900 c 46",
  rules: ["one-input", "one-metaphor", "mono-labels", "formula", "born-in-best-state", "no-new-deps", "tokens", "reduced-motion", "touch", "mobile-hint", "mobile-press", "mobile-perf", "small", "only-transform"],
  status: "candidate",
  tags: { input: "press", family: "optics", intensity: "bold", response: "snap" },
  rationale: "exploração: press, optics, bold, snap nunca testados",
};

const R = 98; // the pivots' ring, in viewBox units
const BLADES = 7;
const STOPS = ["2", "2.8", "4", "5.6", "8"];
const BORN = 1; // first look: already f/2.8, an open heptagon in the dark
// Blades overlap in a ring, which paint order cannot do: blade 0 is painted again
// on top of blade 6, masked by the side of blade 1 it stays under.
const MOVING = [0, 1, 2, 3, 4, 5, 6, 0, 1];
const BLADE = "M-60 0H230V210H-60Z";
const LOOK = { fill: "url(#shutter-blade)", stroke: "color-mix(in srgb, var(--casa-fg) 34%, transparent)", strokeWidth: 0.75 };

const opening = (n: number) => 84 / Math.SQRT2 ** n;
const betaFor = (a: number) => (Math.asin(a / R) * 180) / Math.PI;
const lightFor = (n: number) => 1 - n * 0.14;
const placed = (i: number, beta: number) => {
  const alpha = (360 / BLADES) * i;
  const rad = (alpha * Math.PI) / 180;
  return `translate(${(R * Math.cos(rad)).toFixed(2)} ${(R * Math.sin(rad)).toFixed(2)}) rotate(${(alpha + 180 + beta).toFixed(3)})`;
};

export default function Shutter() {
  const reduce = useReducedMotion();
  const [n, setN] = React.useState(BORN);
  const beta = useMotionValue(betaFor(opening(BORN)));
  const light = useMotionValue(lightFor(BORN));
  const blades = React.useRef<(SVGPathElement | null)[]>([]);
  const held = React.useRef(false);

  // Rotating about each blade's own pivot: an SVG transform on a few small paths.
  useMotionValueEvent(beta, "change", (b) => {
    blades.current.forEach((el, k) => el?.setAttribute("transform", placed(MOVING[k], b)));
  });

  const close = () => {
    if (held.current) return;
    held.current = true;
    navigator.vibrate?.(8);
    if (reduce) beta.jump(0);
    else animate(beta, 0, { duration: 0.06, ease: "easeIn" });
  };
  const open = () => {
    if (!held.current) return;
    held.current = false;
    const next = (n + 1) % STOPS.length;
    setN(next);
    const to = betaFor(opening(next));
    if (reduce) return void (beta.jump(to), light.jump(lightFor(next)));
    animate(beta, to, { type: "spring", stiffness: 900, damping: 46 });
    animate(light, [1, lightFor(next)], { duration: 0.5, ease: "easeOut" });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Obturador, abertura f/${STOPS[n]}. Pressione para fechar um ponto`}
      className="relative grid h-full w-full cursor-pointer touch-none select-none place-items-center rounded-control outline-none [-webkit-touch-callout:none] focus-visible:[box-shadow:var(--focus)]"
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        close();
      }}
      onPointerUp={open}
      onPointerCancel={open}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !e.repeat) (e.preventDefault(), close());
      }}
      onKeyUp={open}
    >
      <svg viewBox="-104 -104 208 208" aria-hidden className="h-full max-h-full w-full">
        <defs>
          <clipPath id="shutter-rim">
            <circle r="96" />
          </clipPath>
          <clipPath id="shutter-ring">
            <path
              ref={(el) => {
                blades.current[8] = el;
              }}
              transform={placed(1, betaFor(opening(BORN)))}
              d="M-60 0H230V-210H-60Z"
            />
          </clipPath>
          <linearGradient id="shutter-blade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="46">
            <stop offset="0" stopColor="color-mix(in srgb, var(--casa-fg) 24%, var(--casa-tile-2))" />
            <stop offset="1" stopColor="var(--casa-tile-2)" />
          </linearGradient>
        </defs>
        {/* The light behind the glass. */}
        <motion.circle r="96" style={{ opacity: light }} className="fill-casa-fg" />
        <g clipPath="url(#shutter-rim)">
          {Array.from({ length: BLADES }, (_, i) => (
            <path
              key={i}
              ref={(el) => {
                blades.current[i] = el;
              }}
              transform={placed(i, betaFor(opening(BORN)))}
              d={BLADE}
              {...LOOK}
            />
          ))}
          <g clipPath="url(#shutter-ring)">
            <path
              ref={(el) => {
                blades.current[7] = el;
              }}
              transform={placed(0, betaFor(opening(BORN)))}
              d={BLADE}
              {...LOOK}
            />
          </g>
        </g>
        <circle r="99" fill="none" strokeWidth="6" className="stroke-casa-bg" />
        <circle r="102.5" fill="none" strokeWidth="1" className="stroke-casa-line" />
      </svg>
      <span aria-hidden className="absolute bottom-0 right-0 font-casa-mono text-casa-sm tabular-nums text-casa-fg-2">
        f/{STOPS[n]}
      </span>
    </div>
  );
}
