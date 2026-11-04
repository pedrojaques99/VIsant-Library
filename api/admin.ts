/**
 * Os dados do painel /admin, só para admin do Visant Labs. Mesma sessão do /lab (`_lab-auth.ts`).
 *
 *   GET /api/admin → { login, admin, fontes, contagens[], notas[], votos[], veredictos[], skills[], github }
 *
 * Cada fonte falha sozinha: uma fora do ar vira `false` em `fontes`, e o painel diz qual caiu em
 * vez de mostrar zero, que é um número falso. Coberto com uma folga de 180 dias para o painel
 * poder comparar 90 dias com os 90 anteriores.
 */

import { listContagens, listFeedback, listInteresse, listNotas, listVeredictos, listVotos, loginReady, session, storeReady } from "./_lab-auth.js";

declare const process: { env: Record<string, string | undefined> };

const REPO = "pedrojaques99/visant-skills-public";

const json = (body: unknown, status = 200, headers = new Headers()) => {
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(body), { status, headers });
};

const comTempo = (url: string, init?: RequestInit) => fetch(url, { ...init, signal: AbortSignal.timeout(6000) });

async function skills() {
  const r = await comTempo("https://skills.sh/api/search?q=visant&limit=30");
  if (!r.ok) throw new Error(`skills.sh ${r.status}`);
  const d = (await r.json()) as { skills?: { source?: string; name?: string; installs?: number }[] };
  return (d.skills ?? [])
    .filter((s) => s.source === REPO)
    .map((s) => ({ nome: s.name ?? "", instalacoes: s.installs ?? 0 }))
    .sort((a, b) => b.instalacoes - a.instalacoes);
}

async function github() {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = { accept: "application/vnd.github+json", "user-agent": "visant-ui-admin" };
  if (token) headers.authorization = `Bearer ${token}`;
  const r = await comTempo(`https://api.github.com/repos/${REPO}`, { headers });
  if (!r.ok) throw new Error(`github ${r.status}`);
  const repo = (await r.json()) as { stargazers_count: number; forks_count: number };
  const base = { estrelas: repo.stargazers_count, forks: repo.forks_count, views: null as number | null, clones: null as number | null };
  if (!token) return base;
  /* O tráfego exige token e o GitHub só guarda 14 dias. */
  const [v, c] = await Promise.all(
    ["views", "clones"].map((t) => comTempo(`https://api.github.com/repos/${REPO}/traffic/${t}`, { headers }).then((x) => (x.ok ? x.json() : null))),
  );
  return { ...base, views: (v as { count?: number } | null)?.count ?? null, clones: (c as { count?: number } | null)?.count ?? null };
}

export async function GET(request: Request) {
  const headers = new Headers();
  if (!loginReady()) return json({ login: false, admin: false }, 200, headers);
  const s = await session(request, headers);
  if (s.isAdmin !== true) return json({ login: true, admin: false }, 200, headers);

  const banco = storeReady();
  const [contagens, notas, votos, veredictos, sk, gh, emails, feedback] = await Promise.allSettled([
    banco ? listContagens(180) : Promise.reject(new Error("sem store")),
    banco ? listNotas() : Promise.reject(new Error("sem store")),
    banco ? listVotos() : Promise.reject(new Error("sem store")),
    banco ? listVeredictos() : Promise.reject(new Error("sem store")),
    skills(),
    github(),
    banco ? listInteresse() : Promise.reject(new Error("sem store")),
    banco ? listFeedback() : Promise.reject(new Error("sem store")),
  ]);
  const valor = <T,>(r: PromiseSettledResult<T>, padrao: T) => (r.status === "fulfilled" ? r.value : padrao);

  return json(
    {
      login: true,
      admin: true,
      fontes: {
        contagens: contagens.status === "fulfilled",
        curadoria: notas.status === "fulfilled",
        burilacao: votos.status === "fulfilled",
        lab: veredictos.status === "fulfilled",
        skills: sk.status === "fulfilled",
        github: gh.status === "fulfilled",
        interesse: emails.status === "fulfilled",
      },
      contagens: valor(contagens, []),
      notas: valor(notas, []),
      /* Quem votou não desce: o painel só precisa do total. */
      votos: valor(votos, []).map(({ duelo, escolha }) => ({ duelo, escolha })),
      veredictos: valor(veredictos, []).map(({ id, status, at }) => ({ id, status, at })),
      skills: valor(sk, []),
      github: valor(gh, null),
      emails: valor(emails, []),
      feedback: valor(feedback, []),
    },
    200,
    headers,
  );
}
