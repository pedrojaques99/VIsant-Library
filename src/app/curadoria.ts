"use client";

/**
 * A curadoria do acervo, do lado da vitrine.
 *
 * As notas moram em `curadoria/notas.json`, versionado, e entram no bundle por
 * import: em produção a vitrine lê o arquivo do último build e esconde o que
 * está arquivado, sem servidor nenhum. Em dev o mesmo dado vem do endpoint
 * (`scripts/vite-curadoria.mjs`) e é recarregado a cada avaliação, então dar
 * nota 2 numa peça a tira da grade na hora.
 *
 * Em produção quem edita é o admin do Visant Labs: ao entrar, `entrarNaCuradoria` troca o token
 * por uma sessão em `/api/curadoria`, e só então as notas vivas descem. Visita comum não faz
 * pedido nenhum: lê o arquivo do build.
 *
 * Arquivar não apaga nada: a peça continua no registry, instalável, e na ficha
 * por link direto. Ela só sai da grade e da busca até a nota subir.
 */

import * as React from "react";
import NOTAS_DO_BUILD from "../../curadoria/notas.json";

export interface Nota {
  nota: number;
  comentario?: string;
  excluir?: boolean;
  data?: string;
}
export type Notas = Record<string, Nota>;

/** Abaixo disto (inclusive) a peça sai da vitrine. Igual ao do plugin. */
export const NOTA_DE_CORTE = 2;

export const arquivada = (n?: Nota) => Boolean(n && (n.excluir || n.nota <= NOTA_DE_CORTE));

/** Só uma dica de que vale perguntar: quem decide é a sessão, conferida no servidor. */
const CHAVE_ADMIN = "visant:curadoria-admin";
const ENDPOINT = import.meta.env.DEV ? "/__curadoria" : "/api/curadoria";

let ativa: boolean = import.meta.env.DEV;
/** Quem pode editar: dev server, ou admin do Visant Labs com sessão. Leia junto de `useNotas`. */
export const curadoriaAtiva = () => ativa;

function lerDica() {
  try {
    return localStorage.getItem(CHAVE_ADMIN) === "1";
  } catch {
    return false;
  }
}
function gravarDica(admin: boolean) {
  try {
    if (admin) localStorage.setItem(CHAVE_ADMIN, "1");
    else localStorage.removeItem(CHAVE_ADMIN);
  } catch {
    /* navegador sem armazenamento: pergunta de novo no próximo login */
  }
}

let atuais: Notas = NOTAS_DO_BUILD as Notas;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());

let recarga: Promise<void> | null = null;

export function recarregarNotas() {
  if (!ativa && !lerDica()) return Promise.resolve();
  /* Cada leitor de `useNotas` pede ao montar: uma resposta serve a todos. */
  return (recarga ??= buscarNotas().finally(() => {
    recarga = null;
  }));
}

async function buscarNotas() {
  try {
    const r = await fetch(ENDPOINT);
    if (!r.ok) return;
    if (import.meta.env.DEV) {
      atuais = (await r.json()) as Notas;
    } else {
      const d = (await r.json()) as { admin?: boolean; notas?: Notas };
      ativa = d.admin === true;
      gravarDica(ativa);
      if (ativa) atuais = { ...(NOTAS_DO_BUILD as Notas), ...d.notas };
    }
    avisar();
  } catch {
    /* sem endpoint: fica o que veio no build */
  }
}

/** Depois do login: o servidor pergunta ao Visant Labs se o dono do token é admin. */
export async function entrarNaCuradoria(token: string) {
  if (import.meta.env.DEV) return;
  try {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ acao: "entrar" }),
    });
    const d = r.ok ? ((await r.json()) as { admin?: boolean }) : {};
    gravarDica(d.admin === true);
    if (d.admin) await recarregarNotas();
  } catch {
    /* o login da pessoa não depende disto */
  }
}

export function sairDaCuradoria() {
  if (import.meta.env.DEV) return;
  gravarDica(false);
  ativa = false;
  atuais = NOTAS_DO_BUILD as Notas;
  avisar();
  void fetch(ENDPOINT, { method: "DELETE" }).catch(() => {});
}

export async function avaliar(item: string, nota: number, comentario: string, excluir: boolean) {
  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ item, nota, comentario, excluir }),
  });
  const dado = (await r.json()) as { ok?: boolean; notas?: Notas; erro?: string; error?: string };
  if (!r.ok || !dado.notas) throw new Error(dado.erro ?? dado.error ?? `HTTP ${r.status}`);
  atuais = import.meta.env.DEV ? dado.notas : { ...(NOTAS_DO_BUILD as Notas), ...dado.notas };
  avisar();
}

/** As notas atuais, re-renderizando quem usa a cada avaliação. */
export function useNotas(): Notas {
  const [, forcar] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    ouvintes.add(forcar);
    return () => {
      ouvintes.delete(forcar);
    };
  }, []);
  React.useEffect(() => {
    void recarregarNotas();
  }, []);
  return atuais;
}
