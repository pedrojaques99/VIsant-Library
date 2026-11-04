"use client";

/**
 * A rota do catálogo: a grade ou a ficha, e tudo o que precisa conhecer as peças.
 *
 * Mora fora do `App.tsx` para a casca não importar o catálogo. O caminho chega cru, e é aqui
 * que ele vira família e peça.
 */

import * as React from "react";
import { CATALOG, FAMILIA_ANTIGA, FAMILIES, familyLabel, type Family } from "./catalog";
import { Gallery } from "./Gallery";
import { FAMILIA_DA_PECA } from "./rota-familia";

/*
 * A ficha também fica fora deste chunk. Ela arrasta `props.generated.json` e
 * `controls.generated.json`, que a grade nunca lê.
 */
const ComponentFocus = React.lazy(() => import("./ComponentFocus").then((m) => ({ default: m.ComponentFocus })));

const familiaValida = (parte: string | null): Family | null =>
  FAMILIES.find((f) => f.key === parte)?.key ?? (parte ? FAMILIA_ANTIGA[parte] : undefined) ?? null;

export function RotaCatalogo({
  focus,
  familia: parte,
  onNavegar,
  onFocus,
  onFamilia,
}: {
  focus: string | null;
  familia: string | null;
  onNavegar: (focus: string | null, familia: string | null) => void;
  onFocus: (focus: string | null) => void;
  onFamilia: (familia: string | null) => void;
}) {
  const peca = React.useMemo(() => (focus ? (CATALOG.find((i) => i.name === focus) ?? null) : null), [focus]);
  const familia = parte === FAMILIA_DA_PECA ? (peca?.family ?? null) : familiaValida(parte);

  /* O mesmo título que o `prerender.mjs` escreve: navegar por dentro não pode trocar um pelo outro. */
  React.useEffect(() => {
    document.title = peca
      ? `${peca.title} / @visant/ui`
      : familia
        ? `${familyLabel(familia)} / catálogo @visant/ui`
        : "A library da Visant / @visant/ui";
  }, [peca, familia]);

  /*
   * A vizinhança da peça em foco: a família dela, na ordem do catálogo.
   *
   * É o que dá sentido a `←`/`→` e ao contador "13/20" — e é derivado da peça,
   * então o mesmo endereço percorre a mesma lista pra qualquer pessoa.
   */
  const irmas = React.useMemo(() => (peca ? CATALOG.filter((i) => i.family === peca.family) : []), [peca]);
  const indice = peca ? irmas.findIndex((i) => i.name === peca.name) : 0;
  const andar = (passo: number) => {
    if (irmas.length) onFocus(irmas[(indice + passo + irmas.length) % irmas.length].name);
  };

  /*
   * A ficha é uma ROTA, não um estado por cima da grade.
   *
   * `/c/<item>` renderiza a ficha no lugar do catálogo, dentro da mesma
   * casca. Enquanto ela era um diálogo, a grade continuava montada atrás do
   * overlay: oitenta demos vivas gastando CPU embaixo de uma peça que ninguém
   * estava vendo.
   *
   * A lista que as setas percorrem é a FAMÍLIA da peça, e não o resultado do
   * filtro que estava na grade. Filtro é estado da outra página; herdá-lo
   * faria `→` levar a lugares diferentes dependendo de como a pessoa chegou,
   * e o mesmo endereço tem de significar a mesma coisa pra quem colou o link
   * no chat.
   */
  if (focus && !peca) {
    return (
      <main className="shell casa min-h-[60vh] pt-24">
        <h1 className="text-casa-xl font-medium">Essa peça não existe.</h1>
        <button
          type="button"
          onClick={() => onNavegar(null, null)}
          className="alvo-toque mt-3 cursor-pointer rounded-control text-casa-lg text-casa-fg-2 underline underline-offset-4"
        >
          Voltar ao catálogo
        </button>
      </main>
    );
  }

  if (focus && peca) {
    return (
      <React.Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
        <ComponentFocus
          key={peca.name}
          item={peca}
          index={indice}
          total={irmas.length}
          onClose={() => onNavegar(null, familia)}
          onPrev={() => andar(-1)}
          onNext={() => andar(1)}
        />
      </React.Suspense>
    );
  }
  return <Gallery onFocus={onFocus} familia={familia} onFamilia={onFamilia} />;
}
