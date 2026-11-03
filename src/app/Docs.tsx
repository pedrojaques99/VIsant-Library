"use client";

/**
 * Docs: o que o registry instala e não tem nada para ver.
 *
 * Libs, hooks, temas e regras saíram do catálogo em 2026-11-03, porque o catálogo
 * mostra peça. Continuam instaláveis e estão aqui para quem precisa deles,
 * principalmente agentes: não há cabeçalho apontando para cá, chega-se pelo link.
 */

import { CATALOG, TYPE_LABEL, type CatalogItem } from "./catalog";
import { CopyCommand } from "./copy-command";
import { installCommand } from "./registry-meta";

const ITENS = CATALOG.filter((i) => i.family === "fundacao");
const TIPOS = [...new Set(ITENS.map((i) => i.type))] as CatalogItem["type"][];

const LINK =
  "alvo-toque rounded-control underline underline-offset-2 outline-none hover:text-casa-fg focus-visible:[box-shadow:var(--focus)]";

export function Docs() {
  return (
    <main className="shell casa pb-24 pt-12 sm:pt-16">
      <h1 className="text-casa-xl font-medium">Docs</h1>
      <p className="mt-3 max-w-2xl text-casa-lg text-casa-fg-2">
        Libs, hooks, temas e regras do registry, sem interface própria. Agentes leem o acervo inteiro em{" "}
        <a href="/llms.txt" className={LINK}>
          llms.txt
        </a>
        .
      </p>

      {TIPOS.map((tipo) => (
        <section key={tipo} className="mt-12">
          <h2 className="mb-2 text-casa-lg font-medium">{TYPE_LABEL[tipo]}</h2>
          <ul>
            {ITENS.filter((i) => i.type === tipo).map((item) => (
              <li
                key={item.name}
                data-doc={item.name}
                className="flex items-start gap-4 border-t border-casa-line py-3"
              >
                <div className="min-w-0 flex-1">
                  <a href={`/c/${item.name}`} className="alvo-toque rounded-control text-casa-base text-casa-fg outline-none hover:underline focus-visible:[box-shadow:var(--focus)]">
                    {item.title}
                  </a>
                  <p className="mt-0.5 max-w-3xl text-casa-sm text-casa-fg-2">{item.description}</p>
                </div>
                <CopyCommand variant="chip" text={installCommand(item.name)} className="size-7" />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
