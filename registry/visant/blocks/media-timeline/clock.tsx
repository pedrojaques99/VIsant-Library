import * as React from "react";

// O tempo do play fora do estado de quem usa a timeline. Com o tempo num `useState`, cada quadro
// do play re-renderizava a tela inteira (99 commits/s); assim, só as folhas que mostram o tempo
// (agulha, timecode) assinam o relógio e redesenham.

export interface Clock {
  get: () => number;
  set: (t: number) => void;
  subscribe: (f: () => void) => () => void;
}

export function createClock(initial = 0): Clock {
  let t = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => t,
    set: (v) => {
      if (v === t) return;
      t = v;
      listeners.forEach((f) => f());
    },
    subscribe: (f) => {
      listeners.add(f);
      return () => {
        listeners.delete(f);
      };
    },
  };
}

/** O tempo atual do relógio, re-renderizando só quem chama. */
export const useClockTime = (c: Clock) => React.useSyncExternalStore(c.subscribe, c.get);

/** Renderiza `children(tempo)` com o tempo vivo: o pai não re-renderiza a cada quadro. */
export function WithTime({ clock, children }: { clock: Clock; children: (t: number) => React.ReactNode }) {
  return <>{children(useClockTime(clock))}</>;
}
