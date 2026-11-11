"use client";

/**
 * Uma biblioteca de sons com busca, facetas, ordem e agrupamento.
 *
 * Na vitrine o estado vai para um adaptador em memória, e não para a URL: são
 * dezenas de peças na mesma página e o `?q=` de uma não pode filtrar a outra.
 * É o mesmo caminho que um app com router usa.
 */

import * as React from "react";

import { byNumber, byText, useCatalog, type CatalogConfig } from "../../../registry/visant/lib/use-catalog";

interface Som {
  id: number;
  nome: string;
  tipo: string;
  humor: string;
  segundos: number;
}

const SONS: Som[] = [
  { id: 1, nome: "Porta de ônibus", tipo: "ambiente", humor: "urbano", segundos: 4 },
  { id: 2, nome: "Chuva no zinco", tipo: "ambiente", humor: "calmo", segundos: 62 },
  { id: 3, nome: "Clique de câmera", tipo: "efeito", humor: "seco", segundos: 1 },
  { id: 4, nome: "Feira de domingo", tipo: "ambiente", humor: "urbano", segundos: 48 },
  { id: 5, nome: "Papel rasgando", tipo: "efeito", humor: "seco", segundos: 2 },
  { id: 6, nome: "Piano de armário", tipo: "trilha", humor: "calmo", segundos: 95 },
  { id: 7, nome: "Bonde em Santa Teresa", tipo: "ambiente", humor: "urbano", segundos: 31 },
  { id: 8, nome: "Batida de lata", tipo: "trilha", humor: "urbano", segundos: 74 },
];

const TIPOS: Record<string, string> = { ambiente: "Ambiente", efeito: "Efeito", trilha: "Trilha" };

const CATALOGO: CatalogConfig<Som> = {
  search: (s) => `${s.nome} ${s.tipo} ${s.humor}`,
  facets: [
    { key: "tipo", label: "Tipo", get: (s) => s.tipo, labelOf: (v) => TIPOS[v] ?? v },
    { key: "humor", label: "Humor", get: (s) => s.humor },
  ],
  sorts: [
    { id: "nome", label: "Nome", compare: byText((s) => s.nome) },
    { id: "duracao", label: "Duração", compare: byNumber((s) => s.segundos) },
  ],
  groupings: [{ id: "tipo", label: "Tipo", get: (s) => s.tipo, labelOf: (v) => TIPOS[v] ?? v }],
  defaultGroup: "tipo",
  labels: { search: "Buscar som" },
};

const tempo = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function UseCatalogDemo() {
  const [params, setParams] = React.useState(() => new URLSearchParams());
  const cat = useCatalog(SONS, { ...CATALOGO, params: { params, setParams } });
  const secoes = cat.sections ?? [{ id: "", label: "", items: cat.filtered }];

  return (
    <div className="flex h-full w-full justify-center overflow-y-auto p-4">
      <div className="flex w-full max-w-[560px] flex-col gap-3">
        {cat.bar()}
        <div className="flex min-h-[15rem] flex-col gap-3">
          {cat.filtered.length === 0 ? <p className="px-1 text-sm text-muted-foreground">Nenhum som com esse filtro.</p> : null}
          {secoes.map((s) => (
            <section key={s.id} className="flex flex-col gap-1">
              {s.label ? <h3 className="px-1 text-xs font-medium text-muted-foreground">{s.label}</h3> : null}
              <ul className="flex flex-col gap-1">
                {s.items.map((som) => (
                  <li key={som.id} className="flex items-center justify-between rounded-[var(--r-control)] bg-muted px-3 py-1.5 text-sm">
                    <span className="truncate">{som.nome}</span>
                    <span className="tabular-nums text-muted-foreground">{tempo(som.segundos)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="truncate px-1 font-mono text-xs text-muted-foreground">?{params.toString() || "(endereço limpo)"}</p>
      </div>
    </div>
  );
}
