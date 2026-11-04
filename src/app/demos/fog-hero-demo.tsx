"use client";

/**
 * A hero numa caixa de vitrine — com os vídeos do acervo e sem logo.
 *
 * Sem logo de propósito: o `logo` é opcional, e o caminho sem ele (só névoa e
 * vídeo) é o que mais quebraria calado se o shader dependesse da textura. Sem
 * título também: numa página de verdade ele iria em `children`, por cima do
 * canvas, mas no palco a névoa fala sozinha.
 *
 * WebM primeiro, se o navegador tocar: o Chromium de build livre não decodifica
 * h264, e uma hero com vídeo preto pareceria shader quebrado.
 */

import * as React from "react";

import { FogHero } from "../../../registry/visant/blocks/fog-hero";
import { midia } from "../media";
import type { DemoProps } from "../catalog";

/*
 * O preset é o aprovado no projeto de origem, suave de propósito (marca de aroma). Na vitrine, com as
 * vinhetas escuras da casa, ele lia como cinza chapado: aqui o tom sobe o
 * contraste, tira o haze e abre mais a clareira, para a névoa enquadrar as
 * bordas e a marca ler nítida no centro. `invertVideo` porque a filmagem é escura.
 */
const TOM_VITRINE = { invertVideo: true, contrast: 1.1, haze: 0.04, smokeLift: 0.12, photo: 0.95, clear: 0.72 };

export default function FogHeroDemo({ props }: DemoProps) {
  const videos = React.useMemo(() => {
    const webm = document.createElement("video").canPlayType("video/webm") !== "";
    return [0, 1, 2]
      .map((i) => midia("video", i))
      .filter((m): m is NonNullable<typeof m> => !!m)
      .map((m) => (webm && m.webm ? m.webm : m.src));
  }, []);

  return (
    <div className="h-full w-full p-3">
    <div className="h-full w-full overflow-hidden rounded-[var(--r-surface,0.875rem)] border border-border">
      <FogHero videos={videos} className="h-full" swapEvery={6000} params={TOM_VITRINE} {...props} />
    </div>
    </div>
  );
}
