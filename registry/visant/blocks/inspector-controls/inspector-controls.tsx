"use client";

/**
 * Inspector controls: as linhas de um painel de propriedades (estúdio de mockups, editor de vídeo).
 *
 * Colhido do estúdio de mockups da vitrine (`src/app/mockups/controles.tsx`). O controle tem a forma
 * do dado: número limitado é a própria linha virando slider, cor é poço com hex, escolha entre
 * poucos é segmento, escolha com imagem é miniatura. Toda linha tem a mesma altura e a mesma ordem:
 * rótulo à esquerda, valor à direita, unidade um tom abaixo. Separação por linha fina entre pastas,
 * nunca caixa dentro de caixa.
 *
 * Sem cor própria: tudo sai de `--background`, `--foreground`, `--muted`, `--muted-foreground`,
 * `--border` e `--ring`. A altura da linha é `--ic-row` (2rem) e o fundo do topo fixo da pasta é
 * `--ic-surface` (padrão `--background`; num popover, aponte para `--popover`).
 */

import * as React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { ChevronRight, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

/* ── Número ─────────────────────────────────────────────────────────────── */

/** Número com vírgula, como se lê em português: 0,85 e não 0.85. */
export const formatNumber = (n: number, decimals = 0) => n.toFixed(decimals).replace(".", ",");

/** O inverso, tolerante: aceita vírgula ou ponto, e ignora unidade digitada junto ("12 dB"). */
export function parseNumber(s: string): number {
  const limpo = s.trim().replace(",", ".").replace(/[^\d.+-]/g, "");
  return limpo === "" ? NaN : Number(limpo);
}

const prender = (n: number, min: number, max: number, step: number) => {
  // Arredondar ao passo antes de prender: o arrasto produz 0,30000000004 e o valor salvo vira lixo.
  const snap = Math.round(n / step) * step;
  return Math.min(max, Math.max(min, +snap.toFixed(6)));
};

/* ── Teclado em grupo de rádio ──────────────────────────────────────────── */

/** Setas andam entre as opções de um radiogroup e já escolhem, como num rádio nativo. */
function andarNoGrupo(e: React.KeyboardEvent<HTMLElement>) {
  const passo = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[e.key];
  if (!passo) return;
  const itens = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)')];
  if (!itens.length) return;
  e.preventDefault();
  const agora = itens.indexOf(document.activeElement as HTMLButtonElement);
  const alvo = itens[(agora + passo + itens.length) % itens.length];
  alvo.focus();
  alvo.click();
}

/** Só a opção marcada entra no Tab (ou a primeira, se nenhuma): um grupo é uma parada do Tab, não N. */
const tabDoGrupo = (marcada: boolean, indice: number, algumaMarcada: boolean) =>
  marcada || (!algumaMarcada && indice === 0) ? 0 : -1;

/* ── Dica ───────────────────────────────────────────────────────────────── */

/**
 * O nome e o atalho de um botão de ícone. O filho precisa repassar ref (um `<button>` repassa).
 * Traz o próprio Provider: funciona solta em qualquer painel. No toque não aparece; lá o
 * `aria-label` e o desenho bastam.
 */
export function InspectorHint({
  label,
  shortcut,
  side = "top",
  children,
}: {
  label: string;
  shortcut?: string;
  side?: "top" | "bottom" | "left" | "right";
  children: React.ReactElement;
}) {
  return (
    <Tooltip.Provider delayDuration={450} skipDelayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="ic-hint" side={side} sideOffset={6}>
            {label}
            {shortcut ? <kbd>{shortcut}</kbd> : null}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

/* ── Pasta ──────────────────────────────────────────────────────────────── */

export interface InspectorSectionProps {
  title: React.ReactNode;
  /** Um resumo à direita do título: contagem, duração. Some quando há reset a mostrar. */
  aside?: React.ReactNode;
  /** O reset só existe depois que algo aqui mudou: é sinal antes de ser ação. */
  dirty?: boolean;
  onReset?: () => void;
  resetLabel?: string;
  defaultOpen?: boolean;
  /** `false` vira cabeça fixa, sem seta: para a pasta que nunca deveria sumir. */
  collapsible?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function InspectorSection({
  title,
  aside,
  dirty,
  onReset,
  resetLabel,
  defaultOpen = true,
  collapsible = true,
  className,
  children,
}: InspectorSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  // Campo opcional que ganhou conteúdo abre sozinho: o que acabou de aparecer precisa ser visto.
  React.useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);
  const aberta = !collapsible || open;
  const nome = resetLabel ?? (typeof title === "string" ? `Restaurar ${title}` : "Restaurar");
  return (
    <section className={cn("ic-section", className)} data-open={aberta || undefined}>
      <header className="ic-section-head">
        {collapsible ? (
          <button type="button" className="ic-section-title" aria-expanded={open} onClick={() => setOpen(!open)}>
            <ChevronRight size={13} aria-hidden />
            {title}
          </button>
        ) : (
          <h3 className="ic-section-title">{title}</h3>
        )}
        {dirty && onReset ? (
          <InspectorHint label={nome}>
            <button type="button" className="ic-reset" aria-label={nome} onClick={onReset}>
              <RotateCcw size={12} />
            </button>
          </InspectorHint>
        ) : aside != null ? (
          <span className="ic-section-aside">{aside}</span>
        ) : null}
      </header>
      <div className="ic-section-body">
        <div>{children}</div>
      </div>
    </section>
  );
}

/* ── Linha: rótulo e o que for ──────────────────────────────────────────── */

/** Rótulo à esquerda, qualquer controle à direita. Para o que não é um slider inteiro. */
export function InspectorRow({ label, children, className }: { label: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("ic-row", className)}>
      <span className="ic-label">{label}</span>
      <div className="ic-row-control">{children}</div>
    </div>
  );
}

/* ── Linha que é slider ─────────────────────────────────────────────────── */

export interface InspectorSliderProps {
  label: string;
  /** Nome para o leitor de tela quando o rótulo visível é curto demais ("Entrada" → "Fade de entrada"). */
  ariaLabel?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Marca na trilha, e destino do duplo clique. */
  defaultValue?: number;
  unit?: string;
  decimals?: number;
  /** Valor → texto. Para mostrar noutra escala (0,85 → "85" com unidade "%"). */
  format?: (v: number) => string;
  /** Texto digitado → valor. Obrigatório quando `format` muda de escala. */
  parse?: (s: string) => number;
  disabled?: boolean;
  /** Mudança contínua: arrasto e setas. Chega muitas vezes por gesto. */
  onValueChange: (v: number) => void;
  /** Mudança de uma vez: valor digitado e duplo clique de volta ao padrão. Sem ela, vai para `onValueChange`. */
  onValueCommit?: (v: number) => void;
  className?: string;
}

export function InspectorSlider({
  label,
  ariaLabel,
  value,
  min,
  max,
  step = 1,
  defaultValue,
  unit = "",
  decimals = 0,
  format,
  parse = parseNumber,
  disabled,
  onValueChange,
  onValueCommit,
  className,
}: InspectorSliderProps) {
  const [rascunho, setRascunho] = React.useState<string | null>(null);
  const raiz = React.useRef<HTMLDivElement>(null);
  const fechando = React.useRef(false);
  const gesto = React.useRef<{ x: number; y: number; v: number; ativo: boolean; toque: boolean; w: number; ultimo: number } | null>(null);
  const editando = rascunho !== null;
  const commit = onValueCommit ?? onValueChange;

  const prende = (n: number) => prender(n, min, max, step);
  const pct = (n: number) => (max === min ? 0 : ((Math.min(max, Math.max(min, n)) - min) / (max - min)) * 100);
  // Faixa que cruza o zero enche a partir do zero: enchido da esquerda, -6 dB leria como um quarto de algo.
  const origem = min < 0 && max > 0 ? pct(0) : 0;
  const atual = pct(value);
  const texto = format ? format(value) : formatNumber(value, decimals);

  const abrirCampo = () => {
    fechando.current = false;
    setRascunho(texto);
  };
  // Enter e o blur chegam juntos: só o primeiro grava. Esc desiste. O foco volta para a linha.
  const fecharCampo = (gravar: boolean) => {
    if (fechando.current) return;
    fechando.current = true;
    if (gravar && rascunho !== null) {
      const n = parse(rascunho);
      if (Number.isFinite(n)) {
        const v = prende(n);
        if (Math.abs(v - value) > 1e-9) commit(v);
      }
    }
    setRascunho(null);
    requestAnimationFrame(() => raiz.current?.focus({ preventScroll: true }));
  };

  return (
    <div
      ref={raiz}
      className={cn("ic-slider", className)}
      role="slider"
      tabIndex={editando || disabled ? -1 : 0}
      aria-label={ariaLabel ?? label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${texto}${unit}`}
      aria-disabled={disabled || undefined}
      data-editing={editando || undefined}
      onPointerDown={(e) => {
        if (editando || disabled || e.button !== 0) return;
        const toque = e.pointerType !== "mouse";
        gesto.current = { x: e.clientX, y: e.clientY, v: value, ativo: false, toque, w: e.currentTarget.getBoundingClientRect().width || 1, ultimo: value };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const g = gesto.current;
        if (!g) return;
        const dx = e.clientX - g.x;
        if (!g.ativo) {
          // O dedo diz o eixo primeiro: arrasto em pé é rolagem do painel, e o valor fica onde está.
          if (Math.abs(dx) < 4) return;
          if (g.toque && Math.abs(e.clientY - g.y) > Math.abs(dx)) {
            gesto.current = null;
            return;
          }
          g.ativo = true;
        }
        // Shift afina o arrasto: a linha inteira passa a valer um quinto da faixa.
        const fino = e.shiftKey ? 0.2 : 1;
        const v = prende(g.v + (dx / g.w) * (max - min) * fino);
        if (v !== g.ultimo) {
          g.ultimo = v;
          onValueChange(v);
        }
      }}
      onPointerUp={() => {
        const g = gesto.current;
        gesto.current = null;
        // Clique sem arrasto digita: as três entradas de um número são arrastar, digitar e setas.
        if (g && !g.ativo) abrirCampo();
      }}
      onPointerCancel={() => (gesto.current = null)}
      onDoubleClick={() => {
        if (defaultValue === undefined || disabled) return;
        fechando.current = true;
        setRascunho(null);
        if (Math.abs(defaultValue - value) > 1e-9) commit(defaultValue);
      }}
      onKeyDown={(e) => {
        if (editando || disabled) return;
        if (e.key === "Enter" || e.key === "F2") {
          e.preventDefault();
          abrirCampo();
          return;
        }
        const d = (e.shiftKey ? 10 : 1) * step;
        const alvo = (
          {
            ArrowRight: value + d,
            ArrowUp: value + d,
            ArrowLeft: value - d,
            ArrowDown: value - d,
            PageUp: value + step * 10,
            PageDown: value - step * 10,
            Home: min,
            End: max,
          } as Record<string, number>
        )[e.key];
        if (alvo === undefined) return;
        e.preventDefault();
        const v = prende(alvo);
        if (v !== value) onValueChange(v);
      }}
    >
      <span className="ic-slider-fill" style={{ left: `${Math.min(origem, atual)}%`, width: `${Math.abs(atual - origem)}%` }} aria-hidden />
      {defaultValue !== undefined ? <span className="ic-slider-mark" style={{ left: `${pct(defaultValue)}%` }} aria-hidden /> : null}
      <span className="ic-label">{label}</span>
      {editando ? (
        <input
          className="ic-slider-input"
          autoFocus
          inputMode="decimal"
          aria-label={`Valor de ${ariaLabel ?? label}`}
          value={rascunho ?? ""}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setRascunho(e.target.value)}
          onBlur={() => fecharCampo(true)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") fecharCampo(true);
            if (e.key === "Escape") fecharCampo(false);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="ic-value">
          {texto}
          {unit ? <i>{unit}</i> : null}
        </span>
      )}
    </div>
  );
}

/* ── Escolha entre poucos ───────────────────────────────────────────────── */

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
}

/** De duas a quatro opções curtas. Valor fora das opções (seleção mista) apaga a luz. */
export function InspectorSegments<T extends string>({
  label,
  value,
  options,
  onValueChange,
  className,
}: {
  label: string;
  value: T | null;
  options: SegmentOption<T>[];
  onValueChange: (v: T) => void;
  className?: string;
}) {
  const i = options.findIndex((o) => o.value === value);
  return (
    <div
      className={cn("ic-segments", className)}
      role="radiogroup"
      aria-label={label}
      style={{ "--n": options.length, "--i": Math.max(0, i) } as React.CSSProperties}
      onKeyDown={andarNoGrupo}
    >
      {i >= 0 ? <span className="ic-segments-light" aria-hidden /> : null}
      {options.map((o, k) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={tabDoGrupo(o.value === value, k, i >= 0)}
          disabled={o.disabled}
          onClick={() => o.value !== value && onValueChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Miniaturas ─────────────────────────────────────────────────────────── */

export function InspectorThumbs({ label, columns = 3, className, children }: { label: string; columns?: number; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("ic-thumbs", className)} role="radiogroup" aria-label={label} style={{ "--columns": columns } as React.CSSProperties} onKeyDown={andarNoGrupo}>
      {children}
    </div>
  );
}

/** Uma opção com desenho. O desenho é o filho; o nome vai embaixo e é também o nome acessível. */
export function InspectorThumb({
  label,
  selected,
  onSelect,
  disabled,
  children,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className="ic-thumb" role="radio" aria-checked={selected} aria-label={label} disabled={disabled} onClick={onSelect}>
      <span className="ic-thumb-art">{children}</span>
      <span className="ic-thumb-name">{label}</span>
    </button>
  );
}

/* ── Cor ────────────────────────────────────────────────────────────────── */

export interface SwatchOption<T extends string = string> {
  value: T;
  /** Qualquer cor CSS: hex, `var(--…)`, oklch. */
  color: string;
  label: string;
  /** Anel vazado: a opção "nenhuma cor própria, vale a herdada". */
  hollow?: boolean;
}

/** Fileira de amostras. Aceita hex solto ou opções com nome (a paleta da marca, cores por token). */
export function InspectorSwatches<T extends string = string>({
  label,
  value,
  options,
  onValueChange,
  className,
}: {
  label: string;
  value: T | null;
  options: (T | SwatchOption<T>)[];
  onValueChange: (v: T) => void;
  className?: string;
}) {
  const lista: SwatchOption<T>[] = options.map((o) => (typeof o === "string" ? { value: o, color: o, label: o } : o));
  const igual = (a: string, b: string | null) => b !== null && a.toUpperCase() === b.toUpperCase();
  const alguma = lista.some((o) => igual(o.value, value));
  return (
    <div className={cn("ic-swatches", className)} role="radiogroup" aria-label={label} onKeyDown={andarNoGrupo}>
      {lista.map((o, k) => (
        <InspectorHint key={o.value} label={o.label}>
          <button
            type="button"
            role="radio"
            aria-checked={igual(o.value, value)}
            aria-label={o.label}
            tabIndex={tabDoGrupo(igual(o.value, value), k, alguma)}
            data-hollow={o.hollow || undefined}
            style={{ "--swatch": o.color } as React.CSSProperties}
            onClick={() => onValueChange(o.value)}
          />
        </InspectorHint>
      ))}
    </div>
  );
}

const HEX = /^#?[0-9a-f]{6}$/i;

/** Cor livre: hex digitável e o poço que abre o seletor do sistema. Com `swatches`, a paleta vem embaixo. */
export function InspectorColor({
  label,
  value,
  onValueChange,
  swatches,
  className,
}: {
  label: string;
  /** `#RRGGBB`. */
  value: string;
  onValueChange: (c: string) => void;
  swatches?: (string | SwatchOption)[];
  className?: string;
}) {
  const [texto, setTexto] = React.useState(value);
  React.useEffect(() => setTexto(value), [value]);
  const linha = (
    <div className={cn("ic-row ic-color", !swatches && className)}>
      <span className="ic-label">{label}</span>
      <input
        className="ic-color-hex"
        aria-label={`${label} em hexadecimal`}
        spellCheck={false}
        value={texto}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          setTexto(e.target.value);
          if (HEX.test(e.target.value)) onValueChange(`#${e.target.value.replace("#", "").toUpperCase()}`);
        }}
        onBlur={() => setTexto(value)}
      />
      <label className="ic-color-well" style={{ "--swatch": value } as React.CSSProperties}>
        <span className="sr-only">Escolher {label}</span>
        <input type="color" value={HEX.test(value) ? value : ""} onChange={(e) => onValueChange(e.target.value.toUpperCase())} />
      </label>
    </div>
  );
  if (!swatches) return linha;
  return (
    <div className={cn("ic-stack", className)}>
      {linha}
      <InspectorSwatches label={`Paleta de ${label}`} value={value} options={swatches} onValueChange={onValueChange} />
    </div>
  );
}

/* ── Vetor: um valor com partes ─────────────────────────────────────────── */

export interface VectorPart {
  /** A letra que nomeia a parte (X, Y, W, H). Arrastar sobre ela muda o valor. */
  letter: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onValueChange: (v: number) => void;
}

export function InspectorVector({ label, parts, className }: { label: string; parts: VectorPart[]; className?: string }) {
  return (
    <div className={cn("ic-vector", className)} role="group" aria-label={label}>
      {parts.map((p) => (
        <Parte key={p.letter} {...p} grupo={label} />
      ))}
    </div>
  );
}

function Parte({ letter, value, min, max, step = 1, unit = "", onValueChange, grupo }: VectorPart & { grupo: string }) {
  const [texto, setTexto] = React.useState<string | null>(null);
  const gesto = React.useRef<{ x: number; v: number } | null>(null);
  const prende = (n: number) => prender(n, min, max, step);
  const casas = Math.max(0, -Math.floor(Math.log10(step)));
  return (
    <label className="ic-part">
      <span
        className="ic-part-letter"
        onPointerDown={(e) => {
          gesto.current = { x: e.clientX, v: value };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (gesto.current) onValueChange(prende(gesto.current.v + (e.clientX - gesto.current.x) * 0.5 * step * (e.shiftKey ? 0.2 : 1)));
        }}
        onPointerUp={() => (gesto.current = null)}
        onPointerCancel={() => (gesto.current = null)}
      >
        {letter}
      </span>
      <input
        inputMode="decimal"
        aria-label={`${grupo} ${letter}`}
        value={texto ?? `${formatNumber(value, casas)}${unit}`}
        onFocus={(e) => {
          setTexto(formatNumber(value, casas));
          requestAnimationFrame(() => e.target.select());
        }}
        onChange={(e) => {
          setTexto(e.target.value);
          const n = parseNumber(e.target.value);
          if (Number.isFinite(n)) onValueChange(prende(n));
        }}
        onBlur={() => setTexto(null)}
        onKeyDown={(e) => {
          if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
          e.preventDefault();
          const n = prende(value + (e.key === "ArrowUp" ? 1 : -1) * step * (e.shiftKey ? 10 : 1));
          onValueChange(n);
          setTexto(formatNumber(n, casas));
        }}
      />
    </label>
  );
}

/* ── Liga e desliga ─────────────────────────────────────────────────────── */

/** A linha inteira é o interruptor: o rótulo diz o que acontece quando está ligado. */
export function InspectorToggle({
  label,
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  label: React.ReactNode;
  /** `null` enquanto o valor ainda não chegou: mostra desligado e não deixa mexer. */
  checked: boolean | null;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked === true}
      disabled={disabled || checked === null}
      className={cn("ic-row ic-toggle", className)}
      onClick={() => onCheckedChange(!checked)}
    >
      <span className="ic-label">{label}</span>
      <span className="ic-toggle-track" aria-hidden>
        <span className="ic-toggle-thumb" />
      </span>
    </button>
  );
}
