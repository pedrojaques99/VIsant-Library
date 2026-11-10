/**
 * Cenas e renders guardados, a mesma loja para a API HTTP e para o MCP.
 * Cena vai para disco (JSON), então uma criada pela API renderiza pelo MCP e vice-versa.
 * Render é job em memória: quem pede espera, ou consulta pelo id.
 */
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { renderizar, resolver, SAIDA_PADRAO } from "./motor.mjs";

const PASTA_CENAS = path.join(SAIDA_PADRAO, "cenas");

export async function criarCena(spec) {
  const { spec: s, cena } = await resolver(spec);
  const id = s.nome ?? `cena-${randomUUID().slice(0, 8)}`;
  mkdirSync(PASTA_CENAS, { recursive: true });
  writeFileSync(path.join(PASTA_CENAS, `${id}.json`), JSON.stringify({ id, spec: { ...s, nome: id } }, null, 2));
  return { id, cena };
}

export function lerCena(id) {
  const f = path.join(PASTA_CENAS, `${path.basename(id)}.json`);
  if (!existsSync(f)) throw new Error(`Cena ${id} não existe.`);
  return JSON.parse(readFileSync(f, "utf8"));
}

const renders = new Map();

/** Começa um render e devolve o job na hora; `job.promessa` resolve quando os arquivos existem. */
export function iniciarRender({ id, spec, pasta }) {
  const s = spec ?? lerCena(id).spec;
  const rid = randomUUID().slice(0, 8);
  const job = { id: rid, cena: s.nome ?? id ?? null, status: "fila", etapa: null, inicio: new Date().toISOString() };
  renders.set(rid, job);
  job.promessa = renderizar(s, { pasta: pasta ?? SAIDA_PADRAO, aoProgresso: (e) => ((job.status = "renderizando"), (job.etapa = e)) }).then(
    (r) => Object.assign(job, { status: "pronto", etapa: null, arquivos: r.arquivos, segundos: r.segundos, errosDaPagina: r.errosDaPagina }),
    (e) => Object.assign(job, { status: "erro", etapa: null, erro: e.message }),
  );
  return job;
}

export function lerRender(rid) {
  const j = renders.get(rid);
  if (!j) throw new Error(`Render ${rid} não existe (renders vivem enquanto o servidor estiver de pé).`);
  const { promessa, ...publico } = j;
  return publico;
}
