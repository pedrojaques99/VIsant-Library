"use client";

import * as React from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform } from "motion/react";

import { useIdle, useInView } from "@/hooks/use-idle";
import { useTilt } from "@/hooks/use-tilt";
import { cn } from "@/lib/utils";

export interface RouteProfileProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** As altitudes da rota, em metros, igualmente espaçadas. */
  altitudes?: number[];
  /**
   * Distância total, em km.
   * @min 1
   * @max 200
   * @step 1
   */
  distance?: number;
  /**
   * Onde o cursor nasce, de 0 a 1.
   * @min 0
   * @max 1
   * @step 0.01
   */
  defaultPosition?: number;
  /** Sozinho na tela, o cursor passeia até alguém pegar nele. */
  idle?: boolean;
  /** Nome do controle para leitor de tela. */
  label?: string;
  onPositionChange?: (position: number) => void;
}

// Rota de exemplo: um relevo liso e determinístico, sem dado de lugar nenhum.
const ROTA = Array.from({ length: 121 }, (_, i) => {
  const t = i / 120;
  return 620 + 1040 * (0.72 * Math.sin(Math.PI * t) ** 1.4 + (0.16 * (1 + Math.sin(t * 13))) / 2 + (0.1 * (1 + Math.sin(t * 29 + 1))) / 2);
});
const ESCALA = [-20, -10, 0, 10, 20];
const inteiro = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const limita01 = (v: number) => Math.max(0, Math.min(1, v));
const anguloDe = (rampa: number) => Math.max(-62, Math.min(62, (Math.atan(rampa / 100) * 180 * 4) / Math.PI));

/**
 * Perfil de rota: leia o caminho pela forma do terreno, com um clinômetro que balança até
 * a inclinação sob o cursor.
 *
 * - **O relevo é a interface.** Da versão do laboratório saíram paradas nomeadas, a linha
 *   de quilômetro e a de subida restante: rótulo demais. Ficaram a altitude, a rampa e a
 *   agulha, e o resto se lê no desenho.
 * - **A agulha pendura por gravidade.** Mola subamortecida: a rampa se sente antes de se ler.
 * - **Inclinar também anda.** O primeiro toque que termina na peça pede o giroscópio, e inclinar o celular rola
 *   o cursor com inércia. Arrasto e teclado continuam sempre lá.
 * - **O passeio sozinho para de vez** quando alguém pega no cursor, para nunca tirar a
 *   pessoa do ponto que ela escolheu.
 * - **`pan-y` no terreno, e o dedo só mexe no cursor depois de andar de lado.** Sem isso, o
 *   começo de uma rolagem em pé já movia a rota. Toque parado também escolhe, ao soltar.
 * - **Movimento reduzido:** cursor e agulha pousam, sem mola nem passeio.
 */
export function RouteProfile({
  altitudes = ROTA,
  distance = 18,
  defaultPosition = 0.2,
  idle = true,
  label = "Posição na rota",
  onPositionChange,
  className,
  ...rest
}: RouteProfileProps) {
  const reduz = useReducedMotion();
  const caixa = React.useRef<HTMLDivElement>(null);
  const visivel = useInView(caixa);
  const dados = React.useMemo(() => {
    const n = Math.max(altitudes.length - 1, 1);
    const topo = Math.max(...altitudes);
    const base = Math.min(...altitudes);
    const yEm = (a: number) => 0.14 + (0.72 * (topo - a)) / (topo - base || 1);
    const linha = altitudes.map((a, i) => `${i ? "L" : "M"}${((i / n) * 320).toFixed(1)} ${(yEm(a) * 120).toFixed(1)}`).join(" ");
    return { n, yEm, linha };
  }, [altitudes]);
  const rampaEm = React.useCallback(
    (i: number) => {
      const a = Math.max(0, i - 1);
      const b = Math.min(dados.n, i + 1);
      return (altitudes[b] - altitudes[a]) / (((b - a) * distance) / dados.n) / 10; // m por km → %
    },
    [altitudes, dados.n, distance],
  );

  const bruto = useMotionValue(limita01(defaultPosition));
  const suave = useSpring(bruto, { stiffness: 260, damping: 32 });
  const p = reduz ? bruto : suave;
  const [i, setI] = React.useState(() => Math.round(limita01(defaultPosition) * dados.n));
  const agulha = useSpring(anguloDe(rampaEm(i)), { stiffness: 120, damping: 9 });
  const tocado = React.useRef(false);
  const preso = React.useRef<{ x: number; y: number; decidido: boolean } | null>(null);
  const gama = React.useRef(0);

  const x = useTransform(p, (v) => `${v * 100}%`);
  const y = useTransform(p, (v) => `${dados.yEm(altitudes[Math.round(limita01(v) * dados.n)]) * 100}%`);
  const resto = useTransform(p, (v) => 1 - v);

  useMotionValueEvent(p, "change", (v) => {
    setI(Math.round(limita01(v) * dados.n));
    onPositionChange?.(limita01(v));
  });
  React.useEffect(() => {
    const a = anguloDe(rampaEm(i));
    if (reduz) agulha.jump(a);
    else agulha.set(a);
  }, [i, reduz, agulha, rampaEm]);

  const giro = useTilt((g) => (gama.current = g));
  React.useEffect(() => {
    if (!giro.on || !visivel) return;
    let raf = 0;
    let v = 0;
    const laco = () => {
      const g = Math.abs(gama.current) < 6 ? 0 : gama.current;
      v = (v + (g / 30) * 0.0004) * 0.94;
      if (!preso.current && Math.abs(v) > 0.00001) bruto.set(limita01(bruto.get() + v));
      raf = requestAnimationFrame(laco);
    };
    raf = requestAnimationFrame(laco);
    return () => cancelAnimationFrame(raf);
  }, [giro.on, visivel, bruto]);

  const poke = useIdle(
    caixa,
    () => {
      if (!tocado.current) bruto.set((bruto.get() + 0.13) % 1);
    },
    2800,
    idle,
  );
  const pegar = () => {
    tocado.current = true;
    poke();
  };
  const doX = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    bruto.set(limita01((e.clientX - r.left) / r.width));
  };

  const rampa = rampaEm(i);
  const km = (i / dados.n) * distance;
  const sinal = rampa > 0.5 ? "+" : rampa < -0.5 ? "−" : "";

  return (
    <div ref={caixa} className={cn("flex w-full max-w-md flex-col gap-3 text-foreground", className)} {...rest}>
      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-3">
          <span className="text-[clamp(1.75rem,8vw,2.5rem)] font-medium leading-none tracking-[-0.02em] tabular-nums [font-family:var(--font-display,inherit)]">
            {inteiro.format(altitudes[i])} m
          </span>
          <span className="text-sm tabular-nums text-muted-foreground">
            {sinal}
            {inteiro.format(Math.abs(rampa))}%
          </span>
        </div>
        <div aria-hidden className="relative h-12 w-20 shrink-0 overflow-hidden rounded-t-full border border-b-0 border-border">
          {ESCALA.map((g) => (
            <span key={g} style={{ transform: `rotate(${anguloDe(g)}deg)` }} className="absolute bottom-0 left-1/2 h-10 w-px origin-bottom">
              <span className={cn("absolute left-0 top-0 h-1.5 w-px", g === 0 ? "bg-foreground" : "bg-muted-foreground")} />
            </span>
          ))}
          <motion.span style={{ rotate: agulha, x: "-50%" }} className="absolute bottom-0 left-1/2 h-9 w-0.5 origin-bottom rounded-full bg-foreground" />
          <span className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-[var(--brand)] ring-1 ring-foreground" />
        </div>
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={distance}
        aria-valuenow={Number(km.toFixed(1))}
        aria-valuetext={`km ${km.toFixed(1)}, ${inteiro.format(altitudes[i])} metros, rampa de ${inteiro.format(rampa)}%`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const dedo = e.pointerType === "touch";
          preso.current = { x: e.clientX, y: e.clientY, decidido: !dedo };
          if (!dedo) {
            pegar();
            doX(e);
          }
        }}
        onPointerMove={(e) => {
          const i = preso.current;
          if (!i) return;
          if (!i.decidido) {
            const dx = Math.abs(e.clientX - i.x);
            if (dx < 6 || dx < Math.abs(e.clientY - i.y)) return;
            i.decidido = true;
            pegar();
          }
          doX(e);
        }}
        onPointerUp={(e) => {
          const i = preso.current;
          preso.current = null;
          if (e.pointerType !== "touch" || !i) return;
          giro.enable(); // o iOS só concede o sensor num toque que terminou aqui
          if (!i.decidido) {
            pegar();
            doX(e);
          }
        }}
        onPointerCancel={() => (preso.current = null)}
        onKeyDown={(e) => {
          const agora = Math.round(bruto.get() * dados.n);
          const mapa: Record<string, number> = {
            ArrowRight: agora + 1,
            ArrowUp: agora + 1,
            ArrowLeft: agora - 1,
            ArrowDown: agora - 1,
            PageUp: agora + 10,
            PageDown: agora - 10,
            Home: 0,
            End: dados.n,
          };
          if (!(e.key in mapa)) return;
          e.preventDefault();
          pegar();
          bruto.set(limita01(mapa[e.key] / dados.n));
        }}
        className="relative h-40 w-full cursor-grab touch-pan-y select-none overflow-hidden rounded-[var(--r-control,0.5rem)] bg-muted outline-none focus-visible:[box-shadow:var(--focus)] active:cursor-grabbing"
      >
        <svg viewBox="0 0 320 120" preserveAspectRatio="none" aria-hidden className="absolute inset-0 size-full">
          <path d={`${dados.linha} L320 120 L0 120 Z`} className="fill-[var(--brand)]" />
          <path d={dados.linha} fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" className="stroke-foreground" />
        </svg>
        {/* O que ainda vem fica sob um véu, e só `transform` move o véu. */}
        <motion.div style={{ scaleX: resto }} className="pointer-events-none absolute inset-0 origin-right [background:color-mix(in_srgb,var(--muted)_72%,transparent)]" />
        <motion.div style={{ x }} className="pointer-events-none absolute inset-0">
          <span className="absolute inset-y-0 left-0 w-px bg-foreground" />
          <motion.span style={{ y }} className="absolute inset-0">
            <span className="absolute left-0 top-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground" />
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
}
