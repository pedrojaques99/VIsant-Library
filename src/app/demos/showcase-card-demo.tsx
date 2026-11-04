"use client";

/**
 * Um card de serviço por vez: foto, nome do serviço e o que vem incluso. As setas
 * trocam o serviço, que é como a peça vive numa página, em série.
 *
 * O `max-w` é teto, não largura fixa: a peça roda sozinha num viewport de 360px na
 * suíte de responsivo, e largura cravada estoura a tela.
 */

import { Media } from "../media";
import { ShowcaseCard } from "../../../registry/visant/ui/showcase-card";
import type { DemoProps } from "../catalog";
import { Trocador, useUmPorVez } from "./um-por-vez";

const SERVICOS = [
  { nome: "Identidade", indice: 3, tags: ["Naming", "Logo", "Guia"] },
  { nome: "Embalagem", indice: 4, tags: ["Rótulo", "Caixa", "Prova"] },
  { nome: "Campanha", indice: 2, tags: ["Foto", "Filme", "Mídia"] },
];
const NOMES = SERVICOS.map((s) => s.nome);

export default function ShowcaseCardDemo({ props }: DemoProps) {
  const { i, atual, passo } = useUmPorVez(NOMES);
  const s = SERVICOS[i];
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-2">
      <ShowcaseCard
        key={atual}
        className="mx-auto w-full max-w-[300px]"
        href="#/c/showcase-card"
        title={s.nome}
        media={<Media papel="cena" indice={s.indice} className="size-full" />}
        tags={s.tags}
        {...props}
      />
      <Trocador nome={atual} onPasso={passo} rotulo="serviço" />
    </div>
  );
}
