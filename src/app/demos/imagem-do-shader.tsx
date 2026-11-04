"use client";

/**
 * A imagem que todo shader da vitrine filtra, escolhida num lugar só.
 *
 * Na aba Shaders quem escolhe é o `ShaderLab`; na ficha de cada peça, as setas.
 * Os dois mexem na mesma escolha. A imagem enviada fica só nesta aba do navegador,
 * como URL local (`blob:`): nada sai da máquina.
 */

import * as React from "react";
import { Upload } from "lucide-react";

import { Trocador } from "./um-por-vez";

export interface ImagemDoShader {
  /** O que aparece entre as setas. */
  nome: string;
  /** O sufixo das miniaturas em `/shots/shader/`. Só as padrão têm. */
  chave: string;
  src: string;
  alt: string;
}

export const IMAGEM_PADRAO = "/media/efeito-mao.webp";

export const PADROES: readonly ImagemDoShader[] = [
  { nome: "mão", chave: "mao", src: IMAGEM_PADRAO, alt: "Mão metálica sobre fundo ciano" },
  { nome: "tv", chave: "tv", src: "/media/efeito-padrao.webp", alt: "TV de tubo numa prateleira" },
  { nome: "forma", chave: "forma", src: "/media/efeito-forma.webp", alt: "Forma abstrata em tons quentes" },
  { nome: "gradiente", chave: "gradiente", src: "/media/efeito-gradiente.webp", alt: "Gradiente suave" },
];

/* Objeto novo a cada mudança: é o que o `useSyncExternalStore` compara. */
let estado: { indice: number; enviada: ImagemDoShader | null } = { indice: 0, enviada: null };
const ouvintes = new Set<() => void>();

function mudar(novo: typeof estado) {
  estado = novo;
  ouvintes.forEach((f) => f());
}

const lista = () => (estado.enviada ? [...PADROES, estado.enviada] : PADROES);

export function escolherImagem(indice: number) {
  mudar({ ...estado, indice });
}

function passar(d: number) {
  const n = lista().length;
  escolherImagem((estado.indice + d + n) % n);
}

export function enviarImagem(arquivo: File | undefined) {
  if (!arquivo || !arquivo.type.startsWith("image/")) return;
  if (estado.enviada) URL.revokeObjectURL(estado.enviada.src);
  mudar({
    indice: PADROES.length,
    enviada: { nome: "sua imagem", chave: "", src: URL.createObjectURL(arquivo), alt: arquivo.name },
  });
}

function assinar(f: () => void) {
  ouvintes.add(f);
  return () => {
    ouvintes.delete(f);
  };
}

export function useEscolhaDeImagem() {
  const { indice, enviada } = React.useSyncExternalStore(assinar, () => estado);
  return { atual: (enviada ? [...PADROES, enviada] : PADROES)[indice], enviada };
}

/** `externo` é o `src` do painel da ficha: uma URL digitada ali vence a escolha. */
export function useImagemDoShader(externo?: unknown): ImagemDoShader {
  const { atual } = useEscolhaDeImagem();
  return typeof externo === "string" && externo && externo !== IMAGEM_PADRAO
    ? { nome: "url", chave: "", src: externo, alt: "" }
    : atual;
}

const ComSeletor = React.createContext(true);

/** No `ShaderLab` o seletor é um só, acima do palco. */
export function SemSeletorDeImagem({ children }: { children: React.ReactNode }) {
  return <ComSeletor.Provider value={false}>{children}</ComSeletor.Provider>;
}

export function PalcoDoShader({ children }: { children: React.ReactNode }) {
  const { atual } = useEscolhaDeImagem();
  const comSeletor = React.useContext(ComSeletor);
  const campo = React.useRef<HTMLInputElement>(null);

  if (!comSeletor) return <div className="flex h-full w-full items-center justify-center">{children}</div>;

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        enviarImagem(e.dataTransfer.files[0]);
      }}
    >
      {children}
      <div className="flex items-center gap-0.5 text-muted-foreground">
        <Trocador nome={atual.nome} onPasso={passar} rotulo="imagem" />
        <button
          type="button"
          onClick={() => campo.current?.click()}
          aria-label="Usar uma imagem do seu computador"
          title="Usar uma imagem do seu computador"
          className="alvo-toque grid size-7 place-items-center rounded-[var(--r-pill,9999px)] outline-none transition-[color,background-color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-muted hover:text-foreground focus-visible:[box-shadow:var(--focus)]"
        >
          <Upload className="size-4" aria-hidden />
        </button>
        <input
          ref={campo}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            enviarImagem(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
