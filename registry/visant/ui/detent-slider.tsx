"use client";

import * as React from "react";
import { motion, useReducedMotion, useSpring, useTransform } from "motion/react";

import { cn } from "@/lib/utils";

export interface DetentSliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Valor controlado, de 1 a 100. */
  value?: number;
  /**
   * Onde a peça nasce quando é livre.
   * @min 1
   * @max 100
   * @step 1
   */
  defaultValue?: number;
  /** As paradas que puxam o polegar. */
  stops?: number[];
  /**
   * A que distância uma parada agarra.
   * @min 0
   * @max 10
   * @step 1
   */
  magnet?: number;
  /** A consequência do valor, em letra grande. Os dígitos rolam. */
  format?: (value: number) => string;
  /** O nome do que o número grande mede, em uma linha acima dele. */
  caption?: string;
  /** O botão de confirmar. Sem ele, a peça é só o controle. */
  action?: string | ((value: number) => string);
  /** Nome do controle para leitor de tela. */
  label?: string;
  onValueChange?: (value: number) => void;
  onAction?: (value: number) => void;
}

const PARADAS = [25, 50, 75, 100];
const MOLA = { stiffness: 420, damping: 34 };
const limita = (v: number) => Math.max(1, Math.min(100, Math.round(v)));

/** Um dígito é uma coluna de 0 a 9 que rola até o valor. */
function Digito({ d, reduz }: { d: number; reduz: boolean | null }) {
  const v = useSpring(d, { stiffness: 260, damping: 28 });
  React.useEffect(() => {
    if (reduz) v.jump(d);
    else v.set(d);
  }, [d, reduz, v]);
  const y = useTransform(v, (n) => `${-n}em`);
  return (
    <span className="inline-block h-[1em] overflow-hidden">
      <motion.span style={{ y }} className="flex flex-col">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="h-[1em]">
            {i}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/** Ancorado à direita: cada coluna fica no lugar enquanto o valor muda de tamanho. */
function Rolante({ texto, reduz }: { texto: string; reduz: boolean | null }) {
  return (
    <span aria-hidden className="inline-flex flex-row-reverse leading-none tabular-nums">
      {[...texto].reverse().map((c, i) =>
        /\d/.test(c) ? (
          <Digito key={`d${i}`} d={Number(c)} reduz={reduz} />
        ) : (
          <span key={`c${i}`} className="whitespace-pre">
            {c}
          </span>
        ),
      )}
    </span>
  );
}

/**
 * Slider com paradas: mostra a consequência exata em letra grande, antes de confirmar. O
 * polegar agarra nas paradas com um pulso no ponto e uma vibração onde o aparelho deixa.
 *
 * - **O valor é sempre 1 a 100, e a consequência vem de fora.** O número grande sai de
 *   `format`, então a peça serve para fechar parte de uma posição, repartir uma conta ou
 *   dividir um orçamento, sem saber de nada disso.
 * - **Dígitos que rolam, não que trocam.** O olho acompanha a mudança, e a coluna fixa à
 *   direita evita que o número dance.
 * - **Sem cor própria.** A versão do laboratório tinha um brilho iridescente e verde e
 *   vermelho no resultado; caiu tudo. O sinal do número já diz se é ganho ou perda.
 * - **`pan-y`.** O gesto é de lado: rolar a página em pé continua funcionando por cima.
 * - **Movimento reduzido:** o número e o polegar pousam, sem rolar e sem pulso.
 */
export function DetentSlider({
  value,
  defaultValue = 50,
  stops = PARADAS,
  magnet = 3,
  format = (v) => `${v}%`,
  caption,
  action,
  label = "Valor",
  onValueChange,
  onAction,
  className,
  ...rest
}: DetentSliderProps) {
  const reduz = useReducedMotion();
  const trilho = React.useRef<HTMLDivElement>(null);
  const [interno, setInterno] = React.useState(defaultValue);
  const atual = limita(value ?? interno);
  const polegar = useSpring(atual, MOLA);
  const pulso = useSpring(1, { stiffness: 600, damping: 18 });
  const preenchido = useTransform(polegar, (v) => v / 100);
  const posicao = useTransform(polegar, (v) => `${v}%`);

  React.useEffect(() => {
    if (reduz) polegar.jump(atual);
    else polegar.set(atual);
  }, [atual, reduz, polegar]);

  const definir = (proximo: number, agarra = false) => {
    const alvo = agarra ? (stops.find((s) => Math.abs(s-proximo) <= magnet) ?? proximo) : proximo;
    const v = limita(alvo);
    if (v === atual) return;
    if (stops.includes(v)) {
      if (!reduz) {
        pulso.jump(1.8);
        pulso.set(1);
      }
      navigator.vibrate?.(8);
    }
    setInterno(v);
    onValueChange?.(v);
  };

  const doX = (x: number) => {
    const r = trilho.current!.getBoundingClientRect();
    return ((x - r.left) / r.width) * 100;
  };
  const resultado = format(atual);
  const rotulo = typeof action === "function" ? action(atual) : action;

  return (
    <div className={cn("flex w-full max-w-sm flex-col gap-5 text-foreground", className)} {...rest}>
      <div className="flex flex-col gap-2">
        {caption ? <span className="text-sm text-muted-foreground">{caption}</span> : null}
        <span className="text-[clamp(2.25rem,11vw,3.25rem)] font-medium tracking-[-0.02em] [font-family:var(--font-display,inherit)]">
          <Rolante texto={resultado} reduz={reduz} />
          <span className="sr-only">{resultado}</span>
        </span>
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={100}
        aria-valuenow={atual}
        aria-valuetext={`${atual}%, ${resultado}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          definir(doX(e.clientX), true);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) definir(doX(e.clientX), true);
        }}
        onKeyDown={(e) => {
          const proxima = stops.find((s) => s > atual) ?? 100;
          const anterior = [...stops].reverse().find((s) => s < atual) ?? 1;
          const mapa: Record<string, number> = {
            ArrowRight: atual + 1,
            ArrowUp: atual + 1,
            ArrowLeft: atual - 1,
            ArrowDown: atual - 1,
            PageUp: proxima,
            PageDown: anterior,
            Home: 1,
            End: 100,
          };
          if (!(e.key in mapa)) return;
          e.preventDefault();
          definir(mapa[e.key]);
        }}
        className="relative h-12 cursor-grab touch-pan-y select-none overflow-hidden rounded-[var(--r-control,0.5rem)] outline-none focus-visible:[box-shadow:var(--focus)] active:cursor-grabbing"
      >
        {/* `overflow-hidden` na caixa: a camada do polegar anda em `transform` e somaria largura à rolagem de quem contém a peça. */}
        <div ref={trilho} className="absolute inset-x-3 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border">
          <motion.div style={{ scaleX: preenchido }} className="absolute inset-0 origin-left rounded-full bg-foreground" />
          {stops.map((s) => (
            <motion.span
              key={s}
              aria-hidden
              style={{ left: `${s}%`, scale: s === atual ? pulso : 1, x: "-50%", y: "-50%" }}
              className={cn("absolute top-1/2 size-1.5 rounded-full", s <= atual ? "bg-background" : "bg-muted-foreground")}
            />
          ))}
          <motion.div style={{ x: posicao }} className="pointer-events-none absolute inset-0">
            <span className="absolute left-0 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground [box-shadow:var(--e-raised,none)]" />
          </motion.div>
        </div>
      </div>

      {rotulo ? (
        <button
          type="button"
          onClick={() => onAction?.(atual)}
          className="h-11 rounded-[var(--r-control,0.5rem)] bg-foreground px-4 text-sm font-medium text-background outline-none transition-transform [transition-duration:var(--dur-fast,150ms)] [transition-timing-function:var(--ease-out,ease-out)] focus-visible:[box-shadow:var(--focus)] active:scale-[0.98]"
        >
          {rotulo}
        </button>
      ) : null}
    </div>
  );
}
