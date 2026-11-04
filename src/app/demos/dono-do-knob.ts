/**
 * Um dono só para o valor que a peça e o painel mexem.
 *
 * A demo guarda o estado, o painel escreve nele e a peça avisa o painel. Sem isto o
 * painel dizia `value 84` com a peça em 0%: cada lado tinha a sua cópia.
 *
 * O ajuste acontece no render, não em efeito: em efeito a peça desenharia um quadro
 * com o valor velho. Quando o knob some ("restaurar o padrão"), volta ao `inicial`.
 * Sem ficha em volta (grade, `?solo=1`) não há `onKnob`, e o estado segue sendo local.
 */

import * as React from "react";

import type { DemoProps } from "../catalog";

export function useDonoDoKnob<T extends string | number | boolean>(
  prop: string,
  inicial: T,
  setValor: (v: T) => void,
  { props, onKnob }: DemoProps,
) {
  const externo = props?.[prop] as T | undefined;
  // Nasce sem ter visto nada: quem abre com o knob já na URL (`?solo=1&p=…`) entra nele.
  const [visto, setVisto] = React.useState<T | undefined>(undefined);
  if (externo !== visto) {
    setVisto(externo);
    setValor(externo ?? inicial);
  }

  return React.useCallback(
    (v: T) => {
      setValor(v);
      onKnob?.(prop, v);
    },
    [prop, setValor, onKnob],
  );
}
