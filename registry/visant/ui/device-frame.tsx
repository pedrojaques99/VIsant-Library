"use client";

import * as React from "react";
import { animate, motion, useInView, useMotionValue, type MotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";

import { cn } from "@/lib/utils";

export type DevicePose = "front" | "hero" | "left" | "right" | "flat";
export type DeviceTilt = "none" | "pointer" | "float" | "scroll";
export type DeviceModel = "phone" | "tablet" | "laptop";

export interface DeviceFrameProps {
  /** A tela: qualquer coisa viva, com largura e altura de 100%. */
  children?: React.ReactNode;
  /** O notebook tem base articulada: fica melhor visto de cima, com `rotation` e X negativo. */
  device?: DeviceModel;
  pose?: DevicePose;
  /** `pointer` cai em `float` no toque, porque celular não tem hover. */
  tilt?: DeviceTilt;
  /** Entra girando até a pose. Com movimento reduzido, já nasce nela. */
  intro?: boolean;
  finish?: "graphite" | "silver";
  /** Quem rola, se não for a página. Só vale com `tilt="scroll"`. */
  scrollContainer?: React.RefObject<HTMLElement>;
  /** O que tem a rolagem medida. Aparelho em `sticky` não sai do lugar: passe o trilho dele aqui. */
  scrollTarget?: React.RefObject<HTMLElement>;
  /**
   * Ângulos dirigidos por fora: ignora `pose`, `tilt` e `intro`. Para quem controla o tempo,
   * como uma exportação quadro a quadro, onde mola nenhuma pode interferir.
   */
  rotation?: { x: MotionValue<number>; y: MotionValue<number>; z: MotionValue<number> };
  className?: string;
  style?: React.CSSProperties;
}

const POSES: Record<DevicePose, { x: number; y: number; z: number }> = {
  front: { x: 0, y: 0, z: 0 },
  hero: { x: 14, y: -12, z: 6 },
  left: { x: 6, y: 24, z: -3 },
  right: { x: 6, y: -24, z: 3 },
  flat: { x: 54, y: 0, z: -24 },
};
// Teto do balanço. Mais que isto e a tela interativa fica difícil de acertar.
const BALANCO = 10;
const CAMADAS = Array.from({ length: 10 }, (_, i) => i + 1);
const MOLA = { stiffness: 120, damping: 20, mass: 0.9 };
const ENTRADA = [0.16, 1, 0.3, 1] as const;

/**
 * Aparelho em CSS 3D com a tela viva dentro. Só `transform`, então a animação não
 * refaz layout. A espessura são camadas empilhadas em Z: convence até uns 60° de
 * giro, mas não dá a volta inteira. Para isso seria preciso um modelo em WebGL, e a
 * tela deixaria de ser HTML de verdade.
 *
 * O ponteiro não mexe no aparelho enquanto há botão apertado: tela que foge do
 * arraste é impossível de usar.
 */
export function DeviceFrame({ children, device = "phone", pose = "hero", tilt = "none", intro = true, finish = "graphite", scrollContainer, scrollTarget, rotation, className, style }: DeviceFrameProps) {
  const reduz = useReducedMotion() ?? false;
  const raiz = React.useRef<HTMLDivElement>(null);
  const naTela = useInView(raiz);
  const alvo = POSES[pose];

  const px = useSpring(alvo.x, MOLA);
  const py = useSpring(alvo.y, MOLA);
  const pz = useSpring(alvo.z, MOLA);
  const ax = useSpring(0, MOLA);
  const ay = useSpring(0, MOLA);
  const entrada = useMotionValue(intro && !reduz && !rotation ? 0 : 1);

  React.useEffect(() => {
    for (const [mv, n] of [[px, alvo.x], [py, alvo.y], [pz, alvo.z]] as const) {
      if (reduz) mv.jump(n);
      else mv.set(n);
    }
  }, [alvo, px, py, pz, reduz]);

  React.useEffect(() => {
    if (!intro || reduz || rotation) return;
    const a = animate(entrada, 1, { duration: 1, ease: ENTRADA });
    return () => a.stop();
  }, [intro, reduz, entrada]);

  const modo = reduz || rotation ? "none" : tilt;

  React.useEffect(() => {
    ax.set(0);
    ay.set(0);
    if (!naTela || modo === "none" || modo === "scroll") return;
    const flutua = modo === "float" || window.matchMedia("(pointer: coarse)").matches;
    if (flutua) {
      let raf = 0;
      const t0 = performance.now();
      const passo = (t: number) => {
        ax.set(Math.sin((t - t0) / 1900) * BALANCO * 0.5);
        ay.set(Math.cos((t - t0) / 2600) * BALANCO * 0.7);
        raf = requestAnimationFrame(passo);
      };
      raf = requestAnimationFrame(passo);
      return () => cancelAnimationFrame(raf);
    }
    const mover = (e: PointerEvent) => {
      if (e.buttons) return;
      ay.set(((e.clientX / window.innerWidth) * 2 - 1) * BALANCO);
      ax.set((1 - (e.clientY / window.innerHeight) * 2) * BALANCO);
    };
    window.addEventListener("pointermove", mover, { passive: true });
    return () => window.removeEventListener("pointermove", mover);
  }, [modo, naTela, ax, ay]);

  const { scrollYProgress } = useScroll({ target: scrollTarget ?? raiz, container: scrollContainer, offset: ["start end", "end start"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (modo !== "scroll") return;
    ay.set((p - 0.5) * 2 * BALANCO * 2.4);
    ax.set((0.5 - p) * BALANCO);
  });

  const rotateX = useTransform([px, ax, entrada], ([p, a, e]: number[]) => p + a + (1 - e) * 38);
  const rotateY = useTransform([py, ay, entrada], ([p, a, e]: number[]) => p + a - (1 - e) * 26);
  const rotateZ = useTransform([pz, entrada], ([p, e]: number[]) => p + (1 - e) * 6);
  const y = useTransform(entrada, (e) => `${(1 - e) * 12}%`);
  // O brilho anda ao contrário do giro: é ele que faz o vidro da tela parecer vidro.
  const brilho = useTransform([rotation?.y ?? py, ay], ([p, a]: number[]) => `${(p + a) * -1.6}%`);

  return (
    <div ref={raiz} className={cn("device-frame", className)} data-device={device} data-finish={finish} style={style}>
      <motion.div className="device-frame-corpo" style={{ rotateX: rotation?.x ?? rotateX, rotateY: rotation?.y ?? rotateY, rotateZ: rotation?.z ?? rotateZ, y, opacity: entrada }}>
        {CAMADAS.map((n) => (
          <span key={n} className="device-frame-camada" style={{ "--c": n } as React.CSSProperties} aria-hidden />
        ))}
        {device === "phone" ? (
          <>
            <span className="device-frame-botao" data-lado="e" style={{ "--t": "20%", "--a": "6%" } as React.CSSProperties} aria-hidden />
            <span className="device-frame-botao" data-lado="e" style={{ "--t": "28%", "--a": "10%" } as React.CSSProperties} aria-hidden />
            <span className="device-frame-botao" data-lado="d" style={{ "--t": "25%", "--a": "14%" } as React.CSSProperties} aria-hidden />
          </>
        ) : null}
        {device === "tablet" ? <span className="device-frame-botao" data-lado="t" style={{ "--t": "8%", "--a": "6%" } as React.CSSProperties} aria-hidden /> : null}
        {device === "laptop" ? (
          <span className="device-frame-base" aria-hidden>
            {CAMADAS.map((n) => (
              <span key={n} className="device-frame-camada" style={{ "--c": n } as React.CSSProperties} />
            ))}
            <span className="device-frame-deck">
              <span className="device-frame-teclado" />
              <span className="device-frame-trackpad" />
            </span>
          </span>
        ) : null}
        <div className="device-frame-frente">
          {device === "tablet" ? <span className="device-frame-camera" aria-hidden /> : null}
          <div className="device-frame-tela">
            {children}
            {device === "tablet" ? null : <span className="device-frame-ilha" aria-hidden />}
            <motion.span className="device-frame-brilho" style={{ x: brilho }} aria-hidden />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
