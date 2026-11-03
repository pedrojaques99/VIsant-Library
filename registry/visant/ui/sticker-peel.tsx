"use client";

import * as React from "react";
import { animate, useMotionValue, useReducedMotion, useSpring } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Sticker Peel — o adesivo que descola de verdade.
 *
 * Um adesivo parado é só um selo. O que faz a mão querer pegar é o canto
 * levantando quando o ponteiro chega perto: a dobra mostra o verso de papel e
 * promete que aquilo sai da página. Pegou, ele descola inteiro (sombra cresce,
 * a dobra abre mais); soltou, ele cola onde caiu.
 *
 * ── O que se vê, e o que reage a quê ───────────────────────────────────────
 *
 * - Ponteiro em cima: o canto inferior direito dobra uns 14px, e a dobra se
 *   abre na direção do ponteiro. Quanto mais perto do canto, maior a dobra.
 * - Arrastando: a dobra vai a ~25% do lado menor e a sombra sobe de
 *   `--e-raised` para uma sombra longa. Soltou, a dobra fecha em mola.
 * - Teclado: setas movem 8px (Shift, 32px). É o mesmo `onPositionChange`.
 * - Com `peelOff`: um clique (apertar e soltar sem arrastar), Enter ou Espaço
 *   descola o adesivo inteiro: a dobra atravessa a peça devagar, com a luz presa
 *   ao vinco, e só com o verso quase todo à mostra ele se solta, sobe e some. Com
 *   a saída de uma vez, a dobra nem chegava a ser vista. Arrastar continua movendo.
 * - Pegou: o adesivo cresce um pouco e inclina com a velocidade da mão, e assenta
 *   de volta ao soltar. Papel tem peso; um retângulo que só muda de coordenada não.
 *
 * ── Decisões que não são óbvias ────────────────────────────────────────────
 *
 * 1. **A dobra é reflexão, não rotação 3D.** O pedaço dobrado é exatamente o
 *    triângulo do canto refletido pela linha de dobra (a mediatriz entre o
 *    canto e o ponto para onde ele foi puxado). Uma matriz 2D e dois
 *    `clip-path` resolvem, em qualquer forma: círculo, pílula, quadrado. Com
 *    `rotate3d` a dobra só fica certa a 45°.
 * 2. **O verso tem a mesma forma do adesivo** porque é uma cópia da caixa com
 *    o mesmo `radius`. Por isso o raio é prop e não classe: a frente e o verso
 *    precisam concordar.
 * 3. **Medida sem escala.** A vitrine (e muito layout de cliente) escala o
 *    palco. A geometria usa `offsetWidth`, e o ponteiro é trazido para o
 *    espaço local dividindo pela escala e desfazendo a rotação do adesivo.
 * 4. **O arrasto é nosso, não o `drag` do motion**, pelo mesmo motivo: sob
 *    `scale(0.5)` o `drag` andaria o dobro do dedo.
 * 5. **A geometria é escrita direto no DOM** a cada quadro da mola. Passar por
 *    estado do React re-renderizaria o conteúdo do adesivo 60 vezes por
 *    segundo sem mudar nada nele.
 */

type Ponto = { x: number; y: number };

/** Corta um polígono convexo pelo semiplano (p − m)·n ≤ 0 (lado > 0 se `fora`). */
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
 * Um `linear-gradient` medido em px a partir da linha de dobra: a luz acompanha o
 * vinco enquanto ele gira. Mesma conta do `page-curl`.
 */
function luzNoVinco(w: number, h: number, m: Ponto, dir: Ponto): string {
  const ang = Math.atan2(dir.x, -dir.y);
  const L = Math.abs(w * Math.sin(ang)) + Math.abs(h * Math.cos(ang)) || 1;
  const s0 = { x: w / 2 - (dir.x * L) / 2, y: h / 2 - (dir.y * L) / 2 };
  const t0 = (m.x - s0.x) * dir.x + (m.y - s0.y) * dir.y;
  const para = (px: number) => `${(((t0 + px) / L) * 100).toFixed(2)}%`;
  return `linear-gradient(${((ang * 180) / Math.PI).toFixed(2)}deg,color-mix(in oklab, black 24%, transparent) ${para(0)},color-mix(in oklab, black 4%, transparent) ${para(10)},color-mix(in oklab, white 10%, transparent) ${para(28)},transparent ${para(120)})`;
}

// Mola de gesto: chega em ~250ms, sem quicar a ponto de o papel parecer borracha.
const MOLA = { type: "spring" as const, stiffness: 340, damping: 30, mass: 0.6 };
// Mola da mira: a dobra vira para o ponteiro com um atraso curto, sem acompanhar cada tremida.
const MOLA_MIRA = { type: "spring" as const, stiffness: 260, damping: 28 };
/** Inclinação máxima ao arrastar, em graus. */
const INCLINA = 6;

/** Ordem de empilhamento compartilhada: o último adesivo tocado fica por cima. */
let topo = 1;

export interface StickerPeelProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Nome falado do adesivo, para leitor de tela. */
  label: string;
  /** Posição inicial em px, relativa ao pai posicionado. */
  defaultPosition?: { x: number; y: number };
  /** Inclinação em graus. Adesivo colado à mão nunca fica reto. */
  rotate?: number;
  /** Raio CSS da forma, compartilhado pela frente e pelo verso. */
  radius?: string;
  /** Dobra em repouso com o ponteiro em cima, em px. */
  peel?: number;
  /** Chamado ao soltar e a cada passo de teclado. */
  onPositionChange?: (pos: { x: number; y: number }) => void;
  /** Clique, Enter ou Espaço descolam o adesivo inteiro da página. */
  peelOff?: boolean;
  /** Chamado quando o adesivo termina de sair (só com `peelOff`). */
  onPeelOff?: () => void;
}

export function StickerPeel({
  label,
  defaultPosition = { x: 0, y: 0 },
  rotate = 0,
  radius = "var(--r-surface)",
  peel = 14,
  onPositionChange,
  peelOff = false,
  onPeelOff,
  className,
  style,
  children,
  ...props
}: StickerPeelProps) {
  const reduzir = useReducedMotion();
  const raiz = React.useRef<HTMLDivElement>(null);
  const frente = React.useRef<HTMLDivElement>(null);
  const verso = React.useRef<HTMLDivElement>(null);
  const pos = React.useRef({ ...defaultPosition });
  const [z, setZ] = React.useState(0);
  const [pego, setPego] = React.useState(false);
  const [saiu, setSaiu] = React.useState(false);
  const [indo, setIndo] = React.useState(false);
  const saindo = React.useRef(false);

  // Dobra = distância (px) que o canto percorre; ângulo = para onde ele vai.
  const dobra = useMotionValue(0);
  const angulo = useMotionValue(Math.PI * 1.25); // diagonal, para cima e à esquerda
  const inclina = useSpring(0, { stiffness: 220, damping: 22 });
  const parouMao = React.useRef(0);
  const ultimaMao = React.useRef({ x: 0, t: 0 });

  const desenhar = React.useCallback(() => {
    const el = raiz.current;
    const f = frente.current;
    const v = verso.current;
    if (!el || !f || !v) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const d = dobra.get();
    if (d < 0.5) {
      f.style.clipPath = "";
      v.style.visibility = "hidden";
      return;
    }
    // Num círculo ou pílula a quina da caixa é vazia: a dobra precisa passar
    // desse vão (0,41 do raio na diagonal, ida e volta) antes de pegar papel.
    const raio = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, Math.min(w, h) / 2);
    const alcance = d + raio * (Math.SQRT2 - 1) * 2;
    const a = angulo.get();
    const c = { x: w, y: h };
    const p = { x: c.x + Math.cos(a) * alcance, y: c.y + Math.sin(a) * alcance };
    const m = { x: (c.x + p.x) / 2, y: (c.y + p.y) / 2 };
    const n = { x: -Math.cos(a), y: -Math.sin(a) }; // aponta para o canto
    // Caixa folgada: o recorte não pode comer a borda branca nem a sombra.
    const f0 = 24;
    const caixa = [
      { x: -f0, y: -f0 },
      { x: w + f0, y: -f0 },
      { x: w + f0, y: h + f0 },
      { x: -f0, y: h + f0 },
    ];
    f.style.clipPath = poligono(cortar(caixa, m, n, false));
    v.style.clipPath = poligono(cortar(caixa, m, n, true));
    const k = m.x * n.x + m.y * n.y;
    v.style.transform = `matrix(${1 - 2 * n.x * n.x},${-2 * n.x * n.y},${-2 * n.x * n.y},${
      1 - 2 * n.y * n.y
    },${2 * k * n.x},${2 * k * n.y})`;
    v.style.backgroundImage = luzNoVinco(w, h, m, n);
    v.style.visibility = "visible";
  }, [dobra, angulo]);

  React.useEffect(() => {
    const a = dobra.on("change", desenhar);
    const b = angulo.on("change", desenhar);
    // Por `rotate` individual: `left`/`top` movem, `transform` é da pegada e da saída.
    const c = inclina.on("change", (g) => {
      if (raiz.current) raiz.current.style.rotate = `${rotate + g}deg`;
    });
    return () => {
      a();
      b();
      c();
      window.clearTimeout(parouMao.current);
    };
  }, [dobra, angulo, desenhar, inclina, rotate]);

  const levar = (alvo: number) => {
    if (saindo.current) return;
    if (reduzir) dobra.set(alvo);
    else animate(dobra, alvo, MOLA);
  };

  /**
   * Descola de vez: o canto viaja pela diagonal até passar da quina oposta (a
   * frente some, o verso inteiro aparece virado) e o adesivo sai da página.
   */
  const descolar = () => {
    const el = raiz.current;
    if (!el || saindo.current) return;
    saindo.current = true;
    setIndo(true);
    setZ(++topo);
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const fim = () => {
      setSaiu(true);
      onPeelOff?.();
    };
    if (reduzir) {
      fim();
      return;
    }
    // A mira leva a dobra para a diagonal sem salto, e a dobra atravessa em vez de
    // estourar: começo lento (vê-se o canto subindo), meio decidido, fim assentado.
    animate(angulo, Math.atan2(-h, -w), { duration: 0.18, ease: [0.23, 1, 0.32, 1] });
    animate(dobra, Math.hypot(w, h) * 2.05, { duration: 0.72, ease: [0.65, 0, 0.35, 1] });
    // Só depois de o verso aparecer ele se solta: sobe, gira um nada e apaga. Um por vez.
    animate(
      el,
      { opacity: 0, y: -22, scale: 1.05, rotate: 7 },
      { duration: 0.26, delay: 0.5, ease: [0.23, 1, 0.32, 1] },
    ).then(fim);
  };

  /** Pega e larga: o adesivo sobe um pouco da página e assenta ao soltar. */
  const erguer = (sim: boolean) => {
    const el = raiz.current;
    if (!el || reduzir) return;
    animate(el, { scale: sim ? 1.05 : 1 }, sim ? { duration: 0.14, ease: [0.23, 1, 0.32, 1] } : MOLA);
  };

  /** Ponteiro em px locais do adesivo: sem escala do palco e sem a rotação. */
  const local = (e: React.PointerEvent) => {
    const el = raiz.current!;
    const r = el.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const giro = (rotate * Math.PI) / 180;
    // A escala sai da diagonal do retângulo girado contra a diagonal local.
    const larguraGirada = w * Math.abs(Math.cos(giro)) + h * Math.abs(Math.sin(giro));
    const escala = r.width / (larguraGirada || 1);
    const dx = (e.clientX - (r.left + r.width / 2)) / escala;
    const dy = (e.clientY - (r.top + r.height / 2)) / escala;
    return {
      x: dx * Math.cos(-giro) - dy * Math.sin(-giro) + w / 2,
      y: dx * Math.sin(-giro) + dy * Math.cos(-giro) + h / 2,
      escala,
      w,
      h,
    };
  };

  const mirar = (l: { x: number; y: number; w: number; h: number }, base: number) => {
    const vx = l.x - l.w;
    const vy = l.y - l.h;
    const dist = Math.hypot(vx, vy);
    if (dist > 4) {
      const alvo = Math.atan2(vy, vx);
      // Dobra ainda fechada não tem o que girar: nasce já apontando para o ponteiro.
      if (reduzir || dobra.get() < 1) angulo.set(alvo);
      else animate(angulo, alvo, MOLA_MIRA);
    }
    // Perto do canto a dobra cresce até o dobro do repouso.
    const perto = Math.max(0, 1 - dist / Math.max(l.w, l.h));
    return base * (1 + perto);
  };

  const arrasto = React.useRef<{
    x: number;
    y: number;
    px: number;
    py: number;
    escala: number;
    moveu: boolean;
  } | null>(null);

  const mover = (x: number, y: number) => {
    pos.current = { x, y };
    if (raiz.current) {
      raiz.current.style.left = `${x}px`;
      raiz.current.style.top = `${y}px`;
    }
  };

  return (
    <div
      ref={raiz}
      role="button"
      tabIndex={0}
      aria-roledescription="adesivo arrastável"
      aria-label={label}
      className={cn(
        "absolute touch-none select-none outline-none focus-visible:[box-shadow:var(--focus)]",
        pego ? "cursor-grabbing" : "cursor-grab",
        className,
      )}
      style={{
        left: defaultPosition.x,
        top: defaultPosition.y,
        rotate: `${rotate}deg`,
        borderRadius: radius,
        zIndex: z,
        display: saiu ? "none" : undefined,
        ...style,
      }}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") levar(peel);
      }}
      onPointerMove={(e) => {
        const l = local(e);
        const g = arrasto.current;
        if (g) {
          if (!g.moveu && Math.hypot(e.clientX - g.px, e.clientY - g.py) < 4) return;
          g.moveu = true;
          const antes = pos.current.x;
          mover(g.x + (e.clientX - g.px) / g.escala, g.y + (e.clientY - g.py) / g.escala);
          mirar(l, 0);
          if (!reduzir) {
            // Inclina pelo passo da mão, e volta ao reto quando ela para.
            const dt = Math.max(1, e.timeStamp - ultimaMao.current.t);
            ultimaMao.current = { x: pos.current.x, t: e.timeStamp };
            inclina.set(Math.max(-INCLINA, Math.min(INCLINA, ((pos.current.x - antes) / dt) * 5)));
            window.clearTimeout(parouMao.current);
            parouMao.current = window.setTimeout(() => inclina.set(0), 70);
          }
          return;
        }
        if (e.pointerType === "mouse") levar(mirar(l, peel));
      }}
      onPointerLeave={() => {
        if (!arrasto.current) levar(0);
      }}
      // Imagem dentro da peça dispara o arrasto nativo do navegador, que cancela
      // o ponteiro no meio do gesto.
      onDragStart={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (e.button !== 0 || saindo.current) return;
        const l = local(e);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        arrasto.current = {
          ...pos.current,
          px: e.clientX,
          py: e.clientY,
          escala: l.escala,
          moveu: false,
        };
        setZ(++topo);
        setPego(true);
        mirar(l, 0);
        levar(Math.min(l.w, l.h) * 0.25);
        erguer(true);
      }}
      onPointerUp={(e) => {
        const g = arrasto.current;
        if (!g) return;
        arrasto.current = null;
        setPego(false);
        inclina.set(0);
        if (!g.moveu && peelOff) {
          descolar();
          return;
        }
        erguer(false);
        levar(e.pointerType === "mouse" ? peel : 0);
        if (g.moveu) onPositionChange?.(pos.current);
      }}
      onPointerCancel={() => {
        arrasto.current = null;
        setPego(false);
        inclina.set(0);
        erguer(false);
        levar(0);
      }}
      onKeyDown={(e) => {
        if (peelOff && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          descolar();
          return;
        }
        const passo = e.shiftKey ? 32 : 8;
        const d = {
          ArrowLeft: [-passo, 0],
          ArrowRight: [passo, 0],
          ArrowUp: [0, -passo],
          ArrowDown: [0, passo],
        }[e.key];
        if (!d) return;
        e.preventDefault();
        setZ(++topo);
        mover(pos.current.x + d[0], pos.current.y + d[1]);
        onPositionChange?.(pos.current);
      }}
      {...props}
    >
      {/* Aura de toque: o canto começa a levantar um pouco antes da borda. */}
      <div aria-hidden className="absolute -inset-3" style={{ borderRadius: radius }} />
      {/* Sombra separada da frente: o recorte da dobra não pode cortá-la. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [box-shadow:var(--e-raised)] transition-[box-shadow,opacity] duration-[var(--dur-base)] ease-[var(--ease-out)]"
        style={{
          borderRadius: radius,
          opacity: indo ? 0 : undefined,
          boxShadow: pego
            ? "0 18px 32px -10px color-mix(in oklab, var(--foreground) 35%, transparent)"
            : undefined,
        }}
      />
      <div ref={frente} className="relative" style={{ borderRadius: radius }}>
        {children}
      </div>
      {/* O verso: a mesma caixa, cor de papel, refletida pela linha de dobra. */}
      {/* O invólucro sem transformação é quem projeta a sombra da aba sobre o adesivo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ filter: "drop-shadow(-2px 3px 5px color-mix(in oklab, black 38%, transparent))" }}
      >
        <div
          ref={verso}
          className="absolute inset-0 origin-top-left"
          style={{
            borderRadius: radius,
            visibility: "hidden",
            // Papel de verso: destacado do fundo em qualquer tema. Em `--muted` puro,
            // ele sumia sobre uma prancheta da mesma cor.
            backgroundColor: "color-mix(in oklab, var(--foreground) 16%, var(--card))",
            boxShadow: "inset 0 0 0 1px var(--border)",
          }}
        />
      </div>
    </div>
  );
}
