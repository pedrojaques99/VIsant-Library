"use client";

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

import { useIdle } from "@/hooks/use-idle";
import { cn } from "@/lib/utils";

export interface WordDialProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "onChange"> {
  /** A palavra. Funciona de 2 a 12 letras: as posições saem da largura de cada letra. */
  word?: string;
  /** Sozinho na tela, o anel dá um passo de tempos em tempos. */
  idle?: boolean;
  /** Nome do controle para leitor de tela. */
  label?: string;
  /** Avisa o arranjo novo, de 0 a 4 (linha, onda, anel, escada, espelho). */
  onArrange?: (index: number) => void;
}

const NOMES = ["linha", "onda", "anel", "escada", "espelho"];
const DETENTE = 360 / NOMES.length;
const LARGURA = 76; // a linha ocupa isto da largura da peça, em cqw
type Lugar = { x: number; y: number; r: number; o: number; sy: number };

/** Onde a letra i fica no arranjo k, em cqw a partir do centro. */
function lugar(k: number, i: number, centros: number[], escala: number, reflexo: boolean): Lugar {
  const n = centros.length;
  const linha: Lugar = { x: centros[i] * escala, y: 0, r: 0, o: 1, sy: 1 };
  if (reflexo) {
    if (k === 4) return { ...linha, y: escala * 0.42, o: 0.32, sy: -1 };
    return { ...lugar(k, i, centros, escala, false), o: 0 };
  }
  const t = n > 1 ? i / (n - 1) : 0.5;
  if (k === 1) return { ...linha, y: Math.sin(t * Math.PI * 2) * 11, r: Math.cos(t * Math.PI * 2) * 15 };
  if (k === 2) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(a) * 30, y: Math.sin(a) * 30, r: (i / n) * 360, o: 1, sy: 1 };
  }
  if (k === 3) return { ...linha, y: (t - 0.5) * 46 };
  if (k === 4) return { ...linha, y: -escala * 0.42 };
  return linha;
}

function Letra({ letra, para, reduz }: { letra: string; para: Lugar; reduz: boolean | null }) {
  const mola = { stiffness: 170, damping: 22 };
  const x = useSpring(para.x, mola);
  const y = useSpring(para.y, mola);
  const r = useSpring(para.r, mola);
  const o = useSpring(para.o, mola);
  const sy = useSpring(para.sy, mola);
  React.useEffect(() => {
    const pares: [typeof x, number][] = [
      [x, para.x],
      [y, para.y],
      [r, para.r],
      [o, para.o],
      [sy, para.sy],
    ];
    for (const [mv, v] of pares) {
      if (reduz) mv.jump(v);
      else mv.set(v);
    }
  }, [para.x, para.y, para.r, para.o, para.sy, reduz, x, y, r, o, sy]);
  const tx = useTransform(x, (v) => `calc(-50% + ${v}cqw)`);
  const ty = useTransform(y, (v) => `calc(-50% + ${v}cqw)`);
  return (
    <motion.span style={{ x: tx, y: ty, rotate: r, opacity: o, scaleY: sy }} className="absolute left-1/2 top-1/2 leading-none">
      {letra}
    </motion.span>
  );
}

/**
 * Word Dial: uma palavra e cinco arranjos, girados como o tambor de um caleidoscópio. As
 * mesmas letras se reordenam em linha, onda, anel, escada e espelho. A marca continua ela
 * mesma enquanto o arranjo muda.
 *
 * - **Serve para qualquer palavra.** A primeira versão tinha quatro letras cravadas numa
 *   grade e virava bloco. Aqui cada letra é medida no navegador e o corpo se ajusta para a
 *   linha caber, então o I estreito e o M largo ficam com o espaçamento certo.
 * - **Só a tinta do tema.** Nada de foil: `--foreground` nas letras e `--border` no anel.
 *   Quem dá presença é a forma.
 * - **Detentes de verdade.** Tocar dá um passo; girar assenta no arranjo mais próximo, com
 *   a figura inclinando um pouco no caminho.
 * - **`touch-none` no anel.** Gesto circular não tem eixo para ceder à rolagem; a peça
 *   não ocupa mais que o próprio anel.
 * - **Movimento reduzido:** as letras pousam, sem mola e sem passo sozinho.
 */
export function WordDial({ word = "VISANT", idle = true, label = "Arranjo da palavra", onArrange, className, ...rest }: WordDialProps) {
  const reduz = useReducedMotion();
  const anel = React.useRef<HTMLDivElement>(null);
  const regua = React.useRef<HTMLSpanElement>(null);
  const letras = React.useMemo(() => [...word], [word]);
  const giro = useMotionValue(0);
  const [k, setK] = React.useState(0);
  // Antes de medir, cada letra vale 0,62 em: o primeiro quadro já sai perto do certo.
  const [larguras, setLarguras] = React.useState<number[]>(() => letras.map(() => 0.62));
  const preso = React.useRef<{ a: number; de: number; moveu: boolean } | null>(null);
  const mola = useSpring(giro, { stiffness: 120, damping: 20 });
  const tambor = reduz ? giro : mola;
  const inclina = useTransform(tambor, (t) => (t - Math.round(t / DETENTE) * DETENTE) * 0.25);

  React.useEffect(() => {
    const medir = () => {
      const el = regua.current;
      if (!el) return;
      const corpo = parseFloat(getComputedStyle(el).fontSize) || 100;
      setLarguras([...el.children].map((c) => (c as HTMLElement).offsetWidth / corpo));
    };
    medir();
    document.fonts?.ready.then(medir);
  }, [word]);

  const total = larguras.reduce((s, l) => s + l, 0) || 1;
  const escala = LARGURA / total; // cqw por em
  const centros: number[] = [];
  let acumulado = -total / 2;
  for (const l of larguras) {
    centros.push(acumulado + l / 2);
    acumulado += l;
  }

  const ir = (grau: number) => {
    giro.set(grau);
    const novo = ((Math.round(grau / DETENTE) % 5) + 5) % 5;
    if (novo !== k) onArrange?.(novo);
    setK(novo);
  };
  const passo = (dir: number) => ir((Math.round(giro.get() / DETENTE) + dir) * DETENTE);
  const poke = useIdle(anel, () => passo(1), 3400, idle);

  const angulo = (e: React.PointerEvent) => {
    const r = anel.current!.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };

  return (
    <div
      ref={anel}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={1}
      aria-valuemax={NOMES.length}
      aria-valuenow={k + 1}
      aria-valuetext={`${word}, ${NOMES[k]}`}
      onPointerDown={(e) => {
        poke();
        e.currentTarget.setPointerCapture(e.pointerId);
        preso.current = { a: angulo(e), de: giro.get(), moveu: false };
      }}
      onPointerMove={(e) => {
        if (!preso.current) return;
        poke();
        const d = ((angulo(e) - preso.current.a + 540) % 360) - 180;
        if (Math.abs(d) > 4) preso.current.moveu = true;
        if (!preso.current.moveu) return;
        preso.current.a = angulo(e);
        preso.current.de += d;
        ir(preso.current.de);
      }}
      onPointerUp={() => {
        if (!preso.current) return;
        if (!preso.current.moveu) passo(1);
        else ir(Math.round(giro.get() / DETENTE) * DETENTE);
        preso.current = null;
      }}
      onPointerCancel={() => (preso.current = null)}
      onKeyDown={(e) => {
        const dir = ({ ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 } as Record<string, number>)[e.key];
        if (!dir) return;
        e.preventDefault();
        poke();
        passo(dir);
      }}
      className={cn(
        "relative aspect-square w-[min(100%,24rem)] cursor-grab touch-none select-none overflow-hidden rounded-full text-foreground outline-none [container-type:inline-size] focus-visible:[box-shadow:var(--focus)] active:cursor-grabbing",
        className,
      )}
      {...rest}
    >
      <motion.div aria-hidden style={{ rotate: tambor }} className="absolute inset-[3%] rounded-full border border-border">
        {NOMES.map((n, i) => (
          <span key={n} style={{ transform: `rotate(${i * DETENTE}deg)` }} className="absolute inset-0 flex justify-center">
            <span className={cn("-mt-1 h-2 w-px", i === 0 ? "bg-foreground" : "bg-muted-foreground")} />
          </span>
        ))}
      </motion.div>
      <motion.div
        aria-hidden
        style={{ rotate: inclina, fontSize: `${escala}cqw` }}
        className="absolute inset-0 font-semibold [font-family:var(--font-display,inherit)]"
      >
        {letras.map((c, i) => (
          <Letra key={`l${i}`} letra={c} para={lugar(k, i, centros, escala, false)} reduz={reduz} />
        ))}
        {letras.map((c, i) => (
          <Letra key={`r${i}`} letra={c} para={lugar(k, i, centros, escala, true)} reduz={reduz} />
        ))}
        {/* A régua: invisível e sem caixa, para não somar à altura de quem contém a peça. */}
        <span className="invisible absolute left-0 top-0 size-0 overflow-hidden">
          <span ref={regua} className="inline-flex whitespace-pre" style={{ fontSize: "100px" }}>
            {letras.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </span>
        </span>
      </motion.div>
    </div>
  );
}
