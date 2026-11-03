"use client";

/**
 * Cinco marcos numa caixa que mostra três: o traço é a peça, e ele anda com a
 * rolagem da própria caixa.
 *
 * A demo rolava com a página, e a página é o que menos rola aqui: na ficha ela
 * nem tem percurso, então a roda não mudava nada, e na grade o estado dependia de
 * onde o ladrilho estava na tela. Com rolagem própria, o que a peça promete vale
 * igual na grade, na ficha e no toque.
 *
 * Nasce no meio do caminho porque é o quadro que conta a história: marcos feitos
 * em cima, o atual no meio e o que falta embaixo. As pontas dissolvem, porque a
 * lista continua.
 */

import * as React from "react";

import { Timeline } from "../../../registry/visant/ui/timeline";

const Linha = ({ children }: { children: React.ReactNode }) => (
  <p className="text-apoio leading-relaxed text-muted-foreground">{children}</p>
);

const MARCOS = [
  { meta: "12 mar", title: "Briefing", content: <Linha>Objetivo e prazo combinados.</Linha> },
  { meta: "24 mar", title: "Primeira versão", content: <Linha>Proposta pronta para revisão.</Linha> },
  { meta: "02 abr", title: "Revisão", content: <Linha>Ajustes pedidos e aprovados.</Linha> },
  { meta: "08 abr", title: "Entrega", content: <Linha>Tudo publicado e documentado.</Linha> },
  { meta: "20 abr", title: "Balanço", content: <Linha>O que ficou e o que muda.</Linha> },
];

/** Fração do percurso em que a demo nasce: logo depois de o terceiro marco acender. */
const NASCE_EM = 0.47;

const DISSOLVE =
  "linear-gradient(to bottom, transparent, black 32px, black calc(100% - 32px), transparent)";

export default function TimelineDemo() {
  const caixa = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const el = caixa.current;
    if (el) el.scrollTop = (el.scrollHeight - el.clientHeight) * NASCE_EM;
  }, []);

  return (
    // Altura em px, e não `h-full`: no preset de celular (iframe) ninguém dá altura
    // à demo, a caixa cresceria até caber tudo e não haveria o que rolar. O anel de
    // foco mora aqui fora porque a máscara da caixa o apagaria.
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-[325px] w-[360px] max-w-full rounded-[var(--r-surface,0.875rem)] has-[:focus-visible]:[box-shadow:var(--focus)]">
        <div
          ref={caixa}
          // `tabIndex`: a rolagem também chega pelo teclado.
          tabIndex={0}
          aria-label="Linha do tempo com rolagem própria"
          className="relative h-full overflow-y-auto px-2 py-6 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ maskImage: DISSOLVE, WebkitMaskImage: DISSOLVE }}
        >
          <Timeline data={MARCOS} scrollContainer={caixa} />
        </div>
      </div>
    </div>
  );
}
