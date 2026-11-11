"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";
import { BatteryFull, BatteryLow, BatteryMedium, BatteryWarning, Play, Square } from "lucide-react";

import { cn } from "@/lib/utils";
import { DeviceEncoder } from "@/components/ui/device-encoder";
import { DeviceKey, usePressFlash } from "@/components/ui/device-key";
import { DeviceLcd, DeviceReadout, DeviceSegments, timecode } from "@/components/ui/device-lcd";
import { DeviceLed } from "@/components/ui/device-led";
import { DeviceEngraving, DeviceShell } from "@/components/ui/device-shell";

/**
 * Voice Recorder: um gravador de voz de bolso, de alumínio escovado, que reage a cada operação.
 *
 * "Você aperta, fala, encerra. O aparelho captura; o software organiza e transcreve." Então o
 * aparelho tem um display pequeno, um REC dominante, Stop e Play discretos e um encoder na
 * lateral. A transcrição não aparece nele: aparece na nota, na lista ao lado.
 *
 * A peça é só a casca: não grava, não toca e não busca nada. Recebe o estado, o tempo, o nível
 * e as notas por props e devolve as ações por callbacks. Quem liga o microfone e o player é a
 * tela que a usa.
 *
 * ── Decisões que não são óbvias ────────────────────────────────────────────
 *
 * 1. **O nível chega por `getLevel`, puxado a cada quadro.** Passar `level` como prop
 *    re-renderiza o aparelho 60 vezes por segundo; a função não. Os dois funcionam.
 * 2. **O REC trava afundado enquanto grava ou pausa**, como uma tecla de gravador de verdade,
 *    e o LED do meio é a luz de gravação: respira gravando, pisca devagar pausado.
 * 3. **O encoder muda de função com o estado**: parado, navega entre as notas; gravando ou
 *    tocando, é o volume. O display mostra o valor enquanto gira e por 1,2 s depois.
 *    Arrasto vertical, roda do mouse e setas andam um detente por vez.
 * 4. **O teclado também afunda o botão.** R/Espaço, S e P marcam a tecla como apertada por um
 *    instante, para o atalho e o clique contarem a mesma história.
 * 5. **O aparelho é montado com o kit `device-*`** (carcaça, display, LED, teclas, encoder). O
 *    material mora no kit (variáveis `--dk-*`, claro e escuro, em `device-kit.css`); aqui fica
 *    só a disposição do gravador. A tinta do display é o `--brand`.
 */

export type RecorderState = "idle" | "recording" | "paused" | "saving" | "transcribing" | "playing" | "error";

export interface RecorderNote {
  id: string;
  title: string;
  durationMs: number;
  date: number | string | Date;
  /** O texto da nota. Aparece na lista, nunca no aparelho. */
  transcript?: string | null;
  /** Ainda transcrevendo. */
  pending?: boolean;
}

export interface VoiceRecorderProps {
  state: RecorderState;
  /** Tempo corrido da gravação, ou a posição do que toca, em ms. */
  timeMs?: number;
  /** Nível do microfone (ou do que toca), de 0 a 1. */
  level?: number;
  /** O mesmo nível, puxado a cada quadro. Tem preferência sobre `level`. */
  getLevel?: () => number;
  notes?: RecorderNote[];
  selectedId?: string | null;
  /** Volume de 0 a 1. */
  volume?: number;
  /** Bateria de 0 a 1. Sem ela, o ícone não aparece. */
  battery?: number | null;
  /** A mensagem do erro, em português, pronta para mostrar. */
  error?: string | null;
  /** Gravar, ou retomar a pausa. */
  onRecord?: () => void;
  onPause?: () => void;
  /** Parar a gravação ou o que toca. */
  onStop?: () => void;
  /** Descartar a gravação em curso (Esc). */
  onDiscard?: () => void;
  onPlay?: (id: string) => void;
  onVolumeChange?: (v: number) => void;
  onSelect?: (id: string) => void;
  /** Abrir a nota (a transcrição inteira, o player). */
  onOpen?: (id: string) => void;
  /** Data da nota na lista. Padrão: "11 nov., 14:02". */
  formatDate?: (d: Date) => string;
  /** Quantas notas a lista mostra de uma vez. */
  listSize?: number;
  className?: string;
}

const PASSO_VOLUME = 0.05;
const MOSTRA_GIRO_MS = 1200;

const dataPadrao = (d: Date) =>
  `${d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}, ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

const curto = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const ROTULO: Record<RecorderState, string> = {
  idle: "Pronto", recording: "Rec", paused: "Pausa", saving: "Salvando", transcribing: "Transcrevendo", playing: "Play", error: "Erro",
};
const ANUNCIO: Record<RecorderState, string> = {
  idle: "Parado", recording: "Gravando", paused: "Pausado", saving: "Salvando a gravação", transcribing: "Transcrevendo a nota", playing: "Tocando", error: "Erro",
};

export function VoiceRecorder({
  state, timeMs = 0, level, getLevel, notes = [], selectedId = null, volume = 0.8, battery = null, error = null,
  onRecord, onPause, onStop, onDiscard, onPlay, onVolumeChange, onSelect, onOpen, formatDate = dataPadrao, listSize = 6, className,
}: VoiceRecorderProps) {
  const corpo = React.useRef<HTMLDivElement>(null);
  const reduzido = !!useReducedMotion();
  const [apertada, apertar] = usePressFlash(); // o atalho de teclado afunda a tecla também

  const idx = Math.max(0, notes.findIndex((n) => n.id === selectedId));
  const nota = notes.length ? notes[idx] : null;
  const gravando = state === "recording" || state === "paused";
  const modo: "notas" | "volume" = (state === "idle" || state === "transcribing" || state === "error") && notes.length > 1 ? "notas" : "volume";

  // ── Ações (as mesmas para clique, teclado e atalho)
  const rec = () => {
    if (state === "saving") return;
    apertar("rec");
    if (state === "recording") onPause?.();
    else onRecord?.();
  };
  const podeParar = gravando || state === "playing";
  const parar = () => { if (!podeParar) return; apertar("stop"); onStop?.(); };
  const podeTocar = !!nota && !gravando && state !== "saving";
  const tocar = () => {
    if (state === "playing") { apertar("play"); onStop?.(); return; }
    if (!podeTocar || !nota) return;
    apertar("play"); onPlay?.(nota.id);
  };

  // ── Encoder
  const [giro, setGiro] = React.useState(0);
  const [mostrando, setMostrando] = React.useState<null | "notas" | "volume">(null);
  const fim = React.useRef<number>();
  const vol = React.useRef(volume); vol.current = volume;
  const estadoAtual = React.useRef({ modo, idx, notes, onVolumeChange, onSelect });
  estadoAtual.current = { modo, idx, notes, onVolumeChange, onSelect };
  const detente = React.useCallback((d: 1 | -1) => {
    const a = estadoAtual.current;
    setGiro((g) => g + d);
    setMostrando(a.modo);
    window.clearTimeout(fim.current);
    fim.current = window.setTimeout(() => setMostrando(null), MOSTRA_GIRO_MS);
    if (a.modo === "volume") {
      const v = Math.min(1, Math.max(0, Math.round((vol.current + d * PASSO_VOLUME) * 20) / 20));
      vol.current = v;
      a.onVolumeChange?.(v);
    } else {
      // Para cima, a nota mais nova (o topo da lista); para baixo, a mais antiga.
      const n = Math.min(a.notes.length - 1, Math.max(0, a.idx - d));
      // O índice anda aqui também: vários detentes no mesmo quadro (roda, arrasto) chegam antes do render.
      if (a.notes[n]) { a.idx = n; a.onSelect?.(a.notes[n].id); }
    }
  }, []);
  React.useEffect(() => () => window.clearTimeout(fim.current), []);

  // ── Teclado: no aparelho, e na página quando nada mais tem o foco.
  const acoes = React.useRef({ rec, parar, tocar, detente, onDiscard, gravando });
  acoes.current = { rec, parar, tocar, detente, onDiscard, gravando };
  React.useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const alvo = e.target as HTMLElement | null;
      const dentro = !!alvo && !!corpo.current?.contains(alvo);
      const solto = !alvo || alvo === document.body;
      if (!dentro && !solto) return;
      const a = acoes.current;
      const tecla = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      // Espaço num botão que não é o REC continua sendo o clique daquele botão.
      const outroBotao = dentro && alvo?.tagName === "BUTTON" && !alvo.classList.contains("vr-rec");
      const f =
        tecla === "r" || (tecla === " " && !outroBotao) ? a.rec
        : tecla === "s" ? a.parar
        : tecla === "p" ? a.tocar
        : tecla === "Escape" && a.gravando && a.onDiscard ? a.onDiscard
        : dentro && (tecla === "ArrowUp" || tecla === "ArrowRight") ? () => a.detente(1)
        : dentro && (tecla === "ArrowDown" || tecla === "ArrowLeft") ? () => a.detente(-1)
        : null;
      if (!f) return;
      e.preventDefault();
      f();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  // ── Onda
  const tela = React.useRef<HTMLCanvasElement>(null);
  const nivel = React.useRef(level ?? 0); nivel.current = level ?? 0;
  const puxar = React.useRef(getLevel); puxar.current = getLevel;
  const historia = React.useRef<Float32Array>(new Float32Array(52));
  React.useEffect(() => {
    const cv = tela.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const h = historia.current;
    const vivo = state === "recording" || state === "playing";
    let raf = 0, ultimo = 0, suave = 0, cor = "", quadros = 0;
    const desenhar = (t: number) => {
      const dpr = window.devicePixelRatio || 1;
      const W = cv.clientWidth, H = cv.clientHeight;
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      if (!cor || quadros++ % 30 === 0) cor = getComputedStyle(cv).color;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = cor;
      const n = h.length, passo = W / n, larg = Math.max(1.5, passo * 0.5);
      const varre = state === "transcribing" && !reduzido ? ((t / 1600) % 1.3) - 0.15 : -1;
      let soma = 0;
      for (let i = 0; i < n; i++) {
        const v = h[i]; soma += v;
        const x = i * passo + (passo - larg) / 2;
        const alt = Math.max(1.5, v * (H - 2));
        let a = state === "saving" || state === "paused" ? 0.55 : state === "transcribing" ? 0.3 : 0.4 + 0.6 * (i / n);
        if (varre >= 0) a += Math.max(0, 0.7 - Math.abs(i / n - varre) * 6);
        ctx.globalAlpha = Math.min(1, a);
        ctx.fillRect(x, (H - alt) / 2, larg, alt);
      }
      ctx.globalAlpha = 1;
      return soma;
    };
    const quadro = (t: number) => {
      if (vivo && t - ultimo > 45) {
        ultimo = t;
        const bruto = Math.min(1, Math.max(0, puxar.current ? puxar.current() : nivel.current));
        suave = bruto > suave ? bruto : suave * 0.6 + bruto * 0.4; // sobe na hora, desce macio
        h.copyWithin(0, 1); h[h.length - 1] = suave;
      }
      if (state === "idle" || state === "error") for (let i = 0; i < h.length; i++) h[i] *= 0.9;
      const soma = desenhar(t);
      const continua = vivo || (state === "transcribing" && !reduzido) || ((state === "idle" || state === "error") && soma > 0.02);
      if (continua) raf = requestAnimationFrame(quadro);
    };
    if (reduzido && (state === "idle" || state === "error")) h.fill(0);
    raf = requestAnimationFrame(quadro);
    return () => cancelAnimationFrame(raf);
  }, [state, reduzido]);

  // ── O que o display diz
  const tempo = state === "idle" || state === "error" ? (nota?.durationMs ?? 0) : timeMs;
  const linha = (() => {
    if (mostrando === "volume") {
      return <>VOL<DeviceSegments className="vr-meter" value={volume} />{Math.round(volume * 100)}</>;
    }
    if (mostrando === "notas" && nota) return nota.title; // o contador 01/38 já anda no canto
    if (state === "error") return error && /negad/i.test(error) ? "Microfone negado" : (error || "Algo falhou");
    if (state === "recording") return "S para, Esc descarta";
    if (state === "paused") return "REC retoma, S para";
    if (state === "saving") return "Subindo o áudio…";
    if (state === "transcribing") return "O texto vai para a nota";
    if (state === "playing") return nota ? nota.title : "";
    return nota ? nota.title : "Aperte REC e fale";
  })();
  const anuncio = state === "playing" && nota ? `Tocando ${nota.title}` : state === "error" ? (error || ANUNCIO.error) : ANUNCIO[state];

  const janela = Math.max(0, Math.min(idx - 2, notes.length - listSize));
  const visiveis = notes.slice(janela, janela + listSize);

  return (
    <div className={cn("vr flex flex-wrap items-start gap-x-14 gap-y-8", className)}>
      <DeviceShell ref={corpo} size="md" className="vr-body" data-state={state} data-turning={mostrando ? "" : undefined}
        role="group" aria-roledescription="gravador" aria-label="Gravador de voz" tabIndex={0}
        aria-keyshortcuts="R Space S P ArrowUp ArrowDown Escape">
        <div className="vr-top">
          <span className="vr-grille" aria-hidden />
          <DeviceEngraving className="vr-mark" aria-hidden>GRAVADOR</DeviceEngraving>
        </div>

        <DeviceLcd lit={state !== "idle" || !!mostrando} className="vr-bezel" screenClassName="vr-screen" aria-hidden>
          <div className="vr-row">
            <span className="vr-status"><span className="vr-status-dot" />{ROTULO[state]}</span>
            <span className="vr-meta">
              {notes.length && !gravando ? <span>{String(idx + 1).padStart(2, "0")}/{String(notes.length).padStart(2, "0")}</span> : null}
              {battery != null ? <Bateria v={battery} /> : null}
            </span>
          </div>
          <DeviceReadout className="vr-time" glow={state !== "idle"}>{timecode(tempo)}</DeviceReadout>
          <div className="vr-sub">{linha}</div>
          <canvas ref={tela} className="vr-wave" />
        </DeviceLcd>

        <div className="vr-controls">
          <DeviceKey shape="ring" size="lg" className="vr-rec" onClick={rec} disabled={state === "saving"}
            pressing={apertada === "rec"} pressed={gravando}
            aria-label={state === "recording" ? "Pausar a gravação" : state === "paused" ? "Retomar a gravação" : "Gravar"}
            aria-keyshortcuts="R Space">
            <DeviceLed size="lg" tone="red" className="vr-led" state={state === "recording" ? "breathe" : state === "paused" ? "blink" : "off"} />
          </DeviceKey>
          <div className="vr-small">
            <DeviceKey shape="square" size="lg" className="vr-btn" onClick={parar} disabled={!podeParar}
              pressing={apertada === "stop"} aria-label="Parar" aria-keyshortcuts="S">
              <Square aria-hidden fill="currentColor" strokeWidth={1.5} />
            </DeviceKey>
            <DeviceKey shape="square" size="lg" className="vr-btn" onClick={tocar} disabled={!podeTocar && state !== "playing"}
              pressing={apertada === "play"} pressed={state === "playing"}
              aria-label={state === "playing" ? "Parar de tocar" : nota ? `Tocar ${nota.title}` : "Tocar"} aria-keyshortcuts="P">
              <Play aria-hidden fill="currentColor" strokeWidth={1.5} />
            </DeviceKey>
          </div>
        </div>

        <DeviceEncoder variant="wheel" className="vr-encoder" position={giro} onDetent={detente}
          label={modo === "volume" ? "Volume" : "Navegar entre as notas"}
          min={modo === "volume" ? 0 : 1}
          max={modo === "volume" ? 100 : notes.length}
          value={modo === "volume" ? Math.round(volume * 100) : idx + 1}
          valueText={modo === "volume" ? `${Math.round(volume * 100)}%` : nota ? `Nota ${idx + 1} de ${notes.length}: ${nota.title}` : undefined} />

        <span className="sr-only" role="status" aria-live="polite">{anuncio}</span>
      </DeviceShell>

      <section aria-label="Notas de voz" className="min-w-0 max-w-md flex-1 basis-72 pt-2">
        {error && state === "error" ? <p role="alert" className="mb-5 text-sm text-destructive first-letter:uppercase">{error}</p> : null}
        {!notes.length ? (
          <p className="text-sm text-muted-foreground">Nenhuma nota ainda. Aperte REC, fale e pare: a nota aparece aqui com o texto.</p>
        ) : (
          <ol className="flex flex-col">
            {visiveis.map((n) => {
              const sel = n.id === nota?.id;
              const tocando = sel && state === "playing";
              return (
                <li key={n.id} className="border-b border-border/70 last:border-0">
                  <button type="button" onClick={() => onSelect?.(n.id)} aria-current={sel ? "true" : undefined}
                    className={cn("group flex w-full items-baseline gap-4 py-3 text-left outline-none focus-visible:underline focus-visible:underline-offset-4",
                      "transition-colors [transition-duration:var(--dur-fast)]", sel ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                    <span className={cn("min-w-0 flex-1 truncate", sel && "font-medium")}>{n.title}</span>
                    <span className="num shrink-0 text-xs">{tocando ? `${curto(timeMs)} / ` : ""}{curto(n.durationMs)}</span>
                    <span className="hidden w-28 shrink-0 text-right text-xs sm:block">{formatDate(new Date(n.date))}</span>
                  </button>
                  {sel ? (
                    <div className="pb-4">
                      <p className="line-clamp-4 text-pretty text-sm leading-relaxed text-foreground/80">
                        {n.pending ? "Transcrevendo…" : n.transcript?.trim() || "Sem fala nesta nota."}
                      </p>
                      {onOpen ? (
                        <button type="button" onClick={() => onOpen(n.id)}
                          className="mt-2 text-xs text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:text-foreground">
                          Abrir a nota
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
        {gravando && onDiscard ? (
          <button type="button" onClick={onDiscard} className="mt-4 text-xs text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:text-foreground">
            Descartar esta gravação (Esc)
          </button>
        ) : null}
      </section>
    </div>
  );
}

function Bateria({ v }: { v: number }) {
  const Icone = v > 0.75 ? BatteryFull : v > 0.4 ? BatteryMedium : v > 0.15 ? BatteryLow : BatteryWarning;
  return <Icone aria-hidden className="size-4" strokeWidth={1.75} />;
}
