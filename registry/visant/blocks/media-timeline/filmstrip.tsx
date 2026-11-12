// Tira de quadros (filmstrip) dentro de um clipe de vídeo. Recebe uma imagem com N quadros lado a
// lado (sprite) e mostra, em cada ladrilho, o quadro do tempo que cai embaixo dele, no zoom que
// estiver. Não sabe de onde vem a imagem: url e medida chegam por props.

export interface FilmstripSprite {
  /** Quadros na imagem, lado a lado. */
  frames: number;
  /** Largura e altura de um quadro na imagem (px). */
  width: number;
  height: number;
  /** Duração do vídeo que a imagem cobre (s). */
  duration: number;
}

/** Ladrilhos colados na largura natural do quadro; acima de 800 por clipe, eles se espaçam. */
const MAX_TILES = 800;

export function Filmstrip({ src, sprite, from, duration, pxPerSecond, height }: {
  src: string; sprite: FilmstripSprite;
  /** Onde o clipe começa dentro do vídeo (s) e quanto dura. */
  from: number; duration: number;
  pxPerSecond: number; height: number;
}) {
  const width = duration * pxPerSecond;
  const natural = sprite.width * (height / sprite.height);
  const tile = Math.max(natural, width / MAX_TILES);
  const count = Math.max(1, Math.ceil(width / tile));
  const tiles = [];
  for (let k = 0; k < count; k++) {
    const t = from + (k * tile + tile / 2) / pxPerSecond;
    const i = Math.max(0, Math.min(sprite.frames - 1, Math.floor((t / sprite.duration) * sprite.frames)));
    tiles.push(
      <span key={k} style={{ left: k * tile, width: natural, backgroundImage: `url(${src})`, backgroundSize: `${sprite.frames * natural}px ${height}px`, backgroundPosition: `${-i * natural}px 0` }} />,
    );
  }
  return <span aria-hidden className="mt-filmstrip">{tiles}</span>;
}
