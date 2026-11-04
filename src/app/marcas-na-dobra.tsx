"use client";

/**
 * A tese do catálogo, na primeira dobra: cada peça veste a marca escolhida.
 *
 * O estado é o do `useBrandTheme`, o mesmo do seletor do cabeçalho, e tocar repinta a vitrine
 * toda. Não baixa nada novo: o `brands.json` já desceu com o provider e o tema só desce no toque.
 * Em rede lenta os botões esperam a dobra assentar, com o vão já reservado.
 *
 * As amostras são DADO da marca (`palette` do índice) em estilo inline: a casca em volta segue
 * neutra, sem fundo, sem borda e sem texto no celular.
 */

import { useBrandTheme, type BrandSummary } from "@/lib/brand-theme";
import { useDobraAssentada } from "@/lib/rede";
import { cn } from "@/lib/utils";

const ORDEM_DOS_PAPEIS = ["primary", "accent", "background", "foreground", "text", "secondary", "muted"];

function amostras(marca: BrandSummary) {
  const peso = (papel?: string | null) => {
    const i = ORDEM_DOS_PAPEIS.indexOf(papel ?? "");
    return i < 0 ? ORDEM_DOS_PAPEIS.length : i;
  };
  return [...marca.palette].sort((a, b) => peso(a.role) - peso(b.role)).slice(0, 4);
}

export function MarcasNaDobra({ className }: { className?: string }) {
  const { brands, active, setBrand } = useBrandTheme();
  const assentada = useDobraAssentada();
  const lista = assentada ? brands.slice(0, 4) : [];

  return (
    <div
      role="group"
      aria-label="Vestir a vitrine com uma marca"
      data-marcas-na-dobra=""
      className={cn("flex h-11 items-center gap-2 sm:gap-5", className)}
    >
      {lista.map((marca) => {
        const ativa = active?.slug === marca.slug;
        return (
          <button
            key={marca.slug}
            type="button"
            aria-pressed={ativa}
            aria-label={marca.name}
            title={marca.name}
            onClick={() => void setBrand(marca.slug)}
            className={cn(
              "group/marca flex h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-control outline-none transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] focus-visible:[box-shadow:var(--focus)] sm:flex-none",
              ativa ? "text-casa-fg" : "text-casa-fg-2 hover:text-casa-fg",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex h-6 w-full overflow-hidden rounded-[6px] outline outline-1 outline-casa-line transition-[outline-color,outline-offset] [transition-duration:var(--dur-fast)] sm:w-12",
                ativa ? "outline-offset-2 outline-casa-fg" : "group-hover/marca:outline-casa-fg-3",
              )}
            >
              {amostras(marca).map((cor) => (
                <span key={cor.hex} className="h-full min-w-0 flex-1" style={{ backgroundColor: cor.hex }} />
              ))}
            </span>
            <span className="hidden whitespace-nowrap text-casa-sm sm:inline">{marca.name}</span>
          </button>
        );
      })}
    </div>
  );
}
