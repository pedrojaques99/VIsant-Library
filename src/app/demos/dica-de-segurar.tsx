"use client";

/**
 * "Segure para mover": a dica só aparece quando o dedo encosta num cartão.
 *
 * No toque o cartão só levanta depois de segurar, e é esse atraso que deixa a página
 * rolar. Quem desliza sem esperar vê a página andar e conclui que a peça não responde.
 * Texto fixo na demo seria a página se explicando, então ela nasce com o gesto: some
 * quando o cartão levanta (dedo ainda parado) ou um instante depois de soltar.
 */

import * as React from "react";

/** Passou disso com o dedo parado, o cartão já levantou: 250ms do sensor e folga. */
const LEVANTOU_MS = 350;
const PERMANECE_MS = 1600;

export function useDicaDeSegurar() {
  const [visivel, setVisivel] = React.useState(false);
  const relogio = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const soltar = React.useRef<(() => void) | undefined>(undefined);

  React.useEffect(
    () => () => {
      clearTimeout(relogio.current);
      soltar.current?.();
    },
    [],
  );

  const onPointerDownCapture = React.useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== "touch" || !(e.target as Element).closest(".kanban-card-movel")) return;
    soltar.current?.();
    setVisivel(true);
    clearTimeout(relogio.current);
    relogio.current = setTimeout(() => setVisivel(false), LEVANTOU_MS);

    const fim = () => {
      soltar.current?.();
      clearTimeout(relogio.current);
      relogio.current = setTimeout(() => setVisivel(false), PERMANECE_MS);
    };
    window.addEventListener("pointerup", fim);
    window.addEventListener("pointercancel", fim);
    soltar.current = () => {
      window.removeEventListener("pointerup", fim);
      window.removeEventListener("pointercancel", fim);
      soltar.current = undefined;
    };
  }, []);

  const dica = (
    <span
      aria-hidden
      data-dica-segurar={visivel ? "" : undefined}
      className={`pointer-events-none absolute inset-x-0 bottom-2 z-10 mx-auto w-fit rounded-[var(--r-control,0.5rem)] bg-foreground px-2.5 py-1 text-xs font-medium text-background transition-opacity [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] ${
        visivel ? "opacity-100" : "opacity-0"
      }`}
    >
      Segure para mover
    </span>
  );

  return { onPointerDownCapture, dica };
}
