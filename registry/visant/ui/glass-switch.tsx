"use client";

import * as React from "react";

import { LiquidGlass } from "@/components/ui/liquid-glass";
import { EASE_ESTICA_CSS } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface GlassSwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "role"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Obrigatório: um interruptor sozinho não diz o que liga. */
  "aria-label": string;
}

const VIDRO = (h: number) => ({
  borderRadius: 999,
  scale: -h * 0.5,
  aberration: [0, h * 0.06, h * 0.12],
  blur: h * 0.06,
  border: 0.08,
  displaceBlur: h * 0.03,
});

// O polegar achata no caminho e assenta com mola (no CSS). Largura e altura trocam
// volume entre si; `scale` em vez de tamanho, porque refazer o mapa do vidro trava.
const ACHATA_MS = 440;
const ACHATA = "1.3 0.8";

/**
 * Interruptor com polegar de vidro. O ligado se lê pelo preenchimento em `--brand`,
 * que aparece refratado através do polegar, e pela posição: nunca pela cor sozinha.
 * Para o interruptor sem vidro, cuja bolinha escorre como gota, use `liquid-toggle`.
 */
export function GlassSwitch({ checked, defaultChecked = false, onCheckedChange, className, onClick, ...props }: GlassSwitchProps) {
  const [proprio, setProprio] = React.useState(defaultChecked);
  const ligado = checked ?? proprio;
  const raiz = React.useRef<HTMLButtonElement>(null);
  const anterior = React.useRef(ligado);

  React.useEffect(() => {
    if (anterior.current === ligado) return;
    anterior.current = ligado;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    raiz.current?.querySelector(".glass-switch-polegar")?.animate(
      [{ scale: "1 1" }, { scale: ACHATA, offset: 0.34 }, { scale: "1 1" }],
      { duration: ACHATA_MS, easing: EASE_ESTICA_CSS },
    );
  }, [ligado]);
  return (
    <button
      ref={raiz}
      type="button"
      role="switch"
      aria-checked={ligado}
      className={cn("glass-switch", className)}
      onClick={(e) => {
        onClick?.(e);
        setProprio(!ligado);
        onCheckedChange?.(!ligado);
      }}
      {...props}
    >
      <span className="glass-switch-fundo" aria-hidden />
      <LiquidGlass className="glass-switch-polegar" options={VIDRO} aria-hidden />
    </button>
  );
}
