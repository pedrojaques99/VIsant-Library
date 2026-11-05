/**
 * O que a vitrine conta: visita, página, peça aberta, origem e comando copiado. Vai para o
 * Supabase por `/api/conta` e aparece em `/admin`.
 *
 * Sem cookie e sem identificador: a visita é uma marca no `sessionStorage` da aba, e o que sai é
 * só "mais um" em tipo, item e dia. `sendBeacon` não segura a navegação, e admin não conta a si mesmo.
 */

const ATIVO = import.meta.env.PROD;
const CHAVE_VISITA = "visant:visita";
const ROTAS_INTERNAS = /^\/(admin|burilar|callback)(\/|$)/;

type Linha = { tipo: string; item: string };

function enviar(linhas: Linha[]) {
  if (!ATIVO || !linhas.length) return;
  try {
    if (localStorage.getItem("visant:curadoria-admin") === "1") return;
    navigator.sendBeacon("/api/conta", new Blob([JSON.stringify({ linhas })], { type: "application/json" }));
  } catch {
    /* Contar nunca atrapalha quem está navegando. */
  }
}

export function contarPagina(caminho: string) {
  if (!ATIVO || ROTAS_INTERNAS.test(caminho)) return;
  const linhas: Linha[] = [{ tipo: "pagina", item: caminho.slice(0, 80) }];
  const peca = /^\/c\/([a-z0-9-]+)/.exec(caminho)?.[1];
  if (peca) linhas.push({ tipo: "peca", item: peca });
  try {
    if (!sessionStorage.getItem(CHAVE_VISITA)) {
      sessionStorage.setItem(CHAVE_VISITA, "1");
      linhas.push({ tipo: "visita", item: "site" });
      const host = document.referrer ? new URL(document.referrer).hostname : "";
      linhas.push({ tipo: "origem", item: host && host !== location.hostname ? host.slice(0, 80) : "direto" });
    }
  } catch {
    /* Sem armazenamento: conta só a página. */
  }
  enviar(linhas);
}

/** O comando copiado: a peça do `shadcn add`, ou `skills` para o instalador das skills. */
/** O que mede o estúdio: quem pôs a própria tela e quem levou um arquivo. */
export function contarEstudio(acao: string) {
  enviar([{ tipo: "estudio", item: acao.slice(0, 80) }]);
}

export function contarCopia(texto: string) {
  const peca = /@visant\/([a-z0-9-]+)/.exec(texto)?.[1];
  const item = peca ?? (/skills add/.test(texto) ? "skills" : null);
  if (item) enviar([{ tipo: "copia", item }]);
}
