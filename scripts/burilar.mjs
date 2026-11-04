#!/usr/bin/env node
/**
 * A burilação de copy, do lado do repo. O desenho está em PLANO-BURILACAO.md.
 *
 *   npm run burilar -- next             # que dúvidas testar hoje, e o que falta escrever
 *   npm run burilar -- check [arquivo]  # confere a rodada antes de publicar (a última, sem arquivo)
 *   npm run burilar -- sync             # traz os votos de produção e escreve burilacao/PLACAR.md
 *
 * Reaproveita o modelo do lab (`lab-taste.mjs`): cada voto é uma tentativa, e a dimensão mais
 * indecisa é a próxima a ser perguntada. Nada aqui muda a skill: o placar só PROPÕE regra.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beta, rate, rng } from "./lab-taste.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(RAIZ, "burilacao");
const lerJson = (f) => JSON.parse(readFileSync(f, "utf8"));

export const DIMENSOES = lerJson(join(DIR, "dimensoes.json"));
export const MIN_VOTOS = 8;
export const MIN_TAXA = 0.8;

export const rodadas = () =>
  readdirSync(join(DIR, "rodadas"))
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => lerJson(join(DIR, "rodadas", f)));

/** votos: [{ duelo, escolha }]. Só A e B contam: "nenhuma" e "minha" não elegem um lado. */
export function placar(todasRodadas, votos) {
  const duelos = new Map(todasRodadas.flatMap((r) => r.duelos).map((d) => [d.id, d]));
  const dims = Object.fromEntries(
    Object.entries(DIMENSOES).map(([dim, valores]) => [dim, { valores: Object.fromEntries(valores.map((v) => [v, 0])), n: 0, viradas: 0 }]),
  );
  const imitacao = { n: 0, acertos: 0 };
  const motivos = {};
  const escritas = [];
  const lado = new Map();

  for (const v of votos) {
    for (const m of v.motivos ?? []) motivos[m] = (motivos[m] ?? 0) + 1;
    const d = duelos.get(v.duelo);
    if (!d) continue;
    if (v.escolha === "minha" && v.escrita) escritas.push({ onde: d.onde, escrita: v.escrita });
    if (v.escolha !== "a" && v.escolha !== "b") continue;
    if (d.tipo === "imitacao") {
      imitacao.n++;
      if (d[v.escolha].real) imitacao.acertos++;
      continue;
    }
    const cel = dims[d.dimensao];
    if (!cel) continue;
    const valor = d[v.escolha].valor;
    /* Duelo repetido com o voto contrário: a dúvida ainda não amadureceu. */
    const origem = d.repete ?? d.id;
    if (lado.has(origem) && lado.get(origem) !== valor) cel.viradas++;
    lado.set(origem, valor);
    cel.valores[valor]++;
    cel.n++;
  }
  return { dims, imitacao, motivos, escritas };
}

/** O lado vencedor com taxa suavizada, para pequenas amostras não virarem certeza. */
export function lider(cel) {
  const [valor, votos] = Object.entries(cel.valores).sort((a, b) => b[1] - a[1])[0];
  return { valor, votos, taxa: rate(votos, cel.n) };
}

export const propostas = (p) =>
  Object.entries(p.dims)
    .filter(([, c]) => c.n >= MIN_VOTOS && c.viradas === 0 && lider(c).taxa >= MIN_TAXA)
    .map(([dim, c]) => ({ dim, ...lider(c), n: c.n }));

/** As mais indecisas primeiro: sorteia a taxa de cada dimensão e fica com as mais perto de 50%. */
export function proximas(p, quantas = 4, r = rng()) {
  return Object.entries(p.dims)
    .map(([dim, c]) => {
      const a = Object.values(c.valores)[0];
      return { dim, indecisao: Math.abs(beta(a + 1, c.n - a + 1, r) - 0.5) };
    })
    .sort((x, y) => x.indecisao - y.indecisao)
    .slice(0, quantas)
    .map((x) => x.dim);
}

/** Lista o que está errado na rodada. Vazio é rodada boa. */
export function conferir(rodada, acervo) {
  const erros = [];
  const reais = new Set(acervo.map((a) => a.texto));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rodada.data ?? "")) erros.push("data inválida");
  if (rodada.duelos?.length !== 5) erros.push(`são ${rodada.duelos?.length ?? 0} duelos, e a rodada tem 5`);
  if (rodada.duelos?.length && rodada.duelos.at(-1).tipo !== "imitacao") erros.push("a imitação fecha a rodada");
  const ids = new Set();
  for (const d of rodada.duelos ?? []) {
    if (!d.id?.startsWith(`${rodada.data}-`)) erros.push(`${d.id}: o id começa pela data da rodada`);
    if (ids.has(d.id)) erros.push(`${d.id}: id repetido`);
    ids.add(d.id);
    if (!d.onde) erros.push(`${d.id}: falta dizer onde a frase mora`);
    if (!d.a?.texto || !d.b?.texto || d.a.texto === d.b.texto) erros.push(`${d.id}: A e B precisam de textos diferentes`);
    if (d.tipo === "imitacao") {
      const marcadas = [d.a, d.b].filter((o) => o?.real);
      if (marcadas.length !== 1) erros.push(`${d.id}: imitação marca exatamente uma frase real`);
      else if (!reais.has(marcadas[0].texto)) erros.push(`${d.id}: a frase real não está em acervo.json`);
      const outra = d.a?.real ? d.b : d.a;
      if (outra && reais.has(outra.texto)) erros.push(`${d.id}: a frase gerada está no acervo`);
    } else {
      const valores = DIMENSOES[d.dimensao];
      if (!valores) erros.push(`${d.id}: dimensão desconhecida`);
      else if (!valores.includes(d.a?.valor) || !valores.includes(d.b?.valor) || d.a.valor === d.b.valor) {
        erros.push(`${d.id}: A e B ficam um em cada lado de ${d.dimensao}`);
      }
    }
  }
  return erros;
}

function caminhoDoLinter() {
  const opcoes = [
    join(homedir(), ".claude/skills/visant-copy/scripts/copy-lint.mjs"),
    resolve(RAIZ, "../visant-skills-public/visant-copy/scripts/copy-lint.mjs"),
  ];
  return opcoes.find((c) => existsSync(c)) ?? null;
}

/** As frases geradas passam no copy-lint. As do acervo são de gente, e ficam como são. */
function lintDasFrases(rodada, acervo) {
  const L = caminhoDoLinter();
  if (!L) return ["copy-lint não encontrado: instale a visant-copy"];
  const reais = new Set(acervo.map((a) => a.texto));
  const frases = (rodada.duelos ?? []).flatMap((d) => [d.a?.texto, d.b?.texto]).filter((t) => t && !reais.has(t));
  const pasta = mkdtempSync(join(tmpdir(), "burilar-"));
  try {
    const arquivo = join(pasta, "frases.txt");
    writeFileSync(arquivo, frases.join("\n") + "\n");
    const r = spawnSync(process.execPath, [L, arquivo], { encoding: "utf8" });
    return r.status === 0 ? [] : [`copy-lint reprovou:\n${r.stdout}`];
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
}

export function markdown(p) {
  const linhas = ["# Placar da burilação", "", "Gerado por `npm run burilar -- sync`. Editar aqui não adianta.", ""];
  linhas.push("| dúvida | votos | na frente | taxa | viradas |", "|---|---|---|---|---|");
  for (const [dim, c] of Object.entries(p.dims)) {
    const l = lider(c);
    linhas.push(`| ${dim} | ${c.n} | ${c.n ? l.valor : ""} | ${c.n ? `${Math.round(l.taxa * 100)}%` : ""} | ${c.viradas} |`);
  }
  linhas.push("", "## Teste de imitação", "");
  linhas.push(
    p.imitacao.n
      ? `Acertou a frase real em ${p.imitacao.acertos} de ${p.imitacao.n}. Quanto mais perto de 50%, mais a skill soa como vocês.`
      : "Sem votos ainda.",
  );
  const prop = propostas(p);
  linhas.push("", "## Regras propostas", "");
  linhas.push(prop.length ? "Só entram na skill com aprovação." : `Nenhuma ainda: pede ${MIN_VOTOS} votos, ${MIN_TAXA * 100}% para um lado e nenhuma virada.`);
  for (const r of prop) linhas.push(`- **${r.dim}:** preferir ${r.valor} (${r.votos} de ${r.n}).`);
  if (Object.keys(p.motivos).length) {
    linhas.push("", "## O que pesou contra", "");
    for (const [m, n] of Object.entries(p.motivos).sort((a, b) => b[1] - a[1])) linhas.push(`- ${m}: ${n}`);
  }
  if (p.escritas.length) {
    linhas.push("", "## Frases escritas por quem votou", "", "Candidatas ao `acervo.json`.", "");
    for (const e of p.escritas) linhas.push(`- ${e.escrita} (${e.onde})`);
  }
  return linhas.join("\n") + "\n";
}

const VOTOS = join(DIR, "votos.json");
const lerVotos = () => (existsSync(VOTOS) ? lerJson(VOTOS) : []);

function next() {
  const escolhidas = proximas(placar(rodadas(), lerVotos()));
  console.log(`Dúvidas de hoje: ${escolhidas.join(", ")}\n`);
  console.log("Escreva burilacao/rodadas/<data>.json com a skill visant-copy:");
  console.log("- 4 duelos, um por dúvida, sobre frases que estão no site. A e B mudam só essa dúvida.");
  console.log("- 1 duelo de imitação: uma frase de burilacao/acervo.json contra uma gerada.");
  console.log("- Sem cena, memória ou número inventado.");
  console.log("Depois: npm run burilar -- check");
  return 0;
}

function check(arquivo) {
  const rodada = arquivo ? lerJson(resolve(arquivo)) : rodadas().at(-1);
  const acervo = lerJson(join(DIR, "acervo.json"));
  const erros = [...conferir(rodada, acervo), ...lintDasFrases(rodada, acervo)];
  if (erros.length) {
    console.error(`✗ rodada ${rodada.data}\n  ${erros.join("\n  ")}`);
    return 1;
  }
  console.log(`✓ rodada ${rodada.data}: ${rodada.duelos.length} duelos`);
  return 0;
}

async function sync() {
  const r = await fetch("https://ui.visantlabs.com/api/burilacao", { signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error(`GET /api/burilacao → ${r.status}`);
  const { store, votos } = await r.json();
  if (!store) throw new Error("store fora do ar, ou burilacao/supabase.sql não foi aplicado");
  writeFileSync(VOTOS, JSON.stringify(votos, null, 2) + "\n");
  writeFileSync(join(DIR, "PLACAR.md"), markdown(placar(rodadas(), votos)));
  console.log(`✓ ${votos.length} voto(s) em burilacao/votos.json e burilacao/PLACAR.md`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [comando, arquivo] = process.argv.slice(2);
  if (comando === "next") process.exitCode = next();
  else if (comando === "check") process.exitCode = check(arquivo);
  else if (comando === "sync") {
    sync().catch((e) => {
      console.error(`✗ ${e.message}`);
      process.exitCode = 1;
    });
  } else {
    console.error("uso: npm run burilar -- next | check [arquivo] | sync");
    process.exitCode = 1;
  }
}
