"use client";

/**
 * Uma prancheta com quatro adesivos espalhados, como tampa de notebook. Clique
 * descola, arrastar muda de lugar. Os knobs pilotam o primeiro (o redondo da
 * marca); os outros mostram que a dobra vale para pílula e quadrado. "Recomeçar"
 * remonta a prancheta.
 *
 * A prancheta não recorta e tem folga em volta. Ao descolar por inteiro, o verso
 * refletido sai pela diagonal até um corpo de adesivo além da posição dele: com
 * `overflow-hidden` aqui, a promessa de "descola inteiro da página" terminava
 * numa borda reta. A folga do lado de fora é do tamanho desse percurso.
 *
 * No celular a prancheta perde 60px de largura, e as posições são outras: as de
 * desktop deixavam a pílula meio para fora.
 */

import * as React from "react";
import { RotateCcw, Sparkles, Star } from "lucide-react";
import { useElementWidth } from "../stage";
import { StickerPeel } from "../../../registry/visant/ui/sticker-peel";
import type { DemoProps } from "../catalog";

/*
 * As posições levam em conta para onde cada um descola: o verso sobe e vai à
 * esquerda, medido, até ~105px no redondo e ~136px na pílula. Daí a pílula longe
 * da quina de cima e o redondo longe da esquerda no celular.
 */
const LARGA = {
  selo: { x: 56, y: 68 },
  calma: { x: 190, y: 98 },
  manda: { x: 84, y: 182 },
  brilho: { x: 258, y: 160 },
};

const ESTREITA = {
  selo: { x: 92, y: 36 },
  calma: { x: 140, y: 130 },
  manda: { x: 104, y: 190 },
  brilho: { x: 226, y: 42 },
};

export default function StickerPeelDemo({ props }: DemoProps) {
  const [rodada, setRodada] = React.useState(0);
  const [mexeu, setMexeu] = React.useState(false);
  const marcar = () => setMexeu(true);
  const [caixa, largura] = useElementWidth<HTMLDivElement>();
  const estreita = largura > 0 && largura < 380;
  const pos = estreita ? ESTREITA : LARGA;

  return (
    // `overflow: clip` com margem: o adesivo pode pintar fora da caixa sem criar
    // barra de rolagem em quem hospeda a demo. O piso é o `preview` do catálogo: no
    // preset de celular (iframe) ninguém dá altura à demo, e sem ele a folga some.
    <div
      ref={caixa}
      className="flex h-full min-h-[400px] w-full items-center justify-center [overflow-clip-margin:20px] [overflow:clip] sm:[overflow-clip-margin:32px]"
    >
      <div className="relative h-[280px] w-[380px] max-w-full rounded-[var(--r-surface)] bg-muted">
        {/* A largura entra na chave: `defaultPosition` só vale ao montar. */}
        <div key={`${rodada}-${estreita}`} className="absolute inset-0">
          <StickerPeel
            label="Selo da marca"
            defaultPosition={pos.selo}
            rotate={-6}
            radius="9999px"
            peelOff
            onPeelOff={marcar}
            onPositionChange={marcar}
            {...props}
          >
            <span className="flex size-20 items-center justify-center rounded-[inherit] border-4 border-background bg-[var(--brand)] text-[var(--brand-foreground)]">
              <Star className="size-8" aria-hidden />
            </span>
          </StickerPeel>
          <StickerPeel
            label="Feito com calma"
            defaultPosition={pos.calma}
            rotate={5}
            radius="var(--r-pill)"
            peelOff
            onPeelOff={marcar}
            onPositionChange={marcar}
          >
            <span className="block whitespace-nowrap rounded-[inherit] border-4 border-background bg-card px-4 py-2 text-sm font-medium text-foreground">
              Feito com calma
            </span>
          </StickerPeel>
          <StickerPeel
            label="Manda ver"
            defaultPosition={pos.manda}
            rotate={-3}
            radius="var(--r-pill)"
            peelOff
            onPeelOff={marcar}
            onPositionChange={marcar}
          >
            <span className="block whitespace-nowrap rounded-[inherit] border-4 border-background bg-foreground px-4 py-2 text-sm font-medium text-background">
              Manda ver
            </span>
          </StickerPeel>
          <StickerPeel
            label="Brilho"
            defaultPosition={pos.brilho}
            rotate={8}
            radius="var(--r-surface)"
            peelOff
            onPeelOff={marcar}
            onPositionChange={marcar}
          >
            <span className="flex size-16 items-center justify-center rounded-[inherit] border-4 border-background bg-card text-foreground">
              <Sparkles className="size-6" aria-hidden />
            </span>
          </StickerPeel>
        </div>
        <button
          type="button"
          disabled={!mexeu}
          onClick={() => {
            setRodada((r) => r + 1);
            setMexeu(false);
          }}
          className="absolute right-3 bottom-3 z-[999] inline-flex items-center gap-1.5 rounded-[var(--r-control)] bg-card px-3 py-1.5 text-xs text-foreground [box-shadow:var(--e-raised)] transition-opacity duration-[var(--dur-fast)] ease-[var(--ease-out)] outline-none focus-visible:[box-shadow:var(--focus)] disabled:opacity-50"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Recomeçar
        </button>
      </div>
    </div>
  );
}
