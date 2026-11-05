"use client";

import * as React from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform } from "motion/react";

import { useIdle } from "@/hooks/use-idle";
import { cn } from "@/lib/utils";

export interface CompassProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Para onde a agulha aponta, em graus (0 = norte, sentido horário). Passando esta prop, quem manda é você. */
  bearing?: number;
  /** Onde a agulha nasce quando a peça é livre. */
  defaultBearing?: number;
  /**
   * Quanto o mostrador inclina em direção ao ponteiro, em graus.
   * @min 0
   * @max 30
   * @step 1
   */
  depth?: number;
  /** A letra do topo do mostrador. */
  north?: string;
  /** Sozinha na tela, a agulha procura o norte de tempos em tempos. */
  idle?: boolean;
  /** Nome do controle para leitor de tela. */
  label?: string;
  onBearingChange?: (bearing: number) => void;
}

const MARCAS = Array.from({ length: 36 }, (_, i) => i * 10);
const INCLINA = { stiffness: 120, damping: 16 };
// A inclinação com que nasce, em fração de `depth`: a foto já mostra as camadas.
const NASCE = { x: -0.8, y: -0.65 };

/**
 * Bússola: a agulha vai até o ponteiro como uma de verdade vai ao norte, passa, volta e
 * para. O mostrador inclina em direção à mão, e a distância entre as camadas é que dá a
 * profundidade.
 *
 * - **Ângulo desenrolado.** O alvo é a menor volta a partir de onde a agulha está. Sem
 *   isso, cruzar de 179° para -179° dá uma volta inteira para trás.
 * - **Mola subamortecida de propósito.** A passada do ponto é o magnetismo.
 * - **Camadas de verdade em `preserve-3d`.** Sombra, base, marcas, agulha, eixo e vidro
 *   ficam em alturas diferentes e se deslocam entre si ao inclinar. Por isso a peça nasce
 *   inclinada: profundidade não pode depender de hover.
 * - **`touch-none` só no mostrador.** Gesto circular não tem eixo para ceder à rolagem;
 *   a página continua rolando pelo resto da peça. O mouse segue a peça inteira.
 * - **Movimento reduzido:** a agulha só aponta, e a inclinação fica na pose de nascença.
 * - **Marca em forma, nunca em texto.** A marca vai no eixo; a letra usa `--foreground`.
 */
export function Compass({
  bearing,
  defaultBearing = -62,
  depth = 18,
  north = "N",
  idle = true,
  label = "Direção",
  onBearingChange,
  className,
  ...rest
}: CompassProps) {
  const reduz = useReducedMotion();
  const caixa = React.useRef<HTMLDivElement>(null);
  const disco = React.useRef<HTMLDivElement>(null);
  const preso = React.useRef(false);
  const alvo = React.useRef(bearing ?? defaultBearing);
  const angulo = useSpring(alvo.current, { stiffness: 120, damping: 7 });
  const nx = useMotionValue(NASCE.x);
  const ny = useMotionValue(NASCE.y);
  const sx = useSpring(nx, INCLINA);
  const sy = useSpring(ny, INCLINA);
  const px = reduz ? nx : sx;
  const py = reduz ? ny : sy;
  const rotateY = useTransform(px, (v) => v * depth);
  const rotateX = useTransform(py, (v) => -v * depth);
  // A sombra foge da mão e o brilho vai atrás dela: é o que convence de que há altura.
  const sombraX = useTransform(px, (v) => `${-v * 9}%`);
  const sombraY = useTransform(py, (v) => `${5 - v * 9}%`);
  const brilhoX = useTransform(px, (v) => `${v * 26}%`);
  const brilhoY = useTransform(py, (v) => `${v * 26}%`);
  const [grau, setGrau] = React.useState(() => Math.round(((alvo.current % 360) + 360) % 360));

  useMotionValueEvent(angulo, "change", (a) => setGrau(Math.round(((a % 360) + 360) % 360)));

  const apontar = React.useCallback(
    (deg: number, avisar = true) => {
      alvo.current += ((((deg - alvo.current + 540) % 360) + 360) % 360) - 180;
      if (reduz) angulo.jump(alvo.current);
      else angulo.set(alvo.current);
      if (avisar) onBearingChange?.(((deg % 360) + 360) % 360);
    },
    [reduz, angulo, onBearingChange],
  );

  React.useEffect(() => {
    if (bearing !== undefined) apontar(bearing, false);
  }, [bearing, apontar]);

  const livre = bearing === undefined;
  const poke = useIdle(
    caixa,
    () => {
      apontar((Math.random() - 0.5) * 120, false);
      nx.set((Math.random() - 0.5) * 1.6);
      ny.set((Math.random() - 0.5) * 1.6);
    },
    2800,
    idle && livre,
  );

  const seguir = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" && !preso.current) return;
    const r = disco.current?.getBoundingClientRect();
    if (!r) return;
    poke();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const raio = r.width / 2 || 1;
    nx.set(Math.max(-1, Math.min(1, dx / raio)));
    ny.set(Math.max(-1, Math.min(1, dy / raio)));
    if (livre && Math.hypot(dx, dy) >= 6) apontar((Math.atan2(dy, dx) * 180) / Math.PI + 90); // centro não tem direção
  };
  const aoSair = () => {
    preso.current = false;
    nx.set(NASCE.x);
    ny.set(NASCE.y);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const passo = ({ ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 } as Record<string, number>)[e.key];
    if (!passo || !livre) return;
    e.preventDefault();
    poke();
    apontar(alvo.current + passo);
  };

  const camada = (z: number): React.CSSProperties => ({ transform: `translateZ(${z}px)` });

  return (
    <div
      ref={caixa}
      onPointerMove={seguir}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") aoSair();
      }}
      className={cn("grid w-full select-none place-items-center [perspective:56rem]", className)}
      {...rest}
    >
      <motion.div
        ref={disco}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={grau}
        aria-valuetext={`${grau} graus`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          preso.current = true;
          seguir(e);
        }}
        onPointerUp={(e) => {
          preso.current = false;
          if (e.pointerType !== "mouse") aoSair();
        }}
        onPointerCancel={aoSair}
        onKeyDown={onKeyDown}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative aspect-square w-[min(100%,20rem)] cursor-grab touch-none rounded-full outline-none [container-type:inline-size] focus-visible:[box-shadow:var(--focus)] active:cursor-grabbing"
      >
        <motion.span
          aria-hidden
          style={{ x: sombraX, y: sombraY, z: -36 }}
          className="absolute inset-[2%] rounded-full blur-xl [background:color-mix(in_srgb,black_30%,transparent)]"
        />
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border border-border [background:radial-gradient(circle_at_50%_38%,var(--card),color-mix(in_srgb,var(--foreground)_7%,var(--card)))]"
        />
        <span aria-hidden className="absolute inset-[3%] rounded-full border border-border" style={camada(6)} />

        <span aria-hidden className="absolute inset-[5%]" style={camada(12)}>
          {MARCAS.map((t) => (
            <span key={t} style={{ transform: `rotate(${t}deg)` }} className="absolute inset-0 flex justify-center">
              <span className={t % 90 === 0 ? "h-[6cqw] w-0.5 bg-foreground" : "h-[3cqw] w-px bg-muted-foreground"} />
            </span>
          ))}
          <span className="absolute left-1/2 top-[8cqw] -translate-x-1/2 text-[8cqw] font-medium leading-none text-foreground [font-family:var(--font-display,inherit)]">
            {north}
          </span>
        </span>

        {/* A sombra da agulha gira junto, mais embaixo: é ela que descola a agulha do mostrador. */}
        <motion.span
          aria-hidden
          style={{ rotate: angulo, z: 18, x: "1.5cqw", y: "2.5cqw" }}
          className="absolute inset-[15%] flex flex-col items-center opacity-25 blur-[2px]"
        >
          <span className="h-1/2 w-[5cqw] bg-black [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
          <span className="h-1/2 w-[5cqw] bg-black [clip-path:polygon(0_0,100%_0,50%_100%)]" />
        </motion.span>
        <motion.span aria-hidden style={{ rotate: angulo, z: 34 }} className="absolute inset-[15%] flex flex-col items-center">
          <span className="h-1/2 w-[5cqw] bg-foreground [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
          <span className="h-1/2 w-[5cqw] bg-muted-foreground [clip-path:polygon(0_0,100%_0,50%_100%)]" />
        </motion.span>
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 -ml-[3.5cqw] -mt-[3.5cqw] size-[7cqw] rounded-full border-2 border-foreground bg-[var(--brand)]"
          style={camada(40)}
        />

        {/* O vidro fica dentro do aro: quem escorrega é o reflexo, senão ele sai pela borda ao inclinar. */}
        <span aria-hidden className="absolute inset-[3%] overflow-hidden rounded-full" style={camada(8)}>
          <motion.span
            style={{ x: brilhoX, y: brilhoY }}
            className="absolute -inset-1/4 [background:radial-gradient(closest-side_at_50%_50%,color-mix(in_srgb,white_28%,transparent),transparent_70%)]"
          />
        </span>
      </motion.div>
    </div>
  );
}
