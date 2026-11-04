/**
 * A curadoria em produção: admin do Visant Labs arquiva e comenta sem dev server e sem deploy.
 *
 * Mesma sessão e mesmo `adminCheck` do /lab (`_lab-auth.ts`). Quem entra pelo botão do cabeçalho
 * manda o token uma vez; aqui ele vale só para perguntar se a pessoa é admin e é descartado.
 *
 *   GET    /api/curadoria  → { login, store, admin, notas }
 *   POST   /api/curadoria  { acao: "entrar" } + Authorization: Bearer <token>
 *   POST   /api/curadoria  { item, nota, comentario, excluir }  (sessão de admin)
 *   DELETE /api/curadoria  → encerra a sessão
 *
 * As notas ficam no Supabase (`curadoria/supabase.sql`). O admin as vê na hora; o público lê
 * `curadoria/notas.json` do build, que o `npm run ship` sincroniza antes de publicar.
 */

import { adminCheck, listNotas, loginReady, putNota, session, storeReady, type NotaDaCuradoria } from "./_lab-auth.js";

const ITEM = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const json = (body: unknown, status = 200, headers = new Headers()) => {
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(body), { status, headers });
};

const comoMapa = (linhas: NotaDaCuradoria[]) =>
  Object.fromEntries(linhas.map(({ item, nota, comentario, excluir, data }) => [item, { nota, comentario, excluir, data }]));

export async function GET(request: Request) {
  const headers = new Headers();
  let admin = false;
  if (loginReady()) admin = (await session(request, headers)).isAdmin === true;
  let notas: Record<string, unknown> = {};
  let store = storeReady();
  if (store) {
    try {
      notas = comoMapa(await listNotas());
    } catch {
      /* Tabela ainda não criada ou Supabase fora: vale o que veio no build. */
      store = false;
    }
  }
  return json({ login: loginReady(), store, admin, notas }, 200, headers);
}

export async function POST(request: Request) {
  if (!loginReady()) return json({ error: "login não configurado" }, 503);
  const headers = new Headers();
  /* Cookie é SameSite=Lax; a origem conferida é a segunda trava contra CSRF. */
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "origem recusada" }, 403, headers);

  let body: { acao?: unknown; item?: unknown; nota?: unknown; comentario?: unknown; excluir?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "JSON inválido" }, 400, headers);
  }

  const s = await session(request, headers);

  if (body.acao === "entrar") {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "sem token" }, 401, headers);
    const { isAdmin, user } = await adminCheck(token);
    if (!isAdmin) return json({ admin: false }, 200, headers);
    s.user = user ?? "admin";
    s.isAdmin = true;
    await s.save();
    return json({ admin: true }, 200, headers);
  }

  if (s.isAdmin !== true) return json({ error: "unauthorized" }, 401, headers);
  if (!storeReady()) return json({ error: "store não configurado" }, 503, headers);

  const item = typeof body.item === "string" ? body.item : "";
  const nota = typeof body.nota === "number" ? body.nota : 0;
  if (!ITEM.test(item) || !Number.isInteger(nota) || nota < 1 || nota > 5) return json({ error: "item ou nota inválidos" }, 400, headers);
  const comentario = typeof body.comentario === "string" ? body.comentario.trim().slice(0, 500) : "";

  try {
    await putNota(item, nota, comentario, body.excluir === true, s.user ?? "admin");
    return json({ ok: true, notas: comoMapa(await listNotas()) }, 200, headers);
  } catch (e) {
    return json({ error: (e as Error).message }, 502, headers);
  }
}

export async function DELETE(request: Request) {
  if (!loginReady()) return json({ ok: true });
  const headers = new Headers();
  (await session(request, headers)).destroy();
  return json({ ok: true }, 200, headers);
}
