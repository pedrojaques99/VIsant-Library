"use client";

import * as React from "react";
import { CornerDownLeft, ListPlus, Paperclip, Pencil, Send, Square, X } from "lucide-react";

import { ContextChip } from "@/components/ui/context-chip";
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
 *    vez de sumir; texto colado continua sendo texto. Com `onPasteText`, a tela
 *    decide se um link ou caminho colado vira chip: o limite do colado é a única
 *    hora em que se sabe onde um caminho com espaços acaba.
 * 6. **Fila, não bloqueio.** Com `queueWhileBusy`, Enter enquanto a resposta
 *    corre chama `onSubmit({ now: false })` e a tela enfileira; Ctrl/⌘+Enter
 *    chama `onSubmit({ now: true })` para interromper e mandar já. A fila
 *    aparece acima do campo, com mandar agora, editar e tirar em cada item.
 * 7. **Menção por fontes.** `@` abre a lista das `mentions`; cada fonte busca do
 *    jeito dela (sync ou Promise) e a resposta velha é descartada se o termo já
 *    mudou. Escolher troca `@termo` por `@nome` e chama `onMention`: quem tem o
 *    dado transforma em anexo. Setas, Enter/Tab e Esc, como num combobox.
 */

export interface PromptAttachment {
  id: string;
  /** O que é: "rabisco", "imagem.png", "comentário". */
  label: string;
  /** Complemento curto: "em 00:12:04". */
  detail?: string;
  /** URL de miniatura (object URL, data URL). */
  preview?: string;
  /** Logo ou ícone (software, tipo de arquivo); fica no lugar da prévia que falhar. */
  icon?: React.ReactNode;
  /** Prévia 9:16, para vídeo vertical. */
  portrait?: boolean;
}

/** Uma mensagem esperando a vez. */
export interface PromptQueuedItem {
  id: string;
  text: string;
  /** Quantos anexos vão junto (só para mostrar). */
  attachmentCount?: number;
}

/** Um resultado de menção. */
export interface PromptMentionItem {
  id: string;
  label: string;
  detail?: string;
  preview?: string;
  icon?: React.ReactNode;
  portrait?: boolean;
}

/** Uma fonte de menção: arquivos, cortes, ferramentas. A busca é da tela. */
export interface PromptMentionSource {
  id: string;
  /** Título do grupo na lista. */
  label: string;
  search: (query: string) => PromptMentionItem[] | Promise<PromptMentionItem[]>;
  /** Quantos mostrar deste grupo. Padrão 6. */
  limit?: number;
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
  /** `now`: Ctrl/⌘+Enter com a resposta correndo, interromper e mandar já. */
  onSubmit: (how: { now: boolean }) => void;
  /** Interrompe a resposta. Com `status="streaming"`, Enviar vira Parar. */
  onStop?: () => void;
  /** `submitted`: mandado, sem resposta ainda. `streaming`: a resposta está correndo. */
  status?: PromptStatus;
  attachments?: PromptAttachment[];
  onRemoveAttachment?: (id: string) => void;
  /** Enquanto a resposta corre, Enter ainda envia (a tela enfileira) e o botão vira "Na fila". */
  queueWhileBusy?: boolean;
  /** As mensagens esperando, de cima (próxima) para baixo. */
  queue?: PromptQueuedItem[];
  onQueueSendNow?: (id: string) => void;
  onQueueEdit?: (id: string) => void;
  onQueueRemove?: (id: string) => void;
  /** Fontes do `@`. */
  mentions?: PromptMentionSource[];
  onMention?: (item: PromptMentionItem, source: PromptMentionSource) => void;
  /** Texto colado. Devolva true se virou outra coisa (chip) e não deve entrar no campo. */
  onPasteText?: (text: string) => boolean;
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
  queueLabel?: string;
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
const botaoMini = cn(
  "inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-[calc(var(--r-control)/2)] border-0 bg-transparent p-0 text-muted-foreground",
  "hover:bg-background hover:text-foreground pointer-coarse:h-8 pointer-coarse:w-8 [&_svg]:size-3",
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
    queueWhileBusy = false,
    queue = [],
    onQueueSendNow,
    onQueueEdit,
    onQueueRemove,
    mentions,
    onMention,
    onPasteText,
    accept = "image/*,video/*,audio/*",
    tools = [],
    aside,
    canSubmit,
    disabled = false,
    placeholder = "Escreva uma mensagem",
    label = "Mensagem",
    submitLabel = "Enviar",
    queueLabel = "Na fila",
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
  const temConteudo = canSubmit ?? (!!value.trim() || attachments.length > 0);
  const pode = !disabled && temConteudo && (!ocupado || queueWhileBusy);
  const enfileira = ocupado && queueWhileBusy;

  // ── Menção: o termo é o que vem depois de um @ no começo ou após espaço, até o cursor.
  const [mencao, setMencao] = React.useState<{ inicio: number; termo: string } | null>(null);
  const [achados, setAchados] = React.useState<{ source: PromptMentionSource; item: PromptMentionItem }[]>([]);
  const [ativo, setAtivo] = React.useState(0);
  const listaId = React.useId();
  const lerMencao = (el: HTMLTextAreaElement) => {
    if (!mentions?.length) return setMencao(null);
    const ate = el.value.slice(0, el.selectionStart ?? el.value.length);
    const m = /(^|\s)@([^\s@]{0,40})$/.exec(ate);
    setMencao((velha) => {
      const nova = m ? { inicio: ate.length - m[2].length - 1, termo: m[2] } : null;
      return velha?.inicio === nova?.inicio && velha?.termo === nova?.termo ? velha : nova;
    });
  };
  React.useEffect(() => {
    if (!mencao || !mentions?.length) return setAchados([]);
    let vivo = true;
    const t = window.setTimeout(async () => {
      const grupos = await Promise.all(
        mentions.map(async (source) => {
          try {
            const itens = await source.search(mencao.termo);
            return itens.slice(0, source.limit ?? 6).map((item) => ({ source, item }));
          } catch {
            return [];
          }
        }),
      );
      // A resposta de um termo velho chega depois da do novo: descarta.
      if (vivo) {
        setAchados(grupos.flat());
        setAtivo(0);
      }
    }, 90);
    return () => {
      vivo = false;
      window.clearTimeout(t);
    };
  }, [mencao, mentions]);
  const escolher = (i: number) => {
    const a = achados[i];
    const el = campo.current;
    if (!a || !mencao || !el) return;
    const fim = mencao.inicio + 1 + mencao.termo.length;
    const nome = `@${a.item.label} `;
    onValueChange(value.slice(0, mencao.inicio) + nome + value.slice(fim));
    onMention?.(a.item, a.source);
    setMencao(null);
    const cursor = mencao.inicio + nome.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  };
  const listaAberta = !!mencao && achados.length > 0;

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

  // `agora` (Ctrl/⌘+Enter) passa mesmo sem fila: interromper e mandar é sempre um pedido válido.
  const enviar = (agora = false) => {
    if (disabled || !temConteudo) return;
    if (!pode && !(agora && ocupado)) return;
    onSubmit({ now: agora && ocupado });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (listaAberta) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const n = achados.length;
        setAtivo((i) => (i + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
        return;
      }
      if ((e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) || e.key === "Tab") {
        e.preventDefault();
        escolher(ativo);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setMencao(null);
        return;
      }
    }
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    enviar(e.ctrlKey || e.metaKey);
  };

  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = [...e.clipboardData.files];
    if (onAttachFiles && files.length) {
      e.preventDefault();
      onAttachFiles(files);
      return;
    }
    const texto = e.clipboardData.getData("text/plain");
    if (texto && onPasteText?.(texto)) e.preventDefault();
  };

  return (
    <div
      className={cn(
        "group/composer relative flex w-full min-w-0 flex-col gap-2 rounded-[var(--r-surface)] border border-border bg-card p-2.5 text-card-foreground",
        "[transition:border-color_var(--dur-fast)_var(--ease-out)] motion-reduce:transition-none",
        "focus-within:[box-shadow:var(--focus)]",
        disabled && "opacity-60",
        className,
      )}
    >
      {queue.length ? (
        <ol className="flex flex-col gap-1" aria-label={`${queue.length} na fila`}>
          {queue.map((q, n) => (
            <li key={q.id} className="visant-composer-chip flex min-w-0 items-center gap-2 rounded-[var(--r-control)] bg-muted/60 py-1 pl-2 pr-1 text-xs">
              <span className="num w-3 shrink-0 text-center text-muted-foreground">{n + 1}</span>
              <span className="min-w-0 flex-1 truncate text-foreground" title={q.text}>
                {q.text || "(só anexos)"}
              </span>
              {q.attachmentCount ? (
                <span className="shrink-0 text-muted-foreground">
                  +<span className="num">{q.attachmentCount}</span>
                </span>
              ) : null}
              <span className="flex shrink-0 items-center">
                {onQueueSendNow ? (
                  <button type="button" className={cn(botaoMini, "w-auto gap-1 px-1.5")} title="Interromper e mandar esta agora" onClick={() => onQueueSendNow(q.id)}>
                    <CornerDownLeft aria-hidden="true" />
                    <span>Agora</span>
                  </button>
                ) : null}
                {onQueueEdit ? (
                  <button type="button" className={botaoMini} aria-label="Editar" title="Editar (volta para o campo)" onClick={() => onQueueEdit(q.id)}>
                    <Pencil aria-hidden="true" />
                  </button>
                ) : null}
                {onQueueRemove ? (
                  <button type="button" className={botaoMini} aria-label="Tirar da fila" title="Tirar da fila" onClick={() => onQueueRemove(q.id)}>
                    <X aria-hidden="true" />
                  </button>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      {attachments.length ? (
        <ul className="flex max-h-[7.5rem] flex-wrap gap-1.5 overflow-y-auto" aria-label="Anexos">
          {attachments.map((a) => (
            <li key={a.id} className="visant-composer-chip min-w-0 max-w-[15rem]">
              <ContextChip
                label={a.label}
                detail={a.detail}
                image={a.preview}
                icon={a.icon}
                portrait={a.portrait}
                title={a.detail ? `${a.label} ${a.detail}` : a.label}
                removeLabel={removeLabel(a)}
                onRemove={
                  onRemoveAttachment && !disabled
                    ? () => {
                        onRemoveAttachment(a.id);
                        // O botão some com o chip; o foco volta pro campo em vez de cair no body.
                        campo.current?.focus();
                      }
                    : undefined
                }
              />
            </li>
          ))}
        </ul>
      ) : null}

      {listaAberta ? (
        <ul
          id={listaId}
          role="listbox"
          aria-label="Mencionar"
          className="absolute inset-x-0 bottom-full z-50 mb-2 max-h-72 overflow-y-auto rounded-[var(--r-surface)] border border-border bg-popover p-1 text-popover-foreground [box-shadow:var(--e-overlay)]"
        >
          {achados.map((a, i) => {
            const grupo = i === 0 || achados[i - 1].source.id !== a.source.id;
            return (
              <React.Fragment key={`${a.source.id}:${a.item.id}`}>
                {grupo ? (
                  <li role="presentation" className="px-2 pb-1 pt-2 text-[0.6875rem] font-medium text-muted-foreground first:pt-1">
                    {a.source.label}
                  </li>
                ) : null}
                <li
                  id={`${listaId}-${i}`}
                  role="option"
                  aria-selected={i === ativo}
                  // Sem isto o campo perde o foco no clique e a lista fecha antes de escolher.
                  onPointerDown={(e) => e.preventDefault()}
                  onPointerEnter={() => setAtivo(i)}
                  onClick={() => escolher(i)}
                  className={cn("flex cursor-pointer items-center gap-2 rounded-[var(--r-control)] px-2 py-1.5 text-sm", i === ativo && "bg-muted")}
                >
                  {a.item.preview ? (
                    <img
                      src={a.item.preview}
                      alt=""
                      loading="lazy"
                      className={cn("shrink-0 rounded-[calc(var(--r-control)/2)] bg-background object-cover", a.item.portrait ? "h-7 w-4" : "size-6")}
                    />
                  ) : (
                    <span className="grid size-6 shrink-0 place-items-center rounded-[calc(var(--r-control)/2)] bg-muted text-foreground/80">{a.item.icon}</span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{a.item.label}</span>
                  {a.item.detail ? <span className="max-w-[45%] shrink-0 truncate text-xs text-muted-foreground">{a.item.detail}</span> : null}
                </li>
              </React.Fragment>
            );
          })}
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
        role={mentions?.length ? "combobox" : undefined}
        aria-expanded={mentions?.length ? listaAberta : undefined}
        aria-controls={listaAberta ? listaId : undefined}
        aria-activedescendant={listaAberta ? `${listaId}-${ativo}` : undefined}
        aria-autocomplete={mentions?.length ? "list" : undefined}
        onChange={(e) => {
          onValueChange(e.target.value);
          lerMencao(e.target);
        }}
        onSelect={(e) => lerMencao(e.currentTarget)}
        onBlur={() => setMencao(null)}
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
        {status === "streaming" && onStop && !(enfileira && temConteudo) ? (
          <button type="button" className={cn(botaoTexto, "border-border bg-background text-foreground hover:bg-muted")} onClick={onStop}>
            <Square aria-hidden="true" />
            {stopLabel}
          </button>
        ) : null}
        {enfileira && temConteudo ? (
          <button
            type="button"
            className={cn(botaoTexto, "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)] hover:enabled:opacity-90")}
            disabled={!pode}
            title="Enter põe na fila · Ctrl+Enter interrompe e manda agora"
            onClick={() => enviar(false)}
          >
            <ListPlus aria-hidden="true" />
            {queueLabel}
          </button>
        ) : status === "streaming" && onStop ? null : (
          <button
            type="button"
            className={cn(botaoTexto, "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)] hover:enabled:opacity-90")}
            disabled={!pode}
            aria-busy={status === "submitted" || undefined}
            onClick={() => enviar(false)}
          >
            {status === "submitted" ? <WorkingGlyph size={14} framed={false} shine={false} /> : <Send aria-hidden="true" />}
            {submitLabel}
          </button>
        )}
      </div>
    </div>
  );
});
