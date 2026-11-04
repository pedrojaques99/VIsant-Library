"use client";

/**
 * O rodapé da casa: o mesmo em toda rota.
 *
 * Mora fora do `App.tsx` e não importa nada do catálogo: é um chunk próprio, pedido depois
 * da primeira dobra, e quem abre `/skills` em Slow 4G não paga por ele antes de ver a página.
 *
 * Na aba Shaders, em desktop, ele some (quem decide é o `App.tsx`). O laboratório mede a
 * altura da janela pra só o painel rolar: um rodapé abaixo dele daria rolagem à página, e o
 * palco deixaria de ficar à vista. O cabeçalho continua ali, com as mesmas portas.
 */

import { cn } from "@/lib/utils";

export type PortaDoRodape = "catalogo" | "skills" | "marca" | "docs";

const PORTAS: { view: PortaDoRodape; rotulo: string; href: string }[] = [
  { view: "catalogo", rotulo: "Catálogo", href: "/" },
  { view: "skills", rotulo: "Skills", href: "/skills" },
  { view: "marca", rotulo: "Marca", href: "/marca" },
  { view: "docs", rotulo: "Docs", href: "/docs" },
];

/* Fora do `cn`: o tailwind-merge lê `text-casa-sm` e `text-casa-fg-2` como a mesma classe e larga o tamanho. */
const LINK =
  "inline-flex min-h-8 items-center rounded-control text-casa-sm text-casa-fg-2 outline-none transition-colors aria-[current=page]:text-casa-fg [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:text-casa-fg focus-visible:[box-shadow:var(--focus)] pointer-coarse:min-h-11";

/* Alvo de toque por padding e não por `min-w-11`: largura mínima abria vão só depois das palavras curtas. */
const PORTA = `${LINK} pointer-coarse:min-w-11 pointer-coarse:justify-center pointer-coarse:px-2`;

export function Rodape({
  atual,
  onPorta,
  className,
}: {
  atual: string;
  onPorta: (view: PortaDoRodape) => void;
  className?: string;
}) {
  return (
    <footer className={cn("casa shell mt-auto", className)}>
      <div className="flex flex-col border-t border-casa-line py-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <a href="https://visantlabs.com" className={`${LINK} gap-2 self-start sm:self-auto`}>
          <span aria-hidden className="h-3 w-3 rounded-[4px] bg-casa-fg" />
          Visant Labs
        </a>
        <nav aria-label="Rodapé" className="flex flex-wrap items-center gap-x-2 sm:gap-x-5 pointer-coarse:-mx-2 pointer-coarse:gap-x-0 pointer-coarse:sm:gap-x-0">
          {PORTAS.map((p) => (
            <a
              key={p.view}
              href={p.href}
              aria-current={atual === p.view ? "page" : undefined}
              onClick={(e) => {
                /* Ctrl, Cmd e botão do meio continuam abrindo aba nova. */
                if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                onPorta(p.view);
              }}
              className={PORTA}
            >
              {p.rotulo}
            </a>
          ))}
          <a href="/llms.txt" className={PORTA}>
            llms.txt
          </a>
          <a href="https://github.com/pedrojaques99/Vintageuiuxlibrary" className={PORTA}>
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
