"use client";

/**
 * Um por vez: a peça grande no palco e um seletor miúdo embaixo.
 *
 * O dono pediu isso em várias fichas ("UM POR VEZ"): nada de quatro variações
 * empilhadas com um rótulo explicando cada uma. A demo mostra UMA, grande, e as
 * setas trocam. O nome que aparece entre as setas é o valor da prop, em texto
 * miúdo, porque é o que a pessoa vai digitar no código.
 *
 * Trocar sempre devolve uma `rodada` nova: a demo usa como `key` e a peça
 * remonta, então a troca já É o replay. Clicar no nome repete a variação atual.
 */

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Índice + rodada. `externo` é o valor que veio dos controles da ficha (knob ou
 * preset): quando ele muda, o seletor acompanha em vez de brigar com ele. Quando ele
 * some ("restaurar o padrão"), volta ao primeiro da lista, que é o padrão da demo.
 *
 * `aoPassar` avisa o painel que a seta mudou o valor. O valor volta como `externo`,
 * e aí não é troca nova: sem a comparação com o índice atual, a peça remontaria duas vezes.
 */
export function useUmPorVez<T>(lista: readonly T[], externo?: unknown, aoPassar?: (valor: T) => void) {
  const [i, setI] = React.useState(() => {
    const k = lista.indexOf(externo as T);
    return k >= 0 ? k : 0;
  });
  const [rodada, setRodada] = React.useState(0);
  const indice = React.useRef(i);
  indice.current = i;

  const anterior = React.useRef(externo);
  React.useEffect(() => {
    if (anterior.current === externo) return;
    anterior.current = externo;
    const k = externo === undefined ? 0 : lista.indexOf(externo as T);
    if (k >= 0 && k !== indice.current) {
      setI(k);
      setRodada((n) => n + 1);
    }
    // a lista é constante de módulo em todas as demos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externo]);

  const passo = React.useCallback(
    (d: number) => {
      const proximo = (indice.current + d + lista.length) % lista.length;
      indice.current = proximo;
      setI(proximo);
      setRodada((n) => n + 1);
      aoPassar?.(lista[proximo]!);
    },
    // a lista é constante de módulo em todas as demos
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lista.length, aoPassar],
  );
  const repetir = React.useCallback(() => setRodada((n) => n + 1), []);

  return { i, atual: lista[i], rodada, passo, repetir, setRodada };
}

export function Trocador({
  nome,
  onPasso,
  onRepetir,
  rotulo = "variação",
}: {
  nome: string;
  onPasso: (d: number) => void;
  onRepetir?: () => void;
  rotulo?: string;
}) {
  return (
    <div className="flex items-center gap-0.5 pointer-coarse:gap-2 text-muted-foreground">
      <Seta dir={-1} onClick={() => onPasso(-1)} rotulo={rotulo} />
      <button
        type="button"
        onClick={onRepetir}
        aria-label={`Repetir ${nome}`}
        className="alvo-toque min-w-16 pointer-coarse:min-w-[max(4rem,calc(2.75rem/var(--alvo-escala,1)))] rounded-[var(--r-control,0.5rem)] px-1.5 py-1 text-center font-mono text-micro tabular-nums outline-none transition-[color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:text-foreground focus-visible:[box-shadow:var(--focus)]"
      >
        {nome}
      </button>
      <Seta dir={1} onClick={() => onPasso(1)} rotulo={rotulo} />
    </div>
  );
}

function Seta({ dir, onClick, rotulo }: { dir: 1 | -1; onClick: () => void; rotulo: string }) {
  const Icone = dir < 0 ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir < 0 ? `${rotulo} anterior` : `Próxima ${rotulo}`}
      className="alvo-toque grid size-7 pointer-coarse:w-[calc(2.75rem/var(--alvo-escala,1))] place-items-center rounded-[var(--r-pill,9999px)] outline-none transition-[color,background-color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-muted hover:text-foreground focus-visible:[box-shadow:var(--focus)]"
    >
      <Icone className="size-4" aria-hidden />
    </button>
  );
}
