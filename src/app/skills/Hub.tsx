"use client";

/**
 * /skills: a página de produto das 6 skills de interface, desenhada em 390x844.
 *
 * Ao nascer, cada dobra é o nome e a demo já em ação. O resto só aparece quando a
 * pessoa pede: "como funciona" abre uma folha por cima, e o único "Instalar" mora
 * no rodapé fixo, junto com o índice no polegar. O filme fica em /skills/filme e a
 * defesa do carro-chefe em /skills/killer.
 */

import * as React from "react";
import { useDobraAssentada } from "@/lib/rede";
import { ALTURA_DOBRA, PaginaCtx, useLargo } from "./hub/nucleo";
import { FotoDaAbertura } from "./hub/foto-da-abertura";

/*
 * A primeira dobra é o título e as duas fotos. O resto da página (as demos, o motion do rodapé)
 * desce depois que ela ficou de pé: em Slow 4G, junto, era 14 s de tela sem foto.
 */
const Resto = React.lazy(() => import("./hub/resto").then((m) => ({ default: m.Resto })));

export function Hub() {
  const [aberta, setAberta] = React.useState<string | null>(null);
  const [instalando, setInstalando] = React.useState(false);
  const largo = useLargo();
  const ctx = React.useMemo(() => ({ aberta, setAberta, instalar: () => setInstalando(true) }), [aberta]);
  const assentada = useDobraAssentada();

  return (
    <PaginaCtx.Provider value={ctx}>
      <main className="casa overflow-x-clip">
        <section data-abertura className={`shell grid min-w-0 content-center items-center gap-4 py-4 lg:grid-cols-2 lg:gap-16 ${ALTURA_DOBRA}`}>
          <div className="min-w-0">
            <h1 className="text-[clamp(2.5rem,6.5vw,5.5rem)] font-medium leading-[1.08] tracking-[-0.03em]">
              Tire a cara de IA da sua interface.
            </h1>
            <p className="mt-2 text-casa-base text-casa-fg-2 [text-wrap:pretty] lg:mt-4 lg:text-casa-lg">
              Seis skills pro Claude Code que auditam tela, texto e animação.
            </p>
          </div>
          <FotoDaAbertura largo={largo} assentada={assentada} />
        </section>

        {/* A altura de uma dobra segura a página enquanto o resto não chega. */}
        <React.Suspense fallback={<div className={ALTURA_DOBRA} />}>
          {assentada ? <Resto instalando={instalando} setInstalando={setInstalando} /> : <div className={ALTURA_DOBRA} />}
        </React.Suspense>
      </main>
    </PaginaCtx.Provider>
  );
}
