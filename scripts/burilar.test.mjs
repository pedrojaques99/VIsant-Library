// node --test scripts/burilar.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { conferir, lider, markdown, placar, propostas, proximas } from "./burilar.mjs";
import { rng } from "./lab-taste.mjs";

const duelo = (id, repete) => ({
  id,
  repete,
  dimensao: "curto-longo",
  onde: "x",
  a: { texto: `${id} a`, valor: "curto" },
  b: { texto: `${id} b`, valor: "longo" },
});
const imitacao = { id: "2026-01-01-i", tipo: "imitacao", onde: "x", a: { texto: "real", real: true }, b: { texto: "gerada" } };

test("A e B contam, nenhuma e minha não elegem lado", () => {
  const p = placar(
    [{ duelos: [duelo("d1"), duelo("d2"), duelo("d3")] }],
    [
      { duelo: "d1", escolha: "a" },
      { duelo: "d2", escolha: "nenhuma" },
      { duelo: "d3", escolha: "minha", escrita: "minha frase" },
    ],
  );
  assert.equal(p.dims["curto-longo"].n, 1);
  assert.equal(p.escritas[0].escrita, "minha frase");
});

test("o lado do valor vale, em qualquer posição", () => {
  const trocado = { ...duelo("d1"), a: { texto: "x", valor: "longo" }, b: { texto: "y", valor: "curto" } };
  const p = placar([{ duelos: [trocado] }], [{ duelo: "d1", escolha: "a" }]);
  assert.equal(p.dims["curto-longo"].valores.longo, 1);
});

test("imitação conta acerto e não entra no placar das dúvidas", () => {
  const p = placar(
    [{ duelos: [imitacao] }],
    [
      { duelo: imitacao.id, escolha: "a" },
      { duelo: imitacao.id, escolha: "b" },
    ],
  );
  assert.deepEqual(p.imitacao, { n: 2, acertos: 1 });
  assert.equal(Object.values(p.dims).reduce((s, c) => s + c.n, 0), 0);
});

test("oito votos iguais propõem regra, sete não, e uma virada segura", () => {
  const duelos = Array.from({ length: 8 }, (_, i) => duelo(`d${i}`));
  const votos = duelos.map((d) => ({ duelo: d.id, escolha: "a" }));
  assert.equal(propostas(placar([{ duelos }], votos)).length, 1);
  assert.equal(propostas(placar([{ duelos }], votos.slice(1))).length, 0);

  const repetido = duelo("r", "d0");
  const comVirada = placar([{ duelos: [...duelos, repetido] }], [...votos, { duelo: "r", escolha: "b" }]);
  assert.equal(comVirada.dims["curto-longo"].viradas, 1);
  assert.equal(propostas(comVirada).length, 0);
});

test("a dúvida decidida para de ser perguntada", () => {
  const duelos = Array.from({ length: 30 }, (_, i) => duelo(`d${i}`));
  const p = placar([{ duelos }], duelos.map((d) => ({ duelo: d.id, escolha: "a" })));
  const r = rng(11);
  let vezes = 0;
  for (let i = 0; i < 300; i++) if (proximas(p, 4, r).includes("curto-longo")) vezes++;
  assert.ok(vezes < 30, `curto-longo saiu ${vezes} de 300`);
});

test("conferir reprova rodada torta", () => {
  const acervo = [{ texto: "real" }];
  const boa = {
    data: "2026-01-01",
    duelos: [...["a", "b", "c", "d"].map((x) => duelo(`2026-01-01-${x}`)), imitacao],
  };
  assert.deepEqual(conferir(boa, acervo), []);
  assert.match(conferir({ ...boa, duelos: boa.duelos.slice(0, -1) }, acervo).join(), /4 duelos/);
  assert.match(conferir(boa, []).join(), /acervo/);
  assert.match(conferir({ ...boa, duelos: [imitacao, ...boa.duelos.slice(0, -1)] }, acervo).join(), /fecha a rodada/);
  const mesmoLado = { ...duelo("2026-01-01-a"), b: { texto: "y", valor: "curto" } };
  assert.match(conferir({ ...boa, duelos: [mesmoLado, ...boa.duelos.slice(1)] }, acervo).join(), /um em cada lado/);
});

test("placar sem voto não quebra", () => {
  const p = placar([], []);
  assert.equal(lider(p.dims["curto-longo"]).votos, 0);
  assert.match(markdown(p), /Nenhuma ainda/);
});
