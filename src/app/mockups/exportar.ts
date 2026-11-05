/**
 * A saída: um quadro vira PNG, N quadros viram vídeo.
 *
 * `modern-screenshot` desenha o DOM real (perspectiva e `preserve-3d` incluídos), e o
 * `mediabunny` codifica por WebCodecs, sem servidor: o arquivo nunca sai da máquina.
 * Aguardar cada `add()` é o que segura o laço quando o encoder fica para trás.
 *
 * Tudo roda na máquina de quem usa, de propósito. O `/api/render` do visantlabs-os (ffmpeg
 * no servidor) só faria sentido num navegador sem WebCodecs, e custaria mandar a tela de
 * alguém para um servidor: por ora esse caso recebe um aviso claro, e não um upload.
 */

import { frameData, frameSteps } from "motion/react";
import { createContext, destroyContext, domToCanvas } from "modern-screenshot";
import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  QUALITY_VERY_HIGH,
  WebMOutputFormat,
  getFirstEncodableVideoCodec,
} from "mediabunny";
import { GIFEncoder, applyPalette, quantize } from "gifenc";

export interface Quadro {
  /** A composição, no tamanho lógico (1080 no lado menor). Sem transform no próprio nó. */
  el: HTMLElement;
  w: number;
  h: number;
}

/**
 * Pinta os valores de movimento sem esperar o próximo quadro da tela. Com a aba escondida o
 * navegador quase para o `requestAnimationFrame`: esperar por ele derrubava o export para um
 * quadro por segundo. A captura lê o estilo, e o estilo já está certo aqui.
 */
function pintarAgora() {
  for (const passo of ["read", "resolveKeyframes", "preUpdate", "update", "preRender", "render", "postRender"] as const) {
    frameSteps[passo].process(frameData);
  }
}

const capturar = ({ el, w, h }: Quadro, saidaW: number) =>
  domToCanvas(el, { width: w, height: h, scale: saidaW / w, backgroundColor: null });

export const baixar = (url: string, nome: string) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
};

/**
 * WebKit às vezes solta o desenho em silêncio e devolve um quadro vazio. Vira erro, para
 * ninguém baixar um arquivo em branco achando que deu certo.
 */
function conferirQuadro(c: HTMLCanvasElement) {
  const sonda = document.createElement("canvas");
  sonda.width = sonda.height = 24;
  const ctx = sonda.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  ctx.drawImage(c, 0, 0, 24, 24);
  const { data } = ctx.getImageData(0, 0, 24, 24);
  for (let i = 3; i < data.length; i += 4) if (data[i]) return;
  throw new Error("O navegador entregou um quadro vazio. Tente o Chrome ou uma resolução menor.");
}

export async function exportarImagem(q: Quadro, saidaW: number, formato: "png" | "webp") {
  pintarAgora();
  const c = await capturar(q, saidaW);
  conferirQuadro(c);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, `image/${formato}`, 0.95));
  if (!blob) throw new Error("O navegador não gerou a imagem.");
  return blob;
}

/** MP4 precisa de H.264 ou similar no navegador; sem ele, a interface oferece só o que existe. */
export async function codecDisponivel(formato: "mp4" | "webm", w: number, h: number) {
  const f = formato === "mp4" ? new Mp4OutputFormat() : new WebMOutputFormat();
  return getFirstEncodableVideoCodec(f.getSupportedVideoCodecs(), { width: w, height: h }).catch(() => null);
}

/** Devolve a vez à tela para o progresso pintar. `setTimeout` cairia para um por segundo em segundo plano. */
const cederAVez = () =>
  new Promise<void>((r) => {
    const canal = new MessageChannel();
    canal.port1.onmessage = () => {
      canal.port1.close();
      r();
    };
    canal.port2.postMessage(0);
  });

function buscarUmVideo(v: HTMLVideoElement, alvo: number) {
  return new Promise<boolean>((r) => {
    const fim = (ok: boolean) => {
      window.clearTimeout(relogio);
      v.removeEventListener("seeked", achou);
      r(ok);
    };
    const achou = () => fim(true);
    const relogio = window.setTimeout(() => fim(false), 2000);
    v.addEventListener("seeked", achou, { once: true });
    v.currentTime = alvo;
  });
}

/** O vídeo dentro da tela anda junto do tempo da cena. Quadro que não chega vira erro: repetir em silêncio sujaria o arquivo. */
async function buscarVideos(el: HTMLElement, segundos: number) {
  await Promise.all(
    [...el.querySelectorAll("video")].map(async (v) => {
      if (!v.duration) return;
      const alvo = segundos % v.duration;
      if (Math.abs(v.currentTime - alvo) < 0.001) return;
      if (!(await buscarUmVideo(v, alvo)) && !(await buscarUmVideo(v, alvo))) {
        throw new Error("Não consegui ler um quadro do vídeo da tela. Tente de novo.");
      }
    }),
  );
}

export async function exportarVideo(opts: {
  quadro: Quadro;
  saidaW: number;
  saidaH: number;
  duracao: number;
  fps: number;
  formato: "mp4" | "webm" | "gif";
  /** Só WebM guarda transparência em vídeo. */
  transparente?: boolean;
  /** Põe a cena no tempo `t` (0 a 1). */
  irPara: (t: number) => void;
  onProgresso: (feito: number, total: number, restanteS: number) => void;
  sinal: AbortSignal;
}) {
  const { quadro, saidaW, saidaH, duracao, fps, formato, transparente = false, irPara, onProgresso, sinal } = opts;
  const codec = formato === "gif" ? null : await codecDisponivel(formato, saidaW, saidaH);
  if (formato !== "gif" && !codec) throw new Error(`Este navegador não codifica ${formato.toUpperCase()}. Tente GIF ou o Chrome.`);

  const alvo = document.createElement("canvas");
  alvo.width = saidaW;
  alvo.height = saidaH;
  const ctx = alvo.getContext("2d", { willReadFrequently: formato === "gif" });
  if (!ctx) throw new Error("Sem canvas 2D.");

  const target = new BufferTarget();
  const output = codec ? new Output({ format: formato === "mp4" ? new Mp4OutputFormat() : new WebMOutputFormat(), target }) : null;
  // Transparência precisa de VP9: o WebM guarda o alfa à parte, e o `mediabunny` cuida disso.
  const fonte = codec ? new CanvasSource(alvo, { codec, bitrate: QUALITY_VERY_HIGH, ...(transparente ? { alpha: "keep" as const } : {}) }) : null;
  if (output && fonte) {
    output.addVideoTrack(fonte, { frameRate: fps });
    await output.start();
  }
  const gif = formato === "gif" ? GIFEncoder() : null;

  // Um contexto só para o vídeo inteiro: fontes e imagens são lidas uma vez, não a cada quadro.
  const contexto = await createContext(quadro.el, { width: quadro.w, height: quadro.h, scale: saidaW / quadro.w, backgroundColor: null });
  const videos = [...quadro.el.querySelectorAll("video")];
  videos.forEach((v) => v.pause());
  const total = Math.round(duracao * fps);
  const t0 = performance.now();
  try {
    for (let i = 0; i < total; i++) {
      if (sinal.aborted) {
        await output?.cancel();
        return null;
      }
      irPara(i / total);
      await buscarVideos(quadro.el, i / fps);
      pintarAgora();
      const c = await domToCanvas(contexto);
      ctx.clearRect(0, 0, saidaW, saidaH);
      if (i === 0) conferirQuadro(c);
      ctx.drawImage(c, 0, 0, saidaW, saidaH);
      if (gif) {
        const { data } = ctx.getImageData(0, 0, saidaW, saidaH);
        const paleta = quantize(data, 256);
        gif.writeFrame(applyPalette(data, paleta), saidaW, saidaH, { palette: paleta, delay: 1000 / fps, repeat: 0 });
      } else if (fonte) {
        await fonte.add(i / fps, 1 / fps);
      }
      await cederAVez();
      const porQuadro = (performance.now() - t0) / (i + 1);
      onProgresso(i + 1, total, (porQuadro * (total - i - 1)) / 1000);
    }
    await output?.finalize();
  } finally {
    destroyContext(contexto);
    videos.forEach((v) => void v.play().catch(() => {}));
  }
  if (gif) {
    gif.finish();
    return new Blob([gif.bytes().slice()], { type: "image/gif" });
  }
  const buffer = target.buffer;
  if (!buffer) throw new Error("O vídeo saiu vazio.");
  return new Blob([buffer], { type: `video/${formato}` });
}
