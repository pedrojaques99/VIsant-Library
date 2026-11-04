/*
 * O que a dobra do catálogo usa do painel de conectar: o logo e o sinal que abre. Fora de
 * `conectar.tsx` porque ele arrasta o Radix, e o painel só desce depois da primeira dobra.
 */

import type { SimpleIcon } from "simple-icons";
import { cn } from "@/lib/utils";

export const EVENTO_CONECTAR = "visant:conectar";

/** Abre o painel de onde estiver (um só por página, montado no cabeçalho). */
export const abrirConectar = () => window.dispatchEvent(new Event(EVENTO_CONECTAR));

/**
 * O traço de um logo do `simple-icons`, na cor do texto. Local e não Iconify:
 * logo que depende de rede vira bolinha vazia quando a API falha.
 * EXCEPTION to noise-scan/hand-drawn-icon: o traço vem do pacote simple-icons por dado, ninguém desenhou nada aqui.
 */
export function LogoAgente({ icone, className = "size-3.5" }: { icone: SimpleIcon; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("shrink-0 fill-current", className)}>
      <path d={icone.path} />
    </svg>
  );
}
