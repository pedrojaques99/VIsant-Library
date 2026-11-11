"use client";

/**
 * "Segure para mover": a dica só aparece quando o dedo fica parado num cartão.
 *
 * No toque o cartão só levanta depois de segurar, e é esse atraso que deixa a página
 * rolar. Quem desliza sem esperar vê a página andar e conclui que a peça não responde.
 * Texto fixo na demo seria a página se explicando, então ela nasce com o gesto: some
 * quando o cartão levanta (dedo ainda parado) ou um instante depois de soltar.
 *
 * A dica só aparece depois de `MOSTRAR_MS` com o dedo QUASE parado (tolerância
 * pequena, a mesma ideia do sensor). Um deslize rápido (quem já sabe arrastar, ou a
 * página rolando) cancela a dica antes dela nascer — sem isso, o próprio texto
 * entrando na tela virava "a peça mudou" num teste de toque, mesmo quando o
 * navegador tinha tomado o gesto pra rolagem e o cartão não saiu do lugar.
 */

import * as React from "react";

const MOSTRAR_MS = 80;
const TOLERANCIA_PX = 8;
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
    clearTimeout(relogio.current);
    const x0 = e.clientX;
    const y0 = e.clientY;
    let mostrou = false;

    relogio.current = setTimeout(() => {
      mostrou = true;
      setVisivel(true);
      relogio.current = setTimeout(() => setVisivel(false), LEVANTOU_MS);
    }, MOSTRAR_MS);

    const cancelaMostrar = () => {
      if (!mostrou) clearTimeout(relogio.current);
    };
    const moveu = (ev: PointerEvent) => {
      if (Math.abs(ev.clientX - x0) > TOLERANCIA_PX || Math.abs(ev.clientY - y0) > TOLERANCIA_PX) cancelaMostrar();
    };
    const fim = () => {
      cancelaMostrar();
      soltar.current?.();
      if (mostrou) {
        clearTimeout(relogio.current);
        relogio.current = setTimeout(() => setVisivel(false), PERMANECE_MS);
      }
    };
    window.addEventListener("pointermove", moveu);
    window.addEventListener("pointerup", fim);
    window.addEventListener("pointercancel", fim);
    soltar.current = () => {
      window.removeEventListener("pointermove", moveu);
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
