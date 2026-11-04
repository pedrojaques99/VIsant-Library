"use client";

/**
 * A demo do marquee mora sozinha porque ela é cara.
 *
 * O motor é GSAP + ScrollTrigger — biblioteca inteira no bundle para servir UM
 * card, que ainda por cima fica no meio da lista. Aqui o pedaço só é buscado
 * quando o card entra na tela. Mesmo trato que o board do kanban recebeu.
 */

import * as React from "react";

import { Trocador } from "./um-por-vez";
import { Marquee } from "../../../registry/visant/ui/marquee";

/**
 * Uma faixa por vez, e as setas trocam de modo.
 *
 * ── Por que as três empilhadas estavam erradas ─────────────────────────────
 *
 * A versão anterior montava os três marquees de uma vez, um embaixo do outro,
 * num palco de 640×300. A ideia era boa — "a diferença entre eles não cabe numa
 * descrição, veja as três reagirem ao mesmo gesto" — e o resultado era o oposto:
 *
 * · **Nenhuma ficava em tamanho de faixa.** Três faixas mais três rótulos em
 *   300px de altura dão ~60px por faixa. Faixa de 60px não é faixa, é uma linha
 *   de texto que se mexe, e o que a peça vende — o corte nas pontas, a marca
 *   passando, a inclinação — some junto.
 * · **Comparar três coisas em movimento ao mesmo tempo ninguém faz.** O olho vai
 *   pra uma. As outras duas viram ruído animado atrás da que está sendo lida.
 * · **Custava três motores.** Três timelines GSAP e três ScrollTriggers vivos,
 *   simultâneos, num card de catálogo — pra mostrar uma peça de cada vez.
 * · **A melhor chegava por último.** A "solta" — que é a peça no ponto em que
 *   ela é vendida, torta, rápida e com a marca no meio — era a terceira, a mais
 *   embaixo, e a mais provável de estar fora da tela.
 *
 * Agora é uma faixa por vez, em largura inteira, com as setas trocando o modo.
 * O que se perde é a comparação simultânea; o que se ganha é poder ver cada uma.
 * E a comparação sobrevive melhor assim: trocar de modo COM a página parada e
 * depois rolar é o gesto que mostra a diferença, porque a diferença está toda em
 * como cada uma responde ao scroll — e pra isso só se pode olhar uma.
 *
 * A "solta" é a inicial porque é ela que o report pediu e é ela que responde
 * "por que eu instalaria isto" em um segundo.
 *
 * O seletor é texto miúdo no pé, sem caixa, sem nota e sem contador: as setas e a
 * legenda mono em cima da fita disputavam com ela. E a fita sai da caixa em vez
 * de parar nela: um corte reto a poucos pixels da borda do cartão lê como acidente.
 */

interface Modo {
  chave: string;
  faixa: (itens: React.ReactNode[], marca: React.ReactNode) => React.ReactNode;
}

/* Maior que o respiro lateral de qualquer palco (32px na ficha): quem corta a fita
   é a borda do cartão, nunca a caixa da demo. Quem deixa pintar fora é o `overflow: clip` lá embaixo. */
const SANGRIA = 64;

const MODOS: Modo[] = [
  {
    chave: "Solta",
    faixa: (itens, marca) => (
      <Marquee
        band
        speed={16}
        boost={6}
        tilt={-2.5}
        gap={40}
        bleed={SANGRIA}
        items={itens.map((it, i) => (
          <span key={i} className="flex items-center gap-4">
            {it}
            {marca}
          </span>
        ))}
      />
    ),
  },
  {
    chave: "Empurra",
    faixa: (itens) => <Marquee band speed={40} bleed={SANGRIA} items={itens} />,
  },
  {
    chave: "Esteira",
    faixa: (itens) => (
      <Marquee
        scroll="drive"
        laps={0.9}
        speed={40}
        bleed={SANGRIA}
        className="border-y border-border py-4"
        items={itens}
      />
    ),
  },
  {
    chave: "Amarrada",
    faixa: (itens) => (
      <Marquee
        scroll="scrub"
        speed={40}
        fade
        bleed={SANGRIA}
        className="py-4"
        items={itens}
      />
    ),
  },
];

export default function MarqueeDemo() {
  const palavras = ["FRETE GRÁTIS", "NOVA COLEÇÃO", "ESTOQUE REAL", "TROCA EM 30 DIAS"];
  const [i, setI] = React.useState(0);
  const modo = MODOS[i];

  const itens = React.useMemo(
    () =>
      palavras.map((t) => (
        <span key={t} className="font-mono text-rotulo tracking-[0.14em]">
          {t}
        </span>
      )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /* A marca no meio da faixa doidona: um asterisco desenhado, não uma fonte —
     glifo de fonte muda de peso a cada família e a faixa perde o ritmo. */
  /* EXCEPTION to noise-scan/hand-drawn-icon: é a marca gráfica preenchida da faixa, não um glifo de interface, e o Asterisk da lucide é traço e mudaria o desenho */
  const marca = (
    <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" aria-hidden fill="currentColor">
      <path d="M12 1.5 13.9 9l6.6-3.8-3.8 6.6 7.3 1.9-7.3 1.9 3.8 6.6L13.9 18 12 25.5 10.1 18l-6.6 3.8 3.8-6.6L0 13.3l7.3-1.9L3.5 4.8 10.1 9z" />
    </svg>
  );

  return (
    /*
     * `overflow: clip` com margem no lugar de `hidden`: a fita pinta além da caixa
     * até a borda do cartão, sem criar barra de rolagem em quem hospeda a demo.
     */
    <div className="flex h-full w-full flex-col justify-center gap-10 [overflow-clip-margin:20px] [overflow:clip] sm:[overflow-clip-margin:32px]">
      {/*
       * `key` no modo: cada troca REMONTA a faixa.
       *
       * Sem isto o GSAP reaproveitaria o contexto entre dois modos que montam
       * timelines diferentes (o `scrub` cria um tween com ScrollTrigger, o
       * `drive` cria um `quickTo` no playhead), e o efeito seria o clássico:
       * a faixa continua andando, surda, com dois motores discutindo o mesmo
       * `x`. Remontar é barato e é a única forma honesta de trocar de motor.
       */}
      <div key={modo.chave} className="min-w-0">
        {modo.faixa(itens, marca)}
      </div>

      <div className="flex justify-center">
        <Trocador
          nome={modo.chave}
          onPasso={(d) => setI((v) => (v + d + MODOS.length) % MODOS.length)}
          rotulo="variação"
        />
      </div>
    </div>
  );
}
