"use client";

/**
 * Os cenários de uma skill: antes e depois na mesma cortina, com o seletor embaixo.
 *
 * Só o cenário escolhido monta, então o peso de quem nunca abriu os outros não chega.
 *
 * O modo Analisar desenha caixa e legenda sobre os elementos, como nos filmes. As marcas
 * moram dentro de cada camada: a cortina recorta a marca junto com a foto, e o que se lê
 * de um lado é sempre daquele estado.
 */

import * as React from "react";
import { ScanSearch } from "lucide-react";
import { PhotoCompare } from "../../../../registry/visant/ui/photo-compare";
import { ALTURA_LARGA, ANIMA_COR, ANIMA_OPACIDADE, cx } from "./base";
import { foto, miniatura } from "./fotos";

/** Em % do quadro. Sai medido do HTML da tela, nunca no olho. */
export type Marca = { x: number; y: number; w: number; h: number; t: string };

export type Tela = {
  id: string;
  nome: string;
  marcas?: { antes: Marca[]; depois: Marca[] };
};

const TAMANHOS = "(min-width: 1024px) 896px, 100vw";

/* As cores dos filmes, em tailwind.css: elas vão sobre a foto do produto, e não sobre a casca. */
const COR = { antes: "var(--marca-antes)", depois: "var(--marca-depois)" } as const;

function Marcas({ marcas, lado }: { marcas: Marca[]; lado: "antes" | "depois" }) {
  return (
    <div data-marcas={lado} aria-hidden="true" className="absolute inset-0">
      {marcas.map((m, i) => {
        // A legenda sai por cima da caixa e, sem espaço, entra nela. Perto da borda direita, alinha pela direita.
        const dentro = m.y < 9;
        const aDireita = m.x + m.w > 62;
        return (
          <div
            key={m.t}
            className="motion-safe:animate-[marca-entra_var(--dur-base)_var(--ease-out)_both]"
            style={{
              position: "absolute",
              left: `${m.x}%`,
              top: `${m.y}%`,
              width: `${m.w}%`,
              height: `${m.h}%`,
              boxShadow: `inset 0 0 0 1.5px ${COR[lado]}`,
              borderRadius: 3,
            }}
          >
            {/* No celular a legenda tampava o texto em volta: lá a caixa leva o número, e a frase desce pra lista. */}
            <span
              className="absolute whitespace-nowrap rounded-[3px] px-1 font-casa-mono text-[10px] leading-[1.5] sm:text-xs"
              style={{
                [aDireita ? "right" : "left"]: 0,
                ...(dentro ? { top: 2 } : { bottom: "calc(100% + 2px)" }),
                background: COR[lado],
                color: "var(--marca-texto)",
              }}
            >
              <span className="sm:hidden">{i + 1}</span>
              <span className="hidden sm:inline">{m.t}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Telas({ telas, faixa, skill }: { telas: Tela[]; faixa?: boolean; skill: string }) {
  const [id, setId] = React.useState(telas[0]?.id);
  /* Nasce ligado: a foto já chega dizendo o que olhar. */
  const [analisando, setAnalisando] = React.useState(true);
  const t = telas.find((x) => x.id === id) ?? telas[0];
  if (!t) return null;

  const camada = (lado: "antes" | "depois") => {
    const sufixo = lado === "antes" ? "a" : "d";
    return (
      <>
        <img {...foto(`${t.id}-${sufixo}`)} sizes={TAMANHOS} alt="" loading="lazy" decoding="async" />
        {analisando && t.marcas ? <Marcas marcas={t.marcas[lado]} lado={lado} /> : null}
      </>
    );
  };

  return (
    <section className={faixa ? "bg-casa-tile" : undefined} data-demo="telas" aria-label={`${skill} em ${telas.length} cenários`}>
      <div className={cx("shell flex min-w-0 flex-col justify-center gap-3 py-6 lg:py-8", ALTURA_LARGA)}>
        <div data-sobreposicao className="contents">
          <div className="w-full min-w-0 lg:mx-auto lg:max-w-4xl">
            <PhotoCompare
              key={t.id}
              ratio="880/580"
              label={`Antes e depois: ${t.nome}`}
              beforeLabel={null}
              afterLabel={null}
              before={camada("antes")}
              after={camada("depois")}
              className="w-full overflow-hidden rounded-tile"
            />
            <div className="mt-1 flex items-center justify-between px-1 text-casa-sm text-casa-fg-2">
              <span>depois</span>
              {t.marcas ? (
                <button
                  type="button"
                  data-analisar
                  aria-pressed={analisando}
                  onClick={() => setAnalisando((a) => !a)}
                  className={cx(
                    "flex h-11 items-center gap-1.5 rounded-control px-2 outline-none focus-visible:[box-shadow:var(--focus)]",
                    ANIMA_COR,
                    analisando ? "text-casa-fg" : "text-casa-fg-2 hover:text-casa-fg",
                  )}
                >
                  <ScanSearch className="size-4" aria-hidden="true" />
                  Analisar
                </button>
              ) : null}
              <span>antes</span>
            </div>
            {analisando && t.marcas ? (
              <div data-legendas className="mt-1 grid grid-cols-2 gap-x-4 gap-y-3 px-1 text-casa-sm sm:hidden">
                {(["depois", "antes"] as const).map((lado) => (
                  <ol key={lado} className="flex min-w-0 flex-col gap-1">
                    {t.marcas![lado].map((m, i) => (
                      <li key={m.t} className="flex min-w-0 gap-1.5 text-casa-fg-2">
                        <span
                          aria-hidden="true"
                          className="h-fit shrink-0 rounded-[3px] px-1 font-casa-mono text-[10px] leading-[1.5]"
                          style={{ background: COR[lado], color: "var(--marca-texto)" }}
                        >
                          {i + 1}
                        </span>
                        {m.t}
                      </li>
                    ))}
                  </ol>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2 md:flex md:justify-center" role="group" aria-label="Escolher o cenário">
          {telas.map((x) => (
            <button
              key={x.id}
              type="button"
              data-tela={x.id}
              aria-pressed={x.id === t.id}
              aria-label={x.nome}
              onClick={() => setId(x.id)}
              className={cx(
                "h-11 w-full overflow-hidden rounded-[8px] outline-none focus-visible:[box-shadow:var(--focus)] md:w-14",
                ANIMA_OPACIDADE,
                x.id === t.id ? "opacity-100 [box-shadow:0_0_0_2px_var(--casa-fg)]" : "opacity-50",
              )}
            >
              <img
                src={miniatura(`${x.id}-d`)}
                alt=""
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
