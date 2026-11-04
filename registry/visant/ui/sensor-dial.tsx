"use client";

import * as React from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform } from "motion/react";
import { Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SensorDialProps {
  /** Ângulo onde o alvo está, em graus (0 = topo, sentido horário). */
  target?: number;
  /** Quebra de linha com `\n`. */
  title?: string;
  foundTitle?: string;
  action?: string;
  activeAction?: string;
  /** Contorno do aparelho no pé da folha: mostra como segurar. Desligue fora de pareamento. */
  guide?: boolean;
  /** Avisa quando o feixe entra ou sai do alvo. */
  onLock?: (locked: boolean) => void;
  onAction?: (active: boolean) => void;
  className?: string;
}

const N = 120;
const C = 200;
const FOLGA = 8;
const INICIO = 222;
const distancia = (a: number, b: number) => Math.abs((((a - b + 540) % 360) + 360) % 360 - 180);
const ponto = (grau: number, r: number) => {
  const t = ((grau - 90) * Math.PI) / 180;
  return [C + r * Math.cos(t), C + r * Math.sin(t)].map((n) => +n.toFixed(2));
};
const MARCAS = Array.from({ length: N }, (_, i) => (i * 360) / N);
const EIXOS = [8, 100, 188, 280];
// O feixe: o traço de destaque no meio, os brancos abrindo em volta dele.
const FEIXE = [-14, -9, -4, 1, 6];

/**
 * Mira de pareamento: gire o feixe até o alvo, e o disco cresce conforme chega perto.
 * Em repouso o feixe procura sozinho, sem nunca chegar, porque celular não tem hover.
 *
 * `touch-none` no mostrador de propósito: gesto circular não tem eixo para ceder à
 * rolagem. A página continua rolando em todo o resto da peça. O SVG é só traço; o
 * botão e o texto são HTML ao lado, porque `foreignObject` em SVG girado sai do lugar
 * no Safari.
 */
export function SensorDial({
  target = 8,
  title = "Aproxime a câmera\ndo sensor",
  foundTitle = "Sensor encontrado.\nNão se mexa",
  action = "Iniciar",
  activeAction = "Rastreando",
  guide = true,
  onLock,
  onAction,
  className,
}: SensorDialProps) {
  const reduz = useReducedMotion();
  const angulo = useMotionValue(INICIO);
  const visto = useSpring(angulo, reduz ? { stiffness: 2000, damping: 100 } : { stiffness: 170, damping: 24 });
  const perto = useTransform(visto, (a) => Math.max(0, 1 - distancia(a, target) / 150));
  const disco = useTransform(perto, (n) => 0.86 + 0.26 * n * n);
  const [grau, setGrau] = React.useState(INICIO);
  const [travado, setTravado] = React.useState(false);
  const [ativo, setAtivo] = React.useState(false);
  const preso = React.useRef(false);
  const tocado = React.useRef(false);
  const eco = React.useRef(onLock);
  eco.current = onLock;

  useMotionValueEvent(angulo, "change", (a) => {
    setGrau(Math.round(((a % 360) + 360) % 360));
    setTravado(distancia(a, target) <= FOLGA);
  });
  const primeira = React.useRef(true);
  React.useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    eco.current?.(travado);
  }, [travado]);

  React.useEffect(() => {
    if (reduz) return;
    let raf = 0;
    const t0 = performance.now();
    const passo = (t: number) => {
      if (tocado.current) return;
      angulo.set(INICIO + 16 * Math.sin((t - t0) / 1400));
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [reduz, angulo]);

  const doPonteiro = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const a = (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI + 90;
    // Caminho mais curto, senão o feixe dá a volta inteira ao cruzar o zero.
    const agora = angulo.get();
    angulo.set(agora + ((((a - agora + 540) % 360) + 360) % 360) - 180);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const passo = ({ ArrowRight: 3, ArrowUp: 3, ArrowLeft: -3, ArrowDown: -3 } as Record<string, number>)[e.key];
    if (!passo) return;
    e.preventDefault();
    tocado.current = true;
    angulo.set(angulo.get() + passo);
  };

  return (
    <div className={cn("sensor-dial", className)} data-travado={travado || undefined}>
      <p className="sensor-dial-titulo" aria-live="polite">{travado ? foundTitle : title}</p>
      <svg
        className="sensor-dial-mostrador"
        viewBox="0 0 400 400"
        role="slider"
        tabIndex={0}
        aria-label="Direção do feixe"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={grau}
        aria-valuetext={travado ? "No alvo" : `${grau} graus`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          tocado.current = true;
          preso.current = true;
          doPonteiro(e);
        }}
        onPointerMove={(e) => {
          if (preso.current) doPonteiro(e);
        }}
        onPointerUp={() => (preso.current = false)}
        onPointerCancel={() => (preso.current = false)}
        onKeyDown={onKeyDown}
      >
        {MARCAS.map((d) => {
          const [x1, y1] = ponto(d, d % 15 === 0 ? 158 : 162);
          const [x2, y2] = ponto(d, 170);
          return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} className="sensor-dial-marca" />;
        })}
        {EIXOS.map((d) => {
          const [x1, y1] = ponto(d, 92);
          const [x2, y2] = ponto(d, 156);
          return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} className="sensor-dial-eixo" />;
        })}
        <circle cx={C} cy={C} r={84} className="sensor-dial-orbita" />
        <motion.g style={{ rotate: visto, transformOrigin: "200px 200px", transformBox: "view-box" }}>
          {FEIXE.map((off) => {
            const [x1, y1] = ponto(off, 92);
            const [x2, y2] = ponto(off, 156);
            return <line key={off} x1={x1} y1={y1} x2={x2} y2={y2} className={off === 1 ? "sensor-dial-feixe sensor-dial-alvo" : "sensor-dial-feixe"} />;
          })}
        </motion.g>
        <motion.g style={{ scale: disco, transformOrigin: "200px 200px", transformBox: "view-box" }}>
          <circle cx={C} cy={C} r={70} className="sensor-dial-disco" />
          <circle cx={C} cy={C} r={62} className="sensor-dial-aro" />
          <circle cx={C} cy={C} r={5} className="sensor-dial-lente" />
        </motion.g>
      </svg>
      {guide ? (
        <svg className="sensor-dial-guia" viewBox="0 0 220 180" aria-hidden>
          <path d="M2 180V24A22 22 0 0 1 24 2H196A22 22 0 0 1 218 24V180" />
          <path d="M62 2v6a12 12 0 0 0 12 12h72a12 12 0 0 0 12-12V2" />
          <rect x="84" y="9" width="30" height="4" rx="2" />
          <circle cx="128" cy="11" r="3.5" />
        </svg>
      ) : null}
      <button
        type="button"
        className="sensor-dial-acao"
        aria-pressed={ativo}
        onClick={() => {
          setAtivo(!ativo);
          onAction?.(!ativo);
        }}
      >
        <span>{ativo ? activeAction : action}</span>
        <i aria-hidden>{ativo ? <X size={18} /> : <Plus size={20} />}</i>
      </button>
    </div>
  );
}
