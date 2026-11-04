/*
 * As fotos de antes e depois em três larguras: o celular leva a de 800 ou 1200 e o desktop
 * de DPR 2 leva a de 1800. Saíram do Remotion em 2x, então o texto miúdo fica legível.
 */
const ARQUIVOS = import.meta.glob("./posters/*.webp", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

const url = (nome: string) => ARQUIVOS[`./posters/${nome}.webp`];

export const foto = (nome: string) => ({
  src: url(`${nome}-1200`),
  srcSet: [800, 1200, 1800].map((w) => `${url(`${nome}-${w}`)} ${w}w`).join(", "),
});

export const miniatura = (nome: string) => url(`${nome}-t`);
export const fotoPequena = (nome: string) => url(`${nome}-800`);
