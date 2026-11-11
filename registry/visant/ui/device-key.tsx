import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Device Key e Device Switch: as peças que o dedo aperta no kit de aparelho.
 *
 * **DeviceKey** é um botão físico que afunda. Afunda ao apertar (`:active`), por um instante
 * quando um atalho de teclado o aciona (`pressing`, para o atalho e o clique contarem a mesma
 * história) e fica travado afundado com `pressed` (vira `aria-pressed`), como o REC de um
 * gravador enquanto grava. `ring` é o anel torneado; `square`, a tecla pequena.
 *
 * **DeviceSwitch** é a chave deslizante de ligar e desligar (`role="switch"`). `busy` marca o
 * trânsito (subindo, parando): a chave não aceita outro toque até o estado chegar.
 */
export interface DeviceKeyProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shape?: "ring" | "square";
  size?: "sm" | "md" | "lg";
  /** Travado afundado. Vira `aria-pressed`; sem valor, a tecla não é de alternar. */
  pressed?: boolean;
  /** Afundado por um instante (o atalho de teclado acionou a tecla). */
  pressing?: boolean;
}

export const DeviceKey = React.forwardRef<HTMLButtonElement, DeviceKeyProps>(function DeviceKey(
  { shape = "square", size = "md", pressed, pressing = false, className, type = "button", ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} data-shape={shape} data-size={size}
      data-pressed={pressing ? "" : undefined} aria-pressed={pressed}
      className={cn("dk-key", className)} {...rest} />
  );
});

/** Marca uma tecla como apertada por um instante: `const [qual, apertar] = usePressFlash()`. */
export function usePressFlash(ms = 140) {
  const [which, setWhich] = React.useState<string | null>(null);
  const t = React.useRef<number>();
  const flash = React.useCallback((k: string) => {
    setWhich(k);
    window.clearTimeout(t.current);
    t.current = window.setTimeout(() => setWhich(null), ms);
  }, [ms]);
  React.useEffect(() => () => window.clearTimeout(t.current), []);
  return [which, flash] as const;
}

export interface DeviceSwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Em trânsito: a chave fica onde foi posta e não aceita outro toque. */
  busy?: boolean;
  size?: "sm" | "md";
}

export const DeviceSwitch = React.forwardRef<HTMLButtonElement, DeviceSwitchProps>(function DeviceSwitch(
  { checked, onCheckedChange, busy = false, size = "md", disabled, className, onClick, ...rest },
  ref,
) {
  return (
    <button ref={ref} type="button" role="switch" aria-checked={checked} aria-busy={busy || undefined}
      data-size={size} disabled={disabled || busy}
      onClick={(e) => { onClick?.(e); if (!e.defaultPrevented) onCheckedChange?.(!checked); }}
      className={cn("dk-switch", className)} {...rest}>
      <span className="dk-switch-lit" aria-hidden />
      <span className="dk-switch-thumb" aria-hidden />
    </button>
  );
});
