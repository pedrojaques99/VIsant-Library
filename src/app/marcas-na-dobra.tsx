"use client";

/**
 * A tese do catálogo, na primeira dobra: cada peça veste a marca escolhida.
 *
 * O estado é o do `useBrandTheme`, o mesmo do seletor do cabeçalho, e tocar repinta a vitrine
 * toda. Não baixa nada novo: o `brands.json` já desceu com o provider e o tema só desce no toque.
 * Em rede lenta os botões esperam a dobra assentar, com o vão já reservado.
 *
 * Cada opção se identifica: logo ou monograma, mais o nome. Era uma pilha de faixas de cor, e
 * quatro paletas apertadas não diziam nem que aquilo era um seletor de marca. No celular cabem só
 * as miniaturas, e o nome da escolhida fica ao lado. A cor vem da marca, em estilo inline, e a
 * casca em volta segue neutra.
 */

import * as React from "react";
import { useBrandTheme, type BrandSummary } from "@/lib/brand-theme";
import { PREFIXO_DA_CONTA, useMarcaPintada } from "@/lib/marca-pintada";
import { useDobraAssentada } from "@/lib/rede";
import { cn } from "@/lib/utils";

/**
 * Mesma regra do `BrandMark` de `brand-selector`, que não dá para importar daqui porque traz o
 * cmdk para a primeira dobra: logo sobre o fundo da própria paleta, ou monograma na cor da marca.
 */
function Miniatura({ marca }: { marca: BrandSummary }) {
  const [semLogo, setSemLogo] = React.useState(!marca.logo);
  const placa = marca.palette.find((c) => c.role === "background")?.hex;
  const tinta = marca.preview.light.brand ?? marca.palette[0]?.hex;
  return (
    <span
      aria-hidden
      className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-[6px] outline outline-1 -outline-offset-1 outline-casa-fg-3"
      style={{ background: semLogo ? tinta : placa }}
    >
      {semLogo ? (
        <span className="text-[11px] font-medium leading-none" style={{ color: marca.preview.light["brand-foreground"] }}>
          {marca.name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
        </span>
      ) : (
        <img
          src={`/logos/${marca.slug}.webp`}
          alt=""
          onError={(e) => {
            if (marca.logo && e.currentTarget.src !== marca.logo.url) e.currentTarget.src = marca.logo.url;
            else setSemLogo(true);
          }}
          className="size-full object-contain p-1"
        />
      )}
    </span>
  );
}

export function MarcasNaDobra({ className }: { className?: string }) {
  const { brands, active, setBrand } = useBrandTheme();
  const assentada = useDobraAssentada();
  const lista = assentada ? brands.slice(0, 4) : [];
  /* Com marca da conta na tela, nenhuma destas está vestida: marcar uma seria mentira. */
  const daConta = useMarcaPintada()?.startsWith(PREFIXO_DA_CONTA);

  return (
    <div
      role="group"
      aria-label="Vestir a vitrine com uma marca"
      data-marcas-na-dobra=""
      className={cn("-ml-1.5 flex h-11 w-fit max-w-full items-center gap-1", className)}
    >
      {lista.map((marca) => {
        const ativa = !daConta && active?.slug === marca.slug;
        return (
          <button
            key={marca.slug}
            type="button"
            aria-pressed={ativa}
            aria-label={marca.name}
            onClick={() => void setBrand(marca.slug)}
            className={cn(
              "flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-control px-1.5 text-casa-sm outline-none sm:pr-3",
              "transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] focus-visible:[box-shadow:var(--focus)]",
              ativa ? "bg-casa-tile-2 text-casa-fg" : "text-casa-fg-2 hover:text-casa-fg",
            )}
          >
            <Miniatura marca={marca} />
            <span className="hidden whitespace-nowrap sm:inline">{marca.name}</span>
          </button>
        );
      })}
      {active && !daConta && lista.length ? <span className="ml-1.5 truncate text-casa-sm text-casa-fg-2 sm:hidden">{active.name}</span> : null}
    </div>
  );
}
