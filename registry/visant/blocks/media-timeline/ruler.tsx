// Régua que se adapta ao zoom (segundos de longe, meio segundo, quadros de perto), ímã e formatos
// de tempo. Funções puras: quem usa pode testar e reaproveitar sem o componente.

/** Distância mínima, em px, entre dois números da régua. */
const LABEL_SPACE = 64;

/** Os intervalos possíveis entre dois números da régua (s): quadros, depois segundos. */
const stepsFor = (fps: number) => [1, 2, 5, 10, 15].map((q) => q / fps).concat([1, 2, 5, 10, 15, 30, 60]);

/** O passo da régua (s), quantas marcas cabem entre dois números e quantos números há. */
export function rulerScale(pxPerSecond: number, duration: number, fps = 30) {
  const step = stepsFor(fps).find((p) => p * pxPerSecond >= LABEL_SPACE) ?? 60;
  const frames = Math.round(step * fps);
  // Marcas pequenas com pelo menos 6 px entre si: cada quadro quando cabe, senão menos.
  const divisions = step < 1
    ? [frames, 5, 3, 2, 1].find((d) => frames % d === 0 && (step * pxPerSecond) / d >= 6) ?? 1
    : [10, 5, 2, 1].find((d) => (step * pxPerSecond) / d >= 8) ?? 1;
  return { step, divisions, count: Math.ceil(duration / step) + 1 };
}

/** "3s" nos segundos inteiros; "15f" (o quadro dentro do segundo) no resto. */
export function rulerLabel(t: number, fps = 30) {
  const q = Math.round(t * fps);
  const s = Math.floor(q / fps), f = q % fps;
  if (f) return <span className="mt-ruler-frame">{f}f</span>;
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : `${s}s`;
}

/** mm:ss:ff. */
export function timecode(t: number, fps = 30) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60), q = Math.floor((t % 1) * fps);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(q).padStart(2, "0")}`;
}

/** Segundos com vírgula e sinal: "+0,42s". */
export const formatSeconds = (d: number, signed = false) =>
  `${signed ? (d > 0.0005 ? "+" : d < -0.0005 ? "−" : "±") : ""}${Math.abs(d).toFixed(2).replace(".", ",")}s`;

/** O ponto mais perto dentro de `limit` (s), ou null. */
export function snapTo(t: number, points: number[], limit: number) {
  let best: number | null = null;
  for (const p of points) if (Math.abs(p - t) <= limit && (best === null || Math.abs(p - t) < Math.abs(best - t))) best = p;
  return best;
}
