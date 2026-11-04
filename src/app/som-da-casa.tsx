"use client";

import { SfxToggle } from "../../registry/visant/ui/sfx-toggle";
import { useSfxWiring, SFX_DEFAULT_SELECTOR } from "@/lib/sfx-bus";

/**
 * O `SfxToggle` do registry vestido de ícone da casa: tom e raio da casca,
 * nunca os da marca. As ondas recolhendo continuam dizendo o estado. Some
 * abaixo de lg: no toque o bus não toca, e no tablet o cabeçalho não tem folga.
 */
const SOM_DA_CASA =
  "max-lg:!hidden size-8 rounded-control text-casa-fg-2 hover:border-transparent hover:bg-casa-tile hover:text-casa-fg data-[state=on]:text-casa-fg-2 focus-visible:outline-none focus-visible:[box-shadow:var(--focus)]";

/*
 * O som da casa: só clique, nunca hover. Passar o ponteiro pela grade não é
 * agir, e sessenta cards estalando sob o mouse é o som que faz desligar.
 * Armado por padrão, mudo sob reduced-motion, e a escolha salva vence.
 */
export function SomDaCasa() {
  useSfxWiring(SFX_DEFAULT_SELECTOR, { hover: false });
  return <SfxToggle className={SOM_DA_CASA} />;
}
