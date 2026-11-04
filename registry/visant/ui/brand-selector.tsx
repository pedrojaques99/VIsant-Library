"use client";

/**
 * BrandSelector — trocar a marca do produto inteiro, ao vivo.
 *
 * Lê o índice publicado em `/r/brands.json` (gerado do vault de brand
 * guidelines do Visant Labs) e aplica o tema compilado da marca escolhida.
 * Nenhum componente da tela sabe que isso aconteceu: todos leem token.
 *
 * Duas decisões que dão o caráter da peça:
 *
 *  1. **Prévia ao percorrer.** O item em foco — mouse OU teclado — já pinta a
 *     interface. Escolher marca é uma decisão visual; obrigar a confirmar para
 *     só então ver é pedir que a pessoa decida no escuro. Sair da lista sem
 *     escolher volta exatamente ao estado anterior.
 *  2. **A linha diz o que é a marca, e só.** Logo, nome, frase e paleta. Versão,
 *     par tipográfico e completude do vault saíram da frente: quem troca de marca
 *     não decide por eles, e quem não conhece o vault lia "MANROPE · V27" e "80%"
 *     como defeito. A busca segue achando por fonte e por nome de cor.
 */

import * as React from "react";
import { Command } from "cmdk";
import { Check, ChevronDown, Palette, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrandTheme, type BrandSummary } from "@/lib/brand-theme";

// --- peças ------------------------------------------------------------------

/** Marca sem logo ainda vira monograma pintado com a própria cor. */
function BrandMark({ brand, size = 28 }: { brand: BrandSummary; size?: number }) {
  const [broken, setBroken] = React.useState(false);
  const url = brand.logo?.thumbnailUrl ?? brand.logo?.url;
  const tint = brand.preview.light.brand ?? brand.palette[0]?.hex ?? "var(--muted)";
  // O arquivo do logo é fixo e o tema muda: sobre o fundo da própria paleta ele
  // nunca some, em tema nenhum, e não precisa de filtro alterando a marca.
  const placa = brand.palette.find((c) => c.role === "background")?.hex ?? tint;
  const comLogo = Boolean(url) && !broken;

  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-[var(--r-control,0.5rem)] border border-border/60"
      style={{ width: size, height: size, background: comLogo ? placa : tint }}
    >
      {comLogo ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          onError={() => setBroken(true)}
          className="h-full w-full object-contain p-[3px]"
        />
      ) : (
        <span
          className="text-[11px] font-semibold leading-none"
          // Marca sem `brand-foreground` compilado cai no token do projeto, não
          // num preto escrito à mão: o portão de hex do `ship` existe para isso.
          style={{ color: brand.preview.light["brand-foreground"] ?? "var(--background)" }}
        >
          {brand.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}

function Swatches({ brand, max = 5 }: { brand: BrandSummary; max?: number }) {
  return (
    <span className="flex items-center -space-x-1">
      {brand.palette.slice(0, max).map((c, i) => (
        <span
          key={`${c.hex}-${i}`}
          title={[c.name, c.hex].filter(Boolean).join(" · ")}
          className="h-3 w-3 rounded-full ring-1 ring-background"
          style={{ background: c.hex }}
        />
      ))}
    </span>
  );
}

// --- trigger -----------------------------------------------------------------

export interface BrandSelectorProps {
  className?: string;
  /** Atalho de teclado. `null` desliga. Padrão: ⌘/Ctrl + B. */
  shortcut?: string | null;
}

export function BrandSelector({ className, shortcut = "b" }: BrandSelectorProps) {
  const { brands, brand, status, error, setBrand, previewBrand } = useBrandTheme();
  const [open, setOpen] = React.useState(false);
  const [highlight, setHighlight] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === shortcut && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shortcut]);

  // Fechar sem escolher desfaz a prévia. Sem isso, "só estava olhando" vira
  // "trocou a marca do produto".
  React.useEffect(() => {
    if (open) return;
    previewBrand(null);
    setHighlight(null);
  }, [open, previewBrand]);

  const commit = React.useCallback(
    (slug: string) => {
      setOpen(false);
      void setBrand(slug);
    },
    [setBrand],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={status === "loading"}
        aria-haspopup="dialog"
        className={cn(
          "group flex items-center gap-2.5 rounded-[var(--r-pill,9999px)] border border-border bg-card/80 py-1.5 pl-1.5 pr-3 text-left backdrop-blur",
          "transition-[background-color,border-color,box-shadow,transform] [transition-duration:var(--dur-fast)] ease-[var(--ease-out)]",
          "hover:border-[var(--brand,var(--border))] hover:[box-shadow:var(--e-raised)] active:scale-[0.985]",
          "focus-visible:outline-none focus-visible:[box-shadow:var(--focus)]",
          "disabled:opacity-60 pointer-coarse:min-h-11",
          className,
        )}
      >
        {brand ? (
          <BrandMark brand={brand} size={26} />
        ) : (
          <span className="grid h-[26px] w-[26px] place-items-center rounded-[var(--r-control,0.5rem)] border border-dashed border-border text-muted-foreground">
            <Palette className="h-3.5 w-3.5" />
          </span>
        )}
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[13px] font-medium">
            {brand ? brand.name : status === "error" ? "Marcas fora do ar" : "Escolher marca"}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {brand ? "Trocar marca" : `${brands.length} disponíveis`}
          </span>
        </span>
        {/*
         * A paleta no gatilho, e não só dentro da lista.
         *
         * Fechado, o botão dizia "Marca · Geist" — nome e fonte, nenhuma cor.
         * Só que a coisa que ele troca é justamente a COR do produto inteiro, e
         * o único lugar onde ela aparecia era atrás do clique. Três amostras
         * custam 30px e fazem o controle dizer o que ele é sem abrir nada. A
         * seta é o que diz que ele abre.
         */}
        <span className="ml-0.5 flex shrink-0 items-center gap-1.5">
          {brand && brand.palette.length > 0 && (
            <span className="hidden sm:block">
              <Swatches brand={brand} max={3} />
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        </span>
        {shortcut && (
          <kbd className="ml-1 hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
            ⌘{shortcut.toUpperCase()}
          </kbd>
        )}
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Selecionar marca"
        shouldFilter
        // Abre em cima da marca atual: sem isto a primeira linha ganhava o foco e a
        // prévia repintava o produto antes de a pessoa mexer em qualquer coisa.
        value={open ? (highlight ?? brand?.slug) : undefined}
        onValueChange={(v) => {
          setHighlight(v);
          previewBrand(v || null);
        }}
        // `className` na cmdk vai para o elemento Command, DENTRO do Content do
        // Radix — quem posiciona a caixa é `contentClassName`.
        overlayClassName="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0"
        contentClassName={cn(
          "fixed left-1/2 top-[12vh] z-50 w-[min(92vw,560px)] -translate-x-1/2 overflow-hidden rounded-[var(--r-surface,0.875rem)] border border-border bg-popover text-popover-foreground",
          "[box-shadow:var(--e-modal)]",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        )}
      >
        <div className="flex items-center gap-2 border-b border-border px-3.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Command.Input
            placeholder="Buscar marca…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {status === "loading" && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              carregando
            </span>
          )}
        </div>

        <Command.List className="max-h-[52vh] overflow-y-auto overscroll-contain p-1.5">
          <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
            {error ? "Não foi possível carregar as marcas." : "Nenhuma marca com esse nome."}
          </Command.Empty>

          {brands.map((b) => (
            <Command.Item
              key={b.slug}
              value={b.slug}
              // Busca por fonte e por nome de cor, não só pelo nome da marca:
              // é assim que se procura marca de verdade ("aquela do Geist").
              keywords={[b.name, b.fonts.display, b.fonts.sans, ...b.palette.map((c) => c.name ?? "")]}
              onSelect={() => commit(b.slug)}
              onMouseEnter={() => previewBrand(b.slug)}
              className={cn(
                "group flex cursor-pointer items-center gap-3 rounded-[var(--r-control,0.5rem)] px-2.5 py-2",
                "transition-colors [transition-duration:var(--dur-press)]",
                "data-[selected=true]:bg-muted",
              )}
            >
              <BrandMark brand={b} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-medium">{b.name}</span>
                  {brand?.slug === b.slug && (
                    <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent-ink)" }} />
                  )}
                </span>
                {b.tagline ? (
                  <span className="truncate text-[11px] text-muted-foreground">{b.tagline}</span>
                ) : null}
              </span>
              <span className="flex shrink-0 items-center">
                <Swatches brand={b} />
              </span>
            </Command.Item>
          ))}
        </Command.List>

        {/* No toque não há setas nem Enter: o rodapé some. */}
        <div className="border-t border-border px-3.5 py-2 text-[11px] text-muted-foreground [@media(pointer:coarse)]:hidden">
          Setas percorrem, Enter aplica
        </div>
      </Command.Dialog>
    </>
  );
}
