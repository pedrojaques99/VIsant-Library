"use client";

import * as React from "react";
import { Paperclip, Send, Square, X } from "lucide-react";

import { WorkingGlyph } from "@/components/ui/working-glyph";
import { cn } from "@/lib/utils";

/**
 * Prompt Composer — o campo de baixo de um painel de agente.
 *
 * Colhido do painel do agente do Estúdio (jaques-os), com a API conferida
 * contra o `prompt-input` e o `BrandingChatInput` do visantlabs-os: os três
 * tinham área de texto que cresce, Enter que envia, Shift+Enter que quebra
 * linha, e um botão que vira Parar enquanto a resposta corre.
 *
 * **Só apresentação.** O texto, os anexos e as ferramentas entram por prop;
 * nada aqui sobe arquivo, grava áudio ou chama API. O microfone é uma
 * ferramenta como as outras (`pressed` enquanto grava, `busy` enquanto
 * transcreve): quem tem o ditado é a tela, e a próxima marca tem outro.
 *
 * ── O que não é óbvio ──────────────────────────────────────────────────────
 *
 * 1. **Enter não envia no meio de uma composição de IME.** Quem digita com
 *    acento morto ou em japonês aperta Enter para confirmar o caractere; sem
 *    `isComposing` a mensagem sai cortada.
 * 2. **Anexo também é mensagem.** Enviar acorda com texto OU com anexo, e
 *    `canSubmit` sobrescreve quando a regra é outra (o Estúdio exige texto
 *    para um comentário com timecode, que sozinho não diz nada).
 * 3. **O campo cresce até `maxRows` e só então rola.** Medido no
 *    `scrollHeight`, sem biblioteca, e volta a encolher quando se apaga.
 * 4. **O foco é do conjunto, não da área de texto.** A moldura inteira ganha o
 *    anel de `--focus`, porque é ela que parece o campo; a área de texto sem
 *    contorno próprio evita o anel dentro do anel.
 * 5. **Colar imagem anexa.** Com `onAttachFiles`, um print colado vira anexo em
 *    vez de sumir; texto colado continua sendo texto.
 */

export interface PromptAttachment {
  id: string;
  /** O que é: "rabisco", "imagem.png", "comentário". */
  label: string;
  /** Complemento curto: "em 00:12:04". */
  detail?: string;
  /** URL de miniatura (object URL, data URL). */
  preview?: string;
}

export interface PromptTool {
  id: string;
  /** Nome acessível e dica do botão. */
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
  /** Ferramenta de liga e desliga ligada (o microfone gravando). */
  pressed?: boolean;
  /** Trabalhando (transcrevendo): troca o ícone pelo glifo de espera. */
  busy?: boolean;
  disabled?: boolean;
}

export type PromptStatus = "ready" | "submitted" | "streaming";

export interface PromptComposerProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  /** Interrompe a resposta. Com `status="streaming"`, Enviar vira Parar. */
  onStop?: () => void;
  /** `submitted`: mandado, sem resposta ainda. `streaming`: a resposta está correndo. */
  status?: PromptStatus;
  attachments?: PromptAttachment[];
  onRemoveAttachment?: (id: string) => void;
  /** Com isto aparece o clipe, e colar imagem vira anexo. */
  onAttachFiles?: (files: File[]) => void;
  /** `accept` do seletor de arquivo. */
  accept?: string;
  /** Ferramentas da esquerda: falar, rabiscar, comentar no tempo. */
  tools?: PromptTool[];
  /** Slot livre entre as ferramentas e o enviar (créditos, modelo). */
  aside?: React.ReactNode;
  /** Regra própria para enviar. Padrão: texto ou anexo, e nada em andamento. */
  canSubmit?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Nome acessível da área de texto. */
  label?: string;
  submitLabel?: string;
  stopLabel?: string;
  attachLabel?: string;
  removeLabel?: (attachment: PromptAttachment) => string;
  minRows?: number;
  maxRows?: number;
  autoFocus?: boolean;
  className?: string;
}

const foco = "focus-visible:outline-none focus-visible:[box-shadow:var(--focus)]";
const botaoIcone = cn(
  "relative grid size-8 shrink-0 cursor-pointer place-items-center rounded-[var(--r-control)] border-0 bg-transparent p-0 text-muted-foreground",
  "[transition:background-color_var(--dur-fast)_var(--ease-out),color_var(--dur-fast)_var(--ease-out)] motion-reduce:transition-none",
  "hover:enabled:bg-muted hover:enabled:text-foreground disabled:cursor-default disabled:opacity-45",
  "pointer-coarse:size-10 [&_svg]:size-4",
  foco,
);
const botaoTexto = cn(
  "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--r-control)] border px-3 text-sm font-medium",
  "[transition:background-color_var(--dur-fast)_var(--ease-out),opacity_var(--dur-fast)_var(--ease-out)] motion-reduce:transition-none",
  "disabled:cursor-default disabled:opacity-45 pointer-coarse:h-10 [&_svg]:size-3.5",
  foco,
);

export const PromptComposer = React.forwardRef<HTMLTextAreaElement, PromptComposerProps>(function PromptComposer(
  {
    value,
    onValueChange,
    onSubmit,
    onStop,
    status = "ready",
    attachments = [],
    onRemoveAttachment,
    onAttachFiles,
    accept = "image/*,video/*,audio/*",
    tools = [],
    aside,
    canSubmit,
    disabled = false,
    placeholder = "Escreva uma mensagem",
    label = "Mensagem",
    submitLabel = "Enviar",
    stopLabel = "Parar",
    attachLabel = "Anexar arquivo",
    removeLabel = (a) => `Tirar ${a.label}`,
    minRows = 2,
    maxRows = 8,
    autoFocus,
    className,
  },
  ref,
) {
  const campo = React.useRef<HTMLTextAreaElement | null>(null);
  const arquivo = React.useRef<HTMLInputElement>(null);
  const juntarRef = React.useCallback(
    (n: HTMLTextAreaElement | null) => {
      campo.current = n;
      if (typeof ref === "function") ref(n);
      else if (ref) ref.current = n;
    },
    [ref],
  );

  const ocupado = status !== "ready";
  const pode = !disabled && !ocupado && (canSubmit ?? (!!value.trim() || attachments.length > 0));

  // Cresce com o texto até maxRows; depois rola. Recalcula também quando o valor
  // muda por fora (ditado, sugestão, limpar depois de enviar).
  React.useLayoutEffect(() => {
    const el = campo.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const linha = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
    const extra = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    el.style.height = "auto";
    const alvo = Math.min(Math.max(el.scrollHeight, linha * minRows + extra), linha * maxRows + extra);
    el.style.height = `${alvo}px`;
    el.style.overflowY = el.scrollHeight > alvo + 1 ? "auto" : "hidden";
  }, [value, minRows, maxRows]);

  const enviar = () => {
    if (pode) onSubmit();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    enviar();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!onAttachFiles) return;
    const files = [...e.clipboardData.files];
    if (!files.length) return;
    e.preventDefault();
    onAttachFiles(files);
  };

  return (
    <div
      className={cn(
        "group/composer flex w-full min-w-0 flex-col gap-2 rounded-[var(--r-surface)] border border-border bg-card p-2.5 text-card-foreground",
        "[transition:border-color_var(--dur-fast)_var(--ease-out)] motion-reduce:transition-none",
        "focus-within:[box-shadow:var(--focus)]",
        disabled && "opacity-60",
        className,
      )}
    >
      {attachments.length ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Anexos">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="visant-composer-chip flex min-w-0 max-w-full items-center gap-1.5 rounded-[var(--r-control)] bg-muted py-1 pl-1.5 pr-1 text-xs text-foreground"
            >
              {a.preview ? (
                <img src={a.preview} alt="" className="size-6 shrink-0 rounded-[calc(var(--r-control)/2)] object-cover" />
              ) : null}
              <span className="min-w-0 truncate">
                {a.label}
                {a.detail ? <span className="text-muted-foreground"> {a.detail}</span> : null}
              </span>
              {onRemoveAttachment ? (
                <button
                  type="button"
                  aria-label={removeLabel(a)}
                  title={removeLabel(a)}
                  disabled={disabled}
                  onClick={() => {
                    onRemoveAttachment(a.id);
                    // O botão some com o chip; o foco volta pro campo em vez de cair no body.
                    campo.current?.focus();
                  }}
                  className={cn(
                    "grid size-5 shrink-0 cursor-pointer place-items-center rounded-[calc(var(--r-control)/2)] border-0 bg-transparent p-0 text-muted-foreground hover:bg-background hover:text-foreground pointer-coarse:size-8",
                    foco,
                  )}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <textarea
        ref={juntarRef}
        value={value}
        rows={minRows}
        aria-label={label}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        className="block w-full resize-none border-0 bg-transparent px-1 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />

      <div className="flex min-w-0 items-center gap-0.5">
        {tools.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cn(botaoIcone, t.pressed && "bg-muted text-foreground")}
            aria-label={t.label}
            title={t.label}
            aria-pressed={t.pressed}
            aria-busy={t.busy || undefined}
            disabled={disabled || t.disabled || t.busy}
            onClick={t.onSelect}
          >
            {t.busy ? <WorkingGlyph size={16} framed={false} shine={false} /> : t.icon}
            {t.pressed ? (
              // Ligado não depende só de cor: o ponto marca o estado também.
              <span aria-hidden="true" className="absolute right-1 top-1 size-1.5 rounded-full bg-[var(--brand)]" />
            ) : null}
          </button>
        ))}
        {onAttachFiles ? (
          <>
            <button
              type="button"
              className={botaoIcone}
              aria-label={attachLabel}
              title={attachLabel}
              disabled={disabled}
              onClick={() => arquivo.current?.click()}
            >
              <Paperclip aria-hidden="true" />
            </button>
            <input
              ref={arquivo}
              type="file"
              multiple
              accept={accept}
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
              onChange={(e) => {
                const files = [...(e.target.files ?? [])];
                if (files.length) onAttachFiles(files);
                e.target.value = "";
              }}
            />
          </>
        ) : null}
        <span className="min-w-0 flex-1" />
        {aside ? <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">{aside}</div> : null}
        {status === "streaming" && onStop ? (
          <button type="button" className={cn(botaoTexto, "border-border bg-background text-foreground hover:bg-muted")} onClick={onStop}>
            <Square aria-hidden="true" />
            {stopLabel}
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              botaoTexto,
              "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)] hover:enabled:opacity-90",
            )}
            disabled={!pode}
            aria-busy={status === "submitted" || undefined}
            onClick={enviar}
          >
            {status === "submitted" ? (
              <WorkingGlyph size={14} framed={false} shine={false} />
            ) : (
              <Send aria-hidden="true" />
            )}
            {submitLabel}
          </button>
        )}
      </div>
    </div>
  );
});
