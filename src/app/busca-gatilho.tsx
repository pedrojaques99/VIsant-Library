"use client";

/*
 * O que a casca precisa da busca antes de ela abrir: o botão e o atalho. Moram fora de
 * `busca.tsx` porque ela arrasta o catálogo, o Radix e o cmdk, que só descem no primeiro uso.
 */

import * as React from "react";
import { Search } from "lucide-react";

/**
 * `⌘K` / `Ctrl+K` abrem a busca de qualquer lugar do site. `/` também, mas só na grade
 * (`naGrade`): em `/marca` a mesma tecla é da busca de tokens. Mora aqui, e não na `Gallery`,
 * porque a tecla tem de valer antes de o chunk dela chegar.
 */
export function useAtalhoDeBusca(abrir: () => void, naGrade = false) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        abrir();
        return;
      }
      const el = e.target as HTMLElement | null;
      const digitando = el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable;
      if (naGrade && e.key === "/" && !digitando) {
        e.preventDefault();
        abrir();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [abrir, naGrade]);
}

/** O botão do cabeçalho. Existe porque atalho que não se anuncia não se usa. */
export function BotaoDeBusca({ onClick }: { onClick: () => void }) {
  const mac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Buscar"
      className="alvo-toque flex h-8 items-center gap-2 rounded-control px-2 text-casa-fg-2 pointer-coarse:h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:text-casa-fg lg:bg-casa-tile lg:w-56 lg:px-3 lg:hover:bg-casa-tile-2"
    >
      <Search className="h-4 w-4 shrink-0" />
      {/* O campo largo é a afordância de busca no desktop. No celular fica o
          ícone, que cabe ao lado da marca sem estourar a linha. */}
      <span className="hidden text-casa-base lg:inline">Buscar</span>
      <kbd className="ml-auto hidden text-casa-sm text-casa-fg-3 lg:inline pointer-coarse:!hidden">
        {mac ? "⌘" : "Ctrl "}K
      </kbd>
    </button>
  );
}
