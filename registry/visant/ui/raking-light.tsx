"use client";

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

import { useIdle } from "@/hooks/use-idle";
import { cn } from "@/lib/utils";

export interface RakingLightProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** A palavra em relevo seco. Curta: é desenhada grande. */
  word?: string;
  /**
   * Comprimento da sombra.
   * @min 0
   * @max 100
   * @step 1
   */
  relief?: number;
  /**
   * Quanto a fibra do papel aparece.
   * @min 0
   * @max 100
   * @step 1
   */
  grain?: number;
  /** Sozinha na tela, a lâmpada passeia. */
  idle?: boolean;
}

const MOLA = { stiffness: 120, damping: 20 };
const SOMBRA = "color-mix(in srgb, black 62%, var(--card))";
const LUZ = "color-mix(in srgb, white 48%, var(--card))";
const LETRA = "col-start-1 row-start-1 leading-none";

/** Fibra acesa por um lado: só preto e branco com alfa, então assenta em qualquer papel. */
function FibraDeLuz({ id, azimute }: { id: string; azimute: number }) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.7 1.05" numOctaves={3} seed={7} result="fibra" />
      <feDiffuseLighting in="fibra" surfaceScale={0.55} lightingColor="white" result="luz">
        <feDistantLight azimuth={azimute} elevation={48} />
      </feDiffuseLighting>
      <feColorMatrix in="luz" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.4 0 0 0 1.784" result="vale" />
      <feColorMatrix in="luz" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.4 0 0 0 -1.784" result="crista" />
      <feMerge>
        <feMergeNode in="vale" />
        <feMergeNode in="crista" />
      </feMerge>
    </filter>
  );
}

/**
 * Luz rasante: uma lâmpada baixa sobre papel com relevo seco, onde a palavra só existe
 * na sombra e no brilho que a luz dá a ela.
 *
 * - **A palavra tem a cor do papel.** Atrás dela, uma cópia de sombra foge da lâmpada e
 *   uma de brilho vai na direção dela. O relevo inteiro é uma posição de lâmpada numa mola.
 * - **A fibra é iluminada de verdade, uma vez só.** Quatro camadas do mesmo ruído, cada
 *   uma acesa de um lado por `feDiffuseLighting`, e a lâmpada só troca a opacidade delas.
 *   Reacender a cada quadro travaria no celular; cruzar quatro pinturas prontas não custa.
 * - **Borda orgânica.** `feDisplacementMap` rói a borda das letras: papel prensado não
 *   tem contorno de vetor.
 * - **Sombra é sempre preta e brilho é sempre branco,** misturados ao `--card`. A luz é
 *   física, então não inverte no tema escuro como um token inverteria.
 * - **`pan-y`, não `touch-none`.** A peça pode ocupar a tela inteira de um celular: o
 *   dedo leva a lâmpada de lado e a rolagem em pé continua da página. O toque também
 *   posiciona a lâmpada na altura.
 * - **Movimento reduzido:** a lâmpada vai direto, sem mola e sem passeio.
 */
export function RakingLight({ word = "relevo", relief = 60, grain = 60, idle = true, className, ...rest }: RakingLightProps) {
  const reduz = useReducedMotion();
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const caixa = React.useRef<HTMLDivElement>(null);
  // Nasce rasante do alto à esquerda: a foto já mostra o relevo.
  const tx = useMotionValue(-0.9);
  const ty = useMotionValue(-0.8);
  const sx = useSpring(tx, MOLA);
  const sy = useSpring(ty, MOLA);
  const lx = reduz ? tx : sx;
  const ly = reduz ? ty : sy;

  const emSombra = relief / 1000;
  const longeX = useTransform(lx, (v) => `${-v * emSombra}em`);
  const longeY = useTransform(ly, (v) => `${-v * emSombra}em`);
  const pertoX = useTransform(lx, (v) => `${(-v * emSombra) / 2}em`);
  const pertoY = useTransform(ly, (v) => `${(-v * emSombra) / 2}em`);
  const brilhoX = useTransform(lx, (v) => `${v * emSombra * 0.35}em`);
  const brilhoY = useTransform(ly, (v) => `${v * emSombra * 0.35}em`);
  const pocaX = useTransform(lx, (v) => `${v * 25}%`);
  const pocaY = useTransform(ly, (v) => `${v * 25}%`);

  // Um piso em toda camada: a fibra nunca some, só ganha força do lado da lâmpada.
  const forca = grain / 100;
  const aceso = (v: number) => (0.25 + 0.75 * Math.max(0, v)) * forca;
  const leste = useTransform(lx, (v) => aceso(v));
  const oeste = useTransform(lx, (v) => aceso(-v));
  const sul = useTransform(ly, (v) => aceso(v));
  const norte = useTransform(ly, (v) => aceso(-v));

  const poke = useIdle(
    caixa,
    () => {
      const a = Math.random() * Math.PI * 2;
      tx.set(Math.cos(a));
      ty.set(Math.sin(a) * 0.8);
    },
    3000,
    idle,
  );

  const seguir = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" && !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    poke();
    const r = e.currentTarget.getBoundingClientRect();
    const limita = (v: number) => Math.max(-1, Math.min(1, v));
    tx.set(limita(((e.clientX - r.left) / r.width) * 2 - 1));
    ty.set(limita(((e.clientY - r.top) / r.height) * 2 - 1));
  };

  const camadas = [
    { id: `${uid}l`, azimute: 0, opacity: leste },
    { id: `${uid}o`, azimute: 180, opacity: oeste },
    { id: `${uid}s`, azimute: 90, opacity: sul },
    { id: `${uid}n`, azimute: 270, opacity: norte },
  ];

  return (
    <div
      ref={caixa}
      role="img"
      aria-label={`A palavra ${word} em relevo seco`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        seguir(e);
      }}
      onPointerMove={seguir}
      className={cn(
        "relative isolate grid min-h-56 w-full cursor-crosshair touch-pan-y select-none place-items-center overflow-hidden rounded-[var(--r-surface,1rem)] bg-card [container-type:inline-size]",
        className,
      )}
      {...rest}
    >
      <svg aria-hidden className="pointer-events-none absolute size-0">
        <defs>
          {camadas.map((c) => (
            <FibraDeLuz key={c.id} id={c.id} azimute={c.azimute} />
          ))}
          <filter id={`${uid}b`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves={3} seed={3} result="ruido" />
            <feDisplacementMap in="SourceGraphic" in2="ruido" scale={2} />
          </filter>
          <filter id={`${uid}m`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves={3} seed={11} />
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.1 0 0 0 -0.42" />
          </filter>
        </defs>
      </svg>

      <motion.div
        aria-hidden
        style={{ x: pocaX, y: pocaY }}
        className="pointer-events-none absolute -inset-1/2 -z-10 [background:radial-gradient(closest-side,color-mix(in_srgb,white_34%,transparent),transparent)]"
      />
      {/* O tom que varia devagar: papel de verdade nunca é uma cor só. */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 -z-10 size-full" style={{ opacity: forca * 0.32 }}>
        <rect width="100%" height="100%" filter={`url(#${uid}m)`} />
      </svg>

      <div aria-hidden data-relevo className="grid text-[min(23cqw,10rem)] font-medium tracking-[-0.03em] [font-family:var(--font-display,inherit)]">
        <motion.span style={{ x: longeX, y: longeY, color: SOMBRA, filter: `url(#${uid}b) blur(3px)` }} className={cn(LETRA, "opacity-60")}>
          {word}
        </motion.span>
        <motion.span style={{ x: pertoX, y: pertoY, color: SOMBRA, filter: `url(#${uid}b) blur(0.75px)` }} className={cn(LETRA, "opacity-80")}>
          {word}
        </motion.span>
        <motion.span style={{ x: brilhoX, y: brilhoY, color: LUZ, filter: `url(#${uid}b)` }} className={LETRA}>
          {word}
        </motion.span>
        <span style={{ filter: `url(#${uid}b)` }} className={cn(LETRA, "relative text-card")}>
          {word}
        </span>
      </div>

      {/* Por cima da palavra: a fibra passa pelo relevo, como no papel. */}
      {camadas.map((c) => (
        <motion.svg
          key={c.id}
          aria-hidden
          style={{ opacity: c.opacity }}
          className="pointer-events-none absolute inset-0 size-full [will-change:opacity]"
        >
          <rect width="100%" height="100%" filter={`url(#${c.id})`} />
        </motion.svg>
      ))}
    </div>
  );
}
