"use client";

/**
 * As seções depois da dobra: o julgamento, a porta, a tela inteira e a prova.
 *
 * Tudo aqui sai de arquivo da visant-skills-public: as perguntas do
 * devils-advocate, os passos do SKILL.md da visant-design, a tabela do README.
 */

import * as React from "react";
import { useReducedMotion } from "motion/react";
import { ArrowUpRight, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Aba, Icone } from "../../casa-ui";
import { SegmentedControl } from "../../../../registry/visant/ui/segmented-control";
import { CartaoReu, COMANDO_FINAL, SAIDA_ABERTA, SaidaGravada } from "./banca";
import { ALVOS, CONSERTOS, cartao, type Conserto, type Juizo } from "./reu";

const TODOS: ReadonlySet<Conserto> = new Set(CONSERTOS);
/* A trilha Audit não muda o card: só aponta. */
const APONTADOS: ReadonlySet<string> = new Set(Object.values(ALVOS).flatMap((a) => a.alvos));

/* ---------------------------------------------------------- o julgamento */

const PERGUNTAS: { id: Juizo; pergunta: string; resposta: string }[] = [
  {
    id: "numero",
    pergunta: "Se eu apagar o “01 / Pricing” hoje, quem reclama em 48 horas?",
    resposta: "Ninguém reclama, porque número de seção num card sozinho é só enfeite. Então ele saiu.",
  },
  {
    id: "caixa",
    pergunta: "O que a caixa de dentro separa?",
    resposta: "Não separa nada: o espaço já junta preço e período, e o preço ainda estava colado no período. A borda saiu e os dois ganharam respiro.",
  },
  {
    id: "hierarquia",
    pergunta: "Qual número decide, e ele é o elemento mais pesado?",
    resposta: "O número é o $49, e ele era o menor texto do card. Agora é o maior, e o período vem depois dele.",
  },
  {
    id: "acao",
    pergunta: "Que decisão este card produz?",
    resposta: "Nenhuma, porque o card nem tinha botão. Agora o título diz qual é o plano e existe uma ação.",
  },
];

export function Julgamento({ ancora }: { ancora: React.RefObject<HTMLElement> }) {
  const [feitos, setFeitos] = React.useState<ReadonlySet<Juizo>>(new Set());
  const no = React.useMemo(() => cartao(TODOS, feitos), [feitos]);
  const acabou = feitos.size === PERGUNTAS.length;

  const responder = (id: Juizo) => {
    const n = new Set(feitos);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setFeitos(n);
  };

  return (
    <section ref={ancora} className="shell scroll-mt-[var(--shell-header-h)] py-16 lg:py-28">
      <div className="max-w-[60ch]">
        <h2 className="text-casa-xl font-medium">O script liberou. O card continua ruim.</h2>
        <p className="mt-3 text-casa-lg text-casa-fg-2">
          Ninguém escreve regra pra preço escondido ou falta de botão. Essa parte é pergunta, e a skill faz contra a própria tela.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="min-w-0 lg:sticky lg:top-[calc(var(--shell-header-h)+24px)] lg:self-start">
          <CartaoReu no={no} className="min-h-[420px] rounded-tile px-6 py-8 lg:px-12" />
        </div>

        <div className="min-w-0">
          <ul className="grid gap-2">
            {PERGUNTAS.map((p) => {
              const feito = feitos.has(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-pressed={feito}
                    onClick={() => responder(p.id)}
                    className={cn(
                      "alvo-toque flex w-full items-start gap-3 rounded-control p-4 text-left",
                      "transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
                      feito ? "bg-casa-tile" : "hover:bg-casa-tile",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[6px] transition-colors [transition-duration:var(--dur-fast)]",
                        feito ? "bg-casa-cta text-casa-cta-fg" : "bg-casa-tile-2",
                      )}
                    >
                      {feito ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-casa-lg">{p.pergunta}</span>
                      {feito ? (
                        <span className="mt-1 block text-casa-base text-casa-fg-2 animate-in fade-in motion-reduce:animate-none [animation-duration:var(--dur-base)]">
                          {p.resposta}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {acabou ? (
            <div className="mt-8 animate-in fade-in motion-reduce:animate-none [animation-duration:var(--dur-base)]">
              <div lang="en" className="rounded-tile bg-casa-tile p-5">
                <SaidaGravada comando={COMANDO_FINAL} saida={SAIDA_ABERTA} />
              </div>
              <p className="mt-5 max-w-[60ch] text-casa-lg">Portão aberto é o mínimo. O próprio scan lista o que falta.</p>
              <p className="mt-2 max-w-[60ch] text-casa-base text-casa-fg-2">
                Em tela inteira, um revisor novo recebe só os quadros, sem a defesa de quem fez. A nota sai no AUDIT.md, com uma seção obrigatória pro que ninguém checou.
              </p>
              <div className="mt-4">
                <Icone rotulo="Refazer as perguntas" onClick={() => setFeitos(new Set())}>
                  <RotateCcw className="h-4 w-4" />
                </Icone>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- a porta */

type TrilhaId = "clean" | "end" | "audit" | "single";

const TRILHAS: {
  id: TrilhaId;
  nome: string;
  pedido: string;
  passos: string[];
  resultado: string;
  consertos: ReadonlySet<Conserto>;
  juizos: ReadonlySet<Juizo>;
}[] = [
  {
    id: "clean",
    nome: "Clean",
    pedido: "“limpa o slop”, “tá com cara de IA”",
    passos: [
      "Roda o check.mjs no código e na tela aberta.",
      "Corrige cada achado na causa. Esconder o que ele aponta não conta.",
      "Lê as imagens e corrige o que nenhum detector vê.",
      "Roda de novo até limpar e conta o que tirou.",
    ],
    resultado: "Mantém o desenho e tira os sinais, inclusive os que nenhum detector pega: a etiqueta numerada e a caixa dentro de caixa. O preço para de colar no período.",
    consertos: TODOS,
    juizos: new Set(["numero", "caixa"]),
  },
  {
    id: "end",
    nome: "End to end",
    pedido: "“melhora a ui”, “redesenha essa tela”",
    passos: [
      "Abre a tela antes de ler o código.",
      "Escreve quem chega, o que veio fazer e que número mexe.",
      "Diagnostica pela imagem, do maior problema pro menor.",
      "Corta antes de somar.",
      "Constrói com os tokens e componentes do produto.",
      "Olha o resultado em cada largura, até três rodadas.",
      "Relata o que mudou, o que cortou e o que não checou.",
    ],
    resultado: "Refaz o card em torno do que ele precisa conseguir.",
    consertos: TODOS,
    juizos: new Set(["numero", "caixa", "hierarquia", "acao"]),
  },
  {
    id: "audit",
    nome: "Audit",
    pedido: "“audita essa tela”, “isso tá bom?”",
    passos: [
      "Passa pra visant-killer e classifica o alvo pelo tamanho do risco.",
      "Roda os detectores antes de ler o código.",
      "Julga, faz o papel de advogado do diabo e abre a tela.",
      "Entrega o AUDIT.md com achados, nota e o que não checou.",
    ],
    resultado: "Não muda nada: o card fica como está, defeitos inclusive, e sai um relatório apontando cada um.",
    consertos: new Set(),
    juizos: new Set(),
  },
  {
    id: "single",
    nome: "Single topic",
    pedido: "“só a animação”, “esse gráfico”, “tira o excesso”",
    passos: [
      "Animação, transição ou espera: visant-motion.",
      "Gráfico, medidor ou painel: visant-refine.",
      "Hierarquia ou o que tirar de uma tela: visant-frontend.",
      "Excesso e rótulo demais: o declutter da visant-killer.",
    ],
    resultado: "Mexe num ponto só. Aqui o pedido foi hierarquia, então o preço cresceu e o resto ficou igual.",
    consertos: new Set(),
    juizos: new Set(["hierarquia"]),
  },
];

export function Porta() {
  const [id, setId] = React.useState<TrilhaId>("clean");
  const t = TRILHAS.find((x) => x.id === id) ?? TRILHAS[0];
  const no = React.useMemo(() => cartao(t.consertos, t.juizos), [t]);

  return (
    <section className="shell py-16 lg:py-28">
      <div className="max-w-[60ch]">
        <h2 className="text-casa-xl font-medium">Peça do seu jeito. A visant-design escolhe a trilha.</h2>
      </div>

      <SegmentedControl<TrilhaId>
        value={id}
        onChange={setId}
        options={TRILHAS.map((x) => ({ value: x.id, label: x.nome }))}
        className="mt-8 max-w-[560px]"
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="min-w-0">
          <p className="text-casa-lg">{t.pedido}</p>
          <ol className="mt-5 grid gap-2.5">
            {t.passos.map((p, i) => (
              <li key={p} className="flex gap-3 text-casa-base text-casa-fg-2 animate-in fade-in motion-reduce:animate-none [animation-duration:var(--dur-base)]">
                <span className="w-4 shrink-0 text-right tabular-nums text-casa-fg-3">{id === "single" ? "" : i + 1}</span>
                <span className="min-w-0">{p}</span>
              </li>
            ))}
          </ol>
        </div>
        <figure className="min-w-0">
          <CartaoReu no={no} aceso={id === "audit" ? APONTADOS : undefined} className="min-h-[420px] rounded-tile px-6 py-8 lg:px-12" />
          <figcaption className="mt-3 text-casa-base text-casa-fg-2">{t.resultado}</figcaption>
        </figure>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- a tela inteira */

const FILMES: { id: string; nome: string }[] = [
  { id: "mata", nome: "Loja" },
  { id: "checkout", nome: "Checkout" },
  { id: "landing", nome: "Landing" },
  { id: "settings", nome: "Ajustes" },
  { id: "kit", nome: "Componentes" },
  { id: "pauta", nome: "Agenda" },
];

export function TelaInteira() {
  const [id, setId] = React.useState(FILMES[0].id);
  const reduzir = useReducedMotion();
  const ref = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const v = ref.current;
    if (!v || reduzir) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void v.play().catch(() => undefined);
        else v.pause();
      },
      { threshold: 0.4 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [id, reduzir]);

  return (
    <section className="shell py-16 lg:py-28">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        <div>
          <h2 className="text-casa-xl font-medium">O mesmo interrogatório, em tela inteira.</h2>
          <p className="mt-3 max-w-[50ch] text-casa-lg text-casa-fg-2">
            Telas fictícias, montadas pra demonstrar. A legenda de cada corte diz qual skill pediu a mudança.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1">
            {FILMES.map((f) => (
              <Aba key={f.id} ativa={f.id === id} onClick={() => setId(f.id)}>
                {f.nome}
              </Aba>
            ))}
          </div>
        </div>
        <video
          key={id}
          ref={ref}
          muted
          loop
          playsInline
          preload="metadata"
          controls={Boolean(reduzir)}
          poster={`/media/skills/${id}.webp`}
          aria-label={`Filme: ${FILMES.find((f) => f.id === id)?.nome} antes e depois da skill`}
          className="aspect-square w-full max-w-[720px] rounded-tile bg-casa-tile lg:justify-self-end"
        >
          {/* MP4 primeiro: o VP9 destes arquivos falha em decodificador por hardware, e erro de decodificação não recorre à source seguinte. */}
          <source src={`/media/skills/${id}.mp4`} type="video/mp4" />
          <source src={`/media/skills/${id}.webm`} type="video/webm" />
        </video>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- a prova */

const REPOS: { nome: string; tokens: string; ruido: string; distribuicao: string }[] = [
  {
    nome: "vercel/commerce",
    tokens: "Passa, porque não tem camada de tokens: a paleta do Tailwind é o design system (3 neutros, 3 matizes).",
    ruido: "2: hover-lift numa imagem de produto e nos botões da galeria.",
    distribuicao: "1 LOW: o checkout passa pro Shopify sem evento begin_checkout.",
  },
  {
    nome: "shadcn-ui/taxonomy",
    // EXCEPTION to token-fallback/tailwind-palette: citação do achado do README, são as classes do repo auditado, nenhuma é aplicada aqui
    tokens: "9: classes de paleta que furam os tokens em CSS (text-red-600, bg-slate-50).",
    ruido: "2: um Shield do lucide desenhado à mão com lucide-react instalado, e um “Enter your email below…”.",
    distribuicao: "1 HIGH (rotas públicas sem descrição), uma rota sem título, sem sitemap.",
  },
  {
    nome: "steven-tey/precedent",
    tokens: "4 hex crus (o azul do Twitter em classe avulsa, um círculo de medidor) e 1 achado de paleta caótica (4 matizes).",
    ruido: "2: o triângulo da Vercel, um CTA que cresce no hover.",
    distribuicao: "Nenhum achado.",
  },
];

const LIMITES = [
  "Testado só no Claude Code. Outros agentes que leem SKILL.md devem rodar, mas a gente ainda não rodou.",
  "O killer-scan lê React e Next. Em Vue, Svelte, Astro ou HTML ele recusa com exit 2, e a auditoria vai à mão com as varreduras no navegador.",
  "Os sinais 47 a 57 do catálogo ainda são suspeita: nenhum tem caso medido em rodada.",
];

export function Prova() {
  return (
    <section className="shell py-16 lg:py-28">
      <div className="max-w-[60ch]">
        <h2 className="text-casa-xl font-medium">Testado em repos de outra gente.</h2>
        <p className="mt-3 text-casa-lg text-casa-fg-2">
          Três projetos Next.js públicos, sem código da Visant. O que está aqui é o que sobrou depois de calibrar até dar pra defender.
        </p>
      </div>

      <table className="mt-10 w-full border-separate border-spacing-0 text-left text-casa-base max-lg:block">
        <thead className="max-lg:sr-only">
          <tr className="text-casa-fg-2">
            <th scope="col" className="pb-3 pr-8 font-normal">Repo</th>
            <th scope="col" className="pb-3 pr-8 font-normal">Tokens</th>
            <th scope="col" className="pb-3 pr-8 font-normal">Ruído</th>
            <th scope="col" className="pb-3 font-normal">Distribuição</th>
          </tr>
        </thead>
        <tbody className="max-lg:grid max-lg:gap-10">
          {REPOS.map((r) => (
            <tr key={r.nome} className="align-top max-lg:grid max-lg:gap-3">
              <th scope="row" className="py-4 pr-8 font-medium lg:whitespace-nowrap max-lg:py-0">
                <a
                  href={`https://github.com/${r.nome}`}
                  target="_blank"
                  rel="noreferrer"
                  className="alvo-toque inline-flex items-center gap-1 underline underline-offset-4"
                >
                  {r.nome}
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                </a>
              </th>
              <Celula titulo="Tokens">{r.tokens}</Celula>
              <Celula titulo="Ruído">{r.ruido}</Celula>
              <Celula titulo="Distribuição">{r.distribuicao}</Celula>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <h3 className="text-casa-lg font-medium">O que a calibração consertou</h3>
          <p className="mt-2 max-w-[60ch] text-casa-base text-casa-fg-2">
            Classe de paleta só conta se existe camada de tokens pra furar. SVG em pasta de ícones e logo de marca deixaram de contar como ícone à mão. Componente nunca é rota. Checkout hospedado saiu da conta de formulário sem medição. Cada conserto tem fixture.
          </p>
        </div>
        <div>
          <h3 className="text-casa-lg font-medium">O que a gente ainda não provou</h3>
          <ul className="mt-2 grid max-w-[60ch] gap-2 text-casa-base text-casa-fg-2">
            {LIMITES.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Celula({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <td className="py-4 pr-8 text-casa-fg-2 max-lg:py-0 max-lg:pr-0">
      <span className="block text-casa-sm text-casa-fg-3 lg:sr-only">{titulo}</span>
      {children}
    </td>
  );
}
