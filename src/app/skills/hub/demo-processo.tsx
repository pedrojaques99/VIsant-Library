"use client";

/**
 * visant-preflight, visant-methodology e visant-mcp-connect. Os pisos de foto e a
 * checagem de fonte são os do `preflight-scan.mjs`: a fonte é consultada no Google
 * Fonts de verdade. Ao nascer, um placar e o toque que resolve. O porquê na folha.
 */

import * as React from "react";
import { Check, X } from "lucide-react";
import { Acao, ANIMA_COR, cx, Dobra, Terminal, useAoEntrar, useMenosMovimento, useNaTela, useSequencia } from "./base";

/* ---- visant-preflight ---- */

const PISOS = [
  { papel: "faixa sangrada", minW: 2000 },
  { papel: "retrato de hero", minW: 1000 },
  { papel: "célula de grade", minW: 700 },
  { papel: "miniatura", minW: 400 },
];
const papelDe = (w: number) => PISOS.find((p) => w >= p.minW)?.papel ?? "pequena demais pra web";

const urlFonte = (nome: string) =>
  `https://fonts.googleapis.com/css2?family=${encodeURIComponent(nome).replace(/%20/g, "+")}:wght@400&display=swap`;

/**
 * Família que não existe volta 400 sem cabeçalho CORS, e no navegador isso vira a
 * mesma exceção de rede fora. Então a falha é conferida contra uma família que
 * existe: se ela responde, a fonte não existe. Se nem ela, fica indeterminado.
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
  { id: "verdade", titulo: "Marca", ruim: "O cofre diz uma fonte, a pasta do cliente diz outra.", bom: "Cofre, pasta e Figma dizem a mesma coisa." },
  { id: "fonte", titulo: "Fontes", ruim: "Fonte Inventada não existe no Google Fonts.", bom: "Syncopate carrega direto do Google Fonts." },
  { id: "foto", titulo: "Fotos", ruim: `1200 px só serve pra ${papelDe(1200)}. A faixa pede 2000.`, bom: `4562 px segura ${papelDe(4562)}.` },
  { id: "arquivos", titulo: "Logo", ruim: "Só tem PNG de apresentação.", bom: "SVG, versão clara, escura e ícone." },
  { id: "numeros", titulo: "Números", ruim: "+40 estúdios, tirado de um layout.", bom: "Origem anotada ao lado do dado." },
];

export function DemoPreflight() {
  const [lidas, setLidas] = React.useState(0);
  const [ok, setOk] = React.useState<Set<string>>(new Set());
  const [ultima, setUltima] = React.useState<string | null>(null);
  const [semRede, setSemRede] = React.useState(false);
  const seq = useSequencia();
  const menos = useMenosMovimento();

  const rodar = () => {
    seq.limpar();
    setOk(new Set());
    setUltima(null);
    setSemRede(false);
    if (menos) return setLidas(CHECAGENS.length);
    setLidas(0);
    CHECAGENS.forEach((_, i) => seq.depois(400 + i * 350, () => setLidas(i + 1)));
  };
  const palco = useAoEntrar<HTMLDivElement>(rodar);

  const tocar = async (id: string) => {
    setUltima(id);
    if (ok.has(id)) return;
    if (id === "fonte") {
      const r = await fonteCarrega("Syncopate");
      if (r === null) return setSemRede(true);
      if (!r) return;
    }
    setOk((s) => new Set(s).add(id));
  };

  const resolver = () => {
    seq.limpar();
    setLidas(CHECAGENS.length);
    CHECAGENS.filter((c) => !ok.has(c.id)).forEach((c, i) => seq.depois(i * 450, () => void tocar(c.id)));
  };

  const atual = CHECAGENS.find((c) => c.id === ultima);
  const verdes = ok.size;

  return (
    <Dobra
      nome="visant-preflight"
      faixa
      como={
        <p>
          Projeto grande costuma dar errado na premissa, e a gente só descobre tarde. Antes do primeiro layout, ela faz uma rodada de perguntas e cinco checagens. Leva 15 minutos. Fonte e foto o script confere sozinho, e a fonte aqui é consultada no Google Fonts na hora.
        </p>
      }
    >
      <div ref={palco} className="flex min-w-0 flex-col gap-2 lg:mx-auto lg:w-full lg:max-w-2xl" data-demo="preflight">
        <ol>
          {CHECAGENS.map((c, i) => {
            const lida = i < lidas;
            const passou = ok.has(c.id);
            return (
              <li key={c.id} className="border-t border-casa-line first:border-t-0">
                <button
                  type="button"
                  data-checagem={c.id}
                  data-status={!lida ? "fila" : passou ? "ok" : "falha"}
                  disabled={!lida}
                  onClick={() => void tocar(c.id)}
                  aria-label={`${c.titulo}: ${passou ? "passou" : "falhou"}. Tocar para resolver.`}
                  className={cx(
                    "flex min-h-14 w-full items-center justify-between gap-3 rounded-control px-1 text-left text-[1.25rem] outline-none focus-visible:[box-shadow:var(--focus)]",
                    ANIMA_COR,
                    lida ? "text-casa-fg" : "text-casa-fg-3",
                  )}
                >
                  {c.titulo}
                  {!lida ? (
                    <span className="size-1.5 rounded-[2px] bg-casa-fg-3" aria-hidden="true" />
                  ) : passou ? (
                    <Check className="size-6" aria-hidden="true" />
                  ) : (
                    <X className="size-6 text-[color:var(--destructive)]" aria-hidden="true" />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="min-h-10 text-casa-base text-casa-fg-2" aria-live="polite" data-detalhe>
          {semRede ? "Sem rede agora: não deu pra consultar o Google Fonts." : atual ? (ok.has(atual.id) ? atual.bom : atual.ruim) : ""}
        </p>
        <div className="flex min-h-11 items-center justify-between gap-3">
          <p className="text-[2rem] font-medium leading-none tabular-nums" data-veredito aria-label={`${verdes} de 5 verdes`}>
            {verdes}/5
          </p>
          <Acao onClick={verdes === CHECAGENS.length ? rodar : resolver} secundaria={verdes === CHECAGENS.length} data-acao="preflight">
            {verdes === CHECAGENS.length ? "De novo" : "Resolver"}
          </Acao>
        </div>
      </div>
    </Dobra>
  );
}

/* ---- visant-methodology ---- */

const ETAPAS = [
  "Mensagem Central & Pilares",
  "Pesquisa de Mercado & Persona",
  "Arquétipos & Tom de Voz",
  "Manifesto",
  "Logotipo & Geometria",
  "Cromatismo & Tipografia",
  "Sistema Gráfico & Layouts",
  "Apresentação",
  "Manual & Entrega",
];

export function DemoMetodo() {
  const [mudou, setMudou] = React.useState(8);
  const menos = useMenosMovimento();
  const palco = useAoEntrar<HTMLDivElement>(() => setMudou(2));
  const voltam = 8 - mudou;
  return (
    <Dobra
      nome="visant-methodology"
      como={
        <p>
          O método de marca da Visant: nove etapas em três fases (A Estratégia, A Identidade Visual e O Ritual), e cada uma alimenta a próxima. Toca numa etapa e vê o que volta pra mesa.
        </p>
      }
    >
      <div ref={palco} className="flex min-w-0 flex-col gap-3 lg:mx-auto lg:w-full lg:max-w-2xl" data-demo="metodo">
        <div className="grid grid-cols-3 gap-2">
          {ETAPAS.map((e, i) => {
            const estado = i === mudou ? "mudou" : i > mudou ? "refaz" : "fica";
            return (
              <button
                key={e}
                type="button"
                data-etapa={i}
                data-estado={estado}
                aria-pressed={i === mudou}
                aria-label={e}
                onClick={() => setMudou(i)}
                style={{ transitionDelay: menos || estado !== "refaz" ? "0ms" : `${Math.min((i - mudou) * 50, 300)}ms` }}
                className={cx(
                  "h-20 rounded-control font-casa-mono text-[1.25rem] tabular-nums outline-none focus-visible:[box-shadow:var(--focus)] lg:h-24",
                  ANIMA_COR,
                  estado === "mudou" && "bg-casa-cta text-casa-cta-fg",
                  estado === "refaz" && "bg-casa-tile-2 text-casa-fg",
                  estado === "fica" && "bg-casa-tile text-casa-fg-3",
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <p className="text-casa-lg" aria-live="polite" data-cascata>
          {ETAPAS[mudou]}
        </p>
        <p className="text-[2rem] font-medium leading-none tabular-nums" data-voltam>
          +{voltam} <span className="text-casa-base font-normal text-casa-fg-2">{voltam === 1 ? "volta" : "voltam"} pra mesa</span>
        </p>
      </div>
    </Dobra>
  );
}

/* ---- visant-mcp-connect ---- */

const FAMILIAS = [
  { nome: "Marca", n: 16, exemplos: ["brand-guidelines-get", "brand-guidelines-ingest", "brand-guidelines-compliance-check"] },
  { nome: "Mockup", n: 5, exemplos: ["mockup-generate", "mockup-list", "mockup-presets"] },
  { nome: "Criativo", n: 8, exemplos: ["creative-full", "creative-generate", "creative-render"] },
  { nome: "Canvas", n: 8, exemplos: ["canvas-create", "canvas-update", "canvas-share"] },
  { nome: "Orçamento", n: 6, exemplos: ["budget-create", "budget-get", "budget-duplicate"] },
];

export function DemoMcp() {
  const [i, setI] = React.useState(0);
  const [mao, setMao] = React.useState(false);
  const [palco, naTela] = useNaTela<HTMLDivElement>();
  const menos = useMenosMovimento();

  React.useEffect(() => {
    if (!naTela || mao || menos) return;
    const id = setInterval(() => setI((n) => (n + 1) % FAMILIAS.length), 1800);
    return () => clearInterval(id);
  }, [naTela, mao, menos]);

  return (
    <Dobra
      nome="visant-mcp-connect"
      faixa
      como={
        <>
          <p>Liga o seu agente nas ferramentas da Visant Labs. Precisa de conta, sem modo anônimo, e as ferramentas de geração gastam crédito.</p>
          <Terminal>{`claude mcp add --transport http \\
  --header "Authorization: Bearer <apiKey>" \\
  --scope user \\
  visant https://api.visantlabs.com/api/mcp`}</Terminal>
        </>
      }
    >
      <div ref={palco} className="flex min-w-0 flex-col gap-3 lg:mx-auto lg:w-full lg:max-w-3xl" data-demo="mcp">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
          {FAMILIAS.map((x, n) => (
            <button
              key={x.nome}
              type="button"
              data-familia={n}
              aria-pressed={n === i}
              onClick={() => {
                setMao(true);
                setI(n);
              }}
              className={cx(
                "flex h-20 flex-col justify-center rounded-control px-3 text-left outline-none first:col-span-2 focus-visible:[box-shadow:var(--focus)] lg:first:col-span-1",
                ANIMA_COR,
                n === i ? "bg-casa-cta text-casa-cta-fg" : "bg-casa-bg text-casa-fg",
              )}
            >
              <span className="text-[1.5rem] font-medium leading-none tabular-nums">{x.n}</span>
              <span className="mt-1 text-casa-sm">{x.nome}</span>
            </button>
          ))}
        </div>
        <ul className="min-h-16 font-casa-mono text-casa-sm text-casa-fg-2" aria-live="polite" data-exemplos>
          {FAMILIAS[i].exemplos.map((e) => (
            <li key={e} className="truncate py-0.5">
              {e}
            </li>
          ))}
        </ul>
      </div>
    </Dobra>
  );
}
