"use client";

import * as React from "react";

import { LiquidGlass } from "@/components/ui/liquid-glass";
import { cn } from "@/lib/utils";

export interface GlassSliderProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  /** Nome para leitor de tela. */
  label: string;
  /** Ícone à esquerda do número; recebe o valor pra trocar de desenho conforme o nível. */
  icon?: (value: number) => React.ReactNode;
  /** Como o número aparece: `(v) => \`${v}%\``. */
  format?: (value: number) => string;
  className?: string;
}

// Abaixo disto o anel deixa de ser pílula e vira risco.
const MENOR = 0.26;
const TRILHO = (h: number) => ({
  borderRadius: 999,
  scale: -h * 0.3,
  aberration: [0, h * 0.02, h * 0.04],
  blur: h * 0.05,
  border: 0.05,
  displaceBlur: h * 0.07,
});
const LENTE = (h: number) => ({
  borderRadius: 999,
  scale: -h * 1.2,
  aberration: [0, h * 0.12, h * 0.24],
  blur: h * 0.05,
  border: 0.09,
  displaceBlur: h * 0.012,
});

/**
 * Slider de vidro cuja lente refrata o fundo. Três decisões que não se veem:
 *
 * - A lente nunca muda de tamanho: refazer o mapa a cada quadro do arraste trava.
 *   Ela tem a largura do trilho, anda por transform e uma máscara corta a sobra. Com
 *   clip-path ou `overflow`, sob um palco com `scale` o Chrome solta os cantos do
 *   backdrop-filter e aparece um retângulo atrás da lente; a máscara segura. Só o
 *   anel, que não tem filtro, muda de largura.
 * - O arraste é da caixa, não do <input range>. Invisível por cima, o input só
 *   responde ao polegar nativo no iOS; ele fica para teclado e leitor de tela.
 * - No toque, o valor só muda em gesto de lado ou toque parado. Quem começa a rolar
 *   a página em cima da peça não altera nada.
 *
 * A mancha clara e a franja colorida não são pintura: são o fundo refratado. Sobre
 * fundo sem luz elas somem, e em Safari e Firefox a lente vira blur.
 */
export function GlassSlider({
  value,
  defaultValue = 50,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  icon,
  format = String,
  className,
}: GlassSliderProps) {
  const [proprio, setProprio] = React.useState(defaultValue);
  const v = value ?? proprio;
  const gesto = React.useRef<{ x: number; y: number; toque: boolean; ativo: boolean } | null>(null);

  const definir = (n: number) => {
    const preso = Math.min(max, Math.max(min, min + Math.round((n - min) / step) * step));
    if (preso === v) return;
    setProprio(preso);
    onChange?.(preso);
  };
  const doPonteiro = (e: React.PointerEvent<HTMLDivElement>) => {
    // Retângulo na tela e clientX estão na mesma escala, então palco com transform não atrapalha.
    const r = e.currentTarget.getBoundingClientRect();
    definir(min + ((e.clientX - r.left) / r.width) * (max - min));
  };

  const p = { "--p": Math.max((v - min) / (max - min), MENOR) } as React.CSSProperties;
  return (
    <div
      className={cn("glass-slider", className)}
      onPointerDown={(e) => {
        const toque = e.pointerType !== "mouse";
        gesto.current = { x: e.clientX, y: e.clientY, toque, ativo: !toque };
        e.currentTarget.setPointerCapture(e.pointerId);
        if (!toque) doPonteiro(e);
      }}
      onPointerMove={(e) => {
        const g = gesto.current;
        if (!g) return;
        if (!g.ativo && Math.abs(e.clientX - g.x) > 6 && Math.abs(e.clientX - g.x) > Math.abs(e.clientY - g.y)) g.ativo = true;
        if (g.ativo) doPonteiro(e);
      }}
      onPointerUp={(e) => {
        const g = gesto.current;
        if (g?.toque && !g.ativo && Math.hypot(e.clientX - g.x, e.clientY - g.y) < 8) doPonteiro(e);
        gesto.current = null;
      }}
      onPointerCancel={() => (gesto.current = null)}
    >
      <LiquidGlass className="glass-slider-trilho" options={TRILHO} aria-hidden />
      <LiquidGlass className="glass-slider-lente" options={LENTE} style={p} aria-hidden />
      <div className="glass-slider-anel" style={p} aria-hidden />
      <div className="glass-slider-leitura" aria-hidden>
        {icon?.(v)}
        <span>{format(v)}</span>
      </div>
      <input
        type="range"
        aria-label={label}
        aria-valuetext={format(v)}
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => definir(Number(e.target.value))}
      />
    </div>
  );
}
