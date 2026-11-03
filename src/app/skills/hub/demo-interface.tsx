"use client";

/**
 * visant-design (a porta) e visant-frontend (o teste do corte).
 * As rotas e as etapas são as da tabela do SKILL.md de cada uma.
 */

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { PROVA_MONTADA, SELO_MONTADO } from "./amostras";
import { Acao, ANIMA_COR, cx, DUR, EASE_OUT, Opcao, useMenosMovimento, useSequencia } from "./base";

const ROTAS = [
  {
    fala: "tá com cara de IA, limpa o slop",
    trilha: "Limpar",
    etapas: ["Roda o check.mjs na tela", "Conserta cada achado na causa", "Lê as imagens e tira o que detector não vê", "Roda de novo até sair limpo"],
  },
  {
    fala: "melhora o design dessa tela",
    trilha: "Ponta a ponta",
    etapas: ["Vê a tela antes do código", "Nomeia o trabalho da tela", "Diagnostica pela imagem", "Corta antes de somar", "Constrói com o que o produto já tem", "Olha o resultado, até três rodadas", "Relata o que não checou"],
  },
  {
    fala: "audita essa tela",
    trilha: "visant-killer",
    etapas: ["Auditoria: não muda nada"],
  },
  {
    fala: "deixa essa animação mais suave",
    trilha: "visant-motion",
    etapas: ["Um assunto só: carrega o manual de motion"],
  },
  {
    fala: "faz um gráfico pra esse painel",
    trilha: "visant-refine",
    etapas: ["Um assunto só: carrega o manual de dado e controle"],
  },
];

export function DemoDesign() {
  const [i, setI] = React.useState(1);
  const rota = ROTAS[i];
  return (
    <div className="grid min-w-0 gap-6 md:grid-cols-2" data-demo="design">
      <ul>
        {ROTAS.map((r, n) => (
          <li key={r.fala}>
            <Opcao ativa={n === i} onClick={() => setI(n)} className="w-full" data-rota={n}>
              {r.fala}
            </Opcao>
          </li>
        ))}
      </ul>
      <div className="min-w-0 border-t border-casa-line pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-2" aria-live="polite">
        <p className="font-casa-mono text-casa-sm text-casa-fg" data-trilha>
          {rota.trilha}
        </p>
        <ol className="mt-2 text-casa-base text-casa-fg-2">
          {rota.etapas.map((e, n) => (
            <motion.li
              key={`${i}-${e}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.base, ease: EASE_OUT, delay: Math.min(n * 0.04, 0.24) }}
              className="py-0.5"
            >
              {e}
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ---- o teste do corte ---- */

const ELEMENTOS = [
  { id: "selo", nome: "Selo de novidade", variavel: null },
  { id: "titulo", nome: "Título com a tarefa", variavel: "cadastro" },
  { id: "tela", nome: "Tela do produto", variavel: "ativação" },
  { id: "cta", nome: "Uma ação primária", variavel: "cadastro" },
  { id: "saiba", nome: "Segundo botão igual", variavel: null },
  { id: "prova", nome: "Número sem fonte", variavel: null },
] as const;

type Elem = (typeof ELEMENTOS)[number]["id"];

export function DemoFrontend({ cabeca }: { cabeca: React.ReactNode }) {
  const [cortados, setCortados] = React.useState<Set<Elem>>(new Set());
  const [olhando, setOlhando] = React.useState<Elem | null>(null);
  const seq = useSequencia();
  const menos = useMenosMovimento();
  const fim = cortados.size === 3;

  const rodar = () => {
    seq.limpar();
    if (fim) {
      setCortados(new Set());
      setOlhando(null);
      return;
    }
    setCortados(new Set());
    if (menos) {
      setCortados(new Set(ELEMENTOS.filter((e) => !e.variavel).map((e) => e.id)));
      return;
    }
    ELEMENTOS.forEach((e, i) => {
      seq.depois(i * 500, () => setOlhando(e.id));
      if (!e.variavel) seq.depois(i * 500 + 300, () => setCortados((s) => new Set(s).add(e.id)));
    });
    seq.depois(ELEMENTOS.length * 500, () => setOlhando(null));
  };

  const vivo = (id: Elem) => !cortados.has(id);
  const realce = (id: Elem) => olhando === id && "[box-shadow:0_0_0_2px_var(--casa-fg)]";
  const saida = { duration: DUR.base, ease: EASE_OUT };

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-12" data-demo="frontend">
      <div className="flex min-w-0 flex-col rounded-tile bg-casa-tile p-5 sm:p-8 order-2">
        <motion.div layout={!menos} transition={saida} className="flex min-h-0 flex-1 flex-col">
          <AnimatePresence initial={false} mode="popLayout">
            {vivo("selo") ? (
              <motion.span
                key="selo"
                layout={!menos}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={saida}
                className={cx("mb-3 inline-block self-start rounded-[6px] bg-casa-tile-2 px-2 py-1 text-casa-sm", realce("selo"))}
              >
                {SELO_MONTADO}
              </motion.span>
            ) : null}
          </AnimatePresence>
          <motion.p layout={!menos} transition={saida} className={cx("rounded-[4px] text-[clamp(1.75rem,3.2vw,3rem)] font-medium leading-[1.12] tracking-[-0.02em]", realce("titulo"))}>
            Marque revisão sem trocar dez e-mails
          </motion.p>
          <motion.div layout={!menos} transition={saida} className="mt-4 flex flex-wrap items-center gap-2">
            <span className={cx("inline-flex h-9 items-center rounded-control bg-casa-cta px-3.5 text-casa-base text-casa-cta-fg", realce("cta"))}>
              Criar minha agenda
            </span>
            <AnimatePresence initial={false} mode="popLayout">
              {vivo("saiba") ? (
                <motion.span
                  key="saiba"
                  layout={!menos}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={saida}
                  className={cx("inline-flex h-9 items-center rounded-control bg-casa-cta px-3.5 text-casa-base text-casa-cta-fg", realce("saiba"))}
                >
                  Saiba mais
                </motion.span>
              ) : null}
            </AnimatePresence>
            <AnimatePresence initial={false} mode="popLayout">
              {vivo("prova") ? (
                <motion.span
                  key="prova"
                  layout={!menos}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={saida}
                  className={cx("rounded-[4px] px-1 text-casa-sm text-casa-fg-2", realce("prova"))}
                >
                  {PROVA_MONTADA}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </motion.div>
          <motion.div
            layout={!menos}
            transition={saida}
            className={cx("mt-6 grid min-h-32 flex-1 grid-cols-7 gap-1 rounded-control bg-casa-tile-2 p-2", realce("tela"))}
            aria-hidden="true"
          >
            {Array.from({ length: 7 }, (_, d) => (
              <span key={d} className="rounded-[4px] bg-casa-bg">
                {d % 3 === 1 ? <span className="mx-1 mt-3 block h-3 rounded-[3px] bg-casa-fg-3" /> : null}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <div className="min-w-0 order-1">
      {cabeca}
      <table className="mt-6 w-full border-collapse text-casa-base">
        <caption className="sr-only">Cada elemento e a variável de negócio que ele move</caption>
        <thead>
          <tr className="text-left text-casa-sm text-casa-fg-3">
            <th scope="col" className="pb-2 font-normal">Elemento</th>
            <th scope="col" className="pb-2 font-normal">Variável que move</th>
          </tr>
        </thead>
        <tbody>
          {ELEMENTOS.map((e) => (
            <tr key={e.id} data-elem={e.id} className={cx("border-t border-casa-line", ANIMA_COR, cortados.has(e.id) && "text-casa-fg-3")}>
              <td className={cx("py-2 pr-3", cortados.has(e.id) && "line-through")}>{e.nome}</td>
              <td className="py-2 font-casa-mono text-casa-sm">{e.variavel ?? (cortados.has(e.id) ? "nenhuma: saiu" : "nenhuma")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4">
        <Acao onClick={rodar} data-acao="frontend">
          {fim ? "Devolver os três" : "Rodar o teste do corte"}
        </Acao>
      </div>
      </div>
    </div>
  );
}
