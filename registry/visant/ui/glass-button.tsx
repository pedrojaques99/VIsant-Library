"use client";

import * as React from "react";

import { LiquidGlass } from "@/components/ui/liquid-glass";
import { cn } from "@/lib/utils";

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** `pill` leva texto; `circle` leva só ícone e pede `aria-label`. */
  shape?: "pill" | "circle";
}

const VIDRO = (h: number) => ({
  borderRadius: 999,
  scale: -h * 0.42,
  aberration: [0, h * 0.04, h * 0.08],
  blur: h * 0.06,
  border: 0.06,
  displaceBlur: h * 0.05,
});

/**
 * Botão de vidro que refrata o fundo. Com `aria-pressed` vira alternância, e o
 * estado aceso é o miolo branco: cor nenhuma entra na peça. O vidro não sustenta
 * contraste sozinho, então só use sobre fundo escuro ou foto com véu.
 */
export function GlassButton({ shape = "pill", type = "button", className, children, ...props }: GlassButtonProps) {
  return (
    <button type={type} className={cn("glass-button", className)} data-shape={shape} {...props}>
      <LiquidGlass className="glass-button-vidro" options={VIDRO} aria-hidden />
      <span className="glass-button-miolo">{children}</span>
    </button>
  );
}
