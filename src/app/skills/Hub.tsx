"use client";

/**
 * /skills: a página de produto das 12 skills públicas, desenhada em 390x844.
 *
 * Ao nascer, cada dobra é o nome e a demo já em ação. O resto só aparece quando a
 * pessoa pede: "como funciona" abre uma folha por cima, e o único "Instalar" mora
 * no rodapé fixo, junto com o índice no polegar. O filme fica em /skills/filme e a
 * defesa do carro-chefe em /skills/killer.
 */

import * as React from "react";
import { useDobraAssentada } from "@/lib/rede";
import { ALTURA_DOBRA, PaginaCtx, useLargo } from "./hub/nucleo";
import { FotosDoAntesDepois } from "./hub/fotos-da-abertura";
import hA from "./hub/posters/hero-a.webp";
import hD from "./hub/posters/hero-d.webp";
import { foto } from "./hub/fotos";

/*
 * A primeira dobra é o título e as duas fotos. O resto da página (doze demos, o GSAP da cortina,
 * o motion do rodapé) desce depois que ela ficou de pé: em Slow 4G, junto, era 14 s de tela sem foto.
 */
const Resto = React.lazy(() => import("./hub/resto").then((m) => ({ default: m.Resto })));
const PhotoCompare = React.lazy(() =>
  import("../../../registry/visant/ui/photo-compare").then((m) => ({ default: m.PhotoCompare })),
);

export function Hub() {
  const [aberta, setAberta] = React.useState<string | null>(null);
  const [instalando, setInstalando] = React.useState(false);
  const largo = useLargo();
  const ctx = React.useMemo(() => ({ aberta, setAberta, instalar: () => setInstalando(true) }), [aberta]);
  const assentada = useDobraAssentada();
  const antes = largo ? foto("mata-a") : { src: hA };
  const depois = largo ? foto("mata-d") : { src: hD };
  const sizes = largo ? "46vw" : undefined;
  const fotosParadas = (
    <FotosDoAntesDepois ratio={largo ? "880/580" : "6/5"} antes={antes} depois={depois} sizes={sizes} className="w-full overflow-hidden rounded-tile" />
  );

  return (
    <PaginaCtx.Provider value={ctx}>
      <main className="casa overflow-x-clip">
        <section data-abertura className={`shell grid min-w-0 content-center items-center gap-4 py-4 lg:grid-cols-2 lg:gap-16 ${ALTURA_DOBRA}`}>
          <div className="min-w-0">
            <h1 className="text-[clamp(2.5rem,6.5vw,5.5rem)] font-medium leading-[1.08] tracking-[-0.03em]">
              Tire a cara de IA da sua interface.
            </h1>
            <p className="mt-2 text-casa-base text-casa-fg-2 lg:mt-4 lg:text-casa-lg">
              Doze skills pro Claude Code que auditam tela, texto, animação e vídeo. A gente só testou lá.
            </p>
          </div>
          <div className="min-w-0">
          <React.Suspense fallback={fotosParadas}>
            {assentada ? (
              <PhotoCompare
                key={largo ? "largo" : "celular"}
                ratio={largo ? "880/580" : "6/5"}
                label="Antes e depois de uma tela de loja, com marca inventada"
                beforeLabel={null}
                afterLabel={null}
                before={<img {...antes} sizes={sizes} alt="" />}
                after={<img {...depois} sizes={sizes} alt="" />}
                className="w-full overflow-hidden rounded-tile"
              />
            ) : (
              fotosParadas
            )}
          </React.Suspense>
          {/* O rótulo mora fora da foto: dentro, ele cobria o texto da tela. */}
          <p className="mt-1.5 flex justify-between px-1 text-casa-sm text-casa-fg-2">
            <span>depois</span>
            <span>antes</span>
          </p>
          </div>
        </section>

        {/* A altura de uma dobra segura a página enquanto o resto não chega. */}
        <React.Suspense fallback={<div className={ALTURA_DOBRA} />}>
          {assentada ? <Resto instalando={instalando} setInstalando={setInstalando} /> : <div className={ALTURA_DOBRA} />}
        </React.Suspense>
      </main>
    </PaginaCtx.Provider>
  );
}
