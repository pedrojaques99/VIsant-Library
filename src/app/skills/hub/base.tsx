"use client";

/**
 * As primitivas da página de skills. Tudo aqui lê `--casa-*`: a página é casca,
 * e as peças do registry usadas nas demos saem neutras dentro de `.casa`.
 */

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { useCopy } from "../../copy-command";
import skills from "../skills.generated.json";

export const SKILLS = skills as {
  nome: string;
  descricao: string;
  scripts: string[];
  referencias: string[];
  instalar: string;
}[];

export const instalar = (nome: string) =>
  SKILLS.find((s) => s.nome === nome)?.instalar ?? `npx skills add pedrojaques99/visant-skills-public --skill ${nome}`;

/**
 * Junta classes sem `tailwind-merge`: ele lê `text-casa-lg` (tamanho) como cor e
 * apaga um dos dois quando os dois aparecem, e o texto sai no tamanho errado.
 */
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const LINK =
  "alvo-toque rounded-control underline underline-offset-2 outline-none hover:text-casa-fg focus-visible:[box-shadow:var(--focus)]";

export const ANIMA_COR =
  "transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]";

export const ANIMA_OPACIDADE =
  "transition-opacity [transition-duration:var(--dur-slow)] [transition-timing-function:var(--ease-out)]";

/** Espelho de --dur-base e --ease-out para o framer-motion (tailwind.css é a fonte). */
export const DUR = { base: 0.2 };
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/** Pede menos movimento? Lido no efeito, porque a página é hidratada no cliente. */
export function useMenosMovimento() {
  const [menos, setMenos] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMenos(mq.matches);
    const ouvir = () => setMenos(mq.matches);
    mq.addEventListener("change", ouvir);
    return () => mq.removeEventListener("change", ouvir);
  }, []);
  return menos;
}

/** Timers de uma sequência de demo: morrem junto com a demo ou com a próxima rodada. */
export function useSequencia() {
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const limpar = React.useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  React.useEffect(() => limpar, [limpar]);
  const depois = React.useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  return { depois, limpar };
}

/** O botão da dobra. Um por demo: é a ação primária daquela dobra. */
export function Acao({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "alvo-toque inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-control bg-casa-cta px-4 text-casa-base font-medium text-casa-cta-fg outline-none",
        "transition-[transform,opacity] [transition-duration:var(--dur-press)] [transition-timing-function:var(--ease-out)]",
        "hover:opacity-90 active:scale-[0.97] focus-visible:[box-shadow:var(--focus)] disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Botão que liga e desliga dentro de uma demo: sem fundo de CTA. */
export function Opcao({
  ativa,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { ativa?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={ativa}
      {...props}
      className={cx(
        "alvo-toque rounded-control px-3 py-2 text-left text-casa-base outline-none focus-visible:[box-shadow:var(--focus)]",
        ANIMA_COR,
        ativa ? "bg-casa-tile-2 text-casa-fg" : "text-casa-fg-2 hover:text-casa-fg",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Cabeça da dobra: o nome da skill é o título, a frase conta o que ela faz. */
export function Cabeca({
  nome,
  children,
  tam,
  semInstalar,
  className,
}: {
  nome: string;
  children: React.ReactNode;
  tam?: "grande" | "medio";
  semInstalar?: boolean;
  className?: string;
}) {
  return (
    <header className={cx("min-w-0", className)}>
      <h2
        className={cx(
          "font-medium",
          tam === "grande"
            ? "text-[clamp(2.25rem,5vw,4rem)] leading-[1.12] tracking-[-0.02em]"
            : tam === "medio"
              ? "text-[clamp(1.75rem,3.4vw,3rem)] leading-[1.15] tracking-[-0.02em]"
              : "text-casa-xl",
        )}
      >
        {nome}
      </h2>
      <p className={cx("mt-3 max-w-[56ch] text-casa-fg-2", tam === "grande" ? "text-[1.25rem] leading-7" : "text-casa-lg")}>
        {children}
      </p>
      {semInstalar ? null : <Instalar nome={nome} className="mt-3" />}
    </header>
  );
}

/** Instalar discreto: uma linha de texto. O comando inteiro vai pro clipboard. */
export function Instalar({ nome, className }: { nome: string; className?: string }) {
  const texto = instalar(nome);
  const { done, copy } = useCopy(texto);
  const Icone = done ? Check : Copy;
  return (
    <button
      type="button"
      onClick={copy}
      data-instalar={nome}
      title={texto}
      aria-label={done ? "Copiado" : `Copiar: ${texto}`}
      className={cx(
        "alvo-toque inline-flex max-w-full items-center gap-2 rounded-control text-left text-casa-fg-3 outline-none hover:text-casa-fg focus-visible:[box-shadow:var(--focus)]",
        ANIMA_COR,
        className,
      )}
    >
      <code className="min-w-0 font-casa-mono text-casa-sm [overflow-wrap:anywhere]">
        npx skills add … --skill {nome}
      </code>
      <Icone className="size-3.5 shrink-0" />
    </button>
  );
}

/** O comando inteiro, à vista: só no carro-chefe. */
export function InstalarCheio({ nome }: { nome: string }) {
  const texto = instalar(nome);
  const { done, copy } = useCopy(texto);
  const Icone = done ? Check : Copy;
  return (
    <button
      type="button"
      onClick={copy}
      data-instalar={nome}
      aria-label={done ? "Copiado" : `Copiar: ${texto}`}
      className={cx(
        "alvo-toque flex w-full items-center gap-3 rounded-control bg-casa-tile-2 px-3.5 py-2.5 text-left text-casa-fg-2 outline-none hover:text-casa-fg focus-visible:[box-shadow:var(--focus)]",
        ANIMA_COR,
      )}
    >
      <code className="min-w-0 flex-1 font-casa-mono text-casa-sm [overflow-wrap:anywhere]">{texto}</code>
      <Icone className="size-4 shrink-0" />
    </button>
  );
}

/** Saída de terminal. Rola por dentro: nunca empurra a página de lado. */
export function Terminal({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLPreElement>) {
  return (
    <pre
      {...props}
      className={cx(
        "max-w-full overflow-x-auto rounded-control bg-casa-tile-2 p-4 font-casa-mono text-casa-sm text-casa-fg-2",
        className,
      )}
    >
      {children}
    </pre>
  );
}

/**
 * Vídeo da dobra. O pôster é uma imagem de verdade, sempre embaixo: o vídeo só
 * aparece depois de pintar um quadro, então carregando, falhando ou sem rede quem
 * se vê é o pôster, nunca o preto do elemento. Mp4 que não toca cai no webm,
 * e webm que falha fica no pôster. Só pede o arquivo perto da tela, só toca visível.
 * `trecho` toca um pedaço do arquivo em laço, `inicio` diz onde entra a primeira vez.
 */
export function Video({
  nome,
  alt,
  className,
  proporcao = "1 / 1",
  poster,
  trecho,
  inicio,
}: {
  nome: string;
  alt: string;
  className?: string;
  proporcao?: string;
  poster?: string;
  trecho?: readonly [number, number];
  inicio?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const video = React.useRef<HTMLVideoElement>(null);
  const [perto, setPerto] = React.useState(false);
  const [fonte, setFonte] = React.useState(0);
  const [pintou, setPintou] = React.useState(false);
  const menos = useMenosMovimento();
  const entrada = inicio ?? trecho?.[0] ?? 0;
  const src = perto && fonte < 2 ? `/media/skills/${nome}.${fonte === 0 ? "mp4" : "webm"}` : undefined;
  const imagem = poster ?? `/media/skills/${nome}.webp`;

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setPerto(true), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !src || menos) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void video.current?.play().catch(() => {});
        else video.current?.pause();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src, menos]);

  const voltar = (v: HTMLVideoElement) => {
    v.currentTime = trecho?.[0] ?? 0;
    void v.play().catch(() => {});
  };

  return (
    <div
      ref={ref}
      role="img"
      aria-label={alt}
      data-video={nome}
      data-pintou={pintou}
      data-fonte={fonte}
      style={{ aspectRatio: proporcao }}
      className={cx("relative w-full overflow-hidden rounded-tile bg-casa-tile-2", className)}
    >
      <img src={imagem} alt="" className="absolute inset-0 size-full object-cover" />
      {src ? (
        <video
          ref={video}
          src={src}
          aria-hidden="true"
          poster={imagem}
          playsInline
          muted
          loop={!trecho}
          preload={menos ? "none" : "metadata"}
          controls={menos}
          onLoadedMetadata={(e) => {
            if (entrada) e.currentTarget.currentTime = entrada;
          }}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (trecho && v.currentTime >= trecho[1]) voltar(v);
            else if (!pintou && !v.seeking && v.currentTime >= entrada) setPintou(true);
          }}
          onEnded={(e) => voltar(e.currentTarget)}
          onError={() => {
            setPintou(false);
            setFonte((f) => f + 1);
          }}
          className={cx("absolute inset-0 size-full object-cover", ANIMA_OPACIDADE, pintou || menos ? "opacity-100" : "opacity-0")}
        />
      ) : null}
    </div>
  );
}
