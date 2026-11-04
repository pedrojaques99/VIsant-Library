"use client";

/** Tudo de /skills que fica abaixo da primeira dobra: as demos, o fecho e o rodapé fixo. */

import { CountUp } from "../../../../registry/visant/ui/count-up";
import { Acao, LINK, Video } from "./base";
import { ALTURA_LARGA } from "./nucleo";
import { Dock, Instalador } from "./dock";
import { DemoKiller, TelasKiller } from "./demo-killer";
import { DemoCopy } from "./demo-copy";
import { DemoMotion } from "./demo-motion";
import { DemoRefine } from "./demo-refine";
import { DemoDesign, DemoFrontend } from "./demo-interface";
import { Sugeridas } from "./sugeridas";
import { Telas } from "./telas";
import { TELAS as TELAS_DESIGN } from "./telas-design";
import { TELAS as TELAS_FRONTEND } from "./telas-frontend";
import { TELAS as TELAS_COPY } from "./telas-copy";
import { TELAS as TELAS_MOTION } from "./telas-motion";
import { TELAS as TELAS_REFINE } from "./telas-refine";

const PECAS = ["photo-compare", "segmented-control", "sim-slider", "count-up"];

export function Resto({ instalando, setInstalando }: { instalando: boolean; setInstalando: (v: boolean) => void }) {
  return (
    <>
        <DemoKiller />
        <TelasKiller />
        <DemoDesign />
        <Telas telas={TELAS_DESIGN} skill="visant-design" />
        <DemoFrontend />
        <Telas telas={TELAS_FRONTEND} skill="visant-frontend" />
        <DemoCopy />
        <Telas telas={TELAS_COPY} skill="visant-copy" />
        <DemoMotion />
        <Telas telas={TELAS_MOTION} faixa skill="visant-motion" />
        <DemoRefine />
        <Telas telas={TELAS_REFINE} skill="visant-refine" />

        <section data-fecho className={`shell grid min-w-0 content-center items-center gap-6 py-6 lg:grid-cols-2 lg:gap-16 ${ALTURA_LARGA}`}>
          <div className="min-w-0">
            <h2 className="text-[clamp(2.25rem,5vw,4rem)] font-medium leading-[1.12] tracking-[-0.02em]">
              <CountUp>6</CountUp> skills, licença MIT.
            </h2>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              <Acao onClick={() => setInstalando(true)} data-acao="fecho">
                Instalar
              </Acao>
              <a href="https://github.com/pedrojaques99/visant-skills-public" className={`${LINK} inline-flex min-h-11 min-w-11 items-center text-casa-base text-casa-fg-2`}>
                Vídeo e projeto no GitHub
              </a>
              <a href="/docs" className={`${LINK} inline-flex min-h-11 min-w-11 items-center text-casa-base text-casa-fg-2`}>
                Docs
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

        <Sugeridas />

        <Dock onInstalar={() => setInstalando(true)} />
        <Instalador aberto={instalando} onFechar={() => setInstalando(false)} />
    </>
  );
}
