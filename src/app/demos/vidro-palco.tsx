"use client";

/**
 * O palco das demos de vidro: a cena de borda a borda e a peça sozinha no meio.
 * Sem chrome, sem legenda; a peça nasce no melhor estado e o fundo é o que a faz vidro.
 */

import type * as React from "react";

export function PalcoDeVidro({ cena, children, style }: { cena: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="relative grid h-full min-h-0 w-full place-items-center overflow-hidden bg-black p-4" style={style}>
      {cena}
      <div className="relative grid w-full place-items-center">{children}</div>
    </div>
  );
}
