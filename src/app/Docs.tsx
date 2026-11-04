"use client";

/**
 * Docs: começar, trocar de marca, conectar o agente e a referência do que não tem nada para ver.
 *
 * O texto e os exemplos moram em `docs-conteudo.json`, que `scripts/llms.mjs` também lê para
 * escrever `/docs.md`: a página e o Markdown não têm como divergir. Cada exemplo de lá foi
 * compilado num projeto Vite limpo, com o item instalado pelo próprio `shadcn add`.
 *
 * Tocar numa linha da referência abre o uso ali mesmo. O arquivo cru fica atrás de "Ver código":
 * a ficha de `/c/<item>` é de peça com palco, e abria o fonte com "Catálogo" aceso no cabeçalho.
 */

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { useBrandTheme } from "@/lib/brand-theme";
import { cn } from "@/lib/utils";
import { CATALOG, TYPE_LABEL } from "./catalog";
import { Codigo } from "./codigo";
import { CopyCommand } from "./copy-command";
import { fold } from "./fold";
import { installCommand } from "./registry-meta";
import CONTEUDO from "./docs-conteudo.json";
import USO from "./uso.json";

const CodigoDoItem = React.lazy(() => import("./ItemDocs").then((m) => ({ default: m.CodigoDoItem })));

const EXEMPLOS = CONTEUDO.exemplos as Record<string, string>;
const USOS = USO as Record<string, { quando?: string; evite?: string }>;

const SECOES = [
  { id: "comecar", rotulo: "Começar" },
  { id: "runtime", rotulo: "Runtime" },
  { id: "agente", rotulo: "Agente" },
  { id: "referencia", rotulo: "Referência" },
];

const ANCORA = "scroll-mt-[calc(var(--shell-header-h)+1rem)]";

interface Linha {
  name: string;
  title: string;
  description: string;
  grupo: string;
}

const FUNDACAO: Linha[] = CATALOG.filter((i) => i.family === "fundacao").map((i) => ({
  name: i.name,
  title: i.title,
  description: i.description,
  grupo: TYPE_LABEL[i.type],
}));

/** Texto com `código` entre crases: é como o JSON guarda, e como o Markdown lê. */
function Prosa({ texto }: { texto: string }) {
  return (
    <p className="max-w-2xl text-casa-base text-casa-fg-2">
      {texto.split(/(`[^`]+`)/).map((pedaco, i) =>
        pedaco.startsWith("`") ? (
          <code key={i} className="font-casa-mono text-casa-sm text-casa-fg">
            {pedaco.slice(1, -1)}
          </code>
        ) : (
          pedaco
        ),
      )}
    </p>
  );
}

/** Um comando de uma linha, inteiro: quebra em vez de cortar o nome da peça, que vem no fim. */
function Comando({ texto }: { texto: string }) {
  return (
    <div className="flex items-center gap-2 rounded-control bg-casa-tile py-1 pl-3 pr-1">
      <code className="min-w-0 flex-1 font-casa-mono text-casa-sm text-casa-fg [overflow-wrap:anywhere]">{texto}</code>
      <CopyCommand variant="chip" text={texto} />
    </div>
  );
}

function BlocoDeCodigo({ codigo, linguagem = "tsx" }: { codigo: string; linguagem?: string }) {
  return (
    /* A cópia tem faixa própria, e a linha longa quebra no celular: rolando de lado, ela escondia o fim do comando. */
    <div className="rounded-control bg-casa-tile">
      <div className="flex justify-end p-1 pb-0">
        <CopyCommand variant="chip" text={codigo} />
      </div>
      <Codigo
        codigo={codigo}
        linguagem={linguagem}
        className="px-3 pb-3 max-sm:!whitespace-pre-wrap max-sm:[overflow-wrap:anywhere]"
      />
    </div>
  );
}

function LinhaDaReferencia({ linha, aberta, onAlternar }: { linha: Linha; aberta: boolean; onAlternar: () => void }) {
  const [comCodigo, setComCodigo] = React.useState(false);
  const uso = USOS[linha.name];
  const exemplo = EXEMPLOS[linha.name];
  const temArquivo = !linha.name.startsWith("theme-");
  return (
    <li id={linha.name} data-doc={linha.name} className={cn("border-t border-casa-line", ANCORA)}>
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-expanded={aberta}
          onClick={onAlternar}
          className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-start gap-2 rounded-control py-3 text-left outline-none focus-visible:[box-shadow:var(--focus)]"
        >
          <ChevronDown
            aria-hidden
            className={cn(
              "mt-0.5 size-4 shrink-0 text-casa-fg-3 transition-transform [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
              aberta && "rotate-180",
            )}
          />
          <span className="min-w-0">
            <span className="block text-casa-base text-casa-fg">{linha.title}</span>
            <span className="mt-0.5 block max-w-3xl text-casa-sm text-casa-fg-2">{linha.description}</span>
          </span>
        </button>
        <CopyCommand variant="chip" text={installCommand(linha.name)} className="mt-1.5 pointer-coarse:mt-0" />
      </div>

      {aberta ? (
        <div className="space-y-3 pb-5 sm:pl-6">
          {uso?.quando ? <Prosa texto={`Quando usar: ${uso.quando}.`} /> : null}
          {uso?.evite ? <Prosa texto={`Evite: ${uso.evite}.`} /> : null}
          <Comando texto={installCommand(linha.name)} />
          {exemplo ? <BlocoDeCodigo codigo={exemplo} /> : null}
          {temArquivo ? (
            comCodigo ? (
              <div className="flex max-h-[32rem] flex-col overflow-hidden rounded-control bg-casa-tile">
                <React.Suspense fallback={<div className="h-40" />}>
                  <CodigoDoItem name={linha.name} />
                </React.Suspense>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setComCodigo(true)}
                className="inline-flex min-h-8 cursor-pointer items-center rounded-control text-casa-sm text-casa-fg-2 underline underline-offset-2 outline-none hover:text-casa-fg focus-visible:[box-shadow:var(--focus)] pointer-coarse:min-h-11"
              >
                Ver código
              </button>
            )
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function NavDaPagina({ className }: { className: string }) {
  return (
    <nav aria-label="Nesta página" className={className}>
      {SECOES.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="inline-flex min-h-8 items-center rounded-control text-casa-base text-casa-fg-2 outline-none transition-colors [transition-duration:var(--dur-fast)] hover:text-casa-fg focus-visible:[box-shadow:var(--focus)] pointer-coarse:min-h-11"
        >
          {s.rotulo}
        </a>
      ))}
    </nav>
  );
}

function Referencia() {
  const { brands } = useBrandTheme();
  const [busca, setBusca] = React.useState("");
  const [abertas, setAbertas] = React.useState<ReadonlySet<string>>(() => new Set());

  const linhas = React.useMemo<Linha[]>(
    () => [
      ...FUNDACAO,
      ...brands.map((b) => ({
        name: `theme-${b.slug}`,
        title: `Tema ${b.name}`,
        description: b.tagline ?? "",
        grupo: TYPE_LABEL.theme,
      })),
    ],
    [brands],
  );

  /* `/docs#brand-theme` chega com a linha aberta e na tela. */
  React.useEffect(() => {
    const abrirPeloEndereco = () => {
      const alvo = decodeURIComponent(window.location.hash.slice(1));
      if (!alvo || SECOES.some((s) => s.id === alvo) || !linhas.some((l) => l.name === alvo)) return;
      setAbertas((a) => new Set(a).add(alvo));
      requestAnimationFrame(() => document.getElementById(alvo)?.scrollIntoView({ block: "start" }));
    };
    abrirPeloEndereco();
    window.addEventListener("hashchange", abrirPeloEndereco);
    return () => window.removeEventListener("hashchange", abrirPeloEndereco);
  }, [linhas]);

  const termos = fold(busca).trim().split(/\s+/).filter(Boolean);
  const achadas = linhas.filter((l) => {
    const onde = fold(`${l.title} ${l.name} ${l.description} ${l.grupo}`);
    return termos.every((t) => onde.includes(t));
  });
  const grupos = [...new Set(achadas.map((l) => l.grupo))];

  return (
    <section id="referencia" className={cn("mt-14", ANCORA)}>
      <h2 className="text-casa-lg font-medium">Referência</h2>
      <p className="mt-1 text-casa-base text-casa-fg-2">Libs, hooks, temas e regras, sem interface própria.</p>
      <label className="mt-4 flex h-11 items-center gap-2 rounded-control bg-casa-tile px-3 focus-within:[box-shadow:var(--focus)]">
        <Search aria-hidden className="size-4 shrink-0 text-casa-fg-3" />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar na referência"
          aria-label="Buscar na referência"
          className="min-w-0 flex-1 bg-transparent text-casa-lg text-casa-fg outline-none placeholder:text-casa-fg-3 sm:text-casa-base"
        />
        <span className="shrink-0 text-casa-sm tabular-nums text-casa-fg-3">{achadas.length}</span>
      </label>

      {grupos.map((grupo) => (
        <div key={grupo} className="mt-8">
          <h3 className="mb-2 text-casa-base font-medium">{grupo}</h3>
          <ul>
            {achadas
              .filter((l) => l.grupo === grupo)
              .map((linha) => (
                <LinhaDaReferencia
                  key={linha.name}
                  linha={linha}
                  aberta={abertas.has(linha.name)}
                  onAlternar={() =>
                    setAbertas((a) => {
                      const nova = new Set(a);
                      if (!nova.delete(linha.name)) nova.add(linha.name);
                      return nova;
                    })
                  }
                />
              ))}
          </ul>
        </div>
      ))}
      {!achadas.length ? <p className="mt-6 text-casa-base text-casa-fg-2">Nada com “{busca}”.</p> : null}
    </section>
  );
}

export function Docs() {
  const { brands } = useBrandTheme();
  const { passos, runtime, agente, lead } = CONTEUDO;

  return (
    <main className="shell casa pb-16 pt-5 sm:pt-16 lg:grid lg:grid-cols-[9rem_minmax(0,1fr)] lg:gap-12">
      <NavDaPagina className="hidden lg:sticky lg:top-[calc(var(--shell-header-h)+1rem)] lg:flex lg:flex-col lg:items-start lg:gap-1 lg:self-start" />

      <div className="min-w-0 max-w-3xl">
        <h1 className="text-casa-xl font-medium">Docs</h1>
        <p className="mt-3 max-w-2xl text-casa-lg text-casa-fg-2">{lead}</p>
        <NavDaPagina className="mt-3 flex items-center gap-5 lg:hidden" />

        <section id="comecar" className={cn("mt-8 lg:mt-10", ANCORA)}>
          <h2 className="text-casa-lg font-medium">Começar em 3 passos</h2>
          <ol className="mt-4 space-y-8">
            {passos.map((passo, i) => (
              <li key={passo.titulo} className="space-y-3">
                <h3 className="text-casa-base font-medium">
                  <span className="mr-2 tabular-nums text-casa-fg-3">{i + 1}</span>
                  {passo.titulo}
                </h3>
                <Prosa texto={passo.texto} />
                <Comando texto={passo.comando} />
                {passo.codigo ? <BlocoDeCodigo codigo={passo.codigo} linguagem={passo.linguagem} /> : null}
                {i === passos.length - 1 && brands.length ? (
                  <Prosa texto={`Temas prontos: ${brands.map((b) => `\`theme-${b.slug}\``).join(", ")}.`} />
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <section id="runtime" className={cn("mt-14 space-y-3", ANCORA)}>
          <h2 className="text-casa-lg font-medium">{runtime.titulo}</h2>
          <Prosa texto={runtime.texto} />
          <Comando texto={runtime.comando} />
          <BlocoDeCodigo codigo={runtime.codigo} />
        </section>

        <section id="agente" className={cn("mt-14", ANCORA)}>
          <h2 className="text-casa-lg font-medium">{agente.titulo}</h2>
          <div className="mt-3">
            <Prosa texto={agente.texto} />
          </div>
          <ul className="mt-4">
            {agente.linhas.map((l) => (
              <li key={l.rotulo} className="flex items-center gap-4 border-t border-casa-line py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-casa-sm text-casa-fg-2">{l.rotulo}</p>
                  <code className="mt-0.5 block font-casa-mono text-casa-sm text-casa-fg [overflow-wrap:anywhere]">{l.comando}</code>
                </div>
                <CopyCommand variant="chip" text={l.comando} />
              </li>
            ))}
          </ul>
        </section>

        <Referencia />
      </div>
    </main>
  );
}
