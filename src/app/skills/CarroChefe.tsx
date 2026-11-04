"use client";

/**
 * /skills/killer: a landing do carro-chefe, visant-killer e visant-design.
 *
 * A página não descreve a skill: mostra o scanner reprovando um card na dobra, com
 * a saída gravada de verdade (`carro-chefe/captura.mjs`), e deixa o visitante
 * consertar. Ela é julgada pelas regras que vende: uma ação primária por dobra,
 * nenhum número que não venha do README ou do scanner.
 */

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { CopyCommand, useCopy } from "../copy-command";
import { Banca } from "./carro-chefe/banca";
import { useDobraAssentada } from "@/lib/rede";

/* Da segunda dobra em diante: descem depois da banca, que é o que a pessoa está vendo. */
const Secoes = React.lazy(() => import("./carro-chefe/secoes-abaixo").then((m) => ({ default: m.SecoesAbaixo })));

const INSTALAR = "npx skills add pedrojaques99/visant-skills-public --skill visant-design visant-killer";
const CONJUNTO =
  "npx skills add pedrojaques99/visant-skills-public --skill visant-design visant-killer visant-frontend visant-motion visant-refine visant-copy";

/**
 * O comando numa linha só. Copia o texto inteiro, mas mostra sem o dono do repo, que
 * era o que quebrava a linha; `title` e `aria-label` guardam a versão completa.
 */
function ComandoInstalar({ className }: { className?: string }) {
  const { done, copy } = useCopy(INSTALAR);
  const Icone = done ? Check : Copy;
  return (
    <button
      type="button"
      title={INSTALAR}
      aria-label={done ? "Copiado" : `Copiar: ${INSTALAR}`}
      onClick={copy}
      className={`alvo-toque flex min-h-10 w-full items-center gap-3 rounded-control bg-casa-cta px-3.5 py-2 text-left text-casa-cta-fg outline-none transition-opacity [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:opacity-90 ${className ?? ""}`}
    >
      <code className="min-w-0 flex-1 whitespace-nowrap font-casa-mono text-casa-sm max-sm:text-[11px]">
        npx skills add … <span className="max-sm:hidden">--skill </span>visant-design visant-killer
      </code>
      <Icone className="h-4 w-4 shrink-0" aria-hidden />
    </button>
  );
}

export function CarroChefe() {
  const julgamento = React.useRef<HTMLElement>(null);
  const assentada = useDobraAssentada();

  React.useEffect(() => {
    const antes = document.title;
    document.title = "visant-killer e visant-design: tire a cara de IA da tela";
    return () => {
      document.title = antes;
    };
  }, []);

  return (
    <main className="casa min-h-screen overflow-x-clip bg-casa-bg text-casa-fg">
      <header className="shell grid gap-6 pb-8 pt-8 lg:grid-cols-2 lg:items-end lg:gap-12 lg:pb-10 lg:pt-10">
        <h1 className="text-[2.25rem] font-medium leading-[1.05] tracking-[-0.03em] lg:text-[3.5rem]">
          Tire a cara de IA da sua tela antes do PR.
        </h1>
        <div>
          <p className="text-casa-lg text-casa-fg-2">
            A visant-killer roda quatro detectores no seu código, abre a tela e discute com o próprio veredito. A visant-design lê o pedido e escolhe o caminho.
          </p>
          <ComandoInstalar className="mt-5" />
        </div>
      </header>

      <Banca aoLiberar={() => julgamento.current?.scrollIntoView({ behavior: "smooth" })} />
      <React.Suspense fallback={<div className="min-h-screen" />}>
        {assentada ? <Secoes ancora={julgamento} /> : <div className="min-h-screen" />}
      </React.Suspense>

      <section className="shell pb-24 pt-16 lg:pb-36 lg:pt-28">
        <div className="max-w-[720px]">
          <h2 className="text-casa-xl font-medium">Instala em uma linha.</h2>
          <ComandoInstalar className="mt-6" />
          <p className="mt-4 text-casa-base text-casa-fg-2">
            Depois é só pedir, em português ou inglês: “tá com cara de IA”, “audita essa tela”, “melhora a ui”. Precisa de Node 20 ou mais novo. Playwright é opcional, pras checagens de tela.
          </p>
          <p className="mt-8 text-casa-base text-casa-fg-2">Os playbooks que a visant-design chama, e o portão de copy da killer, vêm no conjunto de interface:</p>
          <CopyCommand text={CONJUNTO} variant="line" className="mt-3" />
        </div>
      </section>
    </main>
  );
}
