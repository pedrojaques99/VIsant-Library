/**
 * Recebe as contagens da vitrine: visita, página, peça aberta, origem e comando copiado.
 *
 *   POST /api/conta  { linhas: [{ tipo, item }] }  → 204
 *
 * É público de propósito, e por isso aceita pouco: tipos fixos, texto curto, no máximo 5 linhas,
 * só da própria origem. País e aparelho saem do pedido, e só na primeira página da visita.
 * Nada identifica a pessoa (`admin/supabase.sql`).
 */

import { contar, storeReady, type LinhaDeContagem } from "./_lab-auth.js";

const TIPOS = new Set(["visita", "pagina", "peca", "origem", "copia"]);
const ITEM = /^[\w./@:-]{1,80}$/;
const ROBO = /bot|crawl|spider|slurp|preview|monitor/i;

const vazio = () => new Response(null, { status: 204, headers: { "cache-control": "no-store" } });

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
  const agente = request.headers.get("user-agent") ?? "";
  if (ROBO.test(agente) || !storeReady()) return vazio();

  let corpo: { linhas?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const linhas: LinhaDeContagem[] = (Array.isArray(corpo.linhas) ? corpo.linhas : [])
    .slice(0, 5)
    .filter(
      (l): l is LinhaDeContagem =>
        typeof l === "object" && l !== null && TIPOS.has((l as LinhaDeContagem).tipo) && ITEM.test(String((l as LinhaDeContagem).item)),
    );
  if (!linhas.length) return vazio();

  if (linhas.some((l) => l.tipo === "visita")) {
    const pais = request.headers.get("x-vercel-ip-country");
    if (pais && /^[A-Z]{2}$/.test(pais)) linhas.push({ tipo: "pais", item: pais });
    linhas.push({ tipo: "aparelho", item: /Mobi|Android|iPhone/i.test(agente) ? "celular" : "computador" });
  }

  try {
    await contar(linhas);
  } catch {
    /* Contagem nunca vira erro para quem está navegando. */
  }
  return vazio();
}
