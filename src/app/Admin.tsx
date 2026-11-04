"use client";

/**
 * /admin: como a library está sendo usada, só para admin do Visant Labs.
 *
 * Abre pelo que fazer (`admin/leitura.ts`), e os números vêm depois como evidência. Fonte fora do
 * ar aparece como fora do ar: zero fica reservado para quando o zero é verdade. Plano em
 * PLANO-ADMIN.md.
 */

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ArrowUpRight } from "lucide-react";
import { DataTable } from "../../registry/visant/ui/data-table";
import { SegmentedControl } from "../../registry/visant/ui/segmented-control";
import REPORTES from "../../bugs/reports.jsonl?raw";
import { ler, type LinhaDePeca } from "./admin/leitura";
import { CATALOG } from "./catalog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./components/ui/chart";
import { NOTA_DE_CORTE } from "./curadoria";

type Contagem = { tipo: string; item: string; dia: string; n: number };
type Dados = {
  login: boolean;
  admin: boolean;
  fontes?: Record<"contagens" | "curadoria" | "burilacao" | "lab" | "skills" | "github" | "interesse", boolean>;
  contagens?: Contagem[];
  notas?: { item: string; nota: number; comentario: string; excluir: boolean; data: string }[];
  votos?: { duelo: string; escolha: string }[];
  veredictos?: { id: string; status: string; at: string }[];
  skills?: { nome: string; instalacoes: number }[];
  github?: { estrelas: number; forks: number; views: number | null; clones: number | null } | null;
  emails?: { email: string; origem: string; em: string }[];
  feedback?: { texto: string; origem: string; em: string }[];
};
type Periodo = "7" | "30" | "90";

const num = (n: number) => n.toLocaleString("pt-BR");
const iso = (d: Date) => d.toISOString().slice(0, 10);

function reportesAbertos() {
  const porPeca = new Map<string, number>();
  for (const linha of REPORTES.split("\n")) {
    try {
      const r = JSON.parse(linha) as { item?: string; resolvido?: boolean };
      if (r.item && !r.resolvido) porPeca.set(r.item, (porPeca.get(r.item) ?? 0) + 1);
    } catch {
      /* linha vazia no fim do arquivo */
    }
  }
  return porPeca;
}

function Secao({ titulo, children, className }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={className}>
      <h2 className="mb-3 text-casa-lg font-medium">{titulo}</h2>
      {children}
    </section>
  );
}

function Indicador({ rotulo, valor, regua }: { rotulo: string; valor: string; regua: string }) {
  return (
    <div data-indicador={rotulo} className="min-w-0 rounded-tile bg-casa-tile p-4">
      <p className="text-casa-sm text-casa-fg-2">{rotulo}</p>
      <p className="mt-1 text-[1.75rem] font-medium leading-tight tabular-nums">{valor}</p>
      <p className="mt-1 text-casa-sm text-casa-fg-3">{regua}</p>
    </div>
  );
}

/** A régua de um número do período: contra o período anterior, ou o motivo de não haver comparação. */
function contraAnterior(atual: number, anterior: number, dias: number, fonteOk: boolean) {
  if (!fonteOk) return "fonte fora do ar";
  if (!anterior) return `em ${dias} dias, sem período anterior`;
  const v = Math.round(((atual - anterior) / anterior) * 100);
  return `${v >= 0 ? "+" : ""}${v}% sobre ${num(anterior)}`;
}

function Vazio({ children }: { children: React.ReactNode }) {
  return <p className="rounded-tile bg-casa-tile p-4 text-casa-sm text-casa-fg-2">{children}</p>;
}

function SerieDiaria({ dados, nome }: { dados: { dia: string; n: number }[]; nome: string }) {
  const id = React.useId();
  if (!dados.some((d) => d.n > 0)) return <Vazio>Sem {nome.toLowerCase()} neste período.</Vazio>;
  const config = { n: { label: nome, color: "var(--casa-fg-2)" } };
  return (
    <div data-serie={nome} className="rounded-tile bg-casa-tile p-4">
      <ChartContainer id={id} config={config} className="aspect-auto h-44 w-full">
        <BarChart data={dados} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--casa-line)" />
          <XAxis dataKey="dia" tickLine={false} axisLine={false} minTickGap={32} tickFormatter={(d: string) => `${d.slice(8)}/${d.slice(5, 7)}`} />
          <YAxis width={32} tickLine={false} axisLine={false} allowDecimals={false} />
          <ChartTooltip cursor={{ fill: "var(--casa-tile-2)" }} content={<ChartTooltipContent />} />
          <Bar dataKey="n" fill="var(--casa-fg-2)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

/** Lista com barra: comparar quantidades de um mesmo tipo. A cor é uma só, porque o nome já identifica. */
function Ranking({ linhas, vazio }: { linhas: { nome: string; n: number }[]; vazio: string }) {
  if (!linhas.length) return <Vazio>{vazio}</Vazio>;
  const topo = Math.max(...linhas.map((l) => l.n), 1);
  return (
    <ul className="space-y-3 rounded-tile bg-casa-tile p-4">
      {linhas.map((l) => (
        <li key={l.nome}>
          <div className="flex items-baseline justify-between gap-3 text-casa-sm">
            <span className="min-w-0 truncate">{l.nome}</span>
            <span className="tabular-nums text-casa-fg-2">{num(l.n)}</span>
          </div>
          <div aria-hidden="true" className="mt-1 h-1 overflow-hidden rounded-[2px] bg-casa-tile-2">
            <div className="h-full origin-left bg-casa-fg-2" style={{ transform: `scaleX(${l.n / topo})` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const COLUNAS: ColumnDef<LinhaDePeca>[] = [
  { accessorKey: "titulo", header: "Peça" },
  { accessorKey: "downloads", header: "Downloads", cell: ({ getValue }) => <span className="tabular-nums">{num(getValue<number>())}</span> },
  { accessorKey: "copias", header: "Cópias", cell: ({ getValue }) => <span className="tabular-nums">{num(getValue<number>())}</span> },
  { accessorKey: "aberturas", header: "Aberturas", cell: ({ getValue }) => <span className="tabular-nums">{num(getValue<number>())}</span> },
  {
    accessorKey: "nota",
    header: "Nota",
    sortUndefined: "last",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.nota ?? "sem nota"}
        {row.original.arquivada ? " (arquivada)" : ""}
      </span>
    ),
  },
  { accessorKey: "reportes", header: "Reportes", cell: ({ getValue }) => <span className="tabular-nums">{num(getValue<number>())}</span> },
];

const FONTES = [
  { chave: "contagens", nome: "Visitas, downloads e cópias", falta: "Rode admin/supabase.sql no Supabase do lab." },
  { chave: "curadoria", nome: "Notas", falta: "Rode curadoria/supabase.sql." },
  { chave: "burilacao", nome: "Votos da burilação", falta: "Rode burilacao/supabase.sql." },
  { chave: "lab", nome: "Vereditos do lab", falta: "Confira o Supabase do lab." },
  { chave: "skills", nome: "Instalações (skills.sh)", falta: "O skills.sh não respondeu." },
  { chave: "github", nome: "GitHub", falta: "O GitHub não respondeu." },
  { chave: "interesse", nome: "E-mails e feedback", falta: "Rode admin/interesse.sql no Supabase do lab." },
] as const;

export function Admin() {
  const [dados, setDados] = React.useState<Dados | null | "falhou">(null);
  const [periodo, setPeriodo] = React.useState<Periodo>("30");

  React.useEffect(() => {
    fetch("/api/admin", { credentials: "same-origin" })
      .then((r) => (r.ok ? (r.json() as Promise<Dados>) : Promise.reject()))
      .then(setDados)
      .catch(() => setDados("falhou"));
  }, []);

  const dias = Number(periodo);
  const painel = React.useMemo(() => {
    if (!dados || dados === "falhou" || !dados.admin) return null;
    const hoje = new Date();
    const corte = new Date(hoje);
    corte.setUTCDate(corte.getUTCDate() - dias + 1);
    const corteAnterior = new Date(corte);
    corteAnterior.setUTCDate(corteAnterior.getUTCDate() - dias);
    const inicio = iso(corte);
    const inicioAnterior = iso(corteAnterior);
    const contagens = dados.contagens ?? [];
    const noPeriodo = contagens.filter((c) => c.dia >= inicio);
    const soma = (lista: Contagem[], tipo: string) => lista.filter((c) => c.tipo === tipo).reduce((s, c) => s + Number(c.n), 0);
    const anteriores = contagens.filter((c) => c.dia >= inicioAnterior && c.dia < inicio);
    const totais = (tipo: string) => ({ atual: soma(noPeriodo, tipo), anterior: soma(anteriores, tipo) });
    const porItem = (tipo: string) => {
      const m = new Map<string, number>();
      for (const c of noPeriodo) if (c.tipo === tipo) m.set(c.item, (m.get(c.item) ?? 0) + Number(c.n));
      return m;
    };
    const ranking = (tipo: string, limite = 8) =>
      [...porItem(tipo)].map(([nome, n]) => ({ nome, n })).sort((a, b) => b.n - a.n).slice(0, limite);
    const serie = (tipo: string) => {
      const m = new Map<string, number>();
      for (const c of noPeriodo) if (c.tipo === tipo) m.set(c.dia, (m.get(c.dia) ?? 0) + Number(c.n));
      return Array.from({ length: dias }, (_, i) => {
        const d = new Date(corte);
        d.setUTCDate(d.getUTCDate() + i);
        const dia = iso(d);
        return { dia, n: m.get(dia) ?? 0 };
      });
    };
    const notas = new Map((dados.notas ?? []).map((n) => [n.item, n]));
    const reportes = reportesAbertos();
    const downloads = porItem("download");
    const copias = porItem("copia");
    const aberturas = porItem("peca");
    const pecas: LinhaDePeca[] = CATALOG.filter((i) => i.demo).map((i) => {
      const n = notas.get(i.name);
      return {
        nome: i.name,
        titulo: i.title,
        downloads: downloads.get(i.name) ?? 0,
        copias: copias.get(i.name) ?? 0,
        aberturas: aberturas.get(i.name) ?? 0,
        nota: n?.nota ?? null,
        arquivada: Boolean(n && (n.excluir || n.nota <= NOTA_DE_CORTE)),
        reportes: reportes.get(i.name) ?? 0,
      };
    });
    const skills = dados.skills ?? [];
    const visitas = totais("visita");
    const baixadas = totais("download");
    return {
      visitas,
      baixadas,
      paginas: totais("pagina"),
      copiadas: totais("copia"),
      serieVisitas: serie("visita"),
      serieDownloads: serie("download"),
      paginasTop: ranking("pagina"),
      origens: ranking("origem"),
      paises: ranking("pais"),
      aparelhos: ranking("aparelho"),
      pecas: [...pecas].sort((a, b) => b.downloads + b.copias + b.aberturas - (a.downloads + a.copias + a.aberturas)),
      skills,
      instalacoes: skills.reduce((s, x) => s + x.instalacoes, 0),
      reportesTotal: [...reportes.values()].reduce((s, n) => s + n, 0),
      leituras: ler({ pecas, skills, visitas, downloads: baixadas, dias }),
    };
  }, [dados, dias]);

  const casca = "casa shell min-w-0 py-6 lg:py-10";
  if (dados === null) return <main className={casca} aria-busy="true" />;
  if (dados === "falhou") {
    return (
      <main className={casca}>
        <h1 className="text-[2rem] font-medium leading-tight tracking-[-0.02em]">O painel não carregou.</h1>
        <p className="mt-3 text-casa-lg text-casa-fg-2">A API não respondeu. Recarregue a página.</p>
      </main>
    );
  }
  if (!dados.admin || !painel) {
    return (
      <main className={casca}>
        <h1 className="text-[2rem] font-medium leading-tight tracking-[-0.02em]">Esta rota é só de admin.</h1>
        <p className="mt-3 text-casa-lg text-casa-fg-2">Entre pelo botão Entrar, no alto da página, com a conta admin do Visant Labs.</p>
      </main>
    );
  }

  const f = dados.fontes!;
  const notasLista = dados.notas ?? [];
  const media = notasLista.length ? notasLista.reduce((s, n) => s + n.nota, 0) / notasLista.length : null;
  const mantidos = (dados.veredictos ?? []).filter((v) => v.status === "kept").length;
  const faltando = FONTES.filter((x) => !f[x.chave]);

  return (
    <main data-admin className={`${casca} space-y-8`}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-medium leading-tight tracking-[-0.02em]">Painel</h1>
        <SegmentedControl
          aria-label="Período"
          value={periodo}
          onChange={setPeriodo}
          options={[
            { value: "7", label: "7 dias" },
            { value: "30", label: "30 dias" },
            { value: "90", label: "90 dias" },
          ]}
          className="w-full max-w-xs [&_button]:min-h-11 sm:w-72"
        />
      </header>

      {faltando.length ? (
        <p data-fontes-fora className="rounded-tile bg-casa-tile p-4 text-casa-sm">
          Fora do ar: {faltando.map((x) => x.nome).join(", ")}. Veja o que fazer no fim da página.
        </p>
      ) : null}

      <Secao titulo="O que olhar agora">
        {painel.leituras.length ? (
          <ul data-leituras className="divide-y divide-casa-line rounded-tile bg-casa-tile">
            {painel.leituras.map((l) => (
              <li key={l.titulo} className="p-4">
                {l.href ? (
                  <a href={l.href} className="inline-flex min-h-6 items-center gap-1 font-medium underline-offset-2 outline-none hover:underline focus-visible:[box-shadow:var(--focus)]">
                    {l.titulo}
                    <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
                  </a>
                ) : (
                  <p className="font-medium">{l.titulo}</p>
                )}
                <p className="mt-0.5 text-casa-sm text-casa-fg-2">{l.evidencia}</p>
              </li>
            ))}
          </ul>
        ) : (
          <Vazio>Nada pede atenção com os dados que existem hoje.</Vazio>
        )}
      </Secao>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
        <Indicador rotulo="Visitas" valor={num(painel.visitas.atual)} regua={contraAnterior(painel.visitas.atual, painel.visitas.anterior, dias, f.contagens)} />
        <Indicador rotulo="Páginas vistas" valor={num(painel.paginas.atual)} regua={contraAnterior(painel.paginas.atual, painel.paginas.anterior, dias, f.contagens)} />
        <Indicador rotulo="Downloads" valor={num(painel.baixadas.atual)} regua={contraAnterior(painel.baixadas.atual, painel.baixadas.anterior, dias, f.contagens)} />
        <Indicador rotulo="Comandos copiados" valor={num(painel.copiadas.atual)} regua={contraAnterior(painel.copiadas.atual, painel.copiadas.anterior, dias, f.contagens)} />
        <Indicador rotulo="Instalações de skills" valor={f.skills ? num(painel.instalacoes) : "–"} regua={f.skills ? "total no skills.sh" : "fonte fora do ar"} />
        <Indicador rotulo="Estrelas" valor={dados.github ? num(dados.github.estrelas) : "–"} regua={dados.github ? `${num(dados.github.forks)} forks` : "fonte fora do ar"} />
        <Indicador rotulo="Nota média" valor={media === null ? "–" : media.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} regua={`${notasLista.length} de ${painel.pecas.length} peças avaliadas`} />
        <Indicador rotulo="Reportes abertos" valor={num(painel.reportesTotal)} regua="no último deploy" />
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <Secao titulo="Visitas por dia" className="min-w-0">
          <SerieDiaria dados={painel.serieVisitas} nome="Visitas" />
        </Secao>
        <Secao titulo="Downloads por dia" className="min-w-0">
          <SerieDiaria dados={painel.serieDownloads} nome="Downloads" />
        </Secao>
      </div>

      <Secao titulo="Peças">
        <div className="overflow-x-auto rounded-tile bg-casa-tile">
          <DataTable
            columns={COLUNAS}
            data={painel.pecas}
            getRowId={(p) => p.nome}
            primaryColumnId="titulo"
            onRowClick={(p) => {
              window.location.href = `/c/${p.nome}`;
            }}
            emptyMessage="Nenhuma peça."
          />
        </div>
        <p className="mt-2 text-casa-sm text-casa-fg-3">Download conta pedido ao registry. O shadcn também baixa as dependências, então peça base aparece maior.</p>
      </Secao>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <Secao titulo="Skills" className="min-w-0">
          <Ranking linhas={painel.skills.map((s) => ({ nome: s.nome, n: s.instalacoes }))} vazio="Sem dados do skills.sh." />
        </Secao>
        <Secao titulo="Páginas mais vistas" className="min-w-0">
          <Ranking linhas={painel.paginasTop} vazio="Sem páginas contadas neste período." />
        </Secao>
        <Secao titulo="De onde vêm" className="min-w-0">
          <Ranking linhas={painel.origens} vazio="Sem origens contadas neste período." />
        </Secao>
        <Secao titulo="Países" className="min-w-0">
          <Ranking linhas={painel.paises} vazio="Sem países contados neste período." />
        </Secao>
        <Secao titulo="Aparelhos" className="min-w-0">
          <Ranking linhas={painel.aparelhos} vazio="Sem aparelhos contados neste período." />
        </Secao>
        <Secao titulo="Curadoria" className="min-w-0">
          <div className="grid grid-cols-2 gap-2">
            <Indicador rotulo="Votos na burilação" valor={num(dados.votos?.length ?? 0)} regua="no total" />
            <Indicador rotulo="Vereditos do lab" valor={num(dados.veredictos?.length ?? 0)} regua={`aprovados: ${mantidos}`} />
          </div>
          {dados.github?.views != null ? (
            <p className="mt-2 text-casa-sm text-casa-fg-2">
              GitHub em 14 dias: {num(dados.github.views)} views, {num(dados.github.clones ?? 0)} clones.
            </p>
          ) : null}
        </Secao>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <Secao titulo={`E-mails (${num(dados.emails?.length ?? 0)})`} className="min-w-0">
          {dados.emails?.length ? (
            <>
              <ul data-emails className="max-h-72 divide-y divide-casa-line overflow-y-auto rounded-tile bg-casa-tile">
                {dados.emails.map((e) => (
                  <li key={e.email} className="flex flex-wrap items-baseline justify-between gap-x-3 p-3 text-casa-sm">
                    <span className="min-w-0 [overflow-wrap:anywhere]">{e.email}</span>
                    <span className="text-casa-fg-3">{e.em.slice(0, 10)}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                data-copiar-emails
                onClick={() => void navigator.clipboard.writeText(dados.emails!.map((e) => e.email).join("\n"))}
                className="mt-2 inline-flex min-h-11 items-center rounded-control bg-casa-tile-2 px-4 text-casa-sm outline-none focus-visible:[box-shadow:var(--focus)]"
              >
                Copiar todos
              </button>
            </>
          ) : (
            <Vazio>Nenhum e-mail ainda.</Vazio>
          )}
        </Secao>
        <Secao titulo={`Feedback (${num(dados.feedback?.length ?? 0)})`} className="min-w-0">
          {dados.feedback?.length ? (
            <ul data-feedback className="max-h-72 divide-y divide-casa-line overflow-y-auto rounded-tile bg-casa-tile">
              {dados.feedback.map((x) => (
                <li key={`${x.em}${x.texto.slice(0, 20)}`} className="p-3 text-casa-sm">
                  <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{x.texto}</p>
                  <p className="mt-1 text-casa-fg-3">
                    {x.origem}, {x.em.slice(0, 10)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <Vazio>Nenhum feedback ainda.</Vazio>
          )}
        </Secao>
      </div>

      <Secao titulo="Fontes">
        <ul data-fontes className="divide-y divide-casa-line rounded-tile bg-casa-tile">
          {FONTES.map((x) => (
            <li key={x.chave} data-fonte={x.chave} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 p-4 text-casa-sm">
              <span>{x.nome}</span>
              <span className="text-casa-fg-2">{f[x.chave] ? "No ar" : x.falta}</span>
            </li>
          ))}
        </ul>
      </Secao>
    </main>
  );
}
