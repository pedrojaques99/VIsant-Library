"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { EASE_DRAWER } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Page Curl — a revista que se folheia pelo canto.
 *
 * Catálogo, cardápio e anuário em PDF são lidos com a barra de rolagem. Papel
 * é lido pela ponta do dedo. Quando o produto do cliente é editorial, virar a
 * página É a experiência, e um carrossel com setas apaga justamente isso.
 *
 * ── O que se vê, e o que reage a quê ───────────────────────────────────────
 *
 * - Fechada: só a capa, centrada. Virou a capa, o livro desliza até a lombada
 *   ficar no meio e fica ABERTO, com duas páginas (verso da folha virada à
 *   esquerda, a seguinte à direita). Onde duas páginas não cabem na largura da
 *   frase cheia, o livro aberto encolhe por escala: a capa continua grande.
 * - Em repouso: o canto inferior direito levanta só um pouco quando o ponteiro
 *   chega perto (convite, não enfeite).
 * - Arrastando a metade direita: o canto segue o dedo. A parte dobrada mostra o
 *   verso do papel e, por baixo, já aparece a próxima página. A dobra projeta
 *   sombra na página de baixo.
 * - Soltou além do meio, ou com um peteleco para a esquerda: a página termina
 *   de virar. Antes do meio: volta para o lugar. As duas continuam a mesma curva
 *   de onde a mão largou.
 * - Setas do teclado, os botões e o peteleco fazem a mesma virada animada;
 *   voltar é a mesma curva tocada ao contrário.
 * - **A virada é um arco, não um trilho.** O canto levanta enquanto atravessa
 *   (`curvaDaVirada`). Com o canto preso à base, a linha de dobra ficava sempre
 *   vertical: a página não virava, uma faixa cinza varria a folha.
 *
 * ── Decisões que não são óbvias ────────────────────────────────────────────
 *
 * 1. **A dobra é uma reflexão 2D.** O canto puxado vai a P; a linha de dobra é
 *    a mediatriz entre o canto e P. A frente é a página recortada do lado de
 *    cá da linha; o verso é a mesma caixa recortada do lado de lá e refletida
 *    pela linha. Duas `clip-path` e uma `matrix()`, sem WebGL nem 3D.
 * 2. **O papel está preso na lombada.** P nunca se afasta da borda esquerda
 *    mais do que a página permite (distância à quina de baixo ≤ largura, à de
 *    cima ≤ diagonal). Sem essa trava a página "estica" e a ilusão quebra.
 * 3. **Medida sem escala**: `offsetWidth` para a geometria e o delta do
 *    ponteiro dividido pela escala do palco (a vitrine e muito layout de
 *    cliente escalam a peça).
 * 4. **Geometria escrita direto no DOM**, nunca por estado: o conteúdo das
 *    páginas não re-renderiza a cada quadro da mola.
 * 5. **O volume vem da luz, não de 3D.** A aba tem gradiente próprio (sombra no
 *    vinco, brilho no meio, ponta apagando) e a página de baixo recebe a sombra
 *    da aba logo além do vinco. As paradas são medidas em px a partir da linha
 *    de dobra e recalculadas a cada quadro, então a luz gira com o papel. Some
 *    a lombada afundada e três folhas de miolo na borda, e a revista ganha
 *    corpo sem `perspective` nenhuma, que quebraria a conta do ponteiro.
 * 6. **A folha é uma folha só, frente e verso.** A folha `n` tem a página `2n` na
 *    frente e `2n + 1` no verso, e tudo o que está na tela sai daí. O verso é
 *    desespelhado por dentro, então pousa na esquerda exatamente como a página
 *    que fica ali, e a troca de estado não aparece.
 * 7. **A espessura é sombra dura.** Três `drop-shadow` sem desfoque no invólucro
 *    da aba desenham a borda do papel em qualquer ângulo, e a luz em cilindro dos
 *    dois lados do vinco faz a dobra parecer cartão e não seda.
 */

type Ponto = { x: number; y: number };

function cortar(poli: Ponto[], m: Ponto, n: Ponto, fora: boolean): Ponto[] {
  const lado = (p: Ponto) => ((p.x - m.x) * n.x + (p.y - m.y) * n.y) * (fora ? -1 : 1);
  const res: Ponto[] = [];
  for (let i = 0; i < poli.length; i++) {
    const a = poli[i];
    const b = poli[(i + 1) % poli.length];
    const la = lado(a);
    const lb = lado(b);
    if (la <= 0) res.push(a);
    if ((la < 0 && lb > 0) || (la > 0 && lb < 0)) {
      const t = la / (la - lb);
      res.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return res;
}

const poligono = (ps: Ponto[]) =>
  ps.length < 3 ? "polygon(0 0, 0 0, 0 0)" : `polygon(${ps.map((p) => `${p.x}px ${p.y}px`).join(",")})`;

/**
 * Um `linear-gradient` cujas paradas são medidas em px a partir da linha de
 * dobra, na direção `dir`. É o que deixa a luz e a sombra grudadas no vinco
 * enquanto ele gira: o ângulo e as porcentagens saem da geometria do quadro.
 */
function gradienteNaDobra(
  w: number,
  h: number,
  m: Ponto,
  dir: Ponto,
  paradas: [number, string][],
): string {
  const ang = Math.atan2(dir.x, -dir.y);
  const L = Math.abs(w * Math.sin(ang)) + Math.abs(h * Math.cos(ang)) || 1;
  const s0 = { x: w / 2 - (dir.x * L) / 2, y: h / 2 - (dir.y * L) / 2 };
  const t0 = (m.x - s0.x) * dir.x + (m.y - s0.y) * dir.y;
  const lista = paradas
    .map(([px, cor]) => `${cor} ${(((t0 + px) / L) * 100).toFixed(2)}%`)
    .join(",");
  return `linear-gradient(${((ang * 180) / Math.PI).toFixed(2)}deg,${lista})`;
}

/** Luz do verso: sombra colada no vinco e papel quase chapado. Brilho forte lia como metal. */
const LUZ_VERSO: [number, string][] = [
  [0, "color-mix(in oklab, black 36%, transparent)"],
  [8, "color-mix(in oklab, black 12%, transparent)"],
  [20, "color-mix(in oklab, white 9%, transparent)"],
  [44, "color-mix(in oklab, white 3%, transparent)"],
  [220, "color-mix(in oklab, black 8%, transparent)"],
];

/** O outro lado do vinco: a frente da folha já começa a subir antes da dobra. */
const LUZ_FRENTE: [number, string][] = [
  [0, "color-mix(in oklab, black 24%, transparent)"],
  [10, "color-mix(in oklab, white 7%, transparent)"],
  [34, "transparent"],
];

/** A sombra que a aba levantada joga na página de baixo, logo além do vinco. */
const SOMBRA_BAIXO: [number, string][] = [
  [0, "color-mix(in oklab, black 34%, transparent)"],
  [18, "color-mix(in oklab, black 12%, transparent)"],
  [56, "transparent"],
];

const MOLA = { type: "spring" as const, stiffness: 240, damping: 30, mass: 0.7 };

/** A virada inteira: longa porque é o gesto da peça, não um controle respondendo. */
// Virar página é gesto de objeto: dura o que a folha leva para cair, acima do teto de UI.
const VIRADA_S = 0.62;
const VIRADA = { duration: VIRADA_S, ease: EASE_DRAWER };
/** Quanto o canto sobe no meio da virada, em fração da altura da folha. */
const ARCO = 0.26;

export interface PageCurlProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** As páginas, na ordem. Cada uma preenche a folha inteira. */
  pages: React.ReactNode[];
  /** Página inicial (base 0). O livro abre na dupla que contém essa página. */
  defaultIndex?: number;
  /** Avisa a primeira página à vista (base 0) depois de cada virada. */
  onIndexChange?: (index: number) => void;
  /** Quanto o canto levanta com o ponteiro perto, em px. */
  peek?: number;
  /** Rótulo da revista para leitor de tela. */
  label?: string;
  /** Largura de uma folha em px; aberto, o livro mede o dobro. A altura segue 3:4. Sem valor, 240px. */
  width?: number;
}

export function PageCurl({
  pages,
  defaultIndex = 0,
  onIndexChange,
  peek = 22,
  label = "Revista",
  width,
  className,
  ...props
}: PageCurlProps) {
  const reduzir = useReducedMotion();
  const larguraFolha = width ?? 240;
  const total = pages.length;
  // Vista 0 é a capa; a vista `v` mostra as páginas `2v - 1` e `2v`.
  const ultimaVista = Math.floor(total / 2);
  const vistaInicial = Math.max(0, Math.min(ultimaVista, Math.ceil(defaultIndex / 2)));
  const [vista, setVista] = React.useState(vistaInicial);
  // A folha que curva. Na volta é a anterior, que entra virada por cima.
  const [folhaAtual, setFolhaAtual] = React.useState(vistaInicial);
  const vistaRef = React.useRef(vistaInicial);
  const folhaRef = React.useRef(vistaInicial);
  const ocupado = React.useRef(false);
  // Escala do livro fechado e do aberto, pra caber na largura que ele tem.
  const [caber, setCaber] = React.useState({ fechado: 1, aberto: 1 });
  const caberRef = React.useRef(caber);

  const raiz = React.useRef<HTMLDivElement>(null);
  const folha = React.useRef<HTMLDivElement>(null);
  const frente = React.useRef<HTMLDivElement>(null);
  const dobraFrente = React.useRef<HTMLDivElement>(null);
  const verso = React.useRef<HTMLDivElement>(null);
  const luzVerso = React.useRef<HTMLDivElement>(null);
  const sombra = React.useRef<HTMLDivElement>(null);
  const sombraEsq = React.useRef<HTMLDivElement>(null);
  const miolosEsq = React.useRef<HTMLDivElement>(null);
  const lombadaEsq = React.useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const dims = React.useRef({ w: 0, h: 0 });

  const desenhar = React.useCallback(() => {
    const f = frente.current;
    const v = verso.current;
    if (!f || !v) return;
    const { w, h } = dims.current;
    const c = { x: w, y: h };
    const p = { x: px.get(), y: py.get() };
    const dist = Math.hypot(c.x - p.x, c.y - p.y);
    const sb = sombra.current;
    const prog = w ? Math.max(0, Math.min(1, (w - p.x) / (2 * w))) : 0;
    // O livro abre junto com a capa: desliza até a lombada ficar no meio.
    const t = Math.max(0, Math.min(1, (prog - 0.05) / 0.9));
    const abre = folhaRef.current > 0 ? 1 : t * t * (3 - 2 * t);
    const { fechado, aberto } = caberRef.current;
    const escalaLivro = fechado + (aberto - fechado) * abre;
    if (folha.current) {
      folha.current.style.transform = `translateX(${((abre * w) / 2) * escalaLivro}px) scale(${escalaLivro})`;
    }
    if (miolosEsq.current) miolosEsq.current.style.opacity = String(abre);
    if (lombadaEsq.current) lombadaEsq.current.style.opacity = String(abre);
    if (sombraEsq.current) sombraEsq.current.style.opacity = String(Math.sin(Math.PI * prog));
    if (dist < 0.5) {
      f.style.clipPath = "";
      v.style.visibility = "hidden";
      if (sb) sb.style.visibility = "hidden";
      if (dobraFrente.current) dobraFrente.current.style.backgroundImage = "none";
      return;
    }
    const m = { x: (c.x + p.x) / 2, y: (c.y + p.y) / 2 };
    const n = { x: (c.x - p.x) / dist, y: (c.y - p.y) / dist };
    const caixa = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ];
    f.style.clipPath = poligono(cortar(caixa, m, n, false));
    v.style.clipPath = poligono(cortar(caixa, m, n, true));
    const k = m.x * n.x + m.y * n.y;
    v.style.transform = `matrix(${1 - 2 * n.x * n.x},${-2 * n.x * n.y},${-2 * n.x * n.y},${
      1 - 2 * n.y * n.y
    },${2 * k * n.x},${2 * k * n.y})`;
    v.style.visibility = "visible";
    // O verso é pintado no espaço de ANTES da reflexão: ali a aba fica do lado
    // do canto (`+n`), e a matriz leva luz e sombra junto com ela.
    if (luzVerso.current) luzVerso.current.style.backgroundImage = gradienteNaDobra(w, h, m, n, LUZ_VERSO);
    if (dobraFrente.current) {
      dobraFrente.current.style.backgroundImage = gradienteNaDobra(w, h, m, { x: -n.x, y: -n.y }, LUZ_FRENTE);
    }
    if (sb) {
      sb.style.clipPath = v.style.clipPath;
      sb.style.backgroundImage = gradienteNaDobra(w, h, m, n, SOMBRA_BAIXO);
      sb.style.visibility = "visible";
    }
  }, [px, py]);

  const medir = React.useCallback(() => {
    const el = folha.current;
    if (!el) return;
    dims.current = { w: el.offsetWidth, h: el.offsetHeight };
    // `clientWidth` é medida local: a escala do palco não entra na conta. Os 16px
    // são as folhas de miolo que aparecem dos dois lados.
    const util = (raiz.current?.clientWidth ?? 0) - 16;
    const novo =
      util > 0 && el.offsetWidth
        ? { fechado: Math.min(1, util / el.offsetWidth), aberto: Math.min(1, util / (2 * el.offsetWidth)) }
        : { fechado: 1, aberto: 1 };
    if (novo.fechado !== caberRef.current.fechado || novo.aberto !== caberRef.current.aberto) {
      caberRef.current = novo;
      setCaber(novo);
    }
  }, []);

  React.useLayoutEffect(() => {
    medir();
    px.set(dims.current.w);
    py.set(dims.current.h);
    const a = px.on("change", desenhar);
    const b = py.on("change", desenhar);
    const ro = new ResizeObserver(() => {
      medir();
      if (!ocupado.current) {
        px.set(dims.current.w);
        py.set(dims.current.h);
      }
      desenhar();
    });
    if (folha.current) ro.observe(folha.current);
    if (raiz.current) ro.observe(raiz.current);
    desenhar();
    return () => {
      a();
      b();
      ro.disconnect();
    };
  }, [px, py, desenhar, medir]);

  /** Prende o canto à lombada, como papel de verdade. */
  const prender = (p: Ponto): Ponto => {
    const { w, h } = dims.current;
    let q = p;
    const d1 = Math.hypot(q.x, q.y - h);
    if (d1 > w) q = { x: (q.x / d1) * w, y: h + ((q.y - h) / d1) * w };
    const diag = Math.hypot(w, h);
    const d2 = Math.hypot(q.x, q.y);
    if (d2 > diag) q = { x: (q.x / d2) * diag, y: (q.y / d2) * diag };
    return q;
  };

  const ir = (alvo: Ponto, instantaneo = false) => {
    if (reduzir || instantaneo) {
      px.set(alvo.x);
      py.set(alvo.y);
      return Promise.resolve();
    }
    return Promise.all([animate(px, alvo.x, MOLA), animate(py, alvo.y, MOLA)]).then(() => {});
  };

  const fechado = () => ({ x: dims.current.w, y: dims.current.h });

  /** O canto em `prog` (0 fechada, 1 virada), somado ao desvio `dy` da mão. */
  const curvaDaVirada = (prog: number, dy = 0): Ponto => {
    const { w, h } = dims.current;
    return prender({ x: w - 2 * w * prog, y: h - h * ARCO * Math.sin(Math.PI * prog) + dy });
  };
  const progDe = (x: number) => Math.max(0, Math.min(1, (dims.current.w - x) / (2 * dims.current.w)));

  /** Toca a curva de onde o canto está até `ate`. A mão pode ter largado fora dela. */
  const virar = (ate: 0 | 1) => {
    const de = progDe(px.get());
    const { w, h } = dims.current;
    if (reduzir) {
      px.set(ate === 1 ? -w : w);
      py.set(h);
      return Promise.resolve();
    }
    const dy0 = py.get() - (h - h * ARCO * Math.sin(Math.PI * de));
    px.stop();
    py.stop();
    const parte = Math.abs(ate - de);
    return animate(0, 1, {
      ...VIRADA,
      // Volta curta anda em tempo curto; a ida inteira é `VIRADA.duration`.
      duration: Math.max(0.24, VIRADA.duration * parte),
      onUpdate: (t) => {
        const q = curvaDaVirada(de + (ate - de) * t, dy0 * (1 - t));
        px.set(q.x);
        py.set(q.y);
      },
    }).then(() => {
      px.set(ate === 1 ? -w : w);
      py.set(h);
    });
  };

  const assentar = (novo: number) => {
    vistaRef.current = novo;
    folhaRef.current = novo;
    // A troca de folhas precisa estar no DOM ANTES de a dobra desfazer: senão
    // a página velha pisca inteira por um quadro.
    flushSync(() => {
      setVista(novo);
      setFolhaAtual(novo);
    });
    px.set(dims.current.w);
    py.set(dims.current.h);
    desenhar();
    onIndexChange?.(novo === 0 ? 0 : 2 * novo - 1);
  };

  const proxima = async () => {
    const i = vistaRef.current;
    if (ocupado.current || i >= ultimaVista) return;
    ocupado.current = true;
    await virar(1);
    assentar(i + 1);
    ocupado.current = false;
  };

  const anterior = async () => {
    const i = vistaRef.current;
    if (ocupado.current || i <= 0) return;
    ocupado.current = true;
    // A anterior entra virada por cima e desvira até cobrir a atual.
    folhaRef.current = i - 1;
    flushSync(() => setFolhaAtual(i - 1));
    px.set(-dims.current.w);
    py.set(dims.current.h);
    await virar(0);
    assentar(i - 1);
    ocupado.current = false;
  };

  /* Puxar para a direita volta a página, de qualquer ponto da folha. */
  const volta = React.useRef<{ x: number } | null>(null);
  const gesto = React.useRef<{
    x0: number;
    y0: number;
    p0: Ponto;
    escala: number;
    t: number;
    vx: number;
    ux: number;
  } | null>(null);
  /** Alvo do convite de hover: o `pointermove` só reprograma a mola quando ele muda. */
  const convite = React.useRef(false);

  const temProxima = vista < ultimaVista;
  // Numeração impressa: a capa é a 1, a dupla da vista `v` é `2v` e `2v + 1`.
  const paginasVisiveis =
    vista === 0 ? "1" : 2 * vista + 1 <= total ? `${2 * vista}–${2 * vista + 1}` : `${2 * vista}`;

  return (
    <div
      ref={raiz}
      role="group"
      aria-roledescription="revista"
      aria-label={label}
      className={cn("flex w-full flex-col items-center gap-3", className)}
      {...props}
    >
      <div
        className="flex w-full items-center justify-center"
        style={{ height: ((larguraFolha * 4) / 3) * caber.fechado }}
      >
      <div
        ref={folha}
        tabIndex={0}
        aria-label={`${vista === 0 ? "Capa" : `Páginas ${paginasVisiveis}`}, de ${total}. Use as setas para virar.`}
        className={cn(
          "relative isolate aspect-[3/4] shrink-0 touch-pan-y select-none rounded-l-[2px] rounded-r-[var(--r-surface)] bg-card outline-none",
          "[box-shadow:0_1px_2px_color-mix(in_oklab,black_18%,transparent),0_22px_40px_-14px_color-mix(in_oklab,black_50%,transparent)]",
          "focus-visible:[box-shadow:var(--focus)]",
        )}
        style={{ width: larguraFolha }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            void proxima();
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            void anterior();
          }
        }}
        onPointerMove={(e) => {
          const g = gesto.current;
          if (g) {
            const agora = performance.now();
            const dx = (e.clientX - g.x0) / g.escala;
            const dy = (e.clientY - g.y0) / g.escala;
            const dt = Math.max(1, agora - g.t);
            g.vx = (dx - g.ux) / dt;
            g.ux = dx;
            g.t = agora;
            // O arco vale também na mão: arrastar reto para o lado já vira como papel.
            const q = curvaDaVirada(progDe(g.p0.x + dx), g.p0.y + dy - dims.current.h);
            px.set(q.x);
            py.set(q.y);
            return;
          }
          if (ocupado.current || e.pointerType !== "mouse" || !temProxima) return;
          // Convite: o canto só levanta com o ponteiro no quarto de baixo à direita.
          const el = folha.current!;
          const r = el.getBoundingClientRect();
          const escala = r.width / (el.offsetWidth || 1);
          const lx = (e.clientX - r.left) / escala;
          const ly = (e.clientY - r.top) / escala;
          const { w, h } = dims.current;
          const perto = lx > w * 0.6 && ly > h * 0.65;
          if (perto === convite.current) return;
          convite.current = perto;
          void ir(perto ? { x: w - peek, y: h - peek } : fechado());
        }}
        onPointerLeave={() => {
          convite.current = false;
          if (!gesto.current && !ocupado.current) void ir(fechado());
        }}
        // Imagem dentro da peça dispara o arrasto nativo do navegador, que cancela
        // o ponteiro no meio do gesto.
        onDragStart={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          if (e.button !== 0 || ocupado.current) return;
          const el = folha.current!;
          const r = el.getBoundingClientRect();
          const escala = r.width / (el.offsetWidth || 1);
          el.setPointerCapture(e.pointerId);
          volta.current = { x: e.clientX };
          // Na capa só a metade direita pega a folha; a esquerda é a lombada. Com o
          // livro aberto a página da direita inteira pega, e a da esquerda só volta.
          const limite = vistaRef.current > 0 ? 0 : dims.current.w / 2;
          if (!temProxima || (e.clientX - r.left) / escala < limite) return;
          px.stop();
          py.stop();
          gesto.current = {
            x0: e.clientX,
            y0: e.clientY,
            p0: { x: px.get(), y: py.get() },
            escala,
            t: performance.now(),
            vx: 0,
            ux: 0,
          };
        }}
        onPointerUp={async (e) => {
          const g = gesto.current;
          const inicio = volta.current;
          volta.current = null;
          gesto.current = null;
          // Limite em px de tela: dedo é dedo, seja qual for a escala do palco.
          const voltou = !!inicio && e.clientX - inicio.x > 48 && vistaRef.current > 0;
          if (voltou) {
            if (g) {
              ocupado.current = true;
              await virar(0);
              ocupado.current = false;
            }
            await anterior();
            return;
          }
          if (!g) {
            // Da página da esquerda, puxar para a esquerda também vira.
            if (inicio && e.clientX - inicio.x < -48) await proxima();
            return;
          }
          const passou = px.get() < dims.current.w / 2 || g.vx < -0.6;
          ocupado.current = true;
          convite.current = false;
          if (passou) {
            await virar(1);
            assentar(vistaRef.current + 1);
          } else {
            await virar(0);
          }
          ocupado.current = false;
        }}
        onPointerCancel={() => {
          volta.current = null;
          gesto.current = null;
          void ir(fechado());
        }}
      >
        {/* A pega do canto. O gesto da peça é puxar pela quina, e a quina é onde a
            folha não existe: `border-radius` também recorta o alvo do ponteiro,
            então apertar exatamente ali caía fora da folha e nada acontecia. Esta
            área reta, sem raio e passando 16px para fora, entrega o evento à folha
            por bolha, e o mesmo gesto segue valendo. */}
        {temProxima && (
          <div
            aria-hidden
            data-page-curl-pega
            className="absolute -bottom-4 -right-4 z-10 size-20 cursor-grab touch-pan-y active:cursor-grabbing"
          />
        )}
        {/* O miolo: as folhas de baixo aparecendo na borda, como num caderno
            de verdade. Atrás da folha (`-z`) e deslocadas pra direita e pra
            baixo, cada uma um tom mais escura. É o que tira a peça do plano. */}
        {[3, 2, 1].map((k) => (
          <div
            key={k}
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-card"
            style={{
              transform: `translate(${k * 2.5}px, ${k * 1.5}px)`,
              boxShadow: `inset 0 0 0 1px color-mix(in oklab, var(--foreground) ${6 + k * 3}%, transparent)`,
              filter: `brightness(${1 - k * 0.05})`,
            }}
          />
        ))}
        {/* O miolo do lado esquerdo, que só existe com o livro aberto. */}
        <div
          ref={miolosEsq}
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-full -z-10 w-full"
          style={{ opacity: 0 }}
        >
          {[3, 2, 1].map((k) => (
            <div
              key={k}
              className="absolute inset-0 rounded-l-[var(--r-surface)] bg-card"
              style={{
                transform: `translate(${-k * 2.5}px, ${k * 1.5}px)`,
                boxShadow: `inset 0 0 0 1px color-mix(in oklab, var(--foreground) ${6 + k * 3}%, transparent)`,
                filter: `brightness(${1 - k * 0.05})`,
              }}
            />
          ))}
        </div>
        {/* A página da esquerda: o verso da folha que já virou. */}
        {folhaAtual > 0 && (
          <div className="absolute inset-y-0 right-full w-full overflow-hidden rounded-l-[var(--r-surface)] rounded-r-[2px] bg-card [box-shadow:0_22px_40px_-14px_color-mix(in_oklab,black_50%,transparent)]">
            {pages[2 * folhaAtual - 1]}
            <div
              ref={sombraEsq}
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                opacity: 0,
                backgroundImage:
                  "linear-gradient(to left, color-mix(in oklab, black 34%, transparent), color-mix(in oklab, black 10%, transparent) 70%)",
              }}
            />
          </div>
        )}
        <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
          {/* A de baixo: já está ali, só esperando a de cima sair. */}
          {2 * folhaAtual + 2 < total && (
            <div aria-hidden className="absolute inset-0" {...({ inert: "" } as object)}>
              {pages[2 * folhaAtual + 2]}
            </div>
          )}
          {/* A sombra da aba na página de baixo, grudada no vinco. */}
          <div
            ref={sombra}
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ visibility: "hidden" }}
          />
          <div ref={frente} className="absolute inset-0 bg-card">
            {pages[2 * folhaAtual]}
            <div ref={dobraFrente} aria-hidden className="pointer-events-none absolute inset-0" />
          </div>
        </div>
        {/* A aba fica fora do recorte da folha: ela atravessa a lombada e pousa na
            esquerda. A sombra dura é a espessura do papel (nota 7) e a desfocada
            cai sobre as páginas; as duas seguem a forma refletida do verso porque
            o invólucro não tem transformação. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            filter: [
              "drop-shadow(-1.25px 0.75px 0 var(--page-curl-borda))",
              "drop-shadow(-1.25px 0.75px 0 var(--page-curl-borda))",
              "drop-shadow(-1.25px 0.75px 0 var(--page-curl-borda))",
              "drop-shadow(-7px 6px 12px color-mix(in oklab, black 40%, transparent))",
            ].join(" "),
            ["--page-curl-borda" as string]: "color-mix(in oklab, var(--foreground) 34%, var(--card))",
          }}
        >
          <div ref={verso} className="absolute inset-0 origin-top-left" style={{ visibility: "hidden" }} {...({ inert: "" } as object)}>
            {/* Desespelhado por dentro: a reflexão da dobra desfaz este `scaleX`. */}
            <div className="absolute inset-0 -scale-x-100 overflow-hidden rounded-l-[var(--r-surface)] rounded-r-[2px] bg-card">
              {pages[2 * folhaAtual + 1]}
            </div>
            <div ref={luzVerso} className="absolute inset-0 rounded-l-[2px] rounded-r-[var(--r-surface)]" />
          </div>
        </div>
        {/* A lombada: a página afunda na costura. Fica por cima de tudo,
            inclusive do verso, porque a costura não vira com a folha. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in oklab, black 26%, transparent), color-mix(in oklab, black 6%, transparent) 3.5%, color-mix(in oklab, white 7%, transparent) 5%, transparent 12%)",
          }}
        />
        <div
          ref={lombadaEsq}
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-full w-full"
          style={{
            opacity: 0,
            backgroundImage:
              "linear-gradient(to left, color-mix(in oklab, black 22%, transparent), color-mix(in oklab, black 5%, transparent) 3.5%, transparent 10%)",
          }}
        />
      </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void anterior()}
          disabled={vista === 0}
          aria-label="Página anterior"
          className="relative inline-flex size-8 pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5 items-center justify-center rounded-[var(--r-control)] text-foreground outline-none transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-muted focus-visible:[box-shadow:var(--focus)] disabled:text-muted-foreground disabled:hover:bg-transparent"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <span aria-live="polite" className="min-w-24 text-center text-sm tabular-nums text-foreground">
          {paginasVisiveis} <span className="text-muted-foreground">de {total}</span>
        </span>
        <button
          type="button"
          onClick={() => void proxima()}
          disabled={!temProxima}
          aria-label="Próxima página"
          className="relative inline-flex size-8 pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5 items-center justify-center rounded-[var(--r-control)] text-foreground outline-none transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-muted focus-visible:[box-shadow:var(--focus)] disabled:text-muted-foreground disabled:hover:bg-transparent"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
