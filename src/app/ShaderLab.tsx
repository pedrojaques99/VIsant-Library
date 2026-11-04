"use client";

/**
 * A aba Shaders: canvas fixo à esquerda, filtros empilhados à direita.
 *
 * Grade não serve aqui. Cada filtro é um contexto WebGL e o aparelho aguenta só
 * alguns, então parte dos cards ficava em foto antiga e a imagem não batia entre
 * eles. Com um palco só, o filtro aberto é sempre a imagem escolhida.
 *
 * No desktop só o painel rola: o canvas fica à vista enquanto se percorre a lista.
 * No celular é a página que rola, e o palco gruda embaixo da barra de abas junto com
 * o nome e o comando: tocar num filtro lá embaixo mostra o efeito sem subir a tela.
 * Trocar a imagem é a ação secundária, então fica recolhida atrás de um botão.
 *
 * As miniaturas vêm prontas (`npm run build:shader-thumbs`), uma por filtro e
 * imagem padrão. Imagem enviada não tem miniatura pronta: ali cada linha mostra a
 * própria imagem, sem filtro, e o filtro aparece no palco ao escolher.
 */

import * as React from "react";
import { ArrowUpRight, Image as ImageIcon, Upload } from "lucide-react";

import type { CatalogItem } from "./catalog";
import { CopyCommand } from "./copy-command";
import {
  PADROES,
  SemSeletorDeImagem,
  enviarImagem,
  escolherImagem,
  useEscolhaDeImagem,
} from "./demos/imagem-do-shader";
import { installCommand } from "./registry-meta";
import { cn } from "@/lib/utils";

/*
 * A altura do palco no celular, nome e comando de fora. Em tela muito baixa
 * (paisagem) nada gruda: palco grudado ali não deixaria sobrar lista.
 */
const PALCO_NO_CELULAR = "h-[max(12rem,32svh)] lg:h-full";
const GRUDA_NO_CELULAR =
  "[@media(max-width:1023px)_and_(min-height:560px)]:sticky [@media(max-width:1023px)_and_(min-height:560px)]:top-[calc(var(--shell-header-h)+var(--barra-h))]";

const FOCO = "outline-none focus-visible:[box-shadow:var(--focus)]";

function SeletorDeImagem() {
  const { atual, enviada } = useEscolhaDeImagem();
  const campo = React.useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Imagem dos filtros">
      {[...PADROES, ...(enviada ? [enviada] : [])].map((img, i) => (
        <button
          key={img.src}
          type="button"
          onClick={() => escolherImagem(i)}
          aria-label={`Usar ${img.nome}`}
          aria-pressed={img.src === atual.src}
          className={cn(
            FOCO,
            "alvo-toque size-11 cursor-pointer overflow-hidden rounded-control transition-opacity [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:opacity-100",
            img.src === atual.src ? "opacity-100 [box-shadow:0_0_0_2px_var(--casa-fg)]" : "opacity-60",
          )}
        >
          <img src={img.src} alt="" draggable={false} onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} className="size-full object-cover" />
        </button>
      ))}
      <button
        type="button"
        onClick={() => campo.current?.click()}
        className={cn(
          FOCO,
          "alvo-toque flex h-11 cursor-pointer items-center gap-2 rounded-control px-3 text-casa-sm text-casa-fg-2 transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:text-casa-fg",
        )}
      >
        <Upload className="size-4" aria-hidden />
        Usar sua imagem
      </button>
      <input
        ref={campo}
        type="file"
        accept="image/*"
        hidden
        aria-label="Imagem do seu computador"
        onChange={(e) => {
          enviarImagem(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function ShaderLab({ itens, onFocus }: { itens: CatalogItem[]; onFocus: (nome: string) => void }) {
  const [nome, setNome] = React.useState(itens[0]?.name);
  const [trocando, setTrocando] = React.useState(false);
  const item = itens.find((i) => i.name === nome) ?? itens[0];
  const { atual, enviada } = useEscolhaDeImagem();
  const ehEnviada = atual.src === enviada?.src;
  const Demo = item?.demo;

  if (!item || !Demo) return null;

  return (
    <div
      data-shader-lab
      /* `block` no celular: num item de grid o `sticky` só anda dentro da própria linha. */
      className="mt-2 block lg:mt-4 lg:-mb-24 lg:grid lg:h-[calc(100dvh-17rem)] lg:min-h-[26rem] lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-4"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        enviarImagem(e.dataTransfer.files[0]);
      }}
    >
      <div className={cn("z-20 min-w-0 bg-casa-bg pb-2 lg:relative lg:pb-0", GRUDA_NO_CELULAR)}>
        <div className={cn("relative", PALCO_NO_CELULAR)}>
        <div
          className="palco grid size-full grid-cols-[minmax(0,1fr)] place-items-center overflow-hidden rounded-tile p-3 lg:p-6 [--shader-w:min(100%,calc(max(12rem,32svh)-1.5rem))] lg:[--shader-w:min(100%,calc(100dvh-20rem))]"
        >
          <SemSeletorDeImagem>
            <React.Suspense fallback={null}>
              {/* `key`: cada filtro tem o próprio contexto WebGL; trocar solta o anterior. */}
              <Demo key={item.name} />
            </React.Suspense>
          </SemSeletorDeImagem>
        </div>

        <div className="casa absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] items-start gap-2">
          <button
            type="button"
            onClick={() => setTrocando((v) => !v)}
            aria-expanded={trocando}
            aria-label="Trocar imagem"
            title="Trocar imagem"
            className="casa-icone alvo-toque shrink-0 bg-casa-bg"
          >
            <ImageIcon className="size-4" aria-hidden />
          </button>
          {trocando ? (
            <div className="rounded-control bg-casa-bg p-2">
              <SeletorDeImagem />
            </div>
          ) : null}
        </div>
        </div>

        {/* O nome e o comando do filtro aberto, à mão enquanto a lista rola. */}
        <div className="casa flex items-center justify-between gap-2 pt-1 lg:hidden">
          <button
            type="button"
            onClick={() => onFocus(item.name)}
            className={cn(FOCO, "flex min-h-11 min-w-0 cursor-pointer items-center gap-1 rounded-control text-casa-base font-medium text-casa-fg")}
          >
            <span className="truncate">{item.title}</span>
            <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
          </button>
          <CopyCommand
            variant="chip"
            text={installCommand(item.name)}
            className="size-11 bg-casa-cta text-casa-cta-fg hover:bg-casa-cta hover:text-casa-cta-fg"
          />
        </div>
      </div>

      <aside className="casa flex min-h-0 min-w-0 flex-col gap-3">
        <div
          role="group"
          aria-label="Filtros"
          className="grid min-h-0 flex-1 grid-cols-2 gap-1 sm:grid-cols-3 lg:block lg:space-y-1 lg:overflow-y-auto lg:overscroll-contain"
        >
          {itens.map((f) => (
            <button
              key={f.name}
              type="button"
              data-filtro={f.name}
              onClick={() => setNome(f.name)}
              aria-pressed={f.name === item.name}
              className={cn(
                FOCO,
                "alvo-toque flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-control p-1.5 text-left transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-casa-tile",
                f.name === item.name && "bg-casa-tile-2 hover:bg-casa-tile-2",
              )}
            >
              <img
                src={ehEnviada ? atual.src : `/shots/shader/${f.name}-${atual.chave}.webp`}
                alt=""
                loading="lazy"
                draggable={false}
                onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                className="size-12 shrink-0 rounded-control object-cover"
              />
              <span className={cn("min-w-0 truncate text-casa-sm", f.name === item.name ? "text-casa-fg" : "text-casa-fg-2")}>
                {f.title.replace(/^(Shader|Textura) /, "")}
              </span>
            </button>
          ))}
        </div>

        <div className="hidden shrink-0 flex-col gap-2 border-t border-casa-line pt-3 lg:flex">
          <button
            type="button"
            onClick={() => onFocus(item.name)}
            className={cn(
              FOCO,
              "alvo-toque flex w-fit cursor-pointer items-center gap-1 rounded-control text-casa-base font-medium text-casa-fg hover:underline",
            )}
          >
            {item.title}
            <ArrowUpRight className="size-3.5" aria-hidden />
          </button>
          <CopyCommand variant="cta" text={installCommand(item.name)} />
        </div>
      </aside>
    </div>
  );
}
