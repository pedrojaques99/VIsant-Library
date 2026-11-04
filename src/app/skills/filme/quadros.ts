/*
 * A trilha: mostra o quadro que a rolagem pede.
 *
 * Vídeo H.264 com keyframe em todo quadro (`-g 1`), baixado inteiro antes de usar:
 * a busca nunca espera rede nem decodifica quadro vizinho. Foi medido contra sequência
 * de imagens num canvas. Em Chrome e Firefox empatam; sem GPU e com a CPU a 1/6, o
 * vídeo não perdeu quadro e o canvas perdeu 119 de 120, porque o `drawImage` roda na
 * thread principal e o decodificador de vídeo não.
 *
 * Só uma busca por vez: enquanto uma não termina, a próxima espera e pula direto
 * para o quadro mais recente. Embaixo do vídeo mora sempre o quadro de espera, então a
 * cena nunca aparece vazia enquanto o vídeo baixa, e é ele que fica se o vídeo não abrir.
 */

import { redeLenta } from "@/lib/rede";

export type Trilha = {
  el: HTMLElement;
  /** Só o quadro parado, que pesa pouco: chega antes de a cena abrir. */
  preparar(): void;
  carregar(): void;
  soltar(): void;
  irPara(q: number): void;
};

export function trilhaVideo(src: string, espera: string, reserva: string, fps: number): Trilha {
  const caixa = document.createElement("div");
  caixa.className = "filme-trilha";
  const quadro = document.createElement("img");
  quadro.alt = "";
  quadro.decoding = "async";
  caixa.append(quadro);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.preload = "auto";
  /* Só aparece depois de pintar o quadro pedido: antes disso a cena é o quadro de espera, nunca o preto. */
  video.style.visibility = "hidden";
  caixa.append(video);

  /* Economia de dados, rede lenta ou formato que este navegador nem tenta abrir: fica no quadro do resultado. */
  const semVideo = () => redeLenta() || !video.canPlayType("video/mp4");

  let iniciado = false;
  let quer = 0;
  let buscando = false;
  let tentouDireto = false;
  let url: string | null = null;

  const buscar = () => {
    if (buscando || video.readyState < 1) return;
    const t = (quer + 0.5) / fps;
    if (Math.abs(video.currentTime - t) < 0.5 / fps) return;
    buscando = true;
    video.currentTime = t;
  };

  video.addEventListener("seeked", () => {
    buscando = false;
    video.style.visibility = "visible";
    buscar();
  });
  video.addEventListener("loadedmetadata", buscar);
  video.addEventListener(
    "loadeddata",
    () => {
      if (!buscando) video.style.visibility = "visible";
      /* Safari no iPhone só pinta a busca depois de o vídeo ter tocado uma vez. */
      if (matchMedia("(pointer: coarse)").matches) {
        void video
          .play()
          .then(() => video.pause())
          .catch(() => {});
      }
    },
    { once: true },
  );
  video.addEventListener("error", () => {
    /* Devolver o vídeo também dispara `error` no Safari: não é falha, e o capítulo volta a tocar. */
    if (!iniciado) return;
    if (!tentouDireto) {
      tentouDireto = true;
      video.src = src;
      return;
    }
    quadro.src = reserva;
    video.remove();
  });

  return {
    el: caixa,
    preparar() {
      if (!quadro.getAttribute("src")) quadro.src = semVideo() ? reserva : espera;
    },
    carregar() {
      if (iniciado || !video.isConnected || semVideo()) return;
      iniciado = true;
      void fetch(src)
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.blob();
        })
        .then((b) => {
          if (!iniciado) return;
          url = URL.createObjectURL(b);
          video.src = url;
        })
        .catch(() => {
          tentouDireto = true;
          video.src = src;
        });
    },
    /* Celular tem poucos decodificadores: capítulo longe devolve o seu. */
    soltar() {
      if (!iniciado) return;
      iniciado = false;
      buscando = false;
      tentouDireto = false;
      video.style.visibility = "hidden";
      video.removeAttribute("src");
      video.load();
      if (url) URL.revokeObjectURL(url);
      url = null;
    },
    irPara(q) {
      quer = q;
      buscar();
    },
  };
}
