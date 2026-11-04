"use client";

import * as React from "react";

import { LiquidGlass } from "@/components/ui/liquid-glass";
import { EASE_ESTICA_CSS } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface GlassTabsItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface GlassTabsProps {
  items: GlassTabsItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Nome do grupo para leitor de tela. */
  label: string;
  className?: string;
}

const TRILHO = (h: number) => ({
  borderRadius: 999,
  scale: -h * 0.3,
  aberration: [0, h * 0.02, h * 0.04],
  blur: h * 0.06,
  border: 0.05,
  displaceBlur: h * 0.08,
});
const LENTE = (h: number) => ({
  borderRadius: 999,
  scale: -h * 0.9,
  aberration: [0, h * 0.1, h * 0.2],
  blur: h * 0.08,
  border: 0.1,
  displaceBlur: h * 0.01,
});

// A lente chega com mola (no CSS) e estica pelo caminho; o volume se mantém.
const ESTICA_MS = 420;
const ESTICA_POR_ABA = 0.14;
const ESTICA_TETO = 0.3;

/**
 * Abas em que a seleção é uma lente de vidro andando sobre o trilho. As abas têm
 * largura igual porque a lente tem tamanho fixo: refazer o mapa a cada troca pesaria
 * mais do que a animação vale; o esticar é `scale`, por cima do mapa. Setas, Home e
 * End movem o foco, como numa tablist.
 */
export function GlassTabs({ items, value, defaultValue, onChange, label, className }: GlassTabsProps) {
  const [proprio, setProprio] = React.useState(defaultValue ?? items[0]?.value);
  const atual = value ?? proprio;
  const i = Math.max(0, items.findIndex((t) => t.value === atual));
  const raiz = React.useRef<HTMLDivElement>(null);
  const anterior = React.useRef(i);

  React.useEffect(() => {
    const passos = Math.abs(i - anterior.current);
    anterior.current = i;
    if (!passos || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const estica = Math.min(ESTICA_TETO, ESTICA_POR_ABA * passos);
    raiz.current?.querySelector(".glass-tabs-lente")?.animate(
      [{ scale: "1 1" }, { scale: `${1 + estica} ${1 - estica / 2}`, offset: 0.32 }, { scale: "1 1" }],
      { duration: ESTICA_MS, easing: EASE_ESTICA_CSS },
    );
  }, [i]);

  const escolher = (n: number, foco = false) => {
    const alvo = items[(n + items.length) % items.length];
    if (!alvo) return;
    setProprio(alvo.value);
    onChange?.(alvo.value);
    if (foco) raiz.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[(n + items.length) % items.length]?.focus();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const passo = ({ ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: items.length - 1 } as Record<string, number>)[e.key];
    if (passo === undefined) return;
    e.preventDefault();
    escolher(passo, true);
  };

  return (
    <div
      ref={raiz}
      className={cn("glass-tabs", className)}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      style={{ "--n": items.length, "--i": i } as React.CSSProperties}
    >
      <LiquidGlass className="glass-tabs-trilho" options={TRILHO} aria-hidden />
      <LiquidGlass className="glass-tabs-lente" options={LENTE} aria-hidden />
      {items.map((t, n) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={n === i}
          tabIndex={n === i ? 0 : -1}
          onClick={() => escolher(n)}
        >
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}
