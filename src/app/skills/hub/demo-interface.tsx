"use client";

/**
 * visant-design (a porta) e visant-frontend (o teste do corte). Rotas e etapas da
 * tabela do SKILL.md de cada uma. Ao nascer, só a fala e o destino, e só a tela.
 */

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown } from "lucide-react";
import { PROVA_MONTADA, SELO_MONTADO } from "./amostras";
import { Acao, ANIMA_OPACIDADE, cx, Dobra, DUR, EASE_OUT, useAoEntrar, useMenosMovimento, useNaTela, useSequencia } from "./base";

const ROTAS = [
  { fala: "tá com cara de IA, limpa o slop", trilha: "Limpar", etapas: ["Roda o check.mjs na tela", "Conserta cada achado na causa", "Lê as imagens e tira o que detector não vê", "Roda de novo até sair limpo"] },
  { fala: "melhora o design dessa tela", trilha: "Ponta a ponta", etapas: ["Vê a tela antes do código", "Nomeia o trabalho da tela", "Diagnostica pela imagem", "Corta antes de somar", "Constrói com o que o produto já tem", "Olha o resultado, até três rodadas", "Relata o que não checou"] },
  { fala: "audita essa tela", trilha: "visant-killer", etapas: ["Audita e pergunta antes de mudar"] },
  { fala: "deixa essa animação mais suave", trilha: "visant-motion", etapas: ["Carrega o manual de motion"] },
  { fala: "faz um gráfico pra esse painel", trilha: "visant-refine", etapas: ["Carrega o manual de dado e controle"] },
];

/**
 * A fala apaga até onde as duas frases coincidem e digita o resto. O que falta digitar
 * fica no fluxo, transparente: sem isso a frase centrada anda a cada letra.
 */
function useDigitado(alvo: string, menos: boolean) {
  const [texto, setTexto] = React.useState(alvo);
  const anterior = React.useRef(alvo);
  const digitando = alvo.startsWith(texto);
  if (digitando) anterior.current = alvo;
  React.useEffect(() => {
    if (menos || texto === alvo) return;
    const id = setTimeout(() => setTexto(digitando ? alvo.slice(0, texto.length + 1) : texto.slice(0, -1)), digitando ? 34 : 14);
    return () => clearTimeout(id);
  }, [alvo, texto, digitando, menos]);
  if (menos) return { texto: alvo, resto: "", pronto: true };
  return { texto, resto: anterior.current.slice(texto.length), pronto: texto === alvo };
}

export function DemoDesign() {
  const [i, setI] = React.useState(0);
  const [mao, setMao] = React.useState(false);
  const [palco, naTela] = useNaTela<HTMLButtonElement>();
  const menos = useMenosMovimento();
  const rota = ROTAS[i];
  const { texto, resto, pronto } = useDigitado(rota.fala, menos);

  /* Espera a frase terminar antes de contar: a próxima só vem depois de lida. */
  React.useEffect(() => {
    if (!naTela || mao || menos || !pronto) return;
    const id = setTimeout(() => setI((n) => (n + 1) % ROTAS.length), 1800);
    return () => clearTimeout(id);
  }, [naTela, mao, menos, pronto]);

  return (
    <Dobra
      nome="visant-design"
      como={
        <>
          <p>Comece por aqui. Fala do seu jeito e ela escolhe o caminho. Neste pedido, o caminho é:</p>
          <ol className="mt-2 list-inside list-decimal text-casa-fg-2">
            {rota.etapas.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ol>
        </>
      }
    >
      <button
        ref={palco}
        type="button"
        data-demo="design"
        aria-label={`Pedido: ${rota.fala}. Caminho: ${rota.trilha}. Tocar para o próximo.`}
        onClick={() => {
          setMao(true);
          setI((n) => (n + 1) % ROTAS.length);
        }}
        className="grid w-full rounded-tile bg-casa-tile p-6 text-left outline-none focus-visible:[box-shadow:var(--focus)] lg:min-h-[26rem] lg:content-center lg:justify-items-center lg:p-12 lg:text-center"
      >
        {/* Todas as falas, invisíveis, seguram a altura enquanto elas giram. */}
        <span aria-hidden="true" className="invisible col-start-1 row-start-1 flex flex-col gap-5 lg:items-center">
          <span className="grid text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.12] tracking-[-0.02em]">
            {ROTAS.map((r) => (
              <span key={r.fala} className="col-start-1 row-start-1">{r.fala}</span>
            ))}
          </span>
          <span className="size-5" />
          <span className="w-fit px-3 py-2 font-casa-mono text-casa-sm">{rota.trilha}</span>
        </span>
        <span className="col-start-1 row-start-1 flex flex-col gap-5 lg:items-center">
          <span className="text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.12] tracking-[-0.02em]" data-fala>
            {texto}
            {!pronto ? <span aria-hidden="true" data-cursor className="ml-[0.04em] inline-block h-[0.85em] w-[0.06em] translate-y-[0.1em] bg-casa-fg" /> : null}
            <span aria-hidden="true" className="invisible">{resto}</span>
          </span>
          {/* O destino só aparece com a frase inteira: primeiro o pedido, depois o caminho. */}
          <span className={cx("flex flex-col gap-5 lg:items-center", pronto ? cx(ANIMA_OPACIDADE, "opacity-100") : "opacity-0")}>
            <ArrowDown className="size-5 text-casa-fg-3" aria-hidden="true" />
            <span className="w-fit rounded-control bg-casa-tile-2 px-3 py-2 font-casa-mono text-casa-sm" data-trilha>
              {rota.trilha}
            </span>
          </span>
        </span>
      </button>
    </Dobra>
  );
}

/* ---- o teste do corte ---- */

const SEMANA = [
  { dia: "seg", eventos: [{ nome: "Daily", hora: "10:00" }] },
  { dia: "ter", eventos: [{ nome: "Marca", hora: "10:30" }] },
  { dia: "qua", eventos: [] },
  { dia: "qui", eventos: [{ nome: "Aula", hora: "11:30" }, { nome: "Entrega", hora: "16:00" }] },
  { dia: "sex", eventos: [{ nome: "Cliente", hora: "09:30" }] },
];

const ELEMENTOS = [
  { id: "selo", nome: "Selo de novidade", variavel: null },
  { id: "titulo", nome: "Título com a tarefa", variavel: "cadastro" },
  { id: "cta", nome: "Uma ação primária", variavel: "cadastro" },
  { id: "saiba", nome: "Segundo botão igual", variavel: null },
  { id: "prova", nome: "Número sem fonte", variavel: null },
  { id: "tela", nome: "Tela do produto", variavel: "ativação" },
] as const;
type Elem = (typeof ELEMENTOS)[number]["id"];

export function DemoFrontend() {
  const [cortados, setCortados] = React.useState<Set<Elem>>(new Set());
  const [olhando, setOlhando] = React.useState<Elem | null>(null);
  const seq = useSequencia();
  const menos = useMenosMovimento();
  const fim = cortados.size === 3;

  const rodar = () => {
    seq.limpar();
    setCortados(new Set());
    if (menos) return setCortados(new Set(ELEMENTOS.filter((e) => !e.variavel).map((e) => e.id)));
    ELEMENTOS.forEach((e, i) => {
      seq.depois(500 + i * 650, () => setOlhando(e.id));
      if (!e.variavel) seq.depois(500 + i * 650 + 450, () => setCortados((s) => new Set(s).add(e.id)));
    });
    seq.depois(500 + ELEMENTOS.length * 650, () => setOlhando(null));
  };
  const palco = useAoEntrar<HTMLDivElement>(rodar);

  /* Tocar no elemento pergunta a variável. Sem variável, ele sai. */
  const tocar = (id: Elem) => {
    seq.limpar();
    setOlhando(id);
    const e = ELEMENTOS.find((x) => x.id === id);
    if (e && !e.variavel) setCortados((s) => new Set(s).add(id));
  };

  const saida = { duration: DUR.base, ease: EASE_OUT };
  const vivo = (id: Elem) => !cortados.has(id);
  const realce = (id: Elem) => cx("relative rounded-[6px] text-left outline-none focus-visible:[box-shadow:var(--focus)]", olhando === id && "[box-shadow:0_0_0_2px_var(--casa-fg)]");
  const Etiqueta = ({ id }: { id: Elem }) => {
    if (olhando !== id) return null;
    const v = ELEMENTOS.find((x) => x.id === id)?.variavel;
    return (
      <span data-etiqueta={id} className="absolute -top-2 right-0 z-10 rounded-[4px] bg-casa-fg px-1.5 font-casa-mono text-casa-sm text-casa-bg">
        {v ?? "nenhuma"}
      </span>
    );
  };

  return (
    <Dobra
      nome="visant-frontend"
      como={
        <>
          <p>Todo elemento precisa dizer que número do negócio ele mexe. Se não souber dizer, sai da tela. Toca num elemento pra perguntar.</p>
          <table className="mt-2 w-full text-casa-sm">
            <tbody>
              {ELEMENTOS.map((e) => (
                <tr key={e.id} className="border-t border-casa-line">
                  <td className={cx("py-1.5 pr-2", cortados.has(e.id) && "text-casa-fg-3 line-through")}>{e.nome}</td>
                  <td className="py-1.5 font-casa-mono">{e.variavel ?? "nenhuma"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      }
    >
      <div ref={palco} className="flex min-w-0 flex-col gap-3 lg:mx-auto lg:w-full lg:max-w-3xl" data-demo="frontend">
        <motion.div layout={!menos} transition={saida} className="flex min-h-[19rem] flex-col rounded-tile bg-casa-tile p-4 lg:min-h-[21rem] lg:p-10">
          <AnimatePresence initial={false} mode="popLayout">
            {vivo("selo") ? (
              <motion.button key="selo" type="button" layout={!menos} exit={{ opacity: 0, scale: 0.95 }} transition={saida} onClick={() => tocar("selo")} data-elem="selo" className={cx("mb-3 min-h-11 self-start bg-casa-tile-2 px-3 text-casa-sm", realce("selo"))}>
                {SELO_MONTADO}
                <Etiqueta id="selo" />
              </motion.button>
            ) : null}
          </AnimatePresence>
          <motion.button type="button" layout={!menos} transition={saida} onClick={() => tocar("titulo")} data-elem="titulo" className={cx("text-[clamp(1.75rem,4vw,3rem)] font-medium leading-[1.12] tracking-[-0.02em]", realce("titulo"))}>
            Marque revisão sem trocar dez e-mails
            <Etiqueta id="titulo" />
          </motion.button>
          <motion.div layout={!menos} transition={saida} className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => tocar("cta")} data-elem="cta" className={cx("h-11 bg-casa-cta px-3.5 text-casa-base text-casa-cta-fg", realce("cta"))}>
              Criar agenda
              <Etiqueta id="cta" />
            </button>
            <AnimatePresence initial={false} mode="popLayout">
              {vivo("saiba") ? (
                <motion.button key="saiba" type="button" layout={!menos} exit={{ opacity: 0, scale: 0.95 }} transition={saida} onClick={() => tocar("saiba")} data-elem="saiba" className={cx("h-11 bg-casa-cta px-3.5 text-casa-base text-casa-cta-fg", realce("saiba"))}>
                  Saiba mais
                  <Etiqueta id="saiba" />
                </motion.button>
              ) : null}
            </AnimatePresence>
            <AnimatePresence initial={false} mode="popLayout">
              {vivo("prova") ? (
                <motion.button key="prova" type="button" layout={!menos} exit={{ opacity: 0, scale: 0.95 }} transition={saida} onClick={() => tocar("prova")} data-elem="prova" className={cx("min-h-11 px-2 text-casa-sm text-casa-fg-2", realce("prova"))}>
                  {PROVA_MONTADA}
                  <Etiqueta id="prova" />
                </motion.button>
              ) : null}
            </AnimatePresence>
          </motion.div>
          <motion.button
            type="button"
            layout={!menos}
            transition={saida}
            onClick={() => tocar("tela")}
            data-elem="tela"
            aria-label="Tela do produto"
            className={cx("mt-4 grid min-h-40 flex-1 grid-cols-5 gap-px overflow-hidden bg-casa-line p-px", realce("tela"))}
          >
            {SEMANA.map((d) => (
              <span key={d.dia} className="flex min-w-0 flex-col gap-1 bg-casa-bg p-1.5 lg:p-2">
                <span className="text-casa-sm text-casa-fg-2">{d.dia}</span>
                {d.eventos.map((e) => (
                  <span key={e.nome} className="min-w-0 rounded-[4px] bg-casa-tile-2 p-1 lg:p-1.5">
                    <span className="block truncate text-casa-sm text-casa-fg">{e.nome}</span>
                    <span className="block font-casa-mono text-casa-sm text-casa-fg-2">{e.hora}</span>
                  </span>
                ))}
              </span>
            ))}
            <Etiqueta id="tela" />
          </motion.button>
        </motion.div>
        <div className="flex justify-end">
          <Acao onClick={rodar} secundaria={fim} data-acao="frontend">
            {fim ? "De novo" : "Cortar"}
          </Acao>
        </div>
      </div>
    </Dobra>
  );
}
