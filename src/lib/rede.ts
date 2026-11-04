import * as React from "react";

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

/*
 * A primeira dobra ficou de pé? A rota montou (sem espera na tela) e as imagens visíveis
 * chegaram. Em Slow 4G a banda é dividida com quem está descendo junto, então tudo o que não
 * aparece nesse quadro (a marca do cabeçalho, as demos de baixo, o GSAP) entra na fila depois.
 * O teto segura imagem que trava: nada fica de fora para sempre.
 */
const TETO_DA_DOBRA_MS = 12_000;
let dobra: Promise<void> | null = null;

function dobraDePe() {
  if (!document.querySelector("#root header") || document.querySelector("main.dobra, [aria-busy=true]")) return false;
  /* A marca decide o que pinta (`/marca` só tem logo depois dela), e a fonte ainda divide a banda. */
  if (!performance.getEntriesByType("resource").some((r) => /\/r\/theme-[^/]+\.json/.test(r.name))) return false;
  if (document.fonts.status === "loading") return false;
  return [...document.images].every((img) => {
    const r = img.getBoundingClientRect();
    const naTela = r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < innerHeight;
    return !naTela || img.complete;
  });
}

export function esperarDobra() {
  return (dobra ??= new Promise<void>((resolve) => {
    const inicio = performance.now();
    const olhar = () => {
      if (dobraDePe() || performance.now() - inicio > TETO_DA_DOBRA_MS) {
        const ocioso = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 200));
        ocioso(() => resolve(), { timeout: 1000 });
      } else window.setTimeout(olhar, 150);
    };
    olhar();
  }));
}

/** `true` quando dá pra baixar o que fica fora da primeira dobra. Na rede boa, desde o começo. */
export function useDobraAssentada() {
  const [ok, setOk] = React.useState(() => !redeLenta());
  React.useEffect(() => {
    if (!ok) void esperarDobra().then(() => setOk(true));
  }, [ok]);
  return ok;
}
