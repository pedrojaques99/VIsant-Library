"use client";

/** As skills de fora em que as nossas se apoiam: o crédito vira sugestão de instalação. */

import { Check, Copy } from "lucide-react";
import { useCopy } from "../../copy-command";
import { LINK } from "./base";

const SUGERIDAS = [
  {
    nome: "revenue-centric-design",
    autor: "Richard (@richardrx)",
    faz: "Conversão, preço e onboarding",
    href: "https://github.com/heliocosta-dev/revenue-centric-design",
    comando: "npx skills add heliocosta-dev/revenue-centric-design",
  },
  {
    nome: "Emil Kowalski skills",
    autor: "Emil Kowalski",
    faz: "Animação com critério",
    href: "https://github.com/emilkowalski/skills",
    comando: "npx skills@latest add emilkowalski/skills",
  },
  {
    nome: "stageshow",
    autor: "Benji Taylor",
    faz: "Interface falsa para hero e demo",
    href: "https://github.com/benjitaylor/skills/tree/main/stageshow",
    comando: "npx skills add benjitaylor/skills --skill stageshow",
  },
  {
    nome: "impeccable",
    autor: "Paul Bakaus",
    faz: "Detector de tiques de interface",
    href: "https://impeccable.style",
    comando: "npx impeccable detect",
  },
  {
    nome: "agent-skills",
    autor: "Vercel",
    faz: "React, Next e transições de rota",
    href: "https://github.com/vercel-labs/agent-skills",
    comando: "npx skills add vercel-labs/agent-skills",
  },
];

function Sugerida({ nome, autor, faz, href, comando }: (typeof SUGERIDAS)[number]) {
  const { done, copy } = useCopy(comando);
  const Icone = done ? Check : Copy;
  return (
    <li className="flex min-w-0 items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <a href={href} target="_blank" rel="noreferrer" className={`${LINK} inline-flex min-h-11 items-center text-casa-lg`}>
          {nome}
        </a>
        <p className="text-casa-sm text-casa-fg-2">
          {autor}. {faz}.
        </p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={done ? `Comando de ${nome} copiado` : `Copiar: ${comando}`}
        title={comando}
        className="alvo-toque grid size-11 shrink-0 cursor-pointer place-items-center rounded-control text-casa-fg-2 focus-visible:[box-shadow:var(--focus)]"
      >
        <Icone className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}

export function Sugeridas() {
  return (
    <section data-sugeridas className="shell pb-12 pt-6">
      <h2 className="text-casa-xl font-medium">Combina com estas</h2>
      <ul className="mt-2 grid min-w-0 lg:grid-cols-2 lg:gap-x-16">
        {SUGERIDAS.map((s) => (
          <Sugerida key={s.nome} {...s} />
        ))}
      </ul>
    </section>
  );
}
