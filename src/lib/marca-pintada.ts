import * as React from "react";

/** Marca do vault no `data-brand`: nunca colide com o slug de uma marca de demonstração. */
export const PREFIXO_DA_CONTA = "conta:";

const raiz = () => document.documentElement;

function assinar(avisar: () => void) {
  const olho = new MutationObserver(avisar);
  olho.observe(raiz(), { attributes: true, attributeFilter: ["data-brand"] });
  return () => olho.disconnect();
}

/** A marca que está de fato na tela, que pode não ser a efetivada no `useBrandTheme`. */
export function useMarcaPintada() {
  return React.useSyncExternalStore(assinar, () => raiz().dataset.brand ?? null, () => null);
}
