"use client";

/**
 * O seletor em cima do que ele troca.
 *
 * A casca da vitrine é neutra e não lê a marca (`--casa-*`), então trocar a marca
 * com o gatilho sozinho no palco não mudava nada à vista: parecia um botão quebrado.
 * Aqui ele mora dentro de uma superfície pintada só por token: o fundo é `--brand`,
 * a frase vem em `--font-display` e a tira embaixo é a paleta. Escolheu, mudou tudo.
 * A frase e a paleta saem do índice de marcas, e `active` acompanha a prévia.
 *
 * `shortcut={null}`: o cabeçalho da vitrine já escuta ⌘B, e dois ouvintes no mesmo
 * atalho abriam duas caixas. A caixa de comando é portalizada no `body`, igual ao
 * que o `shadcn add` entrega.
 */

import * as React from "react";

import { useBrandTheme } from "../../../registry/visant/lib/brand-theme";
import { BrandSelector } from "../../../registry/visant/ui/brand-selector";

const PINTURA =
  "transition-[background-color,color] [transition-duration:var(--dur-base)] [transition-timing-function:var(--ease-out)]";

export default function BrandSelectorDemo() {
  const { active } = useBrandTheme();

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="w-full max-w-[26rem] overflow-hidden rounded-[var(--r-surface,1rem)] border border-border [box-shadow:var(--e-raised)]">
        <div
          className={`flex min-h-64 flex-col items-start justify-between gap-10 p-4 ${PINTURA}`}
          style={{
            background: "var(--brand, var(--muted))",
            color: "var(--brand-foreground, var(--foreground))",
          }}
        >
          {/* A peça herda a cor de texto: sem isto o nome vinha em --brand-foreground sobre o cartão. */}
          <div className="max-w-full text-foreground">
            <BrandSelector shortcut={null} className="max-w-full bg-card" />
          </div>
          <p
            className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.01em] text-pretty"
            style={{ fontFamily: "var(--font-display, inherit)" }}
          >
            {active?.tagline}
          </p>
        </div>
        <div aria-hidden className="flex h-9">
          {active?.palette
            .filter((c) => c.role !== "accent")
            .slice(0, 4)
            .map((c, i) => (
            <span key={i} className={`flex-1 ${PINTURA}`} style={{ background: c.hex }} />
          ))}
        </div>
      </div>
    </div>
  );
}
