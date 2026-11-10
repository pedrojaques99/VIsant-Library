/**
 * O motor do estúdio para agentes: abre o próprio `/mockups` num Chrome sem janela, monta a cena
 * por `window.estudioAgente` (Estudio.tsx, só com `?agente`) e exporta pelo exportador do app
 * (modern-screenshot + mediabunny). O arquivo é o mesmo que alguém baixaria clicando.
 *
 * Catálogo (presets, poses, movimentos, aparelhos) vem do módulo vivo `modelo.ts` pelo Vite:
 * nada é copiado para cá, então o que o app ganhar, o agente ganha.
 */

import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { z } from "zod";
import { RECEITAS } from "./receitas.mjs";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PORTA = Number(process.env.MOCKUP_PORTA ?? 5189);
const BASE = process.env.MOCKUP_BASE ?? `http://localhost:${PORTA}`;
export const SAIDA_PADRAO = process.env.MOCKUP_SAIDA ?? path.join(RAIZ, "test-results", "mockup-agente");

const log = (...a) => process.stderr.write(`[mockup] ${a.join(" ")}\n`);

/* ── Esquema da cena (o contrato de API e MCP) ─────────────────────────── */

const Rot = z.object({ x: z.number(), y: z.number(), z: z.number() });
const ChaveSpec = z.object({
  pose: z.string().optional().describe("Nome da pose (heroi, mesa, frente...). Ou use rot."),
  rot: Rot.optional(),
  pos: z.object({ x: z.number(), y: z.number() }).optional(),
  tamanho: z.number().min(20).max(300).optional(),
  rolagem: z.number().min(0).max(100).optional(),
});

export const SpecCena = z.object({
  tela: z
    .string()
    .describe("Arquivo local (png/jpg/webp/mp4/webm), URL http(s), ou demo:<id> (pagina, mesa, marca, composicao, vazia)."),
  nome: z.string().regex(/^[\w.-]+$/).optional().describe("Base do nome dos arquivos de saída."),
  receita: z.string().optional().describe("Receita de showreel (list_presets mostra)."),
  preset: z.string().optional().describe("Preset do estúdio: estudio, papel, noite, foto, plano, contorno."),
  modelo: z.enum(["phone", "tablet", "laptop"]).optional(),
  pose: z.string().optional(),
  rot: Rot.optional(),
  tamanho: z.number().min(20).max(300).optional().describe("Tamanho do aparelho no quadro, em %."),
  pos: z.object({ x: z.number(), y: z.number() }).optional(),
  orientacao: z.enum(["retrato", "paisagem"]).optional().describe("Sem isso, segue a forma do arquivo."),
  ajuste: z.enum(["cover", "contain"]).optional().describe("cover preenche a tela cortando; contain mostra o arquivo inteiro (logo, peça quadrada)."),
  acabamento: z.enum(["grafite", "prata", "titanio", "areia", "noite"]).optional(),
  estilo: z.enum(["real", "plano", "contorno"]).optional(),
  movimento: z
    .object({
      tipo: z.enum(["parado", "cenas", "rolar", "flutuar", "balancar", "pendulo", "aproximar", "entrada", "varredura", "close"]).optional(),
      duracao: z.number().min(0.5).max(30).optional(),
      intensidade: z.number().min(0).max(100).optional(),
    })
    .optional(),
  chaves: z.array(ChaveSpec).optional().describe("Câmera por cenas: liga o movimento 'cenas'."),
  fundo: z
    .object({
      modo: z.enum(["cor", "degrade", "foto", "nenhum"]).optional(),
      cor: z.string().optional(),
      a: z.string().optional(),
      b: z.string().optional(),
      angulo: z.number().optional(),
      foto: z.string().optional().describe("Arquivo local ou URL da foto de fundo."),
      desfoque: z.number().optional(),
    })
    .optional(),
  proporcao: z.enum(["16:9", "9:16", "4:5", "1:1"]).optional().describe("Padrão 16:9 (1920x1080)."),
  saida: z
    .object({ largura: z.union([z.literal(1080), z.literal(1440), z.literal(2160)]).optional(), fps: z.union([z.literal(30), z.literal(60)]).optional() })
    .optional()
    .describe("largura é o lado MENOR: 1080 em 16:9 dá 1920x1080."),
  formatos: z.array(z.enum(["mp4", "webm", "png"])).optional().describe("Padrão: mp4 e png (mp4 só se houver movimento)."),
  poster: z.number().min(0).max(1).optional().describe("Instante do PNG, de 0 a 1 do movimento. Padrão 1 (pose final)."),
  cena: z.record(z.string(), z.unknown()).optional().describe("Campos crus da Cena (modelo.ts), aplicados por último."),
});

/* ── Vite e navegador ─────────────────────────────────────────────────── */

let vite = null;
async function respondeModelo() {
  try {
    const r = await fetch(`${BASE}/src/app/mockups/modelo.ts`);
    return r.ok && (await r.text()).includes("MODELOS");
  } catch {
    return false;
  }
}

async function garantirVite() {
  if (await respondeModelo()) return;
  if (process.env.MOCKUP_BASE) throw new Error(`MOCKUP_BASE=${BASE} não serve o estúdio.`);
  log(`subindo vite na ${PORTA}`);
  vite = spawn(process.execPath, [path.join(RAIZ, "node_modules/vite/bin/vite.js"), "--port", String(PORTA), "--strictPort"], {
    cwd: RAIZ,
    stdio: ["ignore", "ignore", "pipe"],
  });
  let erro = "";
  vite.stderr.on("data", (d) => (erro += d));
  for (let i = 0; i < 120; i++) {
    if (vite.exitCode !== null) throw new Error(`vite saiu: ${erro.slice(-400)}`);
    if (await respondeModelo()) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("vite não respondeu em 60 s");
}

let navegador = null;
async function garantirNavegador() {
  if (navegador?.isConnected()) return navegador;
  // Chrome instalado tem H.264 no WebCodecs; o Chromium do Playwright cai em WebM e o ffmpeg converte.
  for (const opcoes of [{ channel: "chrome" }, {}]) {
    try {
      navegador = await chromium.launch({ ...opcoes, headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
      log(`navegador: ${opcoes.channel ?? "chromium"}`);
      return navegador;
    } catch (e) {
      log(`sem ${opcoes.channel ?? "chromium"}: ${e.message.split("\n")[0]}`);
    }
  }
  throw new Error("Nenhum Chromium abriu.");
}

export async function fechar() {
  await navegador?.close().catch(() => {});
  navegador = null;
  vite?.kill();
  vite = null;
}

/* ── Arquivos locais servidos à página ────────────────────────────────── */

const TIPOS = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime" };
const tipoDe = (p) => TIPOS[path.extname(p.split("?")[0]).toLowerCase()] ?? "application/octet-stream";

async function lerFonte(fonte) {
  if (/^https?:\/\//.test(fonte)) {
    const r = await fetch(fonte);
    if (!r.ok) throw new Error(`Não baixou ${fonte}: ${r.status}`);
    return { corpo: Buffer.from(await r.arrayBuffer()), tipo: r.headers.get("content-type")?.split(";")[0] || tipoDe(fonte), nome: path.basename(new URL(fonte).pathname) };
  }
  const p = path.resolve(fonte);
  if (!existsSync(p)) throw new Error(`Arquivo não existe: ${p}`);
  if (tipoDe(p).startsWith("video/")) return { corpo: readFileSync(soKeyframes(p)), tipo: "video/mp4", nome: path.basename(p).replace(/\.\w+$/, ".mp4") };
  return { corpo: readFileSync(p), tipo: tipoDe(p), nome: path.basename(p) };
}

/**
 * Vídeo na tela é buscado quadro a quadro. Com keyframes espaçados (o normal de um mp4), o seek no Chrome sem janela
 * passa do prazo e o export falha ("Não consegui ler um quadro do vídeo da tela"). Uma cópia só de keyframes, no
 * máximo 1920 de largura e sem áudio, busca na hora. Fica em cache por caminho, tamanho e data.
 */
function soKeyframes(p) {
  const st = statSync(p);
  const dir = path.join(os.tmpdir(), "mockup-agente-telas");
  mkdirSync(dir, { recursive: true });
  const chave = createHash("sha1").update(`${p}|${st.size}|${st.mtimeMs}`).digest("hex").slice(0, 16);
  const saida = path.join(dir, `${chave}.mp4`);
  if (!existsSync(saida)) {
    execFileSync("ffmpeg", ["-y", "-v", "error", "-i", p, "-an", "-vf", "scale='min(1920,iw)':-2", "-c:v", "libx264", "-g", "1", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", saida]);
  }
  return saida;
}

/* ── Catálogo ─────────────────────────────────────────────────────────── */

let catalogoCache = null;
async function comPagina(fn) {
  await garantirVite();
  const nav = await garantirNavegador();
  const ctx = await nav.newContext({ viewport: { width: 1920, height: 1080 }, acceptDownloads: true, reducedMotion: "no-preference" });
  // Métrica do app fica limpa: render de agente não é visita.
  await ctx.route("**/api/**", (r) => r.fulfill({ status: 204, body: "" }));
  const page = await ctx.newPage();
  try {
    return await fn(page, ctx);
  } finally {
    await ctx.close().catch(() => {});
  }
}

export async function catalogo() {
  if (catalogoCache) return catalogoCache;
  catalogoCache = await comPagina(async (page) => {
    await page.goto(`${BASE}/__vazio`, { waitUntil: "domcontentloaded" });
    return page.evaluate(async () => {
      const m = await import("/src/app/mockups/modelo.ts");
      return {
        padrao: m.PADRAO,
        presets: m.PRESETS,
        poses: { phone: m.POSES, tablet: m.POSES, laptop: m.POSES_NOTEBOOK },
        movimentos: m.MOVIMENTOS,
        modelos: Object.fromEntries(Object.entries(m.MODELOS).map(([k, v]) => [k, v.nome])),
        acabamentos: Object.fromEntries(Object.entries(m.ACABAMENTOS).map(([k, v]) => [k, v.nome])),
        telasDemo: m.TELAS.filter((t) => t.tipo !== "convite").map((t) => ({ id: t.id, nome: t.nome, tipo: t.tipo })),
      };
    });
  });
  return catalogoCache;
}

export async function listarPresets() {
  const c = await catalogo();
  return {
    receitas: Object.entries(RECEITAS).map(([id, r]) => ({ id, nome: r.nome, para: r.para, modelo: r.modelo, preset: r.preset, movimento: r.movimento.tipo })),
    presets: c.presets.map((p) => ({ id: p.id, nome: p.nome, estilo: p.aplica.aparelhoEstilo, fundo: p.aplica.fundo?.modo })),
    poses: Object.fromEntries(Object.entries(c.poses).map(([m, l]) => [m, l.map((p) => p.id)])),
    movimentos: c.movimentos.map((m) => ({ id: m.id, nome: m.nome, loop: m.emLoop })),
    modelos: c.modelos,
    acabamentos: c.acabamentos,
    telasDemo: c.telasDemo,
  };
}

/* ── Spec → Cena ──────────────────────────────────────────────────────── */

const ehObjeto = (v) => v && typeof v === "object" && !Array.isArray(v);
function fundir(a, b) {
  if (!ehObjeto(b)) return b === undefined ? a : b;
  const r = { ...(ehObjeto(a) ? a : {}) };
  for (const [k, v] of Object.entries(b)) if (v !== undefined) r[k] = fundir(r[k], v);
  return r;
}

/** Devolve a cena parcial que vai para `definir`: tudo menos `telaId`, e `orientacao` só se pedida. */
export async function resolver(spec) {
  const s = SpecCena.parse(spec);
  const cat = await catalogo();
  const rec = s.receita ? RECEITAS[s.receita] : null;
  if (s.receita && !rec) throw new Error(`Receita desconhecida: ${s.receita}. Opções: ${Object.keys(RECEITAS).join(", ")}`);
  const modelo = s.modelo ?? rec?.modelo ?? "phone";
  const poses = cat.poses[modelo];
  const pose = (id) => {
    const p = poses.find((x) => x.id === id);
    if (!p) throw new Error(`Pose ${id} não existe em ${modelo}. Opções: ${poses.map((x) => x.id).join(", ")}`);
    return p.rot;
  };

  let c = structuredClone(cat.padrao);
  c.modelo = modelo;
  c.rot = poses[1].rot;
  const presetId = s.preset ?? rec?.preset;
  if (presetId) {
    const p = cat.presets.find((x) => x.id === presetId);
    if (!p) throw new Error(`Preset desconhecido: ${presetId}. Opções: ${cat.presets.map((x) => x.id).join(", ")}`);
    c = fundir(c, structuredClone(p.aplica));
    if (modelo === "laptop") c.rot = p.rotNotebook;
  }
  if (rec?.pose) c.rot = pose(rec.pose);
  if (rec?.cena) c = fundir(c, rec.cena);
  if (s.pose) c.rot = pose(s.pose);
  if (s.rot) c.rot = s.rot;
  if (s.tamanho) c.tamanho = s.tamanho;
  if (s.pos) c.pos = s.pos;
  if (s.acabamento) c.acabamento = s.acabamento;
  if (s.estilo) c.aparelhoEstilo = s.estilo;
  if (s.ajuste) c.ajuste = s.ajuste;
  c.movimento = { ...c.movimento, ...rec?.movimento, ...s.movimento };

  const chaves = s.chaves ?? rec?.chaves;
  if (chaves?.length) {
    c.chaves = chaves.map((k) => ({ rot: k.rot ?? (k.pose ? pose(k.pose) : c.rot), pos: k.pos ?? c.pos, tamanho: k.tamanho ?? c.tamanho, rolagem: k.rolagem ?? 0 }));
    if (!s.movimento?.tipo) c.movimento.tipo = "cenas";
    // A cena-base é a primeira chave, como quando a pessoa abre a cena 1 no estúdio.
    Object.assign(c, { rot: c.chaves[0].rot, pos: c.chaves[0].pos, tamanho: c.chaves[0].tamanho, rolagem: c.chaves[0].rolagem });
    if (c.chaves.length < 2) throw new Error("Movimento por cenas precisa de 2 chaves ou mais.");
  }

  if (s.fundo) c.fundo = { ...c.fundo, ...s.fundo };
  c.proporcao = s.proporcao ?? "16:9";
  c.saida = { ...c.saida, ...s.saida, imagem: "png", video: s.formatos?.includes("webm") && !s.formatos.includes("mp4") ? "webm" : "mp4" };
  if (s.cena) c = fundir(c, s.cena);

  delete c.telaId;
  if (s.orientacao) c.orientacao = s.orientacao;
  else if (!s.cena?.orientacao) delete c.orientacao;
  return { spec: s, cena: c, duracaoExplicita: Boolean(s.movimento?.duracao ?? rec?.movimento?.duracao) };
}

/* ── Render ───────────────────────────────────────────────────────────── */

const esperarQuadros = (page, n = 2) =>
  page.evaluate((n) => new Promise((r) => { const f = (i) => (i ? requestAnimationFrame(() => f(i - 1)) : r()); f(n); }), n);

async function exportarNaPagina(page, modo, destino) {
  let baixado = null;
  const pega = (d) => (baixado = d);
  page.on("download", pega);
  try {
    await page.evaluate((m) => window.estudioAgente.exportar(m), modo);
    for (let i = 0; i < 40 && !baixado; i++) await page.waitForTimeout(50);
    if (!baixado) {
      const aviso = await page.evaluate(() => window.estudioAgente.aviso());
      throw new Error(`O estúdio não exportou (${modo}): ${aviso ?? "sem aviso"}`);
    }
    const ext = path.extname(baixado.suggestedFilename());
    const arquivo = destino + ext;
    await baixado.saveAs(arquivo);
    return arquivo;
  } finally {
    page.off("download", pega);
  }
}

function paraMp4(webm, mp4) {
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "medium", "-movflags", "+faststart", mp4]);
  return mp4;
}

function sonda(arquivo) {
  try {
    const out = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate,codec_name:format=duration", "-of", "json", arquivo]).toString();
    const j = JSON.parse(out);
    const st = j.streams?.[0] ?? {};
    return { w: st.width, h: st.height, codec: st.codec_name, fps: st.r_frame_rate, duracao: j.format?.duration ? Number(j.format.duration) : undefined };
  } catch {
    return {};
  }
}

/**
 * Renderiza uma cena e devolve os arquivos. `pasta` é onde eles caem (criada se faltar).
 * Um render por vez: o estúdio mede e grava um quadro de cada vez, e dois em paralelo só disputariam a CPU.
 */
let fila = Promise.resolve();
export function renderizar(spec, { pasta = SAIDA_PADRAO, aoProgresso } = {}) {
  const tarefa = fila.then(() => renderizarAgora(spec, { pasta, aoProgresso }));
  fila = tarefa.catch(() => {});
  return tarefa;
}

async function renderizarAgora(spec, { pasta, aoProgresso }) {
  const { spec: s, cena, duracaoExplicita } = await resolver(spec);
  mkdirSync(pasta, { recursive: true });
  const nome = s.nome ?? `cena-${Date.now()}`;
  const base = path.join(pasta, nome);
  const formatos = s.formatos ?? (cena.movimento.tipo === "parado" ? ["png"] : ["mp4", "png"]);
  const t0 = Date.now();

  return comPagina(async (page, ctx) => {
    page.setDefaultTimeout(10 * 60_000);
    const erros = [];
    page.on("pageerror", (e) => erros.push(e.message));

    // A tela e a foto de fundo entram por URLs falsas servidas daqui: o app recebe como um arquivo solto.
    const servidos = new Map();
    await ctx.route("**/__agente/**", (r) => {
      const f = servidos.get(new URL(r.request().url()).pathname);
      return f ? r.fulfill({ status: 200, body: f.corpo, contentType: f.tipo }) : r.fulfill({ status: 404 });
    });
    const servir = async (chave, fonte) => {
      const f = await lerFonte(fonte);
      const url = `/__agente/${chave}/${encodeURIComponent(f.nome)}`;
      servidos.set(url, f);
      return { url, ...f };
    };

    let demo = null;
    let tela = null;
    if (s.tela.startsWith("demo:")) demo = s.tela.slice(5);
    else tela = await servir("tela", s.tela);
    if (cena.fundo?.foto && !cena.fundo.foto.startsWith("/media/") && cena.fundo.modo === "foto") cena.fundo.foto = (await servir("fundo", cena.fundo.foto)).url;

    await page.goto(`${BASE}/mockups?agente=1`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.estudioAgente && document.querySelector(".mk-quadro .device-frame"), null, { timeout: 60_000 });

    if (tela) {
      await page.evaluate(async ({ url, nome, tipo }) => {
        const blob = await (await fetch(url)).blob();
        await window.estudioAgente.receber(new File([blob], nome, { type: tipo }));
      }, { url: tela.url, nome: tela.nome, tipo: tela.tipo });
      await page.waitForFunction(() => window.estudioAgente.cena().telaId.startsWith("arquivo-"), null, { timeout: 20_000 });
    }
    const atual = await page.evaluate(() => window.estudioAgente.cena());
    const parcial = { ...cena, ...(demo ? { telaId: demo } : {}) };
    // Vídeo na tela: sem duração pedida, o movimento dura o vídeo (o estúdio já mediu ao receber).
    if (tela?.tipo.startsWith("video/") && !duracaoExplicita) parcial.movimento = { ...parcial.movimento, duracao: atual.movimento.duracao };
    await page.evaluate((p) => window.estudioAgente.definir(p), parcial);

    // A tela tem de estar decodificada antes do primeiro quadro.
    await page.waitForFunction(() => {
      const q = document.querySelector(".mk-quadro");
      if (!q) return false;
      return [...q.querySelectorAll("img")].every((i) => i.complete && i.naturalWidth > 0) && [...q.querySelectorAll("video")].every((v) => v.readyState >= 2);
    }, null, { timeout: 30_000 });
    await esperarQuadros(page, 3);

    const final = await page.evaluate(() => window.estudioAgente.cena());
    const arquivos = [];
    const querVideo = formatos.some((f) => f === "mp4" || f === "webm");
    if (querVideo) {
      aoProgresso?.("video");
      let v = await exportarNaPagina(page, "video", base);
      if (formatos.includes("mp4") && v.endsWith(".webm") && final.fundo.modo !== "nenhum") {
        paraMp4(v, base + ".mp4");
        v = base + ".mp4";
      }
      arquivos.push({ tipo: "video", caminho: v, bytes: statSync(v).size, ...sonda(v) });
    }
    if (formatos.includes("png")) {
      aoProgresso?.("png");
      const t = s.poster ?? (final.movimento.tipo === "parado" ? 0 : final.movimento.tipo === "close" ? 0.5 : 1);
      // `entrada` em t=1 já assentou; loops voltam ao começo, então o meio do ciclo mostra o movimento.
      const instante = ["flutuar", "balancar", "pendulo", "aproximar"].includes(final.movimento.tipo) && s.poster === undefined ? 0.25 : Math.min(t, 0.9999);
      await page.evaluate((x) => window.estudioAgente.irPara(x), instante);
      await esperarQuadros(page, 2);
      const p = await exportarNaPagina(page, "imagem", base);
      arquivos.push({ tipo: "imagem", caminho: p, bytes: statSync(p).size, ...sonda(p) });
    }
    return { nome, arquivos, segundos: Math.round((Date.now() - t0) / 100) / 10, cena: final, errosDaPagina: erros };
  });
}
