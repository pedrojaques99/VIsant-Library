"use client";

/** Tudo de /skills que fica abaixo da primeira dobra: as demos, o fecho e o rodapé fixo. */

import { CountUp } from "../../../../registry/visant/ui/count-up";
import { Acao, LINK } from "./base";
import { FotoQueGira } from "./foto-que-gira";
import { PedirFeedback } from "./interesse";
import { ALTURA_LARGA, useLargo } from "./nucleo";
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
import { TELAS as TELAS_REFINE } from "./telas-refine";

export function Resto({ instalando, setInstalando }: { instalando: boolean; setInstalando: (v: boolean) => void }) {
  const largo = useLargo();
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
        <DemoRefine />
        <Telas telas={TELAS_REFINE} skill="visant-refine" />

        <section data-fecho className={`shell grid min-w-0 content-center items-center gap-6 py-6 lg:grid-cols-2 lg:gap-16 ${ALTURA_LARGA}`}>
          <div className="min-w-0">
            <h2 className="text-[clamp(2.25rem,5vw,4rem)] font-medium leading-[1.12] tracking-[-0.02em]">
              Para nossa comunidade.
            </h2>
            <p className="mt-3 text-casa-base text-casa-fg-2 lg:text-casa-lg">
              <CountUp>6</CountUp> skills, licença MIT.
            </p>
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
          <FotoQueGira largo={largo} assentada />
        </section>

        <section id="feedback" data-feedback-skills className="shell max-w-2xl scroll-mt-20 py-8">
          <PedirFeedback origem="skills" pergunta="O que você quer que as skills façam?" />
        </section>

        <Sugeridas />

        <Dock onInstalar={() => setInstalando(true)} />
        <Instalador aberto={instalando} onFechar={() => setInstalando(false)} />
    </>
  );
}
