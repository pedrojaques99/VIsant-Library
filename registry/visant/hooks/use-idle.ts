"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";

/** A peça está na tela? Laço e sensor só rodam enquanto alguém pode ver. */
export function useInView(ref: React.RefObject<Element | null>) {
  const [visivel, setVisivel] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisivel(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return visivel;
}

/**
 * Chama `fn` a cada `ms` enquanto a peça está na tela e ninguém mexe nela.
 *
 * Celular não tem hover: peça que só acorda com o ponteiro fica morta no toque.
 * Três coisas calam o laço: sair da tela, `prefers-reduced-motion`, e o `poke()`
 * devolvido, que toda entrada chama para o movimento sozinho não brigar com a mão.
 */
export function useIdle(ref: React.RefObject<Element | null>, fn: () => void, ms = 2600, ligado = true) {
  const visivel = useInView(ref);
  const reduz = useReducedMotion();
  const ultimo = React.useRef(0);
  const eco = React.useRef(fn);
  eco.current = fn;
  React.useEffect(() => {
    if (!ligado || !visivel || reduz) return;
    const t = window.setInterval(() => {
      if (performance.now() - ultimo.current > ms) eco.current();
    }, ms);
    return () => window.clearInterval(t);
  }, [ligado, visivel, reduz, ms]);
  return React.useCallback(() => {
    ultimo.current = performance.now();
  }, []);
}
