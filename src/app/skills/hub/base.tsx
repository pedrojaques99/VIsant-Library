"use client";

/**
 * As primitivas de /skills, desenhadas primeiro em 390x844 com toque.
 *
 * A regra da página: ao nascer, cada dobra é o nome da skill e a demo já em ação.
 * Explicação só quando a pessoa pede, numa folha que passa POR CIMA do rodapé e
 * nunca empurra a demo. Toda ação mede 44px e nenhuma depende de hover.
 */

import * as React from "react";
import { motion } from "motion/react";
import { CircleHelp, X } from "lucide-react";
import { redeLenta } from "@/lib/rede";
import skills from "../skills.generated.json";

import { FUNCAO } from "../filme/roteiro";
export { ALTURA_DOBRA, ALTURA_LARGA, PaginaCtx, useLargo } from "./nucleo";
import { ALTURA_LARGA, PaginaCtx } from "./nucleo";

export { FUNCAO };
export const SKILLS = skills as { nome: string; instalar: string }[];

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
  return React.useMemo(() => ({ depois, limpar }), [depois, limpar]);
}

/** Está na tela agora? As demos que giram sozinhas só giram enquanto vistas. */
export function useNaTela<T extends Element>(limiar = 0.4) {
  const ref = React.useRef<T>(null);
  const [naTela, setNaTela] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNaTela(e.isIntersecting), { threshold: limiar });
    io.observe(el);
    return () => io.disconnect();
  }, [limiar]);
  return [ref, naTela] as const;
}

/** Roda uma vez, na primeira vez que a demo entra em vista. */
export function useAoEntrar<T extends Element>(fn: () => void, limiar = 0.4) {
  const [ref, naTela] = useNaTela<T>(limiar);
  const feito = React.useRef(false);
  const atual = React.useRef(fn);
  atual.current = fn;
  React.useEffect(() => {
    if (!naTela || feito.current) return;
    feito.current = true;
    atual.current();
  }, [naTela]);
  return ref;
}

/* ---- a página: qual folha está aberta e o instalador ---- */

/** A ação da dobra. Uma por demo, 44px. */
export function Acao({
  className,
  children,
  secundaria,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { secundaria?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-control px-5 text-casa-base font-medium outline-none",
        secundaria ? "bg-casa-tile-2 text-casa-fg" : "bg-casa-cta text-casa-cta-fg",
        "transition-[transform,opacity] [transition-duration:var(--dur-press)] [transition-timing-function:var(--ease-out)]",
        "active:scale-[0.97] focus-visible:[box-shadow:var(--focus)] disabled:pointer-events-none",
        className,
      )}
    >
      {children}
    </button>
  );
}

/**
 * A dobra. Título numa linha e a demo. A explicação abre numa folha fixa acima do
 * rodapé: a dobra sobe para o topo e a demo continua à vista atrás dela.
 */
export function Dobra({
  nome,
  como,
  faixa,
  children,
}: {
  nome: string;
  como: React.ReactNode;
  faixa?: boolean;
  children: React.ReactNode;
}) {
  const { aberta, setAberta } = React.useContext(PaginaCtx);
  const aberto = aberta === nome;
  const ref = React.useRef<HTMLElement>(null);
  const folha = React.useRef<HTMLDivElement>(null);
  const [folga, setFolga] = React.useState(0);
  const menos = useMenosMovimento();

  /*
   * Toque fora fecha e não atravessa: a escuta é na captura, antes do alvo. Só a
   * própria demo continua viva por baixo, porque a folha existe pra ser lida com ela.
   */
  React.useEffect(() => {
    if (!aberto) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAberta(null);
    const clique = (e: MouseEvent) => {
      const alvo = e.target as Element;
      if (folha.current?.contains(alvo) || alvo.closest(`[data-como="${nome}"]`)) return;
      if (ref.current?.querySelector("[data-demo]")?.contains(alvo)) return;
      e.preventDefault();
      e.stopPropagation();
      setAberta(null);
    };
    window.addEventListener("keydown", tecla);
    document.addEventListener("click", clique, true);
    return () => {
      window.removeEventListener("keydown", tecla);
      document.removeEventListener("click", clique, true);
    };
  }, [aberto, nome, setAberta]);

  /* A dobra ganha folga do tamanho da folha, e a ação da demo sobe pra cima dela. */
  React.useLayoutEffect(() => {
    setFolga(aberto ? (folha.current?.getBoundingClientRect().height ?? 0) + 24 : 0);
  }, [aberto]);
  React.useEffect(() => {
    if (!aberto || !folga) return;
    const demo = ref.current?.querySelector("[data-demo]")?.getBoundingClientRect();
    const topo = folha.current?.getBoundingClientRect().top;
    if (demo && topo && demo.bottom > topo - 24) {
      window.scrollBy({ top: demo.bottom - topo + 24, behavior: menos ? "auto" : "smooth" });
    }
  }, [aberto, folga, menos]);

  return (
    <section ref={ref} id={nome} data-dobra={nome} style={{ paddingBottom: folga }} className={cx("scroll-mt-[3.5rem] border-t border-casa-fg-3 lg:scroll-mt-14", faixa && "bg-casa-tile")}>
      <div className={cx("shell flex min-w-0 flex-col pb-6 lg:pb-8", ALTURA_LARGA)}>
        {/* O nome fica preso no topo enquanto a skill dura: a troca de nome é a divisa. */}
        <header
          data-cabeca-skill
          className={cx(
            "sticky top-[var(--shell-header-h)] z-20 flex items-center justify-between gap-3 py-3 lg:py-4",
            faixa ? "bg-casa-tile" : "bg-casa-bg",
          )}
        >
          <div className="min-w-0">
            <h2 className="truncate text-[clamp(1.75rem,3.5vw,2.75rem)] font-medium leading-tight tracking-[-0.02em]">{nome}</h2>
            {FUNCAO[nome] ? <p className="truncate text-casa-base text-casa-fg-2">{FUNCAO[nome]}</p> : null}
          </div>
          <button
            type="button"
            data-como={nome}
            aria-expanded={aberto}
            aria-label={`Como funciona ${nome}`}
            title="Como funciona"
            onClick={() => {
              setAberta(aberto ? null : nome);
              if (!aberto) ref.current?.scrollIntoView({ block: "start" });
            }}
            className={cx(
              "grid size-11 shrink-0 place-items-center rounded-control outline-none focus-visible:[box-shadow:var(--focus)]",
              ANIMA_COR,
              aberto ? "bg-casa-tile-2 text-casa-fg" : "text-casa-fg-3 hover:text-casa-fg",
            )}
          >
            <CircleHelp className="size-5" />
          </button>
        </header>
        <div className={cx("mt-3 flex min-w-0 flex-1 flex-col", aberto ? "justify-start" : "justify-center")}>{children}</div>
      </div>
      {aberto ? (
        <motion.div
          data-folha={nome}
          role="region"
          aria-label={`Como funciona ${nome}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.base, ease: EASE_OUT }}
          ref={folha}
          className="fixed inset-x-2 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 mx-auto overflow-hidden rounded-tile bg-casa-tile-2 text-casa-base text-casa-fg [box-shadow:var(--casa-shadow)] sm:max-w-lg lg:bottom-20 lg:left-6 lg:right-auto lg:mx-0 lg:w-[26rem]"
        >
          <button
            type="button"
            aria-label="Fechar"
            data-fechar
            onClick={() => setAberta(null)}
            className="absolute right-1 top-1 z-10 grid size-11 place-items-center rounded-control text-casa-fg-2 outline-none focus-visible:[box-shadow:var(--focus)]"
          >
            <X className="size-4" />
          </button>
          <div className="max-h-[32svh] overflow-y-auto overscroll-contain p-4 lg:max-h-[50svh] [&>p:first-child]:pr-8">{como}</div>
        </motion.div>
      ) : null}
    </section>
  );
}

/** Saída de terminal, dentro da folha. Rola por dentro, nunca empurra a página. */
export function Terminal({ children, className, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  return (
    <pre
      {...props}
      className={cx(
        "mt-3 max-w-full overflow-x-auto rounded-control bg-casa-bg p-3 font-casa-mono text-casa-sm text-casa-fg-2",
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
 * se vê é o pôster, nunca o preto do elemento. Webm que não decodifica cai no mp4,
 * e mp4 que falha fica no pôster. Só pede o arquivo perto da tela, só toca visível.
 */
export function Video({
  nome,
  alt,
  className,
  proporcao = "1 / 1",
}: {
  nome: string;
  alt: string;
  className?: string;
  proporcao?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const video = React.useRef<HTMLVideoElement>(null);
  const [perto, setPerto] = React.useState(false);
  const [fonte, setFonte] = React.useState(0);
  const [pintou, setPintou] = React.useState(false);
  /* Sem movimento ou sem rede: o vídeo não desce sozinho, fica o pôster e o play é de quem quiser. */
  const parado = useMenosMovimento() || redeLenta();
  const src = perto && fonte < 2 ? `/media/skills/${nome}.${fonte === 0 ? "mp4" : "webm"}` : undefined;
  const imagem = `/media/skills/${nome}.webp`;

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setPerto(true), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !src || parado) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void video.current?.play().catch(() => {});
        else video.current?.pause();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src, parado]);

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
      <img
        src={imagem}
        alt=""
        style={{ aspectRatio: proporcao }}
        className="block w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.visibility = "hidden";
        }}
      />
      {src ? (
        <video
          ref={video}
          src={src}
          aria-hidden="true"
          poster={imagem}
          playsInline
          muted
          loop
          preload={parado ? "none" : "metadata"}
          controls={parado}
          onTimeUpdate={(e) => {
            if (!pintou && e.currentTarget.currentTime > 0) setPintou(true);
          }}
          onError={() => {
            setPintou(false);
            setFonte((f) => f + 1);
          }}
          className={cx("absolute inset-0 size-full object-cover", ANIMA_OPACIDADE, pintou || parado ? "opacity-100" : "opacity-0")}
        />
      ) : null}
    </div>
  );
}
