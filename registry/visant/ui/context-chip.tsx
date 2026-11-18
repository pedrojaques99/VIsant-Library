"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Context Chip — a pastilha de uma referência: um arquivo, um corte, um link,
 * um software. Mini thumb, nome curto, detalhe opcional (timecode) e tirar.
 *
 * Colhido do painel do agente do Estúdio (jaques-os). Lá havia quatro chips
 * diferentes para a mesma ideia: o do corte no Markdown, o do corte no campo,
 * o do anexo no campo e o texto "mídia, rabisco" na bolha. Agora é este.
 *
 * Não é o `chip` (pastilha de filtro): aquele liga e desliga uma faceta. Este
 * aponta para uma coisa, e a coisa tem cara.
 *
 * ── O que não é óbvio ──────────────────────────────────────────────────────
 *
 * 1. **A thumb tem três formas.** `image` (capa, quadro do vídeo), `icon`
 *    (logo do software em `currentColor`) e nada. Thumb que não carrega some
 *    e deixa o `icon` no lugar, em vez de um quadrado quebrado.
 * 2. **`portrait` para vídeo vertical.** Corte de Reels em quadrado vira um
 *    recorte da cara de alguém; a proporção 9:16 mostra o quadro inteiro.
 * 3. **Tirar é um botão ao lado, não o chip inteiro.** O chip pode abrir a
 *    coisa (link, corte); clicar para ver não pode apagar. E fica FORA do
 *    link: botão dentro de `<a>` é HTML inválido e o leitor de tela se perde.
 * 4. **`inline` para dentro do texto.** Na linha de um parágrafo o chip desce
 *    para a linha de base e não empurra a entrelinha.
 */

export interface ContextChipProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children" | "onClick"> {
  onClick?: React.MouseEventHandler<HTMLElement>;
  label: React.ReactNode;
  /** Complemento curto: "em 00:12:04", "3,2 MB". */
  detail?: React.ReactNode;
  /** URL da miniatura. */
  image?: string;
  /** Logo ou ícone; também é o que fica se a imagem falhar. */
  icon?: React.ReactNode;
  /** Thumb 9:16 (vídeo vertical) em vez de quadrada. */
  portrait?: boolean;
  /** Abre num link. */
  href?: string;
  /** Link externo: nova aba. */
  external?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
  size?: "sm" | "md";
  /** Dentro de um parágrafo: alinha na linha de base. */
  inline?: boolean;
}

const foco = "focus-visible:outline-none focus-visible:[box-shadow:var(--focus)]";

export const ContextChip = React.forwardRef<HTMLSpanElement, ContextChipProps>(function ContextChip(
  { label, detail, image, icon, portrait, href, external, onRemove, removeLabel, size = "md", inline, className, title, onClick, ...rest },
  ref,
) {
  const [falhou, setFalhou] = React.useState(false);
  React.useEffect(() => setFalhou(false), [image]);
  const sm = size === "sm";
  const temImagem = !!image && !falhou;

  const thumb = temImagem ? (
    <img
      src={image}
      alt=""
      loading="lazy"
      onError={() => setFalhou(true)}
      className={cn(
        "shrink-0 rounded-[calc(var(--r-control)/2)] bg-background object-cover",
        portrait ? (sm ? "h-5 w-[0.7rem]" : "h-7 w-4") : sm ? "size-4" : "size-6",
      )}
    />
  ) : icon ? (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-[calc(var(--r-control)/2)] text-foreground/80",
        sm ? "size-4" : "size-6 bg-background",
      )}
    >
      {icon}
    </span>
  ) : null;

  const corpo = (
    <>
      {thumb}
      <span className="min-w-0 truncate">
        {label}
        {detail ? <span className="text-muted-foreground"> {detail}</span> : null}
      </span>
    </>
  );

  const casca = cn(
    "visant-context-chip inline-flex min-w-0 max-w-full items-center rounded-[var(--r-control)] bg-muted text-foreground",
    "[transition:background-color_var(--dur-fast)_var(--ease-out)] motion-reduce:transition-none",
    sm ? "h-6 text-[0.8125rem] leading-5" : "h-8 text-xs",
    inline && "mx-0.5 translate-y-[3px] align-baseline",
    (href || onClick) && "has-[[data-alvo]:hover]:bg-accent",
    className,
  );
  // O alvo (link, botão ou texto) e o tirar ficam lado a lado: botão dentro de link é HTML inválido.
  const alvo = cn(
    "inline-flex min-w-0 items-center self-stretch rounded-[var(--r-control)] border-0 bg-transparent p-0 text-inherit no-underline",
    sm ? "gap-1 pl-1 pr-1.5" : "gap-1.5 pl-1 pr-2",
    onRemove && (sm ? "pr-0.5" : "pr-1"),
    (href || onClick) && cn("cursor-pointer", foco),
  );

  const tirar = onRemove ? (
    <button
      type="button"
      aria-label={removeLabel ?? (typeof label === "string" ? `Tirar ${label}` : "Tirar")}
      title={removeLabel ?? (typeof label === "string" ? `Tirar ${label}` : "Tirar")}
      onClick={onRemove}
      className={cn(
        "mr-0.5 grid shrink-0 cursor-pointer place-items-center rounded-[calc(var(--r-control)/2)] border-0 bg-transparent p-0 text-muted-foreground hover:bg-background hover:text-foreground pointer-coarse:size-8",
        sm ? "size-4" : "size-6",
        foco,
      )}
    >
      <X className="size-3" aria-hidden="true" />
    </button>
  ) : null;

  return (
    <span ref={ref as React.Ref<HTMLSpanElement>} className={casca} {...rest}>
      {href ? (
        <a data-alvo="" href={href} title={title} onClick={onClick} {...(external ? { target: "_blank", rel: "noreferrer" } : null)} className={alvo}>
          {corpo}
        </a>
      ) : onClick ? (
        <button data-alvo="" type="button" title={title} onClick={onClick} className={alvo}>
          {corpo}
        </button>
      ) : (
        <span title={title} className={alvo}>
          {corpo}
        </span>
      )}
      {tirar}
    </span>
  );
});
