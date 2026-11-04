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
    /*
     * Empilhadas em repouso, e abrem de lado com o mouse em cima ou o foco dentro.
     * Cada marca tem a vaga dela já reservada: o que anda é só `transform`, então abrir
     * não refaz o layout. Em repouso a faixa não pega ponteiro: só as amostras pegam.
     */
    <div
      role="group"
      aria-label="Vestir a vitrine com uma marca"
      data-marcas-na-dobra=""
      className={cn(
        "group/marcas flex h-11 w-fit max-w-full items-center gap-1 pointer-coarse:-ml-1.5 pointer-fine:gap-0",
        "pointer-fine:pointer-events-none pointer-fine:hover:pointer-events-auto pointer-fine:has-[:focus-visible]:pointer-events-auto",
        className,
      )}
    >
      {lista.map((marca, i) => {
        const ativa = active?.slug === marca.slug;
        return (
          <div
            key={marca.slug}
            style={{ zIndex: ativa ? lista.length : lista.length - i, "--i": i } as React.CSSProperties}
            className={cn(
              "relative shrink-0 pointer-coarse:w-11 pointer-fine:w-[7.5rem]",
              "transition-transform [transition-duration:var(--dur-base)] [transition-timing-function:var(--ease-out)]",
              "pointer-fine:[transform:translateX(calc(var(--i)*-6.5rem))] pointer-fine:group-hover/marcas:[transform:none] pointer-fine:group-has-[:focus-visible]/marcas:[transform:none]",
            )}
          >
            <button
              type="button"
              aria-pressed={ativa}
              aria-label={marca.name}
              title={marca.name}
              onClick={() => void setBrand(marca.slug)}
              className={cn(
                "group/marca pointer-events-auto flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-control pointer-fine:justify-start outline-none transition-colors [transition-duration:var(--dur-fast)] focus-visible:[box-shadow:var(--focus)] pointer-fine:w-8",
                ativa ? "text-casa-fg" : "text-casa-fg-2 hover:text-casa-fg",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex h-6 w-8 shrink-0 overflow-hidden rounded-[6px] outline outline-2 transition-[outline-color,outline-offset] [transition-duration:var(--dur-fast)]",
                  ativa ? "outline-offset-1 outline-casa-fg" : "outline-casa-bg group-hover/marca:outline-casa-fg-3",
                )}
              >
                {amostras(marca).map((cor) => (
                  <span key={cor.hex} className="h-full min-w-0 flex-1" style={{ backgroundColor: cor.hex }} />
                ))}
              </span>
              <span
                className={cn(
                  "hidden whitespace-nowrap text-casa-sm opacity-0 transition-opacity [transition-duration:var(--dur-base)] [transition-timing-function:var(--ease-out)] pointer-fine:inline",
                  // Invisível, o nome passa por cima da amostra seguinte: em repouso ele não pega clique.
                  "pointer-fine:pointer-events-none pointer-fine:group-hover/marcas:pointer-events-auto",
                  "pointer-fine:group-hover/marcas:opacity-100 pointer-fine:group-has-[:focus-visible]/marcas:opacity-100",
                )}
              >
                {marca.name}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
