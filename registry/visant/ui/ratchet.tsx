"use client";

import * as React from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform } from "motion/react";

import { useIdle } from "@/hooks/use-idle";
import { cn } from "@/lib/utils";

export interface RatchetProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /**
   * Dentes da catraca.
   * @min 8
   * @max 32
   * @step 1
   */
  teeth?: number;
  /**
   * Curso do gesto por dente, em px.
   * @min 16
   * @max 120
   * @step 4
   */
  pitch?: number;
  /** Sozinha na tela, a catraca dá um clique de tempos em tempos. */
  idle?: boolean;
  /** Nome do controle para leitor de tela. */
  label?: string;
  /** Avisa a cada dente que passa, com o total desde que a peça montou. */
  onWind?: (clicks: number) => void;
}

const R_PONTA = 44;
const R_RAIZ = 36;
// O aço sai do tema: tinta e fundo misturados em vários tons, nenhum valor próprio.
const ACO = (pct: number) => `color-mix(in srgb, var(--foreground) ${pct}%, var(--background))`;
const TORNEADO = `conic-gradient(from 25deg, ${ACO(52)}, ${ACO(8)} 11%, ${ACO(40)} 22%, ${ACO(80)} 36%, ${ACO(48)} 50%, ${ACO(6)} 61%, ${ACO(38)} 72%, ${ACO(78)} 87%, ${ACO(52)})`;
const CHAPA = `conic-gradient(from 205deg, ${ACO(30)}, ${ACO(5)} 14%, ${ACO(26)} 30%, ${ACO(60)} 48%, ${ACO(24)} 64%, ${ACO(6)} 78%, ${ACO(30)})`;
const CUBO = `conic-gradient(from 25deg, ${ACO(70)}, ${ACO(10)} 22%, ${ACO(58)} 46%, ${ACO(12)} 72%, ${ACO(70)})`;
const RISCOS = `repeating-radial-gradient(circle at 50% 50%, color-mix(in srgb, white 7%, transparent) 0 1px, color-mix(in srgb, black 7%, transparent) 1px 2px)`;
const FUROS = [0, 90, 180, 270];

/** A engrenagem como polígono em %: escala com a caixa e cabe num `clip-path`. */
function contorno(dentes: number) {
  const passo = 360 / dentes;
  const ponto = (r: number, grau: number) => {
    const t = (grau * Math.PI) / 180;
    const k = 50 * (r / R_PONTA);
    return `${(50 + k * Math.cos(t)).toFixed(2)}% ${(50 + k * Math.sin(t)).toFixed(2)}%`;
  };
  const lados: string[] = [];
  for (let i = 0; i < dentes; i++) {
    const a = -90 + i * passo;
    lados.push(ponto(R_RAIZ, a), ponto(R_PONTA, a + passo * 0.1)); // face íngreme, depois a rampa longa
  }
  return `polygon(${lados.join(",")})`;
}

const subida = (s: number, curso: number) => Math.min((s % curso) / curso / 0.9, 1) * 15;

/**
 * Catraca: o gesto dá corda numa roda dentada que só gira para um lado, com a lingueta
 * subindo a rampa de cada dente e caindo da face íngreme.
 *
 * - **Só o curso para a frente conta.** Voltar deixa a roda onde está, então dar corda é
 *   descer, voltar e descer de novo, como uma chave de catraca.
 * - **Metal é luz que não gira.** O reflexo do aço torneado fica parado enquanto o recorte
 *   da roda gira: a roda vai num sentido e o gradiente, dentro dela, no sentido contrário.
 *   Tudo em `transform`, sem repintar por quadro. Um desvio pequeno faz o reflexo cintilar.
 * - **O clique tem três partes:** a lingueta quica (mola subamortecida), a roda recua um
 *   fio e o ponto de contato brilha. É isso que dá vida ao desenho.
 * - **Arrasto em pé, com `pan-x`.** Um rolador nativo, a primeira versão, prendia a página
 *   no celular enquanto o curso não acabasse. A roda do mouse é ouvida sem `preventDefault`:
 *   dá corda e a página rola junto, sem armadilha.
 * - **Movimento reduzido:** a lingueta só pousa, sem quique, sem recuo e sem brilho.
 */
export function Ratchet({ teeth = 16, pitch = 40, idle = true, label = "Catraca", onWind, className, ...rest }: RatchetProps) {
  const reduz = useReducedMotion();
  const caixa = React.useRef<HTMLDivElement>(null);
  const nasce = pitch * 2.55; // no meio do dente: a foto já mostra a lingueta levantada
  const curso = useMotionValue(nasce);
  const mola = useSpring(curso, { stiffness: 520, damping: 42 });
  const visto = reduz ? curso : mola;
  const passo = 360 / teeth;
  const lingueta = useSpring(subida(nasce, pitch), { stiffness: 700, damping: 14 });
  const recuo = useSpring(0, { stiffness: 900, damping: 22 });
  const brilho = useSpring(0, { stiffness: 260, damping: 26 });
  const giro = useTransform([visto, recuo], ([s, r]: number[]) => (s / pitch) * passo + r);
  const reflexo = useTransform(giro, (g) => -g + Math.sin((g * Math.PI) / 45) * 6);
  const preso = React.useRef<{ y: number; escala: number } | null>(null);
  const dente = React.useRef(Math.floor(nasce / pitch));
  const total = React.useRef(0);
  const [cliques, setCliques] = React.useState(0);
  const forma = React.useMemo(() => contorno(teeth), [teeth]);

  useMotionValueEvent(visto, "change", (s) => {
    if (reduz) lingueta.jump(subida(s, pitch));
    else lingueta.set(subida(s, pitch));
    const agora = Math.floor(s / pitch);
    if (agora === dente.current) return;
    total.current += agora - dente.current;
    dente.current = agora;
    setCliques(total.current);
    onWind?.(total.current);
    if (reduz) return;
    lingueta.jump(0);
    recuo.jump(-0.9);
    recuo.set(0);
    brilho.jump(1);
    brilho.set(0);
  });

  const poke = useIdle(caixa, () => curso.set(curso.get() + pitch), 2600, idle);
  const dar = (d: number) => {
    if (d <= 0) return;
    poke();
    curso.set(curso.get() + d);
  };

  return (
    <div
      ref={caixa}
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuenow={cliques}
      aria-valuetext={`${cliques} ${cliques === 1 ? "clique" : "cliques"}`}
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.setPointerCapture(e.pointerId);
        // Dentro de um palco escalado, o dedo anda em px de tela e a roda em px da peça.
        preso.current = { y: e.clientY, escala: r.height / (e.currentTarget.offsetHeight || r.height) || 1 };
        poke();
      }}
      onPointerMove={(e) => {
        if (!preso.current) return;
        const d = (e.clientY - preso.current.y) / preso.current.escala;
        preso.current.y = e.clientY;
        dar(d);
      }}
      onPointerUp={() => (preso.current = null)}
      onPointerCancel={() => (preso.current = null)}
      onWheel={(e) => dar(e.deltaY)}
      onKeyDown={(e) => {
        if (e.key !== "ArrowDown" && e.key !== "ArrowRight") return;
        e.preventDefault();
        dar(pitch);
      }}
      className={cn(
        "relative aspect-square w-[min(100%,22rem)] cursor-grab touch-pan-x select-none rounded-[var(--r-surface,1rem)] outline-none [container-type:inline-size] focus-visible:[box-shadow:var(--focus)] active:cursor-grabbing",
        className,
      )}
      {...rest}
    >
      {/* 73,3% da caixa = o raio da ponta (44) no viewBox de 120 da lingueta. */}
      <div aria-hidden className="pointer-events-none absolute inset-[13.33%]">
        <span className="absolute inset-[7%] translate-y-[3%] rounded-full blur-md [background:color-mix(in_srgb,black_22%,transparent)]" />
        <motion.div style={{ rotate: giro, clipPath: forma }} className="absolute inset-0 overflow-hidden">
          <motion.div style={{ rotate: reflexo, background: TORNEADO }} className="absolute -inset-[22%]" />
          <span className="absolute inset-0" style={{ background: RISCOS }} />
        </motion.div>
        {/* A chapa e o cubo são redondos: não precisam girar, e a luz neles fica de graça. */}
        <span
          className="absolute inset-[17%] rounded-full [box-shadow:inset_0_1px_2px_color-mix(in_srgb,black_45%,transparent),0_1px_0_color-mix(in_srgb,white_30%,transparent)]"
          style={{ background: `${RISCOS}, ${CHAPA}` }}
        />
        <motion.div style={{ rotate: giro }} className="absolute inset-0">
          {FUROS.map((g) => (
            <span
              key={g}
              style={{ transform: `rotate(${g}deg) translateY(-15cqw)` }}
              className="absolute left-1/2 top-1/2 -ml-[3cqw] -mt-[3cqw] size-[6cqw] rounded-full bg-background [box-shadow:inset_0_1px_2px_color-mix(in_srgb,black_55%,transparent)]"
            />
          ))}
        </motion.div>
        <span
          className="absolute inset-[39%] rounded-full [box-shadow:0_1px_3px_color-mix(in_srgb,black_45%,transparent)]"
          style={{ background: CUBO }}
        />
      </div>

      <svg viewBox="-60 -60 120 120" aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
        <defs>
          <linearGradient id="ratchet-lingueta" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: ACO(22) }} />
            <stop offset="0.45" style={{ stopColor: ACO(70) }} />
            <stop offset="1" style={{ stopColor: ACO(92) }} />
          </linearGradient>
        </defs>
        <motion.g style={{ rotate: lingueta, originX: 1, originY: 0.29 }}>
          <path d="M31,-50 C20,-49 8,-44 0,-36 C10,-38 22,-41 31,-42 Z" fill="url(#ratchet-lingueta)" className="stroke-foreground" strokeWidth={0.5} strokeLinejoin="round" />
        </motion.g>
        <motion.circle cx={1} cy={-37} r={7} style={{ opacity: brilho, fill: "color-mix(in srgb, white 70%, transparent)" }} className="blur-[2px]" />
        <circle cx={30} cy={-46} r={3.5} className="fill-[var(--brand)] stroke-foreground" strokeWidth={1} />
      </svg>
    </div>
  );
}
