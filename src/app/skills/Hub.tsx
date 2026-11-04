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
import { ALTURA_DOBRA, MENSAGEM_AGENTE, PaginaCtx } from "./hub/nucleo";
import { CopiarParaAgente } from "./hub/interesse";
import { Gleam } from "../../../registry/visant/ui/gleam";
import { Video } from "./hub/video";

/*
 * A primeira dobra é o título e o reel. O resto da página (as demos, o motion do rodapé)
 * desce depois que ela ficou de pé: em Slow 4G, junto, era 14 s de tela sem foto.
 */
const Resto = React.lazy(() => import("./hub/resto").then((m) => ({ default: m.Resto })));

export function Hub() {
  const [aberta, setAberta] = React.useState<string | null>(null);
  const [instalando, setInstalando] = React.useState(false);
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
            <div className="mt-4 lg:mt-6">
              <CopiarParaAgente
                mensagem={MENSAGEM_AGENTE}
                origem="abertura"
                rotulo="Copiar para o agente"
                copiado="Agora cole no agente"
                depois={
                  <a
                    href="/skills/como-usar"
                    data-como-usar-link
                    className="inline-flex h-11 items-center rounded-control text-casa-base text-casa-fg-2 outline-none hover:text-casa-fg focus-visible:[box-shadow:var(--focus)]"
                  >
                    Como usar
                  </a>
                }
              />
            </div>
          </div>
          {/* O reel mostra o que a frase promete: uma tela passando pelas skills. Luz neutra: a casa não fala com a cor da marca. */}
          <div className="min-w-0 lg:ml-auto lg:w-full lg:max-w-[calc(100svh-12rem)]">
            <Gleam tilt={9} tint="var(--casa-fg)" className="overflow-hidden rounded-tile">
              <Video
                nome="reel"
                liberado={assentada}
                alt="Uma tela de painel com cara de IA passando pelas skills, uma correção por vez, até ficar limpa"
              />
            </Gleam>
          </div>
        </section>

        {/* A altura de uma dobra segura a página enquanto o resto não chega. */}
        <React.Suspense fallback={<div className={ALTURA_DOBRA} />}>
          {assentada ? <Resto instalando={instalando} setInstalando={setInstalando} /> : <div className={ALTURA_DOBRA} />}
        </React.Suspense>
      </main>
    </PaginaCtx.Provider>
  );
}
