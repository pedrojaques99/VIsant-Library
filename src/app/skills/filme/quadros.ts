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

export type Trilha = {
  el: HTMLElement;
  carregar(): void;
  soltar(): void;
  irPara(q: number): void;
};

export function trilhaVideo(src: string, espera: string, reserva: string, fps: number): Trilha {
  const caixa = document.createElement("div");
  caixa.className = "filme-trilha";
  const quadro = document.createElement("img");
  quadro.src = espera;
  quadro.alt = "";
  quadro.decoding = "async";
  caixa.append(quadro);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.preload = "auto";
  caixa.append(video);

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
    buscar();
  });
  video.addEventListener("loadedmetadata", buscar);
  video.addEventListener(
    "loadeddata",
    () => {
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
    carregar() {
      if (iniciado) return;
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
