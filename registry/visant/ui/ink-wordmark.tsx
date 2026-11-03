"use client";

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Ink Wordmark — a assinatura de ponta a ponta que condensa da fumaça.
 *
 * Colhido do fecho da página de um cliente (2026-10), onde o nome gigante fecha o
 * site. A peça é só um SVG com um filtro: `feTurbulence` → `feDisplacementMap`
 * → `feGaussianBlur`. Nada de canvas, nada de WebGL — por isso dá pra pôr no
 * rodapé de qualquer página sem gastar contexto de GPU.
 *
 * Três movimentos, cada um com um dono:
 *
 * 1. **Scroll condensa.** Longe, a marca é fumaça (deslocamento ~35, desfoque
 *    4.5); ao chegar no fim do bloco ela assenta em tinta (deslocamento 1.2,
 *    desfoque 0). O 1.2 final não é zero de propósito: sobra uma borda de tinta
 *    que sangrou no papel, e é ela que separa isto de um `<svg>` chapado.
 * 2. **A tinta respira.** A frequência da turbulência oscila num ciclo de ~25s.
 *    Mais rápido que isso lê como tremedeira, não como tinta.
 * 3. **O ponteiro agita.** A velocidade do ponteiro vira energia que decai a
 *    cada quadro (×0.94): mexeu, a tinta revolve; parou, ela assenta sozinha.
 *
 * A cor é `currentColor`. Quem decide é a classe de texto de quem usa.
 *
 * ── Marca escrita por prop ──────────────────────────────────────────────────
 *
 * Quem não tem o logo em contorno escreve a marca com `text` e escolhe a voz:
 * `font` (display, sans, mono, manrope ou qualquer família CSS), `weight`,
 * `textCase`, `tracking`, `mark` (o ® ou ™ pequeno no alto) e `underline` (o
 * traço de pincel embaixo). O `viewBox` se ajusta à caixa real do texto depois
 * que a fonte carrega, então a marca encosta nas bordas em qualquer família,
 * sem número mágico de largura. `path` e `children` continuam valendo e têm
 * precedência sobre `text`.
 *
 * ── Seis efeitos, um caminho só ─────────────────────────────────────────────
 *
 * `fx` troca o que a tinta faz enquanto condensa; o progresso, a respiração e o
 * ponteiro continuam sendo os mesmos. `tinta` é a fumaça original, `escorrer`
 * desloca só na vertical, `fatias` corta em tiras horizontais, `gota` funde as
 * letras (desfoque com limiar), `grao` nasce de pó (ruído fino como máscara) e
 * `neon` assenta com halo na cor da marca. Todos usam só primitivas de `<filter>`,
 * sem canvas. Cada um deixa um resíduo próprio na marca assentada (`resto`): sem
 * isso, seis efeitos terminariam na mesma palavra chapada, e a diferença só
 * existiria durante a transição. Todos terminam legíveis.
 *
 * `prefers-reduced-motion`: a marca nasce assentada (opacidade 1, deslocamento
 * 1.2, sem desfoque) e o laço de quadros nem começa.
 */

export type InkWordmarkFx = "tinta" | "escorrer" | "fatias" | "gota" | "grao" | "neon";

/**
 * Parâmetros de cada efeito. `freq` é a frequência da turbulência em x e y,
 * `abre` quanto ela cresce enquanto é fumaça, `eixo` por onde o deslocamento
 * anda, `forca` multiplica a fumaça, `veu` é o desfoque máximo e `resto` o
 * deslocamento que sobra com a marca assentada.
 */
const FX: Record<InkWordmarkFx, { freq: [number, number]; abre: number; eixo: "xy" | "x" | "y"; forca: number; veu: number; resto: number }> = {
  tinta: { freq: [0.018, 0.029], abre: 0.02, eixo: "xy", forca: 1, veu: 4.5, resto: 1.2 },
  escorrer: { freq: [0.05, 0.0018], abre: 0, eixo: "y", forca: 3.6, veu: 1, resto: 9 },
  fatias: { freq: [0.0006, 0.09], abre: 0, eixo: "x", forca: 4, veu: 0, resto: 11 },
  gota: { freq: [0.01, 0.014], abre: 0.006, eixo: "xy", forca: 0.8, veu: 9, resto: 3 },
  grao: { freq: [0.85, 0.85], abre: 0, eixo: "xy", forca: 0.25, veu: 0, resto: 1.2 },
  neon: { freq: [0.012, 0.02], abre: 0.012, eixo: "xy", forca: 0.5, veu: 3, resto: 0.6 },
};

export interface InkWordmarkProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** `d` de um path único (a marca convertida em contorno). Use com `viewBox`. */
  path?: string;
  /** `viewBox` do SVG. Obrigatório com `path`; com `children` também é o que dá a proporção. */
  viewBox?: string;
  /**
   * Conteúdo SVG livre no lugar do `path` — vários paths, um `<text>`. O filtro
   * desloca qualquer coisa que pinte, inclusive texto vivo.
   */
  children?: React.ReactNode;
  /** A marca escrita, em texto vivo. Ignorado quando há `path` ou `children`. */
  text?: string;
  /** Sinal pequeno no alto, depois do texto: "®", "™". */
  mark?: string;
  /** Família do `text`: token da casa ou qualquer valor de `font-family`. */
  font?: "display" | "sans" | "mono" | "manrope" | (string & {});
  /** Peso do `text`, 100 a 900. */
  weight?: number;
  /** Caixa do `text`. */
  textCase?: "upper" | "lower" | "as-is";
  /** Espaço entre letras do `text`, em em. Negativo aperta. */
  tracking?: number;
  /** Traço de pincel embaixo do `text`. */
  underline?: boolean;
  /** O que a tinta faz ao condensar. Ver a nota do cabeçalho. */
  fx?: InkWordmarkFx;
  /** Nome acessível da marca. Sem ele o SVG é só desenho para o leitor de tela. */
  "aria-label": string;
  /** Deslocamento máximo, em unidades do `viewBox`, quando a marca ainda é fumaça. */
  smoke?: number;
  /**
   * Contêiner que rola, se não for a janela. Layout com rolagem num `div`
   * (painel, modal, vitrine) precisa disto, senão o progresso nunca anda.
   */
  container?: React.RefObject<HTMLElement | null>;
  /**
   * Progresso 0..1 vindo de fora (timeline própria, palco sem rolagem, intro).
   * Quando passado, substitui a rolagem: 0 é fumaça, 1 é tinta assentada.
   */
  progress?: MotionValue<number> | number;
}

const FONTES: Record<string, string> = {
  display: "var(--font-display, inherit)",
  sans: "var(--font-sans, inherit)",
  mono: "var(--font-mono, ui-monospace, monospace)",
  manrope: "'Manrope Variable', 'Manrope', var(--font-sans, sans-serif)",
};

export function InkWordmark({
  path,
  viewBox: viewBoxProp,
  children,
  text,
  mark,
  font = "display",
  weight = 600,
  textCase = "as-is",
  tracking = -0.03,
  underline = false,
  fx = "tinta",
  "aria-label": ariaLabel,
  smoke = 34,
  container,
  progress,
  className,
  onPointerMove,
  onPointerLeave,
  ...props
}: InkWordmarkProps) {
  // id único por instância: dois filtros com o mesmo id no DOM e um apaga o outro.
  const filterId = `tinta-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const ref = React.useRef<HTMLDivElement>(null);
  const turb = React.useRef<SVGFETurbulenceElement>(null);
  const desl = React.useRef<SVGFEDisplacementMapElement>(null);
  const desfoque = React.useRef<SVGFEGaussianBlurElement>(null);
  const limiar = React.useRef<SVGFEColorMatrixElement>(null);
  const halo = React.useRef<SVGFEGaussianBlurElement>(null);
  const energia = React.useRef(0);
  const ultimo = React.useRef<{ x: number; y: number } | null>(null);
  const reduce = useReducedMotion() ?? false;
  const [visivel, setVisivel] = React.useState(false);

  // Modo texto: o viewBox nasce largo e depois encosta na caixa real do texto.
  const modoTexto = !path && !children && !!text;
  const escrito = React.useRef<SVGTextElement>(null);
  const [caixa, setCaixa] = React.useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const conteudo =
    textCase === "upper" ? text?.toUpperCase() : textCase === "lower" ? text?.toLowerCase() : text;

  React.useEffect(() => {
    if (!modoTexto) return;
    let vivo = true;
    const medir = () => {
      const t = escrito.current;
      if (!vivo || !t) return;
      const b = t.getBBox();
      if (b.width) setCaixa({ x: b.x, y: b.y, w: b.width, h: b.height });
    };
    medir();
    // A fonte pode chegar depois do primeiro quadro, e aí a caixa muda.
    document.fonts?.ready.then(medir).catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [modoTexto, conteudo, mark, font, weight, tracking]);

  // O traço nasce da caixa do texto: 8% pra dentro de cada ponta, logo abaixo da base.
  const traco =
    modoTexto && underline && caixa
      ? (() => {
          const x0 = caixa.x + caixa.w * 0.08;
          const x1 = caixa.x + caixa.w * 0.92;
          const y = caixa.y + caixa.h + 34;
          const w = x1 - x0;
          return `M${x0.toFixed(0)} ${y.toFixed(0)} C ${(x0 + w * 0.3).toFixed(0)} ${(y - 30).toFixed(0)}, ${(x0 + w * 0.55).toFixed(0)} ${(y + 34).toFixed(0)}, ${x1.toFixed(0)} ${(y - 12).toFixed(0)}`;
        })()
      : null;

  const viewBox =
    viewBoxProp ??
    (modoTexto && caixa
      ? (() => {
          // Folga em volta: o deslocamento da fumaça empurra a tinta pra fora.
          const fx = caixa.w * 0.05;
          const fy = caixa.h * 0.14;
          const baixo = underline ? 70 : 0;
          return `${(caixa.x - fx).toFixed(1)} ${(caixa.y - fy).toFixed(1)} ${(caixa.w + fx * 2).toFixed(1)} ${(caixa.h + fy * 2 + baixo).toFixed(1)}`;
        })()
      : "0 0 1000 300");

  const { scrollYProgress } = useScroll({
    target: ref,
    container,
    offset: ["start end", "end end"],
  });
  // A mola não é só suavização. Ligado direto no `style`, o `useScroll` pode ser
  // promovido a ScrollTimeline nativo, e o nativo mede o alcance do `offset` de
  // outro jeito: a opacidade chegava a 1 antes da marca entrar na tela. Passar
  // por `useSpring` força o cálculo em JS, que respeita o offset pedido.
  // Progresso externo tem precedência; número vira MotionValue para a mesma mola.
  const fixo = useMotionValue(typeof progress === "number" ? progress : 0);
  React.useEffect(() => {
    if (typeof progress === "number") fixo.set(progress);
  }, [progress, fixo]);
  const fonte = progress === undefined ? scrollYProgress : typeof progress === "number" ? fixo : progress;
  const prog = useSpring(fonte, { stiffness: 90, damping: 28, restDelta: 0.0005 });
  const opacity = useTransform(prog, [0, 0.55], reduce ? [1, 1] : [0, 1]);

  // O laço de quadros só existe com a marca perto da tela. `requestAnimationFrame`
  // já para sozinho com a aba escondida, então o observer cobre o outro caso.
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisivel(e.isIntersecting), {
      rootMargin: "200px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    if (!visivel || reduce) return;
    let raf = 0;
    const t0 = performance.now();
    const quadro = (agora: number) => {
      raf = requestAnimationFrame(quadro);
      if (!turb.current || !desl.current || !desfoque.current) return;
      energia.current *= 0.94;
      // fumaça: 1 longe, 0 quando a marca já assentou (aos 85% do percurso)
      const fumaca = 1 - Math.min(1, Math.max(0, prog.get() / 0.85));
      const s = (agora - t0) / 1000;
      const p = FX[fx];
      // A turbulência também abre um pouco enquanto é fumaça: grão maior lê
      // como vapor, grão fino lê como borda de tinta.
      const onda = 1 + Math.sin(s * 0.25) * 0.2;
      const fx0 = p.freq[0] * onda + fumaca * p.abre;
      const fy0 = p.freq[1] * onda + fumaca * p.abre * 1.6;
      // setAttribute direto, fora do React: re-render a 60fps por causa de três
      // atributos de filtro seria o componente inteiro reconciliado à toa.
      turb.current.setAttribute("baseFrequency", `${fx0.toFixed(4)} ${fy0.toFixed(4)}`);
      desl.current.setAttribute("scale", (p.resto + fumaca * smoke * p.forca + energia.current * 9).toFixed(2));
      // `gota` nunca zera o desfoque: é ele, com o limiar, que arredonda a letra.
      desfoque.current.setAttribute("stdDeviation", (fumaca * p.veu + (fx === "gota" ? 3.4 : 0)).toFixed(2));
      if (limiar.current) {
        // `grao`: o limiar do ruído sobe com a fumaça, e a marca se desfaz em pó.
        // O teto fica abaixo do total de propósito: sobra o pontilhado de tinta gasta.
        const corte = -2.4 + 3.4 * (1 - fumaca);
        limiar.current.setAttribute("values", `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  14 0 0 0 ${(-7 + corte).toFixed(2)}`);
      }
      // `neon`: o halo abre longe e assenta curto, sem nunca apagar.
      if (halo.current) halo.current.setAttribute("stdDeviation", (11 + fumaca * 22).toFixed(2));
    };
    raf = requestAnimationFrame(quadro);
    return () => cancelAnimationFrame(raf);
  }, [visivel, reduce, prog, smoke, fx]);

  const mover = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e);
    const p = { x: e.clientX, y: e.clientY };
    if (ultimo.current) {
      // 140px de deslocamento entre dois eventos = energia cheia. Um gesto
      // calmo agita pouco; só o rápido revolve a tinta inteira.
      const v = Math.hypot(p.x - ultimo.current.x, p.y - ultimo.current.y);
      energia.current = Math.min(1, energia.current + v / 140);
    }
    ultimo.current = p;
  };

  return (
    <div
      ref={ref}
      onPointerMove={mover}
      onPointerLeave={(e) => {
        onPointerLeave?.(e);
        ultimo.current = null;
      }}
      className={cn("overflow-hidden", className)}
      {...props}
    >
      <motion.svg
        viewBox={viewBox}
        role="img"
        aria-label={ariaLabel}
        className="block h-auto w-full overflow-visible"
        style={{ opacity }}
      >
        <defs>
          {/* Região folgada: o deslocamento empurra a tinta para fora da caixa
              do desenho, e o filtro recorta tudo que passar da região. */}
          <filter id={filterId} x="-15%" y="-40%" width="130%" height="180%" colorInterpolationFilters="sRGB">
            <feTurbulence
              ref={turb}
              type="fractalNoise"
              baseFrequency={`${FX[fx].freq[0]} ${FX[fx].freq[1]}`}
              numOctaves={fx === "fatias" ? 1 : 2}
              seed={7}
              result="ruido"
            />
            {/* Eixo único: o outro canal vira 0,5, que é deslocamento nenhum. */}
            {FX[fx].eixo !== "xy" ? (
              <feColorMatrix
                in="ruido"
                type="matrix"
                values={
                  FX[fx].eixo === "y"
                    ? "0 0 0 0 0.5  0 1.6 0 0 -0.3  0 0 1 0 0  0 0 0 0 1"
                    : "1.6 0 0 0 -0.3  0 0 0 0 0.5  0 0 1 0 0  0 0 0 0 1"
                }
                result="ruido"
              />
            ) : null}
            <feDisplacementMap
              ref={desl}
              in="SourceGraphic"
              in2="ruido"
              scale={reduce ? FX[fx].resto : FX[fx].resto + smoke * FX[fx].forca}
              xChannelSelector="R"
              yChannelSelector="G"
              result="tinta"
            />
            <feGaussianBlur
              ref={desfoque}
              in="tinta"
              stdDeviation={fx === "gota" ? 3.4 : reduce ? 0 : FX[fx].veu}
              result="veu"
            />
            {/* `gota`: alfa com ganho alto vira borda dura; letras próximas se fundem. */}
            {fx === "gota" ? (
              <feColorMatrix in="veu" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 14 -6" />
            ) : null}
            {/* `grao`: ruído fino com limiar vira máscara; ela fecha conforme assenta. */}
            {fx === "grao" ? (
              <>
                <feColorMatrix
                  ref={limiar}
                  in="ruido"
                  type="matrix"
                  values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  14 0 0 0 -6"
                  result="mascara"
                />
                <feComposite in="veu" in2="mascara" operator="in" />
              </>
            ) : null}
            {/* `neon`: a marca nítida por cima de um halo na cor da marca (forma, não texto). */}
            {fx === "neon" ? (
              <>
                <feGaussianBlur ref={halo} in="veu" stdDeviation={reduce ? 11 : 33} result="largo" />
                <feFlood style={{ floodColor: "var(--brand, currentColor)" }} result="cor" />
                <feComposite in="cor" in2="largo" operator="in" result="brilho" />
                <feMerge>
                  <feMergeNode in="brilho" />
                  <feMergeNode in="brilho" />
                  <feMergeNode in="veu" />
                </feMerge>
              </>
            ) : null}
          </filter>
        </defs>
        <g fill="currentColor" filter={`url(#${filterId})`}>
          {children ??
            (path ? (
              <path d={path} fillRule="evenodd" clipRule="evenodd" />
            ) : modoTexto ? (
              <>
                <text
                  ref={escrito}
                  x="500"
                  y="190"
                  textAnchor="middle"
                  fontSize="200"
                  fontWeight={weight}
                  letterSpacing={`${tracking}em`}
                  style={{ fontFamily: FONTES[font] ?? font }}
                >
                  {conteudo}
                  {mark ? (
                    <tspan fontSize="0.32em" dx="0.1em" dy="-1.5em" fontWeight={Math.min(weight, 600)}>
                      {mark}
                    </tspan>
                  ) : null}
                </text>
                {traco ? (
                  <path d={traco} fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
                ) : null}
              </>
            ) : null)}
        </g>
      </motion.svg>
    </div>
  );
}
