"use client";

/**
 * A contagem numa dobra de lançamento, com a versão compacta logo embaixo.
 *
 * Esperar dias pra ver o fim não serve de demo: "Pular pro fim" põe o alvo a
 * cinco segundos, e dá pra ver os dígitos virando "Ao vivo". "Recomeçar" volta
 * pros dois dias e pouco, e as rodas giram pelo caminho curto até lá.
 */

import * as React from "react";
import { RotateCcw, SkipForward } from "lucide-react";

import { Countdown } from "../../../registry/visant/ui/countdown";
import type { DemoProps } from "../catalog";

const DOIS_DIAS = (2 * 86_400 + 5 * 3_600 + 41 * 60 + 12) * 1000;

const botao =
  "alvo-toque absolute bottom-3 right-3 grid size-10 place-items-center rounded-[var(--r-pill)] border border-border bg-card text-foreground outline-none transition-colors [transition-duration:var(--dur-fast)] hover:bg-muted focus-visible:[box-shadow:var(--focus)]";

export default function CountdownDemo({ props }: DemoProps) {
  const [alvo, setAlvo] = React.useState(() => Date.now() + DOIS_DIAS);
  const [perto, setPerto] = React.useState(false);

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="flex w-[380px] max-w-full flex-col items-center gap-4">
        <p className="text-corpo text-muted-foreground">A coleção nova abre em</p>
        <Countdown className="w-full" target={alvo} label="A coleção nova abre em" {...props} />
        <Countdown variant="compact" target={alvo} units={["hours", "minutes", "seconds"]} label="Falta pra abrir" />
      </div>
      {/* No canto e fora do fluxo: a contagem fica no centro exato, com qualquer botão. */}
      <button
        type="button"
        aria-label={perto ? "Recomeçar" : "Pular pro fim"}
        title={perto ? "Recomeçar" : "Pular pro fim"}
        className={botao}
        onClick={() => {
          setAlvo(Date.now() + (perto ? DOIS_DIAS : 5_000));
          setPerto(!perto);
        }}
      >
        {perto ? <RotateCcw className="size-4" aria-hidden="true" /> : <SkipForward className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
