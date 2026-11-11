import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Device LCD: o display de vidro do kit de aparelho, com a tinta na luz da marca (`--brand`).
 *
 * `lit` é o backlight: apagado, o vidro fica a 58% e escuro; aceso, a tinta sobe e o fundo
 * esquenta. Use aceso quando o aparelho trabalha (grava, toca, gira) e apagado em repouso.
 *
 * O vidro (reflexo e linhas de varredura) é uma camada por cima, sem pegar clique. O conteúdo
 * vai em `children` e herda a cor da tinta: `DeviceReadout` para o número grande ou o timecode,
 * `DeviceSegments` para um medidor, `DeviceProgress` para uma barra em segmentos.
 */
export interface DeviceLcdProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Backlight aceso. Padrão: aceso. */
  lit?: boolean;
  size?: "sm" | "md";
  /** Classe da tela (o vidro), para altura e respiro. */
  screenClassName?: string;
}

export function DeviceLcd({ lit = true, size = "md", className, screenClassName, children, ...rest }: DeviceLcdProps) {
  return (
    <div data-lit={lit ? "" : undefined} data-size={size} className={cn("dk-lcd", className)} {...rest}>
      <div className={cn("dk-lcd-screen", screenClassName)}>
        <div className="dk-lcd-in">{children}</div>
      </div>
    </div>
  );
}

/** `hh:mm:ss` de um tempo em ms. */
export function timecode(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return [h, m, s % 60].map((n) => String(n).padStart(2, "0")).join(":");
}

export interface DeviceReadoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `lg` é o timecode do gravador (38px); `sm` cabe numa unidade de rack. */
  size?: "sm" | "md" | "lg";
  /** Brilho da tinta: o número está vivo (gravando, tocando). */
  glow?: boolean;
}

/** O número do display, em algarismos tabulares para não pular enquanto corre. */
export function DeviceReadout({ size = "lg", glow = false, className, ...rest }: DeviceReadoutProps) {
  return <div data-size={size} data-glow={glow ? "" : undefined} className={cn("dk-readout", className)} {...rest} />;
}

export interface DeviceSegmentsProps {
  /** De 0 a 1. */
  value: number;
  /** Quantos segmentos. Padrão: 10. */
  count?: number;
  /** Com rótulo, vira um `meter` acessível; sem, é só desenho (o valor já está dito em outro lugar). */
  label?: string;
  className?: string;
}

/** Medidor em segmentos de LCD (volume, nível). */
export function DeviceSegments({ value, count = 10, label, className }: DeviceSegmentsProps) {
  const v = Math.min(1, Math.max(0, value));
  const on = Math.round(v * count);
  const a11y = label
    ? { role: "meter" as const, "aria-label": label, "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": Math.round(v * 100) }
    : { "aria-hidden": true };
  return (
    <span className={cn("dk-segments", className)} {...a11y}>
      {Array.from({ length: count }, (_, i) => <i key={i} data-on={i < on ? "" : undefined} />)}
    </span>
  );
}

export interface DeviceProgressProps {
  /** De 0 a 1. Sem valor, a barra fica vazia. */
  value: number;
  segments?: number;
  /** Nome da barra para leitor de tela. */
  label: string;
  /** O que o leitor de tela diz, se a porcentagem não basta ("3 de 12"). */
  valueText?: string;
  className?: string;
}

/** Barra de progresso em segmentos, na tinta do LCD. */
export function DeviceProgress({ value, segments = 24, label, valueText, className }: DeviceProgressProps) {
  const v = Math.min(1, Math.max(0, value));
  const on = Math.round(v * segments);
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)}
      aria-valuetext={valueText} className={cn("dk-progress", className)}>
      {Array.from({ length: segments }, (_, i) => <i key={i} data-on={i < on ? "" : undefined} />)}
    </div>
  );
}
