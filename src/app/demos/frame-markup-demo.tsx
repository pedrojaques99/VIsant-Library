"use client";

/**
 * Apontar num quadro do filme. O quadro é um canvas pintado com os tokens do
 * tema (a vitrine não carrega vídeo para isso), e o PNG exportado aparece
 * embaixo, para ver que a tinta saiu com a cor concreta da marca.
 */

import * as React from "react";

import { FrameMarkup } from "../../../registry/visant/ui/frame-markup";
import { resolveCssColor } from "../../../registry/visant/lib/css-color";

function useQuadro(raiz: React.RefObject<HTMLDivElement | null>) {
  const [quadro, setQuadro] = React.useState<HTMLCanvasElement | null>(null);
  React.useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const cor = (t: string) => {
      const [r, g, b] = resolveCssColor(t, el);
      return `rgb(${r * 255} ${g * 255} ${b * 255})`;
    };
    const c = document.createElement("canvas");
    c.width = 960;
    c.height = 540;
    const g = c.getContext("2d")!;
    g.fillStyle = cor("var(--muted)");
    g.fillRect(0, 0, 960, 540);
    // Um "plano": horizonte, um prédio e uma janela acesa, só com tokens.
    g.fillStyle = cor("var(--border)");
    g.fillRect(0, 360, 960, 180);
    g.fillStyle = cor("var(--foreground)");
    g.fillRect(560, 140, 180, 220);
    g.fillStyle = cor("var(--background)");
    g.fillRect(600, 180, 40, 50);
    g.fillRect(660, 180, 40, 50);
    g.fillRect(600, 260, 40, 50);
    setQuadro(c);
  }, [raiz]);
  return quadro;
}

export default function FrameMarkupDemo() {
  const raiz = React.useRef<HTMLDivElement>(null);
  const quadro = useQuadro(raiz);
  const [saida, setSaida] = React.useState<string | null>(null);
  const [chave, setChave] = React.useState(0);

  React.useEffect(() => () => void (saida && URL.revokeObjectURL(saida)), [saida]);

  return (
    <div ref={raiz} className="flex h-full w-full items-center justify-center p-4">
      <div className="flex w-full max-w-[520px] flex-col gap-3">
        {saida ? (
          <>
            <img src={saida} alt="O PNG exportado, com o quadro e o rabisco" className="w-full rounded-[var(--r-surface)] border border-border" />
            <button
              type="button"
              onClick={() => {
                setSaida(null);
                setChave((k) => k + 1);
              }}
              className="self-start rounded-[var(--r-control)] px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:[box-shadow:var(--focus)]"
            >
              Rabiscar de novo
            </button>
          </>
        ) : quadro ? (
          <FrameMarkup
            key={chave}
            source={quadro}
            autoFocus={false}
            onDone={({ png }) => setSaida(URL.createObjectURL(png))}
            onCancel={() => setChave((k) => k + 1)}
          />
        ) : null}
      </div>
    </div>
  );
}
