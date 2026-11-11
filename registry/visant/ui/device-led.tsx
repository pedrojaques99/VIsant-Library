import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Device LED: a luz de estado do kit de aparelho.
 *
 * - `off` apagado (a lente fica, sem luz);
 * - `on` aceso parado;
 * - `breathe` respira: trabalhando, gravando;
 * - `blink` pisca devagar: em trânsito, pausado, subindo;
 * - `error` aceso em vermelho, qualquer que seja o tom.
 *
 * O tom `red` é a luz de gravação; o `brand` acende no `--brand` da casa. Com movimento
 * reduzido, `breathe` e `blink` ficam acesos parados: o estado continua visível, só não mexe.
 *
 * Com `label`, o LED se anuncia como imagem com nome ("no ar"); sem, é decorativo e o estado
 * precisa estar escrito ao lado.
 */
export type DeviceLedState = "off" | "on" | "breathe" | "blink" | "error";

export interface DeviceLedProps {
  state?: DeviceLedState;
  tone?: "red" | "brand";
  /** `xs` 6px, `sm` 10px, `md` 14px, `lg` 26px (o LED do REC). */
  size?: "xs" | "sm" | "md" | "lg";
  label?: string;
  title?: string;
  className?: string;
}

export function DeviceLed({ state = "off", tone = "brand", size = "sm", label, title, className }: DeviceLedProps) {
  return (
    <span data-state={state} data-tone={tone} data-size={size} title={title}
      className={cn("dk-led", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })} />
  );
}
