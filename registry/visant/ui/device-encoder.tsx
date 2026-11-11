"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Device Encoder: o encoder do kit de aparelho, um controle que anda em detentes.
 *
 * Arrasto vertical (12 px por detente), roda do mouse (um detente a cada 60 de deltaY, com
 * listener não passivo para a página não rolar enquanto gira), setas (cima/direita sobe) e
 * PageUp/PageDown (dez detentes). É um `role="slider"`.
 *
 * Duas formas de usar:
 * - **Valor**: `value`, `min`, `max`, `step` e `onValueChange`. O encoder anda e prende nos
 *   limites; Home/End vão às pontas.
 * - **Detente**: só `onDetent(+1 | -1)`, quando o que o giro faz muda com o estado (o Gravador
 *   navega entre notas parado e é volume tocando). Passe `value/min/max/valueText` para o
 *   leitor de tela saber onde está.
 *
 * `position` controla o desenho (quantos detentes já girou), para quando o giro vem de fora,
 * por exemplo de um atalho de teclado no aparelho inteiro. Sem ela, o encoder conta sozinho.
 *
 * `wheel` é a roda serrilhada de lado; `knob`, o botão giratório com risco de posição.
 */
export interface DeviceEncoderProps {
  variant?: "wheel" | "knob";
  size?: "sm" | "md" | "lg";
  label: string;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  valueText?: string;
  onValueChange?: (v: number) => void;
  onDetent?: (d: 1 | -1) => void;
  position?: number;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal";
  className?: string;
  style?: React.CSSProperties;
}

const PASSO_ARRASTO = 12; // px por detente
const PASSO_RODA = 60; // deltaY por detente (roda de mouse manda ~100; trackpad soma)
const GRAUS_POR_DETENTE = 15;

export const DeviceEncoder = React.forwardRef<HTMLDivElement, DeviceEncoderProps>(function DeviceEncoder(
  { variant = "wheel", size = "md", label, value, min = 0, max = 100, step = 1, valueText, onValueChange, onDetent,
    position, disabled = false, orientation = "vertical", className, style },
  ref,
) {
  const el = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => el.current!);
  const [proprio, setProprio] = React.useState(0);
  const giro = position ?? proprio;

  // O valor anda aqui também: vários detentes no mesmo quadro (roda, arrasto) chegam antes do render.
  const atual = React.useRef({ value, min, max, step, onValueChange, onDetent, disabled });
  atual.current = { value, min, max, step, onValueChange, onDetent, disabled };
  const detente = React.useCallback((d: 1 | -1) => {
    const a = atual.current;
    if (a.disabled) return;
    setProprio((g) => g + d);
    a.onDetent?.(d);
    if (a.onValueChange && a.value != null) {
      const v = Math.min(a.max, Math.max(a.min, a.value + d * a.step));
      if (v !== a.value) { a.value = v; a.onValueChange(v); }
    }
  }, []);
  const ir = (v: number) => {
    const a = atual.current;
    if (a.disabled || !a.onValueChange || a.value == null || v === a.value) return;
    setProprio((g) => g + Math.sign(v - a.value!));
    a.value = v;
    a.onValueChange(v);
  };

  React.useEffect(() => {
    const no = el.current;
    if (!no) return;
    let soma = 0;
    const roda = (e: WheelEvent) => {
      e.preventDefault();
      soma += e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
      while (Math.abs(soma) >= PASSO_RODA) {
        detente(soma < 0 ? 1 : -1);
        soma -= Math.sign(soma) * PASSO_RODA;
      }
    };
    no.addEventListener("wheel", roda, { passive: false });
    return () => no.removeEventListener("wheel", roda);
  }, [detente]);

  const arrasto = React.useRef<{ y: number; resto: number } | null>(null);
  const [arrastando, setArrastando] = React.useState(false);
  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    arrasto.current = { y: e.clientY, resto: 0 };
    setArrastando(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const a = arrasto.current;
    if (!a) return;
    a.resto += a.y - e.clientY; // para cima é positivo
    a.y = e.clientY;
    while (Math.abs(a.resto) >= PASSO_ARRASTO) {
      detente(a.resto > 0 ? 1 : -1);
      a.resto -= Math.sign(a.resto) * PASSO_ARRASTO;
    }
  };
  const soltar = () => { arrasto.current = null; setArrastando(false); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const k = e.key;
    const f =
      k === "ArrowUp" || k === "ArrowRight" ? () => detente(1)
      : k === "ArrowDown" || k === "ArrowLeft" ? () => detente(-1)
      : k === "PageUp" ? () => { for (let i = 0; i < 10; i++) detente(1); }
      : k === "PageDown" ? () => { for (let i = 0; i < 10; i++) detente(-1); }
      : k === "Home" && onValueChange ? () => ir(min)
      : k === "End" && onValueChange ? () => ir(max)
      : null;
    if (!f) return;
    e.preventDefault(); // um atalho do aparelho inteiro (que olha defaultPrevented) não anda de novo
    f();
  };

  return (
    <div ref={el} role="slider" tabIndex={disabled ? -1 : 0} aria-label={label} aria-orientation={orientation}
      aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={valueText}
      aria-disabled={disabled || undefined}
      data-variant={variant} data-size={size} data-dragging={arrastando ? "" : undefined}
      className={cn("dk-encoder", className)} style={style}
      onKeyDown={onKeyDown} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={soltar} onPointerCancel={soltar}>
      {variant === "wheel" ? (
        <span className="dk-knurl" aria-hidden style={{ transform: `translateY(${(((giro * 2) % 8) + 8) % 8}px)` }} />
      ) : (
        <span className="dk-knob-cap" aria-hidden style={{ transform: `rotate(${giro * GRAUS_POR_DETENTE}deg)` }} />
      )}
    </div>
  );
});
