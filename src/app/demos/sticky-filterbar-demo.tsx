"use client";

/**
 * Uma linha de filtros e fotos rolando por baixo dela. Mais nada.
 *
 * Sem cabeçalho falso, sem segunda linha, sem contagem e sem legenda nos cards: o
 * que a peça promete é grudar, e isso se vê com a lista passando por baixo. Por
 * isso a demo nasce já um pouco rolada, com a foto cortada pela barra.
 *
 * O pé dissolve: a lista continua, e quem diz isso é o fim gradual. Com corte reto,
 * o conteúdo terminava seco no meio do palco da ficha e a grade mostrava uma fresta
 * de 2 a 3px da fileira seguinte na borda do cartão.
 *
 * `--header-h` em -1px neste invólucro e um `headerSelector` que não acha nada: sem
 * cabeçalho aqui, a peça não pode medir o da vitrine e reescrever a página. O -1px
 * é do palco: sob `scale` o topo da barra cai em fração de pixel, e uma linha da
 * foto escapava por cima dela.
 */

import * as React from "react";

import { Media, type Papel } from "../media";
import { Chip } from "../../../registry/visant/ui/chip";
import { StickyFilterbar, FilterRow } from "../../../registry/visant/ui/sticky-filterbar";
import type { DemoProps } from "../catalog";

const ACERVO: { papel: Papel; indice: number }[] = [
  { papel: "cena", indice: 2 },
  { papel: "textura", indice: 0 },
  { papel: "cena", indice: 3 },
  { papel: "textura", indice: 2 },
  { papel: "cena", indice: 5 },
  { papel: "textura", indice: 3 },
  { papel: "cena", indice: 6 },
  { papel: "textura", indice: 1 },
  { papel: "cena", indice: 0 },
  { papel: "cena", indice: 4 },
];

const SEM_CABECALHO = { "--header-h": "-1px" } as React.CSSProperties;
const ROLAGEM_INICIAL = 44;
const DISSOLVE = "linear-gradient(to bottom, black calc(100% - 72px), transparent)";

export default function StickyFilterbarDemo({ props }: DemoProps) {
  const [filtro, setFiltro] = React.useState<Papel | null>(null);
  const caixa = React.useRef<HTMLDivElement>(null);
  const lista = ACERVO.filter((p) => !filtro || p.papel === filtro);

  React.useLayoutEffect(() => {
    caixa.current?.scrollTo({ top: ROLAGEM_INICIAL });
  }, []);

  return (
    // O contêiner é quem rola. A barra descobre isso sozinha (ela procura o
    // ancestral rolante), então o fio de progresso mede este percurso.
    <div
      ref={caixa}
      style={{ ...SEM_CABECALHO, maskImage: DISSOLVE, WebkitMaskImage: DISSOLVE }}
      className="h-full w-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <StickyFilterbar headerSelector="[data-demo-sem-cabecalho]" className="px-4" {...props}>
        <FilterRow>
          <Chip pressed={filtro === null} onClick={() => setFiltro(null)}>
            Todos
          </Chip>
          <Chip pressed={filtro === "cena"} onClick={() => setFiltro("cena")}>
            Cenas
          </Chip>
          <Chip pressed={filtro === "textura"} onClick={() => setFiltro("textura")}>
            Texturas
          </Chip>
        </FilterRow>
      </StickyFilterbar>

      {/* A chave é o filtro: a grade remonta e entra de novo, e a pessoa vê que a
          lista respondeu. */}
      <div key={String(filtro)} className="grid grid-cols-2 gap-3 p-4">
        {lista.map((p) => (
          <Media
            key={`${p.papel}-${p.indice}`}
            papel={p.papel}
            indice={p.indice}
            ratio="16/10"
            className="w-full rounded-[var(--r-control,0.5rem)] animate-in fade-in-0 [animation-duration:var(--dur-base)] [animation-timing-function:var(--ease-out)]"
          />
        ))}
      </div>
    </div>
  );
}
