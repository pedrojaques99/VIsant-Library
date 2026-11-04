"use client";

/**
 * /skills: a página de produto das 12 skills públicas, desenhada em 390x844.
 *
 * Ao nascer, cada dobra é o nome e a demo já em ação. O resto só aparece quando a
 * pessoa pede: "como funciona" abre uma folha por cima, e o único "Instalar" mora
 * no rodapé fixo, junto com o índice no polegar. O filme fica em /skills/filme e a
 * defesa do carro-chefe em /skills/killer.
 */

import * as React from "react";
import { CountUp } from "../../../registry/visant/ui/count-up";
import { PhotoCompare } from "../../../registry/visant/ui/photo-compare";
import { Acao, ALTURA_DOBRA, LINK, PaginaCtx, useLargo, Video } from "./hub/base";
import { Dock, Instalador } from "./hub/dock";
import { DemoKiller, TelasKiller } from "./hub/demo-killer";
import { DemoCopy } from "./hub/demo-copy";
import { DemoMotion } from "./hub/demo-motion";
import { DemoRefine } from "./hub/demo-refine";
import { DemoDesign, DemoFrontend } from "./hub/demo-interface";
import { DemoEditor, DemoPremiere, DemoReels } from "./hub/demo-video";
import { DemoMcp, DemoMetodo, DemoPreflight } from "./hub/demo-processo";
import hA from "./hub/posters/hero-a.webp";
import hD from "./hub/posters/hero-d.webp";
import mA from "./hub/posters/mata-a.webp";
import mD from "./hub/posters/mata-d.webp";

const PECAS = ["photo-compare", "segmented-control", "sim-slider", "count-up"];

export function Hub() {
  const [aberta, setAberta] = React.useState<string | null>(null);
  const [instalando, setInstalando] = React.useState(false);
  const largo = useLargo();
  const ctx = React.useMemo(() => ({ aberta, setAberta, instalar: () => setInstalando(true) }), [aberta]);

  return (
    <PaginaCtx.Provider value={ctx}>
      <main className="casa overflow-x-clip pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-20">
        <section data-abertura className={`shell grid min-w-0 content-center items-center gap-4 py-4 lg:grid-cols-2 lg:gap-16 ${ALTURA_DOBRA}`}>
          <div className="min-w-0">
            <h1 className="text-[clamp(2.5rem,6.5vw,5.5rem)] font-medium leading-[1.08] tracking-[-0.03em]">
              Tire a cara de IA da sua interface.
            </h1>
            <p className="mt-2 text-casa-base text-casa-fg-2 lg:mt-4 lg:text-casa-lg">
              Doze skills pro Claude Code que auditam tela, texto, animação e vídeo. A gente só testou lá.
            </p>
          </div>
          <PhotoCompare
            key={largo ? "largo" : "celular"}
            ratio={largo ? "880/580" : "6/5"}
            label="Antes e depois de uma tela de loja, com marca inventada"
            before={<img src={largo ? mA : hA} alt="" />}
            after={<img src={largo ? mD : hD} alt="" />}
            className="w-full overflow-hidden rounded-tile"
          />
        </section>

        <DemoKiller />
        <TelasKiller />
        <DemoDesign />
        <DemoFrontend />
        <DemoCopy />
        <DemoMotion />
        <DemoRefine />
        <DemoEditor />
        <DemoReels />
        <DemoPremiere />
        <DemoPreflight />
        <DemoMetodo />
        <DemoMcp />

        <section data-fecho className={`shell grid min-w-0 content-center items-center gap-6 py-6 lg:grid-cols-2 lg:gap-16 ${ALTURA_DOBRA}`}>
          <div className="min-w-0">
            <h2 className="text-[clamp(2.25rem,5vw,4rem)] font-medium leading-[1.12] tracking-[-0.02em]">
              <CountUp>12</CountUp> skills, licença MIT.
            </h2>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              <Acao onClick={() => setInstalando(true)} data-acao="fecho">
                Instalar
              </Acao>
              <a href="https://github.com/pedrojaques99/visant-skills-public" className={`${LINK} inline-flex min-h-11 min-w-11 items-center text-casa-base text-casa-fg-2`}>
                GitHub
              </a>
            </div>
          </div>
          <div className="min-w-0">
            <Video nome="library" proporcao="16 / 9" alt="Filme do catálogo @visant/ui com peças de dados e shaders" />
            <ul className="mt-3 flex flex-wrap gap-x-4">
              {PECAS.map((nome) => (
                <li key={nome}>
                  <a href={`/c/${nome}`} className="inline-flex min-h-11 items-center font-casa-mono text-casa-sm text-casa-fg-2 underline underline-offset-2 outline-none focus-visible:[box-shadow:var(--focus)]">
                    {nome}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Dock onInstalar={() => setInstalando(true)} />
        <Instalador aberto={instalando} onFechar={() => setInstalando(false)} />
      </main>
    </PaginaCtx.Provider>
  );
}
