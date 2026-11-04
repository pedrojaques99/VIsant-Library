/*
 * O pouco de `base.tsx` que a primeira dobra de /skills usa. Mora à parte porque `base` importa
 * o motion, e a abertura não pode esperar por ele.
 */

import * as React from "react";

/** Altura da dobra: a tela menos o cabeçalho do App e o rodapé fixo. */
export const ALTURA_DOBRA = "min-h-[calc(100svh-9.5rem)] lg:min-h-[calc(100svh-7.5rem)]";

/** No celular a dobra tem a altura da demo. Só o desktop centra numa tela inteira. */
export const ALTURA_LARGA = "lg:min-h-[calc(100svh-7.5rem)]";

/** Tela larga? Só para o que a CSS não alcança, como o viewBox de um gráfico. */
export function useLargo() {
  /* Lido já no primeiro render: senão o desktop baixa a foto do celular à toa. */
  const [largo, setLargo] = React.useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches);
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setLargo(mq.matches);
    const ouvir = () => setLargo(mq.matches);
    mq.addEventListener("change", ouvir);
    return () => mq.removeEventListener("change", ouvir);
  }, []);
  return largo;
}

/** Pede menos movimento? Lido no efeito, porque a página é hidratada no cliente. */
export function useMenosMovimento() {
  const [menos, setMenos] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMenos(mq.matches);
    const ouvir = () => setMenos(mq.matches);
    mq.addEventListener("change", ouvir);
    return () => mq.removeEventListener("change", ouvir);
  }, []);
  return menos;
}

/** Está na tela agora? As demos que giram sozinhas só giram enquanto vistas. */
export function useNaTela<T extends Element>(limiar = 0.4) {
  const ref = React.useRef<T>(null);
  const [naTela, setNaTela] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNaTela(e.isIntersecting), { threshold: limiar });
    io.observe(el);
    return () => io.disconnect();
  }, [limiar]);
  return [ref, naTela] as const;
}

export const PaginaCtx = React.createContext<{
  aberta: string | null;
  setAberta: (n: string | null) => void;
  instalar: () => void;
}>({ aberta: null, setAberta: () => {}, instalar: () => {} });
