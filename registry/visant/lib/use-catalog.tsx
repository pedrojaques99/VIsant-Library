"use client";

import * as React from "react";
import { FilterBar, type FilterBarChip } from "@/components/ui/filter-bar";
import { FilterMenu, type FilterGroup } from "@/components/ui/filter-menu";
import { fold } from "@/hooks/use-local-search";

/**
 * useCatalog — busca, facetas, ordem e agrupamento iguais em qualquer lista.
 *
 * Colhido do Estúdio (jaques-os), onde cinco telas (peças, projetos, gravações,
 * imagens, sons) tinham cada uma a sua barra de filtro. A tela só diz o que
 * cada item TEM (o texto da busca, as facetas, as ordens, os agrupamentos); a
 * barra, o estado e a contagem são estes, sempre.
 *
 * ── As decisões que custaram caro ──────────────────────────────────────────
 *
 * 1. **As opções de cada faceta saem dos próprios dados**, com quantos itens têm
 *    cada uma. Opção que não existe na lista não aparece: nada de filtro que
 *    zera a tela. Faceta com uma opção só some (não há o que escolher), a não
 *    ser que esteja marcada, porque aí a pessoa precisa conseguir desmarcar.
 * 2. **O estado mora na URL** (`?q=`, `?f.<faceta>=a,b`, `?sort=`, `?group=`).
 *    O link leva o filtro junto, voltar e recarregar não perdem nada, e um
 *    agente lê na barra de endereço o que a pessoa está vendo.
 * 3. **`group=none` guarda a escolha de NÃO agrupar** quando a tela agrupa por
 *    padrão. Sem esse valor, desagrupar apagaria o parâmetro e o padrão voltaria.
 * 4. **A ordem padrão não vai pra URL.** Só o que diverge do padrão aparece no
 *    link; o endereço limpo continua limpo.
 * 5. **Ordenar e agrupar usam o mesmo `filter-menu`**, em modo excludente. Um
 *    menu a mais com outro desenho é o começo de três barras diferentes de novo.
 *
 * ── Sem router ─────────────────────────────────────────────────────────────
 *
 * O padrão lê `window.location.search` e escreve com `history.replaceState`
 * (filtrar não empilha histórico: o Voltar sai da tela, não desfaz um chip).
 * Com router, passe o adaptador e o estado passa por ele:
 *
 *   const [params, setParams] = useSearchParams();             // react-router
 *   useCatalog(items, { ...cfg, params: { params, setParams: (n) => setParams(n, { replace: true }) } });
 *
 * No Next: `useSearchParams()` + `router.replace(`?${n}`, { scroll: false })`.
 *
 * Sem `search` na config a busca é do servidor: o hook não filtra por texto e a
 * tela lê `query` para mandar junto na requisição.
 */

export interface CatalogFacet<T> {
  key: string;
  label: string;
  /** O(s) valor(es) do item nesta faceta. */
  get: (item: T) => string | string[] | null | undefined;
  /** Rótulo de um valor (id do status → "Editado"). Sem isto, o valor é o rótulo. */
  labelOf?: (value: string) => string;
  /** Ordem fixa das opções (etapas de um quadro); sem isto, as mais comuns primeiro. */
  order?: string[];
  mode?: "multi" | "single";
}

export interface CatalogSort<T> {
  id: string;
  label: string;
  compare: (a: T, b: T) => number;
}

export interface CatalogGrouping<T> {
  id: string;
  label: string;
  get: (item: T) => string;
  labelOf?: (value: string) => string;
  /** Ordem fixa das seções; o que ficar fora vai para o fim. */
  order?: string[];
}

/** De onde o estado é lido e para onde vai. O padrão é a URL do navegador. */
export interface CatalogParamsAdapter {
  params: URLSearchParams;
  setParams: (next: URLSearchParams) => void;
}

export interface CatalogLabels {
  search?: string;
  filters?: string;
  clear?: string;
  sort?: (current: string) => string;
  sortBy?: string;
  group?: string;
  groupedBy?: (current: string) => string;
  groupBy?: string;
  noGroups?: string;
  count?: (filtered: number, total: number) => string;
  /** Rótulo da seção de itens sem valor no agrupamento. */
  empty?: string;
}

export interface CatalogConfig<T> {
  /** Texto onde a busca procura. Sem isto, a busca é do servidor. */
  search?: (item: T) => string;
  facets?: CatalogFacet<T>[];
  sorts?: CatalogSort<T>[];
  defaultSort?: string;
  groupings?: CatalogGrouping<T>[];
  /** Agrupamento com que a tela já abre. */
  defaultGroup?: string;
  /** Prefixo dos parâmetros, quando a tela tem mais de um catálogo (`a.q`, `b.q`). */
  prefix?: string;
  /** Adaptador de router. Sem ele, `window.location` + `history.replaceState`. */
  params?: CatalogParamsAdapter;
  labels?: CatalogLabels;
}

export interface CatalogSection<T> {
  id: string;
  label: string;
  items: T[];
}

const ROTULOS: Required<CatalogLabels> = {
  search: "Buscar",
  filters: "Filtrar",
  clear: "Limpar",
  sort: (atual) => `Ordem: ${atual}`,
  sortBy: "Ordenar por",
  group: "Agrupar",
  groupedBy: (atual) => `Por ${atual.toLowerCase()}`,
  groupBy: "Agrupar por",
  noGroups: "Sem grupos",
  count: (a, b) => `${a} de ${b}`,
  empty: "—",
};

const SEM_FACETAS: never[] = [];
const valores = (v: string | string[] | null | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

// ── O adaptador padrão: a URL do navegador ──────────────────────────────────
// `replaceState` não dispara evento nenhum. Dois catálogos na mesma página (ou o
// mesmo catálogo depois de mexer) só se enxergam por este aviso próprio.
const AVISO = "visant:catalog-url";
const assinar = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  window.addEventListener(AVISO, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(AVISO, cb);
  };
};
const lerBusca = () => window.location.search;
const lerNoServidor = () => "";

function useUrlParams(): CatalogParamsAdapter {
  const busca = React.useSyncExternalStore(assinar, lerBusca, lerNoServidor);
  const params = React.useMemo(() => new URLSearchParams(busca), [busca]);
  const setParams = React.useCallback((n: URLSearchParams) => {
    const s = n.toString();
    const url = `${window.location.pathname}${s ? `?${s}` : ""}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new Event(AVISO));
  }, []);
  return { params, setParams };
}

export function useCatalog<T>(items: readonly T[], cfg: CatalogConfig<T>) {
  const daUrl = useUrlParams();
  const { params, setParams } = cfg.params ?? daUrl;
  const L = { ...ROTULOS, ...cfg.labels };
  const p = cfg.prefix ? `${cfg.prefix}.` : "";
  const facets: CatalogFacet<T>[] = cfg.facets ?? SEM_FACETAS;
  const ordemPadrao = cfg.defaultSort ?? cfg.sorts?.[0]?.id ?? "";

  const query = params.get(`${p}q`) ?? "";
  const sort = params.get(`${p}sort`) ?? ordemPadrao;
  const grupoBruto = params.get(`${p}group`);
  const group = grupoBruto === "none" ? "" : (grupoBruto ?? cfg.defaultGroup ?? "");

  // A chave em texto segura o memo: o objeto `params` pode ser novo a cada render
  // no adaptador de quem chama, e o filtro não precisa refazer por isso.
  const chave = params.toString();
  const selected: Record<string, string[]> = React.useMemo(
    () =>
      Object.fromEntries(
        facets.map((f) => [f.key, (params.get(`${p}f.${f.key}`) ?? "").split(",").filter(Boolean)]),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chave, p, facets],
  );

  // Sempre a partir do estado atual, nunca de uma cópia antiga: duas mudanças no
  // mesmo clique (limpar e marcar) não podem se apagar.
  const atual = React.useRef(params);
  atual.current = params;
  const mexer = React.useCallback(
    (fn: (n: URLSearchParams) => void) => {
      const n = new URLSearchParams(cfg.params ? atual.current : window.location.search);
      fn(n);
      atual.current = n;
      setParams(n);
    },
    [cfg.params, setParams],
  );

  const setQuery = (v: string) =>
    mexer((n) => {
      if (v) n.set(`${p}q`, v);
      else n.delete(`${p}q`);
    });
  const toggle = (key: string, id: string) =>
    mexer((n) => {
      const f = facets.find((x) => x.key === key);
      const agora = (n.get(`${p}f.${key}`) ?? "").split(",").filter(Boolean);
      const tem = agora.includes(id);
      const novo = f?.mode === "single" ? (tem ? [] : [id]) : tem ? agora.filter((x) => x !== id) : [...agora, id];
      if (novo.length) n.set(`${p}f.${key}`, novo.join(","));
      else n.delete(`${p}f.${key}`);
    });
  const clear = () =>
    mexer((n) => {
      n.delete(`${p}q`);
      for (const f of facets) n.delete(`${p}f.${f.key}`);
    });
  const setSort = (id: string) =>
    mexer((n) => {
      if (id && id !== ordemPadrao) n.set(`${p}sort`, id);
      else n.delete(`${p}sort`);
    });
  const setGroup = (id: string) =>
    mexer((n) => {
      if (id === (cfg.defaultGroup ?? "")) n.delete(`${p}group`);
      else n.set(`${p}group`, id || "none");
    });

  // Busca + facetas + ordem.
  const filtered = React.useMemo(() => {
    const termos = fold(query).split(/\s+/).filter(Boolean);
    const ativas = facets.filter((f) => selected[f.key]?.length);
    const lista = items.filter((it) => {
      if (termos.length && cfg.search) {
        const t = fold(cfg.search(it));
        if (!termos.every((x) => t.includes(x))) return false;
      }
      return ativas.every((f) => valores(f.get(it)).some((v) => selected[f.key]!.includes(v)));
    });
    const o = cfg.sorts?.find((x) => x.id === sort);
    return o ? [...lista].sort(o.compare) : lista;
  }, [items, query, selected, sort, facets, cfg.search, cfg.sorts]);

  // As opções de cada faceta, contadas sobre a lista inteira (a contagem não muda
  // conforme se filtra, senão a pessoa perde a noção do tamanho de cada grupo).
  const groups: FilterGroup[] = React.useMemo(
    () =>
      facets
        .map((f) => {
          const conta = new Map<string, number>();
          for (const it of items) for (const v of valores(f.get(it))) conta.set(v, (conta.get(v) ?? 0) + 1);
          const ids = f.order
            ? f.order.filter((x) => conta.has(x))
            : [...conta.keys()].sort((a, b) => conta.get(b)! - conta.get(a)! || a.localeCompare(b));
          return {
            key: f.key,
            label: f.label,
            mode: f.mode,
            options: ids.map((id) => ({ id, label: `${f.labelOf?.(id) ?? id} ${conta.get(id)}` })),
          };
        })
        .filter((g) => g.options.length > 1 || (selected[g.key]?.length ?? 0) > 0),
    [items, selected, facets],
  );

  const chips: FilterBarChip[] = facets.flatMap((f) =>
    (selected[f.key] ?? []).map((id) => ({
      key: `${f.key}:${id}`,
      label: `${f.label}: ${f.labelOf?.(id) ?? id}`,
      onRemove: () => toggle(f.key, id),
    })),
  );

  // Com um agrupamento escolhido, a lista vira seções.
  const ag = cfg.groupings?.find((a) => a.id === group);
  const sections: CatalogSection<T>[] | null = React.useMemo(() => {
    if (!ag) return null;
    const m = new Map<string, T[]>();
    for (const it of filtered) {
      const k = ag.get(it) || "";
      const l = m.get(k);
      if (l) l.push(it);
      else m.set(k, [it]);
    }
    const ids = ag.order
      ? [...ag.order.filter((x) => m.has(x)), ...[...m.keys()].filter((x) => !ag.order!.includes(x))]
      : [...m.keys()].sort((a, b) => (a ? (b ? a.localeCompare(b) : -1) : 1));
    return ids.map((id) => ({ id, label: id ? (ag.labelOf?.(id) ?? id) : L.empty, items: m.get(id)! }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ag, filtered]);

  const filtrando = chips.length > 0 || !!query;
  const bar = (extras?: React.ReactNode) => (
    <FilterBar
      query={query}
      onQueryChange={setQuery}
      queryPlaceholder={L.search}
      groups={groups}
      selected={selected}
      onToggle={toggle}
      filtersLabel={L.filters}
      chips={chips}
      onClearAll={filtrando ? clear : undefined}
      clearAllLabel={L.clear}
      filteredCount={filtered.length}
      totalCount={items.length}
      countLabel={L.count}
      sort={
        cfg.sorts?.length || cfg.groupings?.length ? (
          <div className="flex items-center gap-2">
            {cfg.sorts?.length ? <SortMenu sorts={cfg.sorts} value={sort} onChange={setSort} labels={L} /> : null}
            {cfg.groupings?.length ? (
              <FilterMenu
                count={false}
                align="end"
                label={ag ? L.groupedBy(ag.label) : L.group}
                groups={[
                  {
                    key: "group",
                    label: L.groupBy,
                    mode: "single",
                    options: [{ id: "", label: L.noGroups }, ...cfg.groupings.map((a) => ({ id: a.id, label: a.label }))],
                  },
                ]}
                selected={{ group: [group] }}
                onToggle={(_k, id) => setGroup(id === group ? "" : id)}
              />
            ) : null}
          </div>
        ) : undefined
      }
      extras={extras}
    />
  );

  return {
    /** Itens depois da busca, das facetas e da ordem. */
    filtered,
    /** Seções, quando há agrupamento ativo; `null` sem agrupamento. */
    sections,
    /** A barra pronta. `extras` entra no slot da direita (botão de criar, troca de vista). */
    bar,
    query,
    sort,
    group,
    selected,
    total: items.length,
    setQuery,
    toggle,
    clear,
    setSort,
    setGroup,
    /** Facetas prontas para um `filter-menu` montado fora da barra. */
    groups,
    chips,
  };
}

/** Comparadores comuns, para não repetir em cada tela. */
export const byText =
  <T,>(get: (x: T) => string, locale?: string) =>
  (a: T, b: T) =>
    get(a).localeCompare(get(b), locale, { sensitivity: "base", numeric: true });

/** Sem valor vai para o fim, nos dois sentidos. `desc` (padrão) põe o maior primeiro. */
export const byNumber =
  <T,>(get: (x: T) => number | null | undefined, desc = true) =>
  (a: T, b: T) => {
    const va = get(a);
    const vb = get(b);
    if (va == null || vb == null) return va == null ? (vb == null ? 0 : 1) : -1;
    return (vb - va) * (desc ? 1 : -1);
  };

/** Data ISO (ou qualquer texto que `Date.parse` entenda). `desc` põe a mais recente primeiro. */
export const byDate = <T,>(get: (x: T) => string | null | undefined, desc = true) =>
  byNumber<T>((x) => {
    const d = get(x);
    const t = d ? Date.parse(d) : NaN;
    return Number.isNaN(t) ? null : t;
  }, desc);

/**
 * Só o menu de ordem, para a tela que já tem a própria barra de filtro. Mesmo
 * componente e mesmo texto das listas que usam o catálogo inteiro.
 */
export function SortMenu({
  sorts,
  value,
  onChange,
  labels,
}: {
  sorts: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  labels?: Pick<CatalogLabels, "sort" | "sortBy">;
}) {
  const rotulo = labels?.sort ?? ROTULOS.sort;
  return (
    <FilterMenu
      count={false}
      align="end"
      label={rotulo(sorts.find((o) => o.id === value)?.label ?? "")}
      groups={[
        {
          key: "sort",
          label: labels?.sortBy ?? ROTULOS.sortBy,
          mode: "single",
          options: sorts.map((o) => ({ id: o.id, label: o.label })),
        },
      ]}
      selected={{ sort: [value] }}
      onToggle={(_k, id) => onChange(id)}
    />
  );
}
