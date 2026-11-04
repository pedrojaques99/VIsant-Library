/**
 * A burilação de copy: o admin escolhe entre duas frases, e cada voto ensina a `visant-copy`.
 *
 * Mesma sessão e mesmo `adminCheck` do /lab (`_lab-auth.ts`). Os votos ficam no Supabase
 * (`burilacao/supabase.sql`). `npm run burilar -- sync` traz para o repo, sem o nome de quem votou.
 *
 *   GET  /api/burilacao  → { login, store, admin, meus[], votos[] }
 *   POST /api/burilacao  { duelo, escolha: "a"|"b"|"nenhuma"|"minha", motivos?, escrita? }
 *        401 sem sessão de admin · 403 origem estranha · 503 store não configurado
 */

import MOTIVOS from "../burilacao/motivos.json" with { type: "json" };
import { listVotos, loginReady, putVoto, session, storeReady, type VotoDaBurilacao } from "./_lab-auth.js";

const DUELO = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*$/;
const ESCOLHAS = ["a", "b", "nenhuma", "minha"];

const json = (body: unknown, status = 200, headers = new Headers()) => {
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(body), { status, headers });
};

export async function GET(request: Request) {
  const headers = new Headers();
  let admin = false;
  let user: string | undefined;
  if (loginReady()) {
    const s = await session(request, headers);
    admin = s.isAdmin === true;
    user = s.user;
  }
  let store = storeReady();
  let votos: VotoDaBurilacao[] = [];
  if (store) {
    try {
      votos = await listVotos();
    } catch {
      /* Tabela ainda não criada ou Supabase fora. */
      store = false;
    }
  }
  const meus = admin ? votos.filter((v) => v.por === (user ?? "admin")).map((v) => v.duelo) : [];
  return json(
    { login: loginReady(), store, admin, meus, votos: votos.map(({ por: _por, ...v }) => v) },
    200,
    headers,
  );
}

export async function POST(request: Request) {
  if (!loginReady()) return json({ error: "login não configurado" }, 503);
  const headers = new Headers();
  /* Cookie é SameSite=Lax; a origem conferida é a segunda trava contra CSRF. */
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "origem recusada" }, 403, headers);

  const s = await session(request, headers);
  if (s.isAdmin !== true) return json({ error: "só admin" }, 401, headers);
  if (!storeReady()) return json({ error: "store não configurado" }, 503, headers);

  let body: { duelo?: unknown; escolha?: unknown; motivos?: unknown; escrita?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "JSON inválido" }, 400, headers);
  }

  const { duelo, escolha } = body;
  if (typeof duelo !== "string" || !DUELO.test(duelo)) return json({ error: "duelo inválido" }, 400, headers);
  if (typeof escolha !== "string" || !ESCOLHAS.includes(escolha)) return json({ error: "escolha inválida" }, 400, headers);
  const motivos = Array.isArray(body.motivos)
    ? body.motivos.filter((m): m is string => typeof m === "string" && MOTIVOS.includes(m))
    : [];
  const escrita = typeof body.escrita === "string" ? body.escrita.trim().slice(0, 280) : "";
  if (escolha === "minha" && !escrita) return json({ error: "faltou a frase" }, 400, headers);

  await putVoto(duelo, s.user ?? "admin", escolha, motivos, escrita);
  return json({ ok: true }, 200, headers);
}
