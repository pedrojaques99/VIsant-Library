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

import { createContext, destroyContext, domToCanvas } from "modern-screenshot";
import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
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

const capturar = ({ el, w, h }: Quadro, saidaW: number) =>
  domToCanvas(el, { width: w, height: h, scale: saidaW / w, backgroundColor: null });

const baixar = (blob: Blob, nome: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
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

export async function exportarImagem(q: Quadro, saidaW: number, formato: "png" | "webp", nome: string) {
  const c = await capturar(q, saidaW);
  conferirQuadro(c);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, `image/${formato}`, 0.95));
  if (!blob) throw new Error("O navegador não gerou a imagem.");
  baixar(blob, `${nome}.${formato}`);
  return blob.size;
}

/** MP4 precisa de H.264 ou similar no navegador; sem ele, a interface oferece só o que existe. */
export async function codecDisponivel(formato: "mp4" | "webm", w: number, h: number) {
  const f = formato === "mp4" ? new Mp4OutputFormat() : new WebMOutputFormat();
  return getFirstEncodableVideoCodec(f.getSupportedVideoCodecs(), { width: w, height: h }).catch(() => null);
}

const proximoPaint = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

/** O vídeo dentro da tela anda junto do tempo da cena, senão ele sairia congelado no quadro atual. */
async function buscarVideos(el: HTMLElement, segundos: number) {
  await Promise.all(
    [...el.querySelectorAll("video")].map(
      (v) =>
        new Promise<void>((r) => {
          if (!v.duration) return r();
          const alvo = segundos % v.duration;
          if (Math.abs(v.currentTime - alvo) < 0.001) return r();
          const fim = () => r();
          v.addEventListener("seeked", fim, { once: true });
          v.currentTime = alvo;
          setTimeout(fim, 1500);
        }),
    ),
  );
}

export async function exportarVideo(opts: {
  quadro: Quadro;
  saidaW: number;
  saidaH: number;
  duracao: number;
  fps: number;
  formato: "mp4" | "webm" | "gif";
  nome: string;
  /** Põe a cena no tempo `t` (0 a 1). */
  irPara: (t: number) => void;
  onProgresso: (feito: number, total: number, restanteS: number) => void;
  sinal: AbortSignal;
}) {
  const { quadro, saidaW, saidaH, duracao, fps, formato, nome, irPara, onProgresso, sinal } = opts;
  const codec = formato === "gif" ? null : await codecDisponivel(formato, saidaW, saidaH);
  if (formato !== "gif" && !codec) throw new Error(`Este navegador não codifica ${formato.toUpperCase()}. Tente GIF ou o Chrome.`);

  const alvo = document.createElement("canvas");
  alvo.width = saidaW;
  alvo.height = saidaH;
  const ctx = alvo.getContext("2d", { willReadFrequently: formato === "gif" });
  if (!ctx) throw new Error("Sem canvas 2D.");

  const target = new BufferTarget();
  const output = codec ? new Output({ format: formato === "mp4" ? new Mp4OutputFormat() : new WebMOutputFormat(), target }) : null;
  const fonte = codec ? new CanvasSource(alvo, { codec, bitrate: QUALITY_HIGH }) : null;
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
      await proximoPaint();
      const c = await domToCanvas(contexto);
      ctx.clearRect(0, 0, saidaW, saidaH);
      if (i === 0) conferirQuadro(c);
      ctx.drawImage(c, 0, 0, saidaW, saidaH);
      if (gif) {
        const { data } = ctx.getImageData(0, 0, saidaW, saidaH);
        const paleta = quantize(data, 256);
        gif.writeFrame(applyPalette(data, paleta), saidaW, saidaH, { palette: paleta, delay: 1000 / fps, repeat: 0 });
        // Devolve o controle à tela: a paleta é conta pesada e o progresso precisa pintar.
        await new Promise((r) => setTimeout(r));
      } else if (fonte) {
        await fonte.add(i / fps, 1 / fps);
      }
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
    const bytes = gif.bytes();
    baixar(new Blob([bytes.slice()], { type: "image/gif" }), `${nome}.gif`);
    return bytes.byteLength;
  }
  const buffer = target.buffer;
  if (!buffer) throw new Error("O vídeo saiu vazio.");
  baixar(new Blob([buffer], { type: `video/${formato}` }), `${nome}.${formato}`);
  return buffer.byteLength;
}
