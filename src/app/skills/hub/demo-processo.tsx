"use client";

/**
 * As três skills de processo: visant-preflight, visant-methodology e
 * visant-mcp-connect. Os pisos de foto e a checagem de fonte são os mesmos do
 * `preflight-scan.mjs`: a fonte é consultada no Google Fonts de verdade.
 */

import * as React from "react";
import { Check, X } from "lucide-react";
import { Acao, ANIMA_COR, cx, Opcao, Terminal, useMenosMovimento, useSequencia } from "./base";

/* ---- visant-preflight ---- */

const PISOS = [
  { papel: "faixa sangrada", minW: 2000 },
  { papel: "retrato de hero", minW: 1000 },
  { papel: "célula de grade", minW: 700 },
  { papel: "miniatura", minW: 400 },
];
const papelDe = (w: number) => PISOS.find((p) => w >= p.minW)?.papel ?? "pequena demais pra web";

type Status = "fila" | "ok" | "falha" | "aberto";

const urlFonte = (nome: string) =>
  `https://fonts.googleapis.com/css2?family=${encodeURIComponent(nome).replace(/%20/g, "+")}:wght@400&display=swap`;

/**
 * A URL do script: `css2?family=<nome>:wght@400`. Família que não existe volta 400
 * sem cabeçalho CORS, e no navegador isso vira a mesma exceção de rede fora. Então
 * a falha é conferida contra uma família que existe: se ela responde, a rede está
 * de pé e a fonte não existe. Se nem ela responde, fica indeterminado, como no script.
 */
async function fonteCarrega(nome: string): Promise<boolean | null> {
  try {
    return (await fetch(urlFonte(nome))).ok;
  } catch {
    try {
      return (await fetch(urlFonte("Syncopate"))).ok ? false : null;
    } catch {
      return null;
    }
  }
}

const CHECAGENS = [
  { id: "verdade", titulo: "As cópias da marca batem?", ruim: "Cofre diz uma fonte, a pasta do cliente diz outra", bom: "Cofre, pasta e Figma dizem a mesma fonte", conserto: "Conferi na pasta" },
  { id: "fonte", titulo: "As fontes carregam?", conserto: "Trocar a família" },
  { id: "foto", titulo: "A foto segura o layout?", conserto: "Achar o original" },
  { id: "arquivos", titulo: "O logo existe em vetor?", ruim: "Só tem PNG de apresentação", bom: "SVG, versões clara e escura, ícone", conserto: "Pedir ao cliente" },
  { id: "numeros", titulo: "Todo número tem fonte?", ruim: "+40 estúdios, tirado de um layout", bom: "Origem anotada ao lado do dado", conserto: "Anotar a origem" },
] as const;

export function DemoPreflight() {
  const [familia, setFamilia] = React.useState("Fonte Inventada");
  const [largura, setLargura] = React.useState(1200);
  const [fonteOk, setFonteOk] = React.useState<boolean | null>(false);
  const [consultou, setConsultou] = React.useState(false);
  const [consertados, setConsertados] = React.useState<Set<string>>(new Set());
  const [lidas, setLidas] = React.useState<number>(CHECAGENS.length);
  const [rodando, setRodando] = React.useState(false);
  const seq = useSequencia();
  const menos = useMenosMovimento();

  const rodar = async () => {
    seq.limpar();
    setConsertados(new Set());
    setFamilia("Fonte Inventada");
    setLargura(1200);
    setLidas(0);
    setRodando(true);
    setFonteOk(await fonteCarrega("Fonte Inventada"));
    setConsultou(true);
    const passo = menos ? 0 : 420;
    CHECAGENS.forEach((_, i) => seq.depois(passo * (i + 1), () => setLidas(i + 1)));
    seq.depois(passo * (CHECAGENS.length + 1), () => setRodando(false));
  };

  const consertar = async (id: string) => {
    if (id === "fonte") {
      setFamilia("Syncopate");
      setFonteOk(await fonteCarrega("Syncopate"));
      setConsultou(true);
    } else if (id === "foto") {
      setLargura(4562);
    } else {
      setConsertados((s) => new Set(s).add(id));
    }
  };

  const status = (id: string, i: number): Status => {
    if (i >= lidas) return "fila";
    if (id === "fonte") return fonteOk === null ? "aberto" : fonteOk ? "ok" : "falha";
    if (id === "foto") return largura >= 2000 ? "ok" : "falha";
    return consertados.has(id) ? "ok" : "falha";
  };

  const descricao = (c: (typeof CHECAGENS)[number]) => {
    if (c.id === "fonte") {
      if (fonteOk === null) return `${familia}: não deu pra consultar o Google Fonts agora`;
      const fim = consultou ? ", consultado agora" : "";
      return fonteOk ? `${familia}: Google Fonts carrega direto${fim}` : `${familia}: não existe no Google Fonts${fim}`;
    }
    if (c.id === "foto") return `Foto de ${largura} px serve pra: ${papelDe(largura)}. A faixa pede 2000 px`;
    return consertados.has(c.id) ? c.bom : c.ruim;
  };

  const verdes = CHECAGENS.filter((c, i) => status(c.id, i) === "ok").length;
  const terminou = lidas === CHECAGENS.length && !rodando;

  return (
    <div className="min-w-0" data-demo="preflight">
      <ol>
        {CHECAGENS.map((c, i) => {
          const s = status(c.id, i);
          return (
            <li
              key={c.id}
              data-checagem={c.id}
              data-status={s}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-casa-line py-3.5"
            >
              <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center">
                {s === "ok" ? (
                  <Check className="size-4 text-casa-fg" />
                ) : s === "falha" ? (
                  <X className="size-4 text-[color:var(--destructive)]" />
                ) : (
                  <span className="size-1.5 rounded-[2px] bg-casa-fg-3" />
                )}
              </span>
              <div className="min-w-0 flex-1 basis-56">
                <p className={cx("text-casa-lg", s === "fila" ? "text-casa-fg-2" : "text-casa-fg", ANIMA_COR)}>{c.titulo}</p>
                <p className="mt-0.5 min-h-5 text-casa-base text-casa-fg-2">
                  {s === "fila" ? "" : descricao(c)}
                  <span className="sr-only">{s === "ok" ? " Passou." : s === "falha" ? " Falhou." : ""}</span>
                </p>
              </div>
              {s === "falha" ? (
                <button
                  type="button"
                  data-consertar={c.id}
                  onClick={() => void consertar(c.id)}
                  className={cx(
                    "alvo-toque rounded-control bg-casa-tile-2 px-3 py-1.5 text-casa-base text-casa-fg outline-none focus-visible:[box-shadow:var(--focus)]",
                    ANIMA_COR,
                  )}
                >
                  {c.conserto}
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-casa-line pt-4">
        <Acao onClick={() => void rodar()} disabled={rodando} data-acao="preflight">
          Rodar as cinco de novo
        </Acao>
        <p className="text-casa-base text-casa-fg-2" aria-live="polite" data-veredito>
          {!terminou
            ? "Consultando a fonte no Google Fonts, do seu navegador."
            : verdes === CHECAGENS.length
              ? "Cinco verdes. Pode começar o layout."
              : `${verdes} de ${CHECAGENS.length} verdes. Nada grande começa assim.`}
        </p>
      </div>
    </div>
  );
}

/* ---- visant-methodology ---- */

const FASES = [
  { nome: "A Estratégia", etapas: ["Mensagem Central & Pilares", "Pesquisa de Mercado & Persona", "Arquétipos & Tom de Voz", "Manifesto"] },
  { nome: "A Identidade Visual", etapas: ["Logotipo & Geometria", "Cromatismo & Tipografia", "Sistema Gráfico & Layouts"] },
  { nome: "O Ritual", etapas: ["Apresentação", "Manual & Entrega"] },
];

export function DemoMetodo() {
  const [mudou, setMudou] = React.useState(2);
  let n = -1;
  const depois = 8 - mudou;
  return (
    <div className="min-w-0" data-demo="metodo">
      <div className="grid gap-5">
        {FASES.map((f) => (
          <div key={f.nome}>
            <p className="text-casa-sm text-casa-fg-3">{f.nome}</p>
            <ol className="mt-1">
              {f.etapas.map((e) => {
                n += 1;
                const i = n;
                const estado = i === mudou ? "mudou" : i > mudou ? "refaz" : "fica";
                return (
                  <li key={e}>
                    <button
                      type="button"
                      data-etapa={i}
                      data-estado={estado}
                      aria-pressed={i === mudou}
                      onClick={() => setMudou(i)}
                      className={cx(
                        "alvo-toque flex w-full items-baseline gap-3 rounded-control px-2 py-1.5 text-left text-casa-base outline-none focus-visible:[box-shadow:var(--focus)]",
                        ANIMA_COR,
                        estado === "mudou" && "bg-casa-cta text-casa-cta-fg",
                        estado === "refaz" && "bg-casa-tile-2 text-casa-fg",
                        estado === "fica" && "text-casa-fg-3 hover:text-casa-fg",
                      )}
                    >
                      <span className="font-casa-mono text-casa-sm tabular-nums">0{i + 1}</span>
                      {e}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
      <p className="mt-6 text-casa-base text-casa-fg-2" aria-live="polite" data-cascata>
        {depois === 0 ? "Última etapa: mexer aqui não derruba nada." : `Mudou a etapa ${mudou + 1}? ${depois === 1 ? "A etapa seguinte alimenta dela" : `As ${depois} seguintes alimentam dela`} e voltam pra mesa.`}
      </p>
    </div>
  );
}

/* ---- visant-mcp-connect ---- */

const FAMILIAS = [
  { nome: "Marca", n: 16, exemplos: "brand-guidelines-get, brand-guidelines-ingest, brand-guidelines-compliance-check" },
  { nome: "Mockup", n: 5, exemplos: "mockup-generate, mockup-list, mockup-presets" },
  { nome: "Criativo", n: 8, exemplos: "creative-full, creative-generate, creative-render" },
  { nome: "Canvas", n: 8, exemplos: "canvas-create, canvas-update, canvas-share" },
  { nome: "Orçamento", n: 6, exemplos: "budget-create, budget-get, budget-duplicate" },
];

export function DemoMcp({ cabeca }: { cabeca: React.ReactNode }) {
  const [i, setI] = React.useState(0);
  const f = FAMILIAS[i];
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-12" data-demo="mcp">
      <div className="min-w-0">
        {cabeca}
        <p className="mt-3 text-casa-base text-casa-fg-2">
          Precisa de conta na Visant Labs, sem modo anônimo. E as ferramentas de geração gastam crédito da conta.
        </p>
      </div>
      <div className="min-w-0">
      <div className="flex flex-wrap gap-1" role="group" aria-label="Família de ferramentas">
        {FAMILIAS.map((x, n) => (
          <Opcao key={x.nome} ativa={n === i} onClick={() => setI(n)} data-familia={n}>
            {x.nome}
          </Opcao>
        ))}
      </div>
      <p className="mt-3 min-h-14 font-casa-mono text-casa-sm text-casa-fg-2" data-exemplos>
        {f.n} ferramentas. {f.exemplos}
      </p>
      <Terminal className="mt-3">{`claude mcp add --transport http \\
  --header "Authorization: Bearer <apiKey>" \\
  --scope user \\
  visant https://api.visantlabs.com/api/mcp`}</Terminal>
      </div>
    </div>
  );
}
