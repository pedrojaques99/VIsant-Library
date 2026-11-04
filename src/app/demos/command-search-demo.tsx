"use client";

/** O painel aberto na página: quem olha vê a busca e os atalhos; digitar "pá" já acha. */

import * as React from "react";
import { FileText, Plus, Search } from "lucide-react";

import { CommandSearch } from "../../../registry/visant/ui/command-search";
import { FILA, ROTULO_FILTRO } from "./fila-filtro";

const ATALHOS = [
  { id: "q1", title: "Fila de produção", subtitle: "Tudo que está aberto", icon: <FileText className="size-4" aria-hidden /> },
  { id: "q2", title: "Criar job", subtitle: "Novo job com cliente", icon: <Plus className="size-4" aria-hidden /> },
  { id: "q3", title: "Buscar arquivos", subtitle: "Peças e provas", icon: <Search className="size-4" aria-hidden /> },
];

export default function CommandSearchDemo() {
  const buscar = React.useCallback(async (q: string) => {
    const needle = q.toLowerCase();
    const atalhos = ATALHOS.filter((a) => `${a.title} ${a.subtitle}`.toLowerCase().includes(needle)).map(({ id, title, subtitle }) => ({
      id,
      title,
      subtitle,
      type: "atalho",
    }));
    const fila = FILA.filter((l) => l.nome.toLowerCase().includes(needle)).map((l) => ({
      id: l.id,
      title: l.nome,
      subtitle: ROTULO_FILTRO[l.status],
      type: "job",
    }));
    return [...atalhos, ...fila];
  }, []);

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <CommandSearch
        inline
        className="max-w-[440px]"
        onSearch={buscar}
        onSelect={() => {}}
        delay={120}
        placeholder="Buscar"
        quickLinks={ATALHOS}
      />
    </div>
  );
}
