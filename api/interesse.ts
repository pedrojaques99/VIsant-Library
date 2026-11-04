/**
 * O e-mail de quem instala as skills e o feedback de quem usou (`admin/interesse.sql`).
 *
 *   GET  /api/interesse  → { contagens, interesse }: as tabelas existem? Sem nenhum dado.
 *   POST /api/interesse  { email, origem }  ou  { feedback, origem }  ou  { sair: email }  → 204
 *        400 entrada inválida · 403 origem estranha · 502 banco fora
 *
 * Público de propósito, e por isso aceita pouco. O campo `site` é isca: gente não vê, robô preenche.
 */

import { listContagens, listFeedback, putFeedback, putInteresse, sairInteresse, storeReady } from "./_lab-auth.js";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const ORIGEM = /^[a-z-]{1,30}$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export async function GET() {
  if (!storeReady()) return json({ contagens: false, interesse: false });
  const [contagens, interesse] = await Promise.allSettled([listContagens(0), listFeedback()]);
  return json({ contagens: contagens.status === "fulfilled", interesse: interesse.status === "fulfilled" });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "origem recusada" }, 403);

  let corpo: { email?: unknown; feedback?: unknown; origem?: unknown; site?: unknown; sair?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }
  if (corpo.site) return new Response(null, { status: 204 });
  const origem = typeof corpo.origem === "string" && ORIGEM.test(corpo.origem) ? corpo.origem : "site";
  if (!storeReady()) return json({ error: "banco não configurado" }, 502);

  try {
    if (typeof corpo.sair === "string") {
      /* A resposta é a mesma com ou sem o e-mail na lista: daqui não se descobre quem está nela. */
      const email = corpo.sair.trim().toLowerCase();
      if (!EMAIL.test(email)) return json({ error: "e-mail inválido" }, 400);
      await sairInteresse(email);
    } else if (typeof corpo.email === "string") {
      const email = corpo.email.trim().toLowerCase();
      if (!EMAIL.test(email)) return json({ error: "e-mail inválido" }, 400);
      await putInteresse(email, origem);
    } else if (typeof corpo.feedback === "string" && corpo.feedback.trim()) {
      await putFeedback(corpo.feedback.trim().slice(0, 2000), origem);
    } else {
      return json({ error: "nada para gravar" }, 400);
    }
  } catch (e) {
    console.error("api/interesse:", (e as Error).message);
    return json({ error: "banco fora" }, 502);
  }
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}
