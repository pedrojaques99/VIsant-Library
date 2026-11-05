/**
 * As telas enviadas, guardadas no próprio navegador pela Cache API: recarregar a página não
 * perde o trabalho, e o arquivo continua sem sair da máquina. Sem armazenamento (janela anônima
 * em alguns navegadores), vale só nesta visita.
 */

const CAIXA = "visant-mockup-telas";
const PREFIXO = "/__tela/";
const LIMITE = 8;

export interface ArquivoSalvo {
  id: string;
  nome: string;
  blob: Blob;
}

const abrir = () => (typeof caches === "undefined" ? Promise.resolve(null) : caches.open(CAIXA).catch(() => null));

export async function guardarArquivo(id: string, nome: string, arquivo: Blob) {
  const caixa = await abrir();
  if (!caixa) return;
  await caixa
    .put(PREFIXO + id, new Response(arquivo, { headers: { "content-type": arquivo.type, "x-nome": encodeURIComponent(nome) } }))
    .catch(() => {});
  const chaves = await caixa.keys();
  // O id leva o instante do envio: os mais antigos saem primeiro.
  const antigas = [...chaves].sort((a, b) => a.url.localeCompare(b.url)).slice(0, Math.max(0, chaves.length - LIMITE));
  await Promise.all(antigas.map((c) => caixa.delete(c)));
}

export async function lerArquivos(): Promise<ArquivoSalvo[]> {
  const caixa = await abrir();
  if (!caixa) return [];
  const chaves = await caixa.keys();
  const lidos = await Promise.all(
    chaves.map(async (c) => {
      const r = await caixa.match(c);
      if (!r) return null;
      return { id: new URL(c.url).pathname.slice(PREFIXO.length), nome: decodeURIComponent(r.headers.get("x-nome") ?? "Arquivo"), blob: await r.blob() };
    }),
  );
  return lidos.filter((a): a is ArquivoSalvo => a !== null).sort((a, b) => b.id.localeCompare(a.id));
}
