"use client";

/**
 * A casa do @visant/ui.
 *
 * Antes, a home era a bancada de áudio vintage — 13 dos 45 itens. Quem chegava
 * concluía que a library era um kit de knobs e ia reescrever o resto. Agora a
 * home é o catálogo inteiro, e a bancada virou uma das abas: continua sendo a
 * melhor demo do kit, só não é mais a fachada.
 *
 * O `BrandThemeProvider` fica na raiz de propósito: as três abas leem os mesmos
 * tokens, então trocar de marca no seletor repinta catálogo, studio e bancada
 * ao mesmo tempo. Se só o studio respondesse, a promessa seria demo, não sistema.
 *
 * **A URL é a fonte da verdade da navegação.** Aba e item em foco moram no
 * caminho, e o estado do React é derivado dele — não o contrário. É o que faz o
 * botão voltar do navegador funcionar de dentro da vista de foco e o que torna
 * `/c/kanban` um link que pode ser mandado no chat e abrir com prévia.
 */

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandThemeProvider } from "@/lib/brand-theme";
import { redeLenta, useDobraAssentada } from "@/lib/rede";
import { BotaoDeBusca, useAtalhoDeBusca } from "./busca-gatilho";
import { REPO_DAS_SKILLS } from "./skills/hub/nucleo";

/*
 * Studio e bancada chegam quando alguém abre a aba.
 *
 * Eram 620KB num arquivo só: quem entrava para ver o catálogo baixava também o
 * kit vintage inteiro (13 peças skeuomórficas, canvas de osciloscópio, lottie) e
 * o studio de marca, sem nunca abrir nenhum dos dois. O catálogo é a porta de
 * entrada de praticamente todo mundo; ele não pode pagar o pedágio das outras
 * duas seções.
 */
const BrandStudioBody = React.lazy(() =>
  import("./BrandStudio").then((m) => ({ default: m.BrandStudioBody })),
);

/*
 * O catálogo sai da entrada, e com ele a grade, os metadados das peças, a ficha e o motion.
 *
 * Em Slow 4G (50 KB/s) cada 50 KB é um segundo, e quem abria `/skills` ou `/marca` baixava
 * o catálogo inteiro antes de ver a própria página (PLANO-PERFORMANCE.md, rodada 6). A casca
 * só conhece o caminho: quem resolve família, peça e título é `RotaCatalogo`.
 */
const RotaCatalogo = React.lazy(() => import("./RotaCatalogo").then((m) => ({ default: m.RotaCatalogo })));
const RotaSolo = React.lazy(() => import("./Solo").then((m) => ({ default: m.RotaSolo })));
const Busca = React.lazy(() => import("./busca").then((m) => ({ default: m.Busca })));
const KitRoom = React.lazy(() =>
  Promise.all([import("./KitRoom"), import("./kits")]).then(([sala, lista]) => ({
    default: (props: { slug: string | null; onSlug: (s: string) => void; onFocus: (f: string | null) => void }) => (
      <sala.KitRoom {...props} slug={props.slug ?? lista.KITS[0].slug} />
    ),
  })),
);
/* Só a marca do cabeçalho pedia cmdk, Radix e o logo: chegam depois da primeira dobra. */
const BrandSelector = React.lazy(() =>
  import("../../registry/visant/ui/brand-selector").then((m) => ({ default: m.BrandSelector })),
);
const Conectar = React.lazy(() => import("./conectar").then((m) => ({ default: m.Conectar })));
/* O rodapé nunca está na primeira dobra de quem chega: fora da entrada, ele não pesa em /skills. */
const Rodape = React.lazy(() => import("./rodape").then((m) => ({ default: m.Rodape })));
const SomDaCasa = React.lazy(() => import("./som-da-casa").then((m) => ({ default: m.SomDaCasa })));

/* A rede boa não espera por ninguém: a ficha desce no ocioso, e o clique não paga. */
if (typeof window !== "undefined" && !redeLenta() && /^\/($|c\/|catalogo)/.test(window.location.pathname)) {
  const ocioso = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 1500));
  window.addEventListener("load", () => ocioso(() => void import("./ComponentFocus")), { once: true });
}

/*
 * A primeira dobra que o `prerender.mjs` escreveu no HTML, lida antes de o React limpar a
 * raiz. É ela que segura a tela até o chunk da rota chegar: sem isto, o título que já estava
 * pintado sumia na subida do app e voltava segundos depois. Sem prerender, a altura de uma tela.
 */
const dobraDoHtml = typeof document !== "undefined" ? (document.querySelector("#root > main")?.outerHTML ?? "") : "";
const caminhoDaDobra = typeof window !== "undefined" ? window.location.pathname : "";

/* A dobra só vale para o endereço que a escreveu: navegar por dentro não pode mostrar o título de outra página. */
function EsperaDaRota() {
  const dobra = window.location.pathname === caminhoDaDobra ? dobraDoHtml : "";
  return <div className="min-h-screen" aria-busy="true" dangerouslySetInnerHTML={{ __html: dobra }} />;
}
/* O laboratório de interações (`/lab`): só quem abre a rota paga pelo chunk. */
const Lab = React.lazy(() => import("./Lab").then((m) => ({ default: m.Lab })));
/* O painel de uso (`/admin`): só para admin, e os gráficos descem só para quem abre. */
const Admin = React.lazy(() => import("./Admin").then((m) => ({ default: m.Admin })));
/* A burilação de copy (`/burilar`): duelos A ou B, só para admin. */
const Burilar = React.lazy(() => import("./Burilar").then((m) => ({ default: m.Burilar })));
const Docs = React.lazy(() => import("./Docs").then((m) => ({ default: m.Docs })));
/* O estúdio de mockups: as libs de exportação só descem para quem abre a rota. */
const Estudio = React.lazy(() => import("./mockups/Estudio").then((m) => ({ default: m.Estudio })));
const SkillsHub = React.lazy(() => import("./skills/Hub").then((m) => ({ default: m.Hub })));
const SkillsFilme = React.lazy(() => import("./skills/Filme").then((m) => ({ default: m.Filme })));
const SkillsCarroChefe = React.lazy(() => import("./skills/CarroChefe").then((m) => ({ default: m.CarroChefe })));
const SkillsComoUsar = React.lazy(() => import("./skills/ComoUsar").then((m) => ({ default: m.ComoUsar })));
import { FAMILIA_DA_PECA } from "./rota-familia";
import { DEFAULT_BRAND, REGISTRY_URL } from "./registry-meta";
import { VisantAuthProvider } from "./visant-auth";
import { MinhasMarcas } from "./MinhasMarcas";
import { contarPagina } from "./metricas";

type View = "kits" | "catalogo" | "marca" | "mockups" | "lab" | "burilar" | "admin" | "docs" | "skills" | "404";

interface Route {
  view: View;
  /** Item aberto em foco. Só existe no catálogo. */
  focus: string | null;
  /** Sala aberta. Só existe nos kits. */
  kit: string | null;
  /**
   * Fatia do catálogo, como veio no caminho. `null` = "Tudo", `FAMILIA_DA_PECA` = a da peça em
   * foco. Quem valida é `RotaCatalogo`, que é quem conhece as famílias.
   */
  familia: string | null;
  /** Página de estilo (`/estilo/vintage`). Outro eixo: uma rota tem família OU estilo. */
  estilo?: string | null;
}

/**
 * A aba `marca` e a família `marca` são coisas diferentes, e a URL diz qual.
 *
 * `/marca` é o Brand Studio — a seção que repinta a interface inteira. A família
 * `marca` do catálogo (logo, cover, brand-selector) mora em `/catalogo/marca`,
 * porque família é sempre segmento de dentro do catálogo. Não há colisão: a
 * primeira parte do caminho decide a seção, e a segunda só é lida quando a
 * primeira é `catalogo`. Dar à família um endereço de primeiro nível é que
 * criaria ambiguidade — e roubaria o endereço curto de uma seção inteira.
 */
const FAMILIAS_DOS_DOCS = ["fundacao", "marca", "base"];

/*
 * Kits primeiro, e não por ordem alfabética.
 *
 * A home era o catálogo: 65 peças soltas numa coluna, que é a organização do
 * repositório e não a da decisão de quem chega. Ninguém instala um `chip` — se
 * instala uma mesa de trabalho inteira. O catálogo continua a um clique, para
 * quem já sabe o nome do que quer.
 */
const VIEWS: { value: View; label: string; beta?: boolean }[] = [
  { value: "catalogo", label: "Catálogo" },
  { value: "marca", label: "Marca" },
  { value: "mockups", label: "Mockups", beta: true },
  { value: "skills", label: "Skills" },
  { value: "docs", label: "Docs" },
];

/* Kits saíram do cabeçalho em 2026-11-03: as salas seguem abrindo por link, sem
   porta na navegação e com noindex no prerender. */
const ROTAS_SEM_PORTA: View[] = ["kits", "docs"];
const SUBPAGINAS_DE_SKILLS = ["filme", "killer", "como-usar"];
/* `callback` é a volta do OAuth (`visant-auth.tsx`), que cai no catálogo. */
const ROTAS_CONHECIDAS = ["catalogo", "estilo", "marca", "mockups", "skills", "kits", "kit", "c", "rig", "lab", "burilar", "admin", "docs", "callback"];

const TITULO_DA_VIEW: Partial<Record<View, string>> = {
  marca: "Marca / @visant/ui",
  mockups: "Mockups (beta) / @visant/ui",
  docs: "Docs / @visant/ui",
  kits: "Kits / @visant/ui",
  lab: "Lab / @visant/ui",
  burilar: "Burilação / @visant/ui",
  admin: "Painel / @visant/ui",
  "404": "Página não encontrada / @visant/ui",
};
const TITULO_DA_SKILL: Record<string, string> = {
  filme: "Skills em filme / Visant",
  killer: "visant-killer e visant-design / Visant",
};

// --- rota --------------------------------------------------------------------

/*
 * Caminho de verdade, não hash.
 *
 * `#/c/kanban` funcionava para navegar e não servia para mais nada: servidor
 * nenhum vê o que vem depois do `#`, então não havia como entregar título,
 * descrição ou imagem por item — link colado no Slack aparecia como "Vintage UI
 * UX Library" para os 47 itens. Com `/c/kanban` o build gera um HTML por item
 * (`scripts/prerender.mjs`) e a página passa a existir para quem não é browser.
 *
 * O hash antigo continua entrando: quem tem link salvo é redirecionado.
 */
function parsePath(loc: Location): Route {
  if (loc.hash.startsWith("#/")) return parseLegacyHash(loc.hash);

  const partes = loc.pathname.split("/").filter(Boolean);
  /* As landings das skills: `kit` guarda a subpágina, `/skills/filme` ou `/skills/killer`. */
  if (partes[0] === "skills") {
    if (partes[1] && !SUBPAGINAS_DE_SKILLS.includes(partes[1])) return { view: "404", focus: null, kit: null, familia: null };
    return { view: "skills", focus: null, kit: partes[1] ?? null, familia: null };
  }
  /* Endereço errado precisa parecer errado: abrir o catálogo faz link quebrado passar por link certo. */
  if (partes[0] && !ROTAS_CONHECIDAS.includes(partes[0])) return { view: "404", focus: null, kit: null, familia: null };
  if (partes[0] === "estilo") return { view: "catalogo", focus: null, kit: null, familia: null, estilo: partes[1] ?? null };
  if (partes[0] === "c" && partes[1]) {
    const focus = decodeURIComponent(partes[1]);
    return { view: "catalogo", focus, kit: null, familia: FAMILIA_DA_PECA };
  }
  if (partes[0] === "kit" && partes[1]) {
    return { view: "kits", focus: null, kit: decodeURIComponent(partes[1]), familia: null };
  }
  /* `/lab` fica fora das três portas do cabeçalho: é bancada de rascunho, não
     seção da library. Entra por endereço. */
  if (partes[0] === "lab") return { view: "lab", focus: null, kit: null, familia: null };
  if (partes[0] === "burilar") return { view: "burilar", focus: null, kit: null, familia: null };
  if (partes[0] === "admin") return { view: "admin", focus: null, kit: null, familia: null };
  /* `/rig` era a aba da bancada. Hoje a bancada é uma sala, e o link antigo
     entra nela em vez de dar 404 em quem tinha o endereço salvo. */
  if (partes[0] === "rig")
    return { view: "kits", focus: null, kit: "rig-vintage", familia: null };
  /* `/` é o catálogo. Os kits ficam em `/kits` enquanto não forem redesenhados:
     eram a porta de entrada e ainda não se explicam sozinhos. */
  if (ROTAS_SEM_PORTA.includes(partes[0] as View))
    return { view: partes[0] as View, focus: null, kit: null, familia: null };
  const view = VIEWS.find((v) => v.value === partes[0]);
  /* A família só é lida sob `catalogo`: é o que mantém `/marca` (o estúdio)
     separado de `/catalogo/marca` (a fatia do catálogo). Nome de família que não
     existe cai no índice, em vez de mostrar uma fatia vazia. */
  const familia = view?.value === "catalogo" ? (partes[1] ?? null) : null;
  /* Fundação não tem fatia: é o conteúdo de `/docs`. */
  if (familia && FAMILIAS_DOS_DOCS.includes(familia)) return { view: "docs", focus: null, kit: null, familia: null };
  return { view: view?.value ?? "catalogo", focus: null, kit: null, familia };
}

function parseLegacyHash(hash: string): Route {
  if (hash.startsWith("#/c/")) {
    const focus = decodeURIComponent(hash.slice(4)) || null;
    return { view: "catalogo", focus, kit: null, familia: FAMILIA_DA_PECA };
  }
  if (hash.startsWith("#/rig"))
    return { view: "kits", focus: null, kit: "rig-vintage", familia: null };
  const view = VIEWS.find((v) => hash.startsWith(`#/${v.value}`));
  const familia = view?.value === "catalogo" ? (hash.replace(/^#\//, "").split("/")[1] ?? null) : null;
  return { view: view?.value ?? "catalogo", focus: null, kit: null, familia };
}

/* Link de verdade: Cmd+clique abre outra aba, e só o clique simples fica dentro do app. */
function navegarSemRecarregar(e: React.MouseEvent<HTMLAnchorElement>, navegar: () => void) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  navegar();
}

function formatPath({ view, focus, kit, familia, estilo }: Route): string {
  if (focus) return `/c/${encodeURIComponent(focus)}`;
  if (view === "skills") return kit ? `/skills/${kit}` : "/skills";
  if (view === "kits") return kit ? `/kit/${encodeURIComponent(kit)}` : "/kits";
  if (view === "catalogo" && estilo) return `/estilo/${estilo}`;
  if (view === "catalogo") return familia ? `/catalogo/${familia}` : "/";
  return `/${view}`;
}

function useRoute() {
  const [route, setRoute] = React.useState<Route>(() => parsePath(window.location));
  /* Onde a grade estava quando a ficha abriu: fechar a ficha devolve ao mesmo card. */
  const yDaGrade = React.useRef<number | null>(null);

  // Link antigo com hash entra e sai limpo, sem entulhar o histórico.
  React.useEffect(() => {
    if (window.location.hash.startsWith("#/")) {
      window.history.replaceState(null, "", formatPath(parseLegacyHash(window.location.hash)));
    }
  }, []);

  // O navegador manda: voltar/avançar e link colado atualizam o estado.
  React.useEffect(() => {
    const sync = () => setRoute(parsePath(window.location));
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  const navigate = React.useCallback((next: Route) => {
    const caminho = formatPath(next);
    if (next.focus && !window.location.pathname.startsWith("/c/")) yDaGrade.current = window.scrollY;
    if (window.location.pathname !== caminho) {
      // Cada passo vira entrada no histórico — é o que faz o botão voltar
      // significar "voltar pra grade" de dentro da vista de foco.
      window.history.pushState(null, "", caminho);
    }
    setRoute(next);
  }, []);

  /*
   * Abrir um lugar novo começa no topo.
   *
   * O documento encurta quando a grade sai, e o navegador só prende a rolagem no
   * novo fim: a ficha aberta do meio da grade nascia com o título já fora da tela.
   * Trocar de fatia não entra aqui: quem cuida dela é a `Gallery`, que para na barra.
   */
  const antes = React.useRef(route);
  React.useLayoutEffect(() => {
    const anterior = antes.current;
    antes.current = route;
    if (route.focus) {
      if (route.focus !== anterior.focus) window.scrollTo(0, 0);
    } else if (anterior.focus) {
      window.scrollTo(0, yDaGrade.current ?? 0);
      yDaGrade.current = null;
    } else if (route.view !== anterior.view || (route.view === "skills" && route.kit !== anterior.kit)) {
      window.scrollTo(0, 0);
    }
  }, [route]);

  return [route, navigate] as const;
}

/*
 * Escuro por padrão, e a escolha fica.
 *
 * A vitrine é de peça sobre fundo escuro — é onde componente de interface se lê
 * melhor e é a referência (Bench, Apple Developer). Quem prefere claro troca uma
 * vez; sem guardar, a casa voltava ao padrão a cada visita. A classe é aplicada
 * no `main.tsx` antes do primeiro quadro, então aqui só se lê e se grava.
 */
const CHAVE_TEMA = "visant:ui:tema";

function useDarkMode() {
  const [dark, setDark] = React.useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem(CHAVE_TEMA, dark ? "escuro" : "claro");
    } catch {
      /* janela anônima: a escolha vale só pra esta visita */
    }
  }, [dark]);
  return [dark, setDark] as const;
}

// --- casca -------------------------------------------------------------------

function Shell() {
  const [route, navigate] = useRoute();

  /* Conta depois de a rota mudar: cada endereço, uma vez. */
  React.useEffect(() => {
    contarPagina(window.location.pathname);
  }, [route.view, route.focus, route.familia, route.kit]);

  /* O prerender só cuida da primeira carga: navegar por dentro precisa trocar o título também. */
  React.useEffect(() => {
    /* O título da peça e o da família quem põe é `RotaCatalogo`: só ela conhece os dois. */
    if (route.focus || route.familia || route.estilo) return;
    document.title = route.view === "skills"
        ? (TITULO_DA_SKILL[route.kit ?? ""] ?? "Skills / Visant")
        : (TITULO_DA_VIEW[route.view] ?? "A library da Visant / @visant/ui");
  }, [route.focus, route.familia, route.estilo, route.view, route.kit]);
  const [dark, setDark] = useDarkMode();
  const setView = React.useCallback(
    // Clicar na aba "Catálogo" volta ao índice das categorias, nunca à última
    // fatia aberta: aba é começo de caminho, não retomada de estado.
    (view: View) => {
      navigate({ view, focus: null, kit: null, familia: null });
      window.scrollTo(0, 0);
    },
    [navigate],
  );
  /* Fechar o foco devolve à fatia de onde a peça foi aberta — se ela foi aberta
     por link direto (`/c/kanban`), não há fatia e o retorno é o índice. */
  const familiaAtual = route.familia;
  const estiloAtual = route.estilo;
  const setFocus = React.useCallback(
    (focus: string | null) =>
      navigate({ view: "catalogo", focus, kit: null, familia: familiaAtual, estilo: estiloAtual }),
    [navigate, familiaAtual, estiloAtual],
  );
  const setEstilo = React.useCallback(
    (estilo: string | null) => navigate({ view: "catalogo", focus: null, kit: null, familia: null, estilo }),
    [navigate],
  );
  const setFamilia = React.useCallback(
    (familia: string | null) => navigate({ view: "catalogo", focus: null, kit: null, familia }),
    [navigate],
  );
  const setKit = React.useCallback(
    (kit: string) => navigate({ view: "kits", focus: null, kit, familia: null }),
    [navigate],
  );

  const dobraAssentada = useDobraAssentada();
  /*
   * A busca abre em qualquer seção e entrega na ficha da peça, sem mudar a fatia aberta atrás:
   * é um atalho pra uma peça, não uma mudança de lugar. O chunk dela só desce na primeira vez.
   */
  const [buscando, setBuscando] = React.useState(false);
  const [buscaUsada, setBuscaUsada] = React.useState(false);
  const abrirBusca = React.useCallback(() => {
    setBuscaUsada(true);
    setBuscando(true);
  }, []);
  useAtalhoDeBusca(abrirBusca, route.view === "catalogo" && !route.focus);
  const escolherNaBusca = React.useCallback(
    (name: string) => {
      setBuscando(false);
      setFocus(name);
    },
    [setFocus],
  );

  return (
    <div className="flex min-h-screen flex-col bg-casa-bg text-casa-fg">
      {/*
       * O cabeçalho da casa.
       *
       * Logo, as três seções, a busca, o tema, a marca e entrar — e nada mais.
       * Era o lugar de nove controles: densidade, dois segmentados, um seletor de
       * marca com cinco informações e uma tecla de atalho anunciada. Fundo sólido
       * e sem linha embaixo: o que separa o cabeçalho do resto é o próprio scroll.
       *
       * Só uma linha gruda, em toda largura. É a altura que `--shell-header-h`
       * promete a quem gruda embaixo dele (a barra de filtro, a sala, o palco).
       * No celular as seções ficam na linha de baixo, fora do que gruda.
       */}
      <a
        href="#conteudo"
        className="casa sr-only z-50 rounded-control bg-casa-cta px-3 py-2 text-casa-cta-fg focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Pular para o conteúdo
      </a>
      <header className="casa sticky top-0 z-40 bg-casa-bg">
        <div className="shell flex h-[var(--shell-header-h)] items-center gap-2 sm:gap-6">
          <a
            href="/"
            onClick={(e) => navegarSemRecarregar(e, () => setView("catalogo"))}
            className="alvo-toque flex shrink-0 items-center gap-2 rounded-control text-casa-base font-medium"
          >
            <span className="h-4 w-4 rounded-[5px] bg-casa-fg" aria-hidden />
            <span className="max-[359px]:sr-only">visant/ui</span>
          </a>

          {/*
            As três portas, em texto: Catálogo primeiro (é a home), Kits (as
            telas montadas) e Marca (a prova do multi-marca). Kits e Marca
            saíram do menu e voltaram depois do audit de 2026-10-20.
          */}
          <Secoes view={route.view} onView={setView} className="hidden md:flex" />

          <div className="ml-auto flex min-w-0 items-center gap-1.5 pointer-coarse:gap-0">
            <BotaoDeBusca onClick={abrirBusca} />
            {/* O liga e desliga do som, no tom dos outros ícones da casa. */}
            {/* O catálogo no agente de IA de quem chegou: MCP do shadcn + @visant. */}
            {dobraAssentada ? (
              <React.Suspense fallback={null}>
                <Conectar className="max-lg:!hidden" />
                <SomDaCasa />
              </React.Suspense>
            ) : null}
            <button
              type="button"
              onClick={() => setDark(!dark)}
              aria-label={dark ? "Tema claro" : "Tema escuro"}
              className="casa-icone alvo-toque"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {/*
              O seletor do registry, em versão de cabeçalho: a marca e o nome.
              A fonte, a versão, as amostras e o atalho continuam lá dentro do
              diálogo, que é onde se escolhe; no gatilho eram ruído. O atalho
              segue valendo, só não é anunciado.
            */}
            {/* O vão espera do tamanho do gatilho: a marca chegar não empurra o resto da linha. */}
            <React.Suspense fallback={<span aria-hidden className={VAO_DA_MARCA} />}>
              {dobraAssentada ? <BrandSelector className={GATILHO_DE_MARCA} /> : <span aria-hidden className={VAO_DA_MARCA} />}
            </React.Suspense>
            <MinhasMarcas />
          </div>
        </div>
      </header>
      <span id="conteudo" tabIndex={-1} className="block outline-none" />

      {/* No celular as seções descem para uma linha própria, que rola com a página. */}
      {/* Na ficha, não: a peça vem antes da navegação, e o X e o logo já tiram de lá. */}
      {route.focus ? null : (
        <div className="casa shell md:hidden">
          <Secoes view={route.view} onView={setView} className="h-11" />
        </div>
      )}

      {route.view === "kits" && (
        <React.Suspense fallback={<EsperaDaRota />}>
          <KitRoom slug={route.kit} onSlug={setKit} onFocus={setFocus} />
        </React.Suspense>
      )}

      {route.view === "catalogo" && (
        <main className="contents">
          <React.Suspense fallback={<EsperaDaRota />}>
            <RotaCatalogo
              focus={route.focus}
              familia={route.familia}
              estilo={route.estilo ?? null}
              onNavegar={(focus, familia) => navigate({ view: "catalogo", focus, kit: null, familia, estilo: route.estilo })}
              onFocus={setFocus}
              onFamilia={setFamilia}
              onEstilo={setEstilo}
            />
          </React.Suspense>
        </main>
      )}

      {/* A espera nunca é um "carregando…": trocar de aba não deve fazer a página encolher
          e voltar a crescer, e a abertura segura o título que o HTML já pintou. */}
      <React.Suspense fallback={<EsperaDaRota />}>
        {route.view === "marca" && <BrandStudioBody />}
        {route.view === "mockups" && (
          <React.Suspense fallback={<EsperaDaRota />}>
            <Estudio />
          </React.Suspense>
        )}
        {route.view === "lab" && <Lab />}
        {route.view === "burilar" && <Burilar />}
        {route.view === "admin" && <Admin />}
        {route.view === "docs" && <Docs />}
        {route.view === "404" && (
          <main className="shell casa min-h-[60vh] pt-24">
            <h1 className="text-casa-xl font-medium">Essa página não existe.</h1>
            <button
              type="button"
              onClick={() => setView("catalogo")}
              className="alvo-toque mt-3 cursor-pointer rounded-control text-casa-lg text-casa-fg-2 underline underline-offset-4 outline-none hover:text-casa-fg focus-visible:[box-shadow:var(--focus)]"
            >
              Voltar ao catálogo
            </button>
          </main>
        )}
        {route.view === "skills" &&
          (route.kit === "filme" ? <SkillsFilme /> : route.kit === "killer" ? <SkillsCarroChefe /> : route.kit === "como-usar" ? <SkillsComoUsar /> : <SkillsHub />)}
      </React.Suspense>

      {/* Estúdio é ferramenta de tela cheia: rodapé nenhum embaixo do painel. */}
      {dobraAssentada && route.view !== "mockups" ? (
        <React.Suspense fallback={null}>
          <Rodape
            atual={route.view}
            onPorta={setView}
            repo={route.view === "skills" ? REPO_DAS_SKILLS : undefined}
            className={cn(
              /* O dock de /skills é fixo: fica acima dele no celular e abaixo do flutuante na tela larga. */
              route.view === "skills" && !route.kit
                ? "pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-20"
                : "pb-[env(safe-area-inset-bottom)]",
              /* Shaders em desktop é a janela inteira, com só o painel rolando (explicado em rodape.tsx). */
              route.view === "catalogo" && route.familia === "shaders" && !route.focus && "lg:hidden",
            )}
          />
        </React.Suspense>
      ) : null}

      {buscaUsada ? (
        <React.Suspense fallback={null}>
          <Busca aberto={buscando} onAberto={setBuscando} onEscolher={escolherNaBusca} />
        </React.Suspense>
      ) : null}
    </div>
  );
}

/*
 * O gatilho do seletor de marca, enxuto por fora.
 *
 * O `BrandSelector` é peça publicada: clientes instalam aquele botão com nome,
 * fonte, versão, amostras e atalho, e está certo para um painel de produto. No
 * cabeçalho de uma vitrine ele era o controle mais barulhento da tela. Em vez de
 * editar a peça (o que mudaria o que o `add` entrega), a casa esconde por fora o
 * que não decide nada aqui: a linha de fonte e versão, as amostras e a tecla.
 */
// casa-lint/vidro: aqui o blur é DESLIGADO — a peça publicada traz o vidro de fábrica
const VAO_DA_MARCA = "h-8 w-[5.5rem] shrink-0 max-[479px]:w-11 pointer-coarse:h-11";

const GATILHO_DE_MARCA = [
  /* O nome da marca é o que menos cabe: no celular fica o ícone, e o nome segue para leitor de tela. */
  "max-[479px]:[&>span:nth-child(2)]:sr-only max-[479px]:!pr-1 max-w-48 pointer-coarse:!h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center",
  // casa-lint/vidro: aqui o blur é DESLIGADO — a peça publicada traz o vidro de fábrica
  "h-8 gap-2 !rounded-control !border-0 !bg-transparent !py-0 !pl-1 !pr-2.5 !backdrop-blur-none",
  "hover:!bg-casa-tile hover:![box-shadow:none] active:!scale-100",
  "[&>span:first-child]:!h-5 [&>span:first-child]:!w-5 [&>span:first-child]:!rounded-[6px] [&>span:first-child]:!border-0",
  "[&>span:nth-child(2)>span:last-child]:hidden [&>span:nth-child(2)>span:first-child]:!text-casa-base [&>span:nth-child(2)>span:first-child]:!font-normal",
  "[&>span:nth-child(3)]:!hidden [&>kbd]:!hidden",
].join(" ");

/**
 * As portas da casa, em texto: a ativa em tom cheio, as outras no tom de
 * apoio. Sem fundo, sem borda, sem pílula.
 */
function Secoes({
  view,
  onView,
  className,
}: {
  view: View;
  onView: (v: View) => void;
  className?: string;
}) {
  return (
    <nav aria-label="Seção" className={cn("flex items-center gap-2.5 overflow-x-auto [scrollbar-width:none] sm:gap-5 md:overflow-visible", className)}>
      {VIEWS.map((v) => (
        <a
          key={v.value}
          href={formatPath({ view: v.value, focus: null, kit: null, familia: null })}
          onClick={(e) => navegarSemRecarregar(e, () => onView(v.value))}
          aria-current={view === v.value ? "page" : undefined}
          className={cn(
            "alvo-toque rounded-control text-casa-base transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] focus-visible:[box-shadow:var(--focus)]",
            view === v.value ? "text-casa-fg" : "text-casa-fg-2 hover:text-casa-fg",
          )}
        >
          {v.label}
          {v.beta ? <span className="ml-1 text-casa-sm text-casa-fg-3">beta</span> : null}
        </a>
      ))}
    </nav>
  );
}

/**
 * `?solo=1` corta a casca inteira: cabeçalho, abas, grade, tudo.
 *
 * É a rota que roda dentro do iframe do preset de viewport. Ela precisa do
 * `BrandThemeProvider` (a peça lê `--brand`) e de nada mais — e a marca e o tema
 * chegam por query, porque iframe é outro documento e não herda o que o pai
 * aplicou no `<html>` dele.
 */
function useSolo() {
  const [solo, setSolo] = React.useState(() => new URLSearchParams(window.location.search));
  React.useEffect(() => {
    const sync = () => setSolo(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  return solo;
}

function Raiz() {
  const params = useSolo();
  const ehSolo = params.get("solo") === "1";

  React.useEffect(() => {
    if (ehSolo) document.documentElement.classList.toggle("dark", params.get("dark") === "1");
  }, [ehSolo, params]);

  if (ehSolo) {
    return (
      <React.Suspense fallback={null}>
        <RotaSolo params={params} />
      </React.Suspense>
    );
  }

  return <Shell />;
}

export default function App() {
  const marca = new URLSearchParams(window.location.search).get("brand");

  return (
    <VisantAuthProvider>
      <BrandThemeProvider registryUrl={REGISTRY_URL} defaultBrand={marca || DEFAULT_BRAND}>
        <Raiz />
      </BrandThemeProvider>
    </VisantAuthProvider>
  );
}
