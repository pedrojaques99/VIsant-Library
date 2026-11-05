"use client";

import * as React from "react";

type ComPermissao = { requestPermission?: () => Promise<"granted" | "denied"> };

/**
 * A inclinação lateral do celular (`gamma`, em graus), depois de `enable()`.
 *
 * O iOS só concede o sensor dentro de um gesto, então `enable` tem de rodar num
 * `pointerdown`. Recusou ou não existe sensor: nada acontece, e o arrasto da peça
 * continua sendo o caminho. Nunca é a única entrada.
 */
export function useTilt(fn: (gamma: number) => void) {
  const [on, setOn] = React.useState(false);
  const eco = React.useRef(fn);
  eco.current = fn;
  React.useEffect(() => {
    if (!on) return;
    const ouvir = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null) eco.current(e.gamma);
    };
    window.addEventListener("deviceorientation", ouvir);
    return () => window.removeEventListener("deviceorientation", ouvir);
  }, [on]);
  const enable = React.useCallback(() => {
    if (on || typeof DeviceOrientationEvent === "undefined") return;
    const pedir = (DeviceOrientationEvent as unknown as ComPermissao).requestPermission;
    if (!pedir) return setOn(true);
    pedir().then(
      (r) => {
        if (r === "granted") setOn(true);
      },
      () => {},
    );
  }, [on]);
  return { on, enable };
}
