#!/usr/bin/env node
/**
 * API HTTP local do estúdio de mockups. Só escuta em 127.0.0.1: grava arquivo no disco de quem roda.
 *
 *   GET  /presets                 receitas, presets, poses, movimentos, aparelhos
 *   POST /cenas          {spec}   valida e guarda a cena → { id, cena }
 *   GET  /cenas/:id               a spec guardada
 *   POST /cenas/:id/render {pasta?}  começa o render → 202 { id, status }
 *   POST /render  {spec, pasta?}  cria e renderiza de uma vez, espera e devolve os arquivos
 *   GET  /renders/:id             status do render: fila | renderizando | pronto | erro
 */
import http from "node:http";
import { criarCena, iniciarRender, lerCena, lerRender } from "./cenas.mjs";
import { fechar, listarPresets } from "./motor.mjs";

const PORTA = Number(process.env.MOCKUP_API_PORTA ?? 4319);

const ler = (req) =>
  new Promise((ok, falha) => {
    let b = "";
    req.on("data", (d) => (b += d));
    req.on("end", () => {
      try {
        ok(b ? JSON.parse(b) : {});
      } catch {
        falha(Object.assign(new Error("JSON inválido"), { status: 400 }));
      }
    });
  });

const responder = (res, status, corpo) => {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(corpo, null, 2));
};

const servidor = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://x");
  const p = pathname.split("/").filter(Boolean);
  try {
    if (req.method === "GET" && pathname === "/presets") return responder(res, 200, await listarPresets());
    if (req.method === "POST" && pathname === "/cenas") return responder(res, 201, await criarCena(await ler(req)));
    if (req.method === "GET" && p[0] === "cenas" && p.length === 2) return responder(res, 200, lerCena(p[1]));
    if (req.method === "POST" && p[0] === "cenas" && p[2] === "render") {
      const corpo = await ler(req);
      const { promessa, ...job } = iniciarRender({ id: p[1], pasta: corpo.pasta });
      return responder(res, 202, job);
    }
    if (req.method === "POST" && pathname === "/render") {
      const corpo = await ler(req);
      const spec = corpo.spec ?? corpo;
      await criarCena(spec);
      const job = iniciarRender({ spec, pasta: corpo.pasta });
      await job.promessa;
      return responder(res, job.status === "pronto" ? 200 : 500, lerRender(job.id));
    }
    if (req.method === "GET" && p[0] === "renders" && p.length === 2) return responder(res, 200, lerRender(p[1]));
    responder(res, 404, { erro: "Rota desconhecida. Veja MOCKUP-AGENTE.md." });
  } catch (e) {
    const status = e.status ?? (e.name === "ZodError" ? 400 : /não existe/.test(e.message) ? 404 : 500);
    responder(res, status, { erro: e.name === "ZodError" ? e.issues : e.message });
  }
});

servidor.listen(PORTA, "127.0.0.1", () => process.stderr.write(`[mockup] API em http://127.0.0.1:${PORTA}\n`));
const sair = async () => {
  servidor.close();
  await fechar();
  process.exit(0);
};
process.on("SIGINT", sair);
process.on("SIGTERM", sair);
