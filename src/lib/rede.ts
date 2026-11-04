/*
 * Rede que não aguenta vídeo sozinho: "economia de dados" ligada ou conexão que o
 * próprio navegador classifica abaixo de 4G (Slow 4G real cai em "3g"). Safari e
 * Firefox não têm `navigator.connection`: lá nada muda, e vale o caminho normal.
 */
type ComConexao = Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };

export function redeLenta() {
  if (typeof navigator === "undefined") return false;
  const c = (navigator as ComConexao).connection;
  return Boolean(c && (c.saveData || /(^|-)[23]g$/.test(c.effectiveType ?? "")));
}
