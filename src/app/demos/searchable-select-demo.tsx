"use client";

/** A lista aberta: grupos, busca que acha por palavra escondida e "Criar" quando não acha. */

import * as React from "react";

import { SearchableSelect } from "../../../registry/visant/ui/searchable-select";

export default function SearchableSelectDemo() {
  const [valor, setValor] = React.useState("produto");
  const [extras, setExtras] = React.useState<{ value: string; label: string }[]>([]);

  const grupos = React.useMemo(
    () => [
      {
        label: "Times",
        options: [
          { value: "produto", label: "Produto", keywords: "app roadmap" },
          { value: "marketing", label: "Marketing", keywords: "campanha" },
        ],
      },
      { label: "Geral", options: [{ value: "financeiro", label: "Financeiro" }, ...extras] },
    ],
    [extras],
  );

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <SearchableSelect
        inline
        hideEmptyOption
        className="max-w-[340px]"
        value={valor}
        onValueChange={setValor}
        groups={grupos}
        searchPlaceholder="Buscar ou criar"
        createEntityLabel="time"
        onCreate={async (label) => {
          const value = label.toLowerCase().replace(/\s+/g, "-");
          setExtras((atual) => [...atual, { value, label }]);
          return value;
        }}
      />
    </div>
  );
}
