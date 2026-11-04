/**
 * Conta o download de cada peça: o `shadcn add` e os agentes pedem `/r/<peça>.json`.
 *
 * Os arquivos são estáticos, então só aqui dá para ver o pedido. Navegador fica de fora, porque
 * a própria vitrine lê esses arquivos, e robô também. Conta depois de responder: nunca atrasa nem
 * derruba o download. Grava só peça, tipo e dia (`admin/supabase.sql`).
 */

declare const process: { env: Record<string, string | undefined> };

export const config = { matcher: "/r/:path*" };

const PECA = /^\/r\/([a-z0-9]+(?:-[a-z0-9]+)*)\.json$/;
const NAO_E_PECA = new Set(["index", "registry", "brands"]);
const ROBO = /bot|crawl|spider|slurp|preview|monitor/i;

export default function middleware(request: Request, context?: { waitUntil?: (p: Promise<unknown>) => void }) {
  const item = PECA.exec(new URL(request.url).pathname)?.[1];
  if (!item || NAO_E_PECA.has(item)) return;
  if (request.headers.get("sec-fetch-site") || ROBO.test(request.headers.get("user-agent") ?? "")) return;

  const db = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!db || !key) return;

  const headers: Record<string, string> = { apikey: key, "content-type": "application/json" };
  if (key.startsWith("eyJ")) headers.authorization = `Bearer ${key}`;
  const envio = fetch(`${db}/rest/v1/rpc/contagem_somar`, {
    method: "POST",
    headers,
    body: JSON.stringify({ p_linhas: [{ tipo: "download", item }] }),
  }).catch(() => {});
  context?.waitUntil?.(envio);
}
