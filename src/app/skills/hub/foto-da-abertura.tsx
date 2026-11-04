"use client";

/**
 * A foto da primeira dobra: a cortina dentro da `Gleam`, girando por outros exemplos.
 *
 * A `Gleam` dá a perspectiva e a luz: parada ela já repousa inclinada, e no mouse acompanha
 * o ponteiro. A troca acontece dentro das camadas da cortina, então a alça fica onde a pessoa
 * deixou. Só troca com a foto seguinte já decodificada, e nunca em cima de quem está arrastando.
 */

import * as React from "react";
import { Gleam } from "../../../../registry/visant/ui/gleam";
import { redeLenta } from "@/lib/rede";
import { FotosDoAntesDepois } from "./fotos-da-abertura";
import { foto, fotoPequena } from "./fotos";
import { useMenosMovimento, useNaTela } from "./nucleo";
import hA from "./posters/hero-a.webp";
import hD from "./posters/hero-d.webp";

/* A cortina pede 45 KB de GSAP: em Slow 4G eles não podem vir antes das fotos. */
const PhotoCompare = React.lazy(() =>
  import("../../../../registry/visant/ui/photo-compare").then((m) => ({ default: m.PhotoCompare })),
);

const EXEMPLOS = ["mata", "dsg-landing", "fnt-hotel", "cpy-box", "dsg-portal", "ref-pousada"];
const TROCA_MS = 5000;
const FOLGA_DA_MAO_MS = 8000;
const SIZES = "46vw";

type Lado = "a" | "d";

function fonte(id: string, lado: Lado, largo: boolean): { src: string; srcSet?: string } {
  if (largo) return foto(`${id}-${lado}`);
  if (id === "mata") return { src: lado === "a" ? hA : hD };
  return { src: fotoPequena(`${id}-${lado}`) };
}

function preparar(id: string, largo: boolean) {
  return Promise.all(
    (["a", "d"] as const).map((lado) => {
      const { src, srcSet } = fonte(id, lado, largo);
      const img = new Image();
      if (srcSet) {
        img.sizes = SIZES;
        img.srcset = srcSet;
      }
      img.src = src;
      return img.decode();
    }),
  );
}

export function FotoDaAbertura({ largo, assentada }: { largo: boolean; assentada: boolean }) {
  const [par, setPar] = React.useState<{ atual: number; anterior: number | null }>({ atual: 0, anterior: null });
  const [caixa, naTela] = useNaTela<HTMLDivElement>();
  const menos = useMenosMovimento();
  const toque = React.useRef(0);
  const atual = React.useRef(0);
  const sizes = largo ? SIZES : undefined;
  const ratio = largo ? "880/580" : "6/5";

  React.useEffect(() => {
    if (!assentada || !naTela || menos || redeLenta()) return;
    let vivo = true;
    const id = setInterval(() => {
      if (document.hidden || Date.now() - toque.current < FOLGA_DA_MAO_MS) return;
      const de = atual.current;
      const para = (de + 1) % EXEMPLOS.length;
      preparar(EXEMPLOS[para], largo)
        .then(() => {
          if (!vivo || atual.current !== de) return;
          atual.current = para;
          setPar({ atual: para, anterior: de });
        })
        .catch(() => {});
    }, TROCA_MS);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, [assentada, naTela, menos, largo]);

  const camada = (lado: Lado) => (
    <div className="relative">
      {par.anterior !== null ? (
        <img key={par.anterior} {...fonte(EXEMPLOS[par.anterior], lado, largo)} sizes={sizes} alt="" className="absolute inset-0" />
      ) : null}
      <img
        key={par.atual}
        {...fonte(EXEMPLOS[par.atual], lado, largo)}
        sizes={sizes}
        alt=""
        className="absolute inset-0 motion-safe:animate-[foto-entra_calc(var(--dur-slow)*2)_var(--ease-out)_both]"
      />
    </div>
  );

  const paradas = (
    <FotosDoAntesDepois ratio={ratio} antes={fonte("mata", "a", largo)} depois={fonte("mata", "d", largo)} sizes={sizes} className="w-full overflow-hidden rounded-tile" />
  );

  return (
    <div ref={caixa} className="min-w-0">
      {/* Luz neutra: a casa não fala com a cor da marca. */}
      <Gleam tilt={9} tint="var(--casa-fg)" className="overflow-hidden rounded-tile">
        <React.Suspense fallback={paradas}>
          {assentada ? (
            <PhotoCompare
              key={largo ? "largo" : "celular"}
              ratio={ratio}
              label="Antes e depois de telas de exemplo, com marcas inventadas"
              beforeLabel={null}
              afterLabel={null}
              before={camada("a")}
              after={camada("d")}
              onValueChange={() => {
                toque.current = Date.now();
              }}
              className="w-full overflow-hidden rounded-tile"
            />
          ) : (
            paradas
          )}
        </React.Suspense>
      </Gleam>
      {/* O rótulo mora fora da foto: dentro, ele cobria o texto da tela. */}
      <p className="mt-1.5 flex justify-between px-1 text-casa-sm text-casa-fg-2">
        <span>depois</span>
        <span>antes</span>
      </p>
    </div>
  );
}
