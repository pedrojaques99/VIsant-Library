"use client";

import * as React from "react";
import { Check, Eraser, Undo2 } from "lucide-react";

import { getStrokeOutline, outlineToPath, type InkPoint } from "@/components/ui/signature-pad";
import { resolveCssColor } from "@/lib/css-color";
import { cn } from "@/lib/utils";

/**
 * Frame Markup — rabiscar por cima de um quadro e sair com um PNG.
 *
 * Colhido do Estúdio (jaques-os), onde existia duas vezes: o rabisco do painel
 * do agente (sobre o quadro parado do vídeo, vira anexo) e o do editor (sobre a
 * imagem do quadro, vira nota). Os dois resolviam "aponta aqui" melhor que
 * qualquer frase: "esse canto está escuro" não diz qual canto.
 *
 * ── O que não é óbvio ──────────────────────────────────────────────────────
 *
 * 1. **O vídeo é congelado na montagem.** O quadro é copiado para um canvas
 *    assim que o componente abre. Se o vídeo continuar tocando atrás, o rabisco
 *    segue apontando para o quadro em que a pessoa pensou, e o PNG sai igual
 *    ao que ela viu.
 * 2. **Quadro de outra origem não quebra o export.** Vídeo ou imagem sem CORS
 *    "suja" o canvas, e o `toBlob` explodiria só no fim, com o rabisco pronto.
 *    A sujeira é testada na montagem: o fundo vira o `--muted` do tema, o
 *    rabisco continua valendo, e `frameLost` avisa quem chamou.
 * 3. **A tinta é `var(--brand)` resolvida na hora de exportar.** Na tela o
 *    traço é `fill-[var(--brand)]` e acompanha o tema; o PNG precisa de cor
 *    concreta, então ela é lida do token (via `css-color`) no clique de
 *    concluir, já com o tema que estiver valendo.
 * 4. **O motor de traço é o do `signature-pad`.** Mesma tinta de pena: afina
 *    na velocidade, engrossa na pressão da caneta, tampa redonda. Os pontos
 *    moram no espaço de pixels do quadro exportado, então o traço da tela e o
 *    do PNG são o mesmo caminho.
 *
 * Teclado: Ctrl/Cmd+Z desfaz, Delete limpa (e Ctrl/Cmd+Z traz de volta),
 * Esc cancela, Ctrl/Cmd+Enter conclui.
 */

export type FrameSource = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | string | null;

export interface MarkupStroke {
  points: InkPoint[];
}

export interface FrameMarkupResult {
  png: Blob;
  /** Tamanho do PNG; os pontos dos traços estão neste espaço. */
  width: number;
  height: number;
  strokes: MarkupStroke[];
  /** O quadro não pôde ser lido (outra origem sem CORS): o PNG tem só o rabisco. */
  frameLost: boolean;
}

export interface FrameMarkupProps {
  /** O quadro: vídeo (congela o quadro atual), imagem, canvas ou URL de imagem. */
  source?: FrameSource;
  onDone: (result: FrameMarkupResult) => void;
  onCancel?: () => void;
  /** Lado maior do PNG. O quadro é reduzido até caber. */
  maxSize?: number;
  /** Proporção quando não há quadro (ou enquanto a imagem carrega). */
  fallbackSize?: { width: number; height: number };
  /** Espessura do traço em fração do lado maior. */
  strokeSize?: number;
  label?: string;
  hint?: string;
  doneLabel?: string;
  cancelLabel?: string;
  undoLabel?: string;
  clearLabel?: string;
  autoFocus?: boolean;
  className?: string;
}

const foco = "focus-visible:outline-none focus-visible:[box-shadow:var(--focus)]";
const botaoIcone = cn(
  "grid size-9 shrink-0 cursor-pointer place-items-center rounded-[var(--r-control)] border-0 bg-transparent p-0 text-muted-foreground",
  "[transition:background-color_var(--dur-fast)_var(--ease-out),color_var(--dur-fast)_var(--ease-out)] motion-reduce:transition-none",
  "hover:enabled:bg-muted hover:enabled:text-foreground disabled:cursor-default disabled:opacity-45 pointer-coarse:size-11 [&_svg]:size-[18px]",
  foco,
);
const botaoTexto = cn(
  "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--r-control)] border px-3.5 text-sm font-medium",
  "[transition:background-color_var(--dur-fast)_var(--ease-out),opacity_var(--dur-fast)_var(--ease-out)] motion-reduce:transition-none",
  "disabled:cursor-default disabled:opacity-45 pointer-coarse:h-11 [&_svg]:size-4",
  foco,
);

function dimensoes(s: FrameSource): { width: number; height: number } | null {
  if (!s || typeof s === "string") return null;
  if (s instanceof HTMLVideoElement) return s.videoWidth ? { width: s.videoWidth, height: s.videoHeight } : null;
  if (s instanceof HTMLImageElement) return s.naturalWidth ? { width: s.naturalWidth, height: s.naturalHeight } : null;
  return s.width ? { width: s.width, height: s.height } : null;
}

function caminho(s: MarkupStroke, size: number, last = true) {
  const caneta = s.points.some((p) => p.p > 0);
  return outlineToPath(
    getStrokeOutline(s.points, {
      size,
      simulatePressure: !caneta,
      taperStart: size * 1.5,
      taperEnd: caneta ? 0 : size * 4,
      last,
    }),
  );
}

const corConcreta = (token: string, el: Element) => {
  const [r, g, b] = resolveCssColor(token, el);
  return `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)})`;
};

export function FrameMarkup({
  source = null,
  onDone,
  onCancel,
  maxSize = 1280,
  fallbackSize = { width: 1280, height: 720 },
  // Mais grosso que uma assinatura: o traço aqui aponta, e precisa ler na miniatura do anexo.
  strokeSize = 1 / 150,
  label = "Rabisco sobre o quadro",
  hint = "Desenhe por cima para apontar",
  doneLabel = "Concluir",
  cancelLabel = "Cancelar",
  undoLabel = "Desfazer",
  clearLabel = "Limpar",
  autoFocus = true,
  className,
}: FrameMarkupProps) {
  const uid = React.useId();
  const raiz = React.useRef<HTMLDivElement>(null);
  const palco = React.useRef<HTMLDivElement>(null);
  const fundo = React.useRef<HTMLCanvasElement>(null);
  const aoVivo = React.useRef<SVGPathElement>(null);
  const atual = React.useRef<{ id: number; stroke: MarkupStroke; stamp: number } | null>(null);

  const [tam, setTam] = React.useState(() => {
    const d = dimensoes(source) ?? fallbackSize;
    const k = Math.min(1, maxSize / Math.max(d.width, d.height));
    return { width: Math.round(d.width * k), height: Math.round(d.height * k) };
  });
  const [temQuadro, setTemQuadro] = React.useState(false);
  const [perdido, setPerdido] = React.useState(false);
  const [hist, setHist] = React.useState<{ past: MarkupStroke[][]; present: MarkupStroke[] }>({ past: [], present: [] });
  const [desenhando, setDesenhando] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const tracos = hist.present;
  const espessura = Math.max(2, Math.max(tam.width, tam.height) * strokeSize);

  // Congela o quadro (nota 1) e testa se ele pode ser exportado (nota 2).
  React.useEffect(() => {
    let vivo = true;
    const pintar = (fonte: CanvasImageSource, w: number, h: number) => {
      if (!vivo) return;
      const k = Math.min(1, maxSize / Math.max(w, h));
      const W = Math.round(w * k);
      const H = Math.round(h * k);
      setTam({ width: W, height: H });
      const c = fundo.current;
      if (!c) return;
      c.width = W;
      c.height = H;
      const g = c.getContext("2d");
      if (!g) return;
      try {
        g.drawImage(fonte, 0, 0, W, H);
        g.getImageData(0, 0, 1, 1); // lança se o canvas ficou sujo
        setTemQuadro(true);
        setPerdido(false);
      } catch {
        g.clearRect(0, 0, W, H);
        setTemQuadro(false);
        setPerdido(true);
      }
    };
    if (typeof source === "string") {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => pintar(img, img.naturalWidth, img.naturalHeight);
      img.onerror = () => vivo && setPerdido(true);
      img.src = source;
    } else {
      const d = dimensoes(source);
      if (source && d) pintar(source, d.width, d.height);
    }
    return () => {
      vivo = false;
    };
  }, [source, maxSize]);

  React.useEffect(() => {
    if (autoFocus) palco.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const gravar = (prox: MarkupStroke[]) => setHist((h) => ({ past: [...h.past, h.present].slice(-60), present: prox }));
  const desfazer = () => {
    if (!hist.past.length || atual.current) return;
    setHist((h) => (h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1]! } : h));
    setStatus("Desfeito");
  };
  const limpar = () => {
    if (!tracos.length || atual.current) return;
    gravar([]);
    setStatus("Rabisco apagado. Desfazer traz de volta.");
  };

  function paraQuadro(e: { clientX: number; clientY: number }) {
    // Razão do retângulo de tela: funciona com o quadro escalado por CSS ou transform.
    const r = palco.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * tam.width, y: ((e.clientY - r.top) / r.height) * tam.height };
  }
  function pintarAoVivo() {
    const a = atual.current;
    if (a && aoVivo.current) aoVivo.current.setAttribute("d", caminho(a.stroke, espessura, false));
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (atual.current || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    palco.current?.focus({ preventScroll: true });
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = paraQuadro(e);
    const caneta = e.pointerType === "pen" && e.pressure > 0;
    atual.current = { id: e.pointerId, stamp: e.nativeEvent.timeStamp, stroke: { points: [{ x, y, p: caneta ? e.pressure : -1, t: 0 }] } };
    setDesenhando(true);
    pintarAoVivo();
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const a = atual.current;
    if (!a || a.id !== e.pointerId) return;
    const juntos = typeof e.nativeEvent.getCoalescedEvents === "function" ? e.nativeEvent.getCoalescedEvents() : [];
    for (const s of juntos.length ? juntos : [e.nativeEvent]) {
      const { x, y } = paraQuadro(s);
      const caneta = s.pointerType === "pen" && s.pressure > 0;
      const ult = a.stroke.points[a.stroke.points.length - 1]!.t;
      a.stroke.points.push({ x, y, p: caneta ? s.pressure : -1, t: Math.max(ult, s.timeStamp - a.stamp) });
    }
    pintarAoVivo();
  }
  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const a = atual.current;
    if (!a || a.id !== e.pointerId) return;
    atual.current = null;
    gravar([...tracos, a.stroke]);
    aoVivo.current?.setAttribute("d", "");
    setDesenhando(false);
    setStatus(`${tracos.length + 1} ${tracos.length ? "traços" : "traço"}`);
  }

  const concluir = () => {
    if (!tracos.length || !raiz.current) return;
    const c = document.createElement("canvas");
    c.width = tam.width;
    c.height = tam.height;
    const g = c.getContext("2d");
    if (!g) return;
    if (temQuadro && fundo.current) g.drawImage(fundo.current, 0, 0);
    else {
      g.fillStyle = corConcreta("var(--muted)", raiz.current);
      g.fillRect(0, 0, c.width, c.height);
    }
    g.fillStyle = corConcreta("var(--brand)", raiz.current);
    for (const s of tracos) g.fill(new Path2D(caminho(s, espessura)));
    const strokes = tracos.map((s) => ({ points: s.points.map((p) => ({ ...p })) }));
    c.toBlob((png) => {
      if (png) onDone({ png, width: c.width, height: c.height, strokes, frameLost: perdido });
    }, "image/png");
  };

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const mod = e.metaKey || e.ctrlKey;
    if (e.key === "Escape" && onCancel) {
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    } else if (mod && e.key.toLowerCase() === "z") {
      e.preventDefault();
      desfazer();
    } else if (mod && e.key === "Enter") {
      e.preventDefault();
      concluir();
    } else if (!mod && (e.key === "Delete" || e.key === "Backspace") && e.target === palco.current) {
      e.preventDefault();
      limpar();
    }
  }

  const vazio = tracos.length === 0;

  return (
    <div ref={raiz} className={cn("flex w-full min-w-0 flex-col gap-2.5 text-foreground", className)} onKeyDown={onKeyDown}>
      <div
        ref={palco}
        tabIndex={0}
        role="img"
        aria-roledescription="área de desenho"
        aria-label={`${label}. ${vazio ? "Sem traços." : `${tracos.length} ${tracos.length === 1 ? "traço" : "traços"}.`}`}
        aria-describedby={`${uid}-teclas`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ aspectRatio: `${tam.width} / ${tam.height}` }}
        className={cn(
          "relative isolate w-full cursor-crosshair touch-none select-none overflow-hidden rounded-[var(--r-surface)] border bg-muted",
          "[transition:border-color_var(--dur-fast)_var(--ease-out)] motion-reduce:transition-none",
          desenhando ? "border-foreground/40" : "border-border",
          foco,
        )}
      >
        <canvas ref={fundo} aria-hidden="true" className={cn("absolute inset-0 size-full", !temQuadro && "invisible")} />
        <svg
          viewBox={`0 0 ${tam.width} ${tam.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full fill-[var(--brand)]"
        >
          {tracos.map((s, i) => (
            <path key={i} d={caminho(s, espessura)} />
          ))}
          <path ref={aoVivo} />
        </svg>
        {vazio && !desenhando ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[var(--r-control)] bg-background/85 px-2.5 py-1 text-xs text-muted-foreground"
          >
            {hint}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <button type="button" className={botaoIcone} aria-label={undoLabel} title={undoLabel} onClick={desfazer} disabled={!hist.past.length}>
          <Undo2 aria-hidden="true" strokeWidth={1.75} />
        </button>
        <button type="button" className={botaoIcone} aria-label={clearLabel} title={clearLabel} onClick={limpar} disabled={vazio}>
          <Eraser aria-hidden="true" strokeWidth={1.75} />
        </button>
        {perdido ? <span className="ml-1 text-xs text-muted-foreground">O quadro não pôde ser lido; vai só o rabisco.</span> : null}
        <span className="min-w-0 flex-1" />
        {onCancel ? (
          <button type="button" className={cn(botaoTexto, "border-transparent bg-transparent text-foreground hover:bg-muted")} onClick={onCancel}>
            {cancelLabel}
          </button>
        ) : null}
        <button
          type="button"
          className={cn(botaoTexto, "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)] hover:enabled:opacity-90")}
          onClick={concluir}
          disabled={vazio}
        >
          <Check aria-hidden="true" />
          {doneLabel}
        </button>
      </div>

      <p id={`${uid}-teclas`} className="sr-only">
        Desenhe com mouse, caneta ou dedo. Control ou Command mais Z desfaz, Delete limpa, Esc cancela, Control ou Command mais Enter conclui.
      </p>
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
