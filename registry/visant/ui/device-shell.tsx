import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Device Shell: a carcaça de alumínio escovado do kit de aparelho (`device-*`).
 *
 * Só a casca: textura escovada, ruído fino, luz na borda de cima, sombra em três camadas.
 * O conteúdo (display, teclas, encoder) entra como filho. O material mora em `device-kit.css`
 * (variáveis `--dk-*`, claro e escuro); aqui não há cor.
 *
 * Tamanhos: `sm` é uma unidade de rack ou um controle de linha (raio 12), `md` o aparelho de
 * bolso do Gravador (raio 36), `lg` um aparelho de mesa.
 */
export type DeviceSize = "sm" | "md" | "lg";

export interface DeviceShellProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: DeviceSize;
}

export const DeviceShell = React.forwardRef<HTMLDivElement, DeviceShellProps>(function DeviceShell(
  { size = "md", className, ...rest },
  ref,
) {
  return <div ref={ref} data-size={size} className={cn("dk-shell", className)} {...rest} />;
});

/** Texto gravado no metal: rótulo de marca, nome de canal, nome do serviço. */
export function DeviceEngraving({ className, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("dk-engrave", className)} {...rest} />;
}

/** Parafuso de fenda, para as orelhas de uma unidade de rack. Decorativo. */
export function DeviceScrew({ className }: { className?: string }) {
  return <span aria-hidden className={cn("dk-screw", className)} />;
}
