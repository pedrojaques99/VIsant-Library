"use client";

/**
 * visant-killer: o cartão do README passa pelo portão, a pessoa clica no achado
 * e vê a linha, depois corrige e o portão abre. As saídas são as reais.
 */

import * as React from "react";
import pCheckout from "./posters/checkout.webp";
import pKit from "./posters/kit.webp";
import pLanding from "./posters/landing.webp";
import pMata from "./posters/mata.webp";
import pPauta from "./posters/pauta.webp";
import pSettings from "./posters/settings.webp";
import { StatusTicker } from "../../../../registry/visant/ui/status-ticker";
import { CODIGO_LIMPO, CODIGO_SLOP, SAIDA_ABERTA, SAIDA_FECHADA, type LinhaSaida } from "./amostras";
import { Acao, ANIMA_COR, ANIMA_OPACIDADE, cx, LINK, Opcao, useMenosMovimento, useSequencia, Video } from "./base";

type Fase = "rodando" | "fechado" | "corrigido";

const PASSOS = ["impeccable", "audit:design", "copy", "noise"];

export function DemoKiller() {
  const [fase, setFase] = React.useState<Fase>("fechado");
  const [passo, setPasso] = React.useState(4);
  const [alvo, setAlvo] = React.useState<number | null>(null);
  const seq = useSequencia();
  const menos = useMenosMovimento();

  const rodar = (saida: Fase) => {
    seq.limpar();
    setAlvo(null);
    if (menos) {
      setPasso(4);
      setFase(saida);
      return;
    }
    setFase("rodando");
    setPasso(-1);
    PASSOS.forEach((_, i) => seq.depois(350 + i * 1000, () => setPasso(i)));
    seq.depois(350 + PASSOS.length * 1000, () => {
      setPasso(4);
      setFase(saida);
    });
  };

  const [corrigindo, setCorrigindo] = React.useState(false);
  const limpo = corrigindo || fase === "corrigido";
  const codigo = limpo ? CODIGO_LIMPO : CODIGO_SLOP;
  const saida: LinhaSaida[] = limpo ? SAIDA_ABERTA : SAIDA_FECHADA;
  const visiveis = saida.filter((l) => l.passo <= passo);

  const acionar = () => {
    if (fase === "fechado") {
      setCorrigindo(true);
      rodar("corrigido");
    } else {
      seq.limpar();
      setCorrigindo(false);
      setFase("fechado");
      setPasso(4);
      setAlvo(null);
    }
  };

  const rotulo = fase === "rodando" ? "Rodando" : fase === "fechado" ? "Corrigir e rodar de novo" : "Voltar pro slop";

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2" data-demo="killer">
      <div className="min-w-0 rounded-tile bg-casa-bg p-4 sm:p-6">
        <ol className="overflow-x-auto font-casa-mono text-casa-sm">
          {codigo.map((linha, i) => (
            <li
              key={`${limpo}-${i}`}
              className={cx(
                "flex w-max min-w-full gap-3 whitespace-pre rounded-[4px] px-1 py-px text-casa-fg-2",
                ANIMA_COR,
                alvo === i + 1 && "bg-casa-tile-2 text-casa-fg",
              )}
            >
              <span aria-hidden="true" className="w-4 shrink-0 text-right tabular-nums text-casa-fg-3">
                {i + 1}
              </span>
              {linha}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex min-w-0 flex-col rounded-tile bg-casa-bg p-4 sm:p-6">
        <p className="mb-3 font-casa-mono text-casa-sm text-casa-fg-3">node killer-scan.mjs src</p>
        <div className="min-h-[17.5rem] flex-1 font-casa-mono text-casa-sm" aria-live="polite">
          {fase === "rodando" ? (
            <StatusTicker className="mb-4" steps={PASSOS} rotateEverySec={1} loop={false} showTimer={false} />
          ) : null}
          <ul className="overflow-x-auto">
            {visiveis.map((l) =>
              l.alvo ? (
                <li key={l.linha}>
                  <button
                    type="button"
                    data-achado={l.alvo}
                    onClick={() => setAlvo(l.alvo ?? null)}
                    onMouseEnter={() => setAlvo(l.alvo ?? null)}
                    className={cx(
                      "ml-[2ch] whitespace-pre rounded-[4px] py-1 text-left text-casa-fg-2 underline decoration-casa-line underline-offset-2 outline-none hover:text-casa-fg focus-visible:[box-shadow:var(--focus)]",
                      ANIMA_COR,
                      alvo === l.alvo && "text-casa-fg",
                    )}
                  >
                    {l.linha.trim()}
                  </button>
                </li>
              ) : (
                <li
                  key={l.linha}
                  className={cx(
                    "whitespace-pre py-px",
                    l.fecho
                      ? "mt-3 font-medium text-casa-fg"
                      : l.linha.startsWith("[FAIL]")
                        ? "text-[color:var(--destructive)]"
                        : "text-casa-fg-2",
                  )}
                >
                  {l.linha}
                </li>
              ),
            )}
          </ul>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Acao onClick={acionar} disabled={fase === "rodando"} data-acao="killer">
            {rotulo}
          </Acao>
          <p className="text-casa-sm text-casa-fg-2">
            {fase === "corrigido"
              ? "Detector verde é só o começo. Falta abrir a tela e discutir com o veredito."
              : "Saída capturada rodando o killer-scan neste cartão do README. Clica num achado e vê a linha."}
          </p>
        </div>
      </div>
    </div>
  );
}

/* As etapas abaixo são as de cada filme, transcritas de visant-slop-reel/src. */
const TELAS = [
  {
    id: "mata",
    nome: "Café",
    etapas: [
      ["a foto é o produto, sem selo gritando", "visant-frontend"],
      ["nome, origem e preço por grama", "visant-copy"],
      ["opção é controle, sem pílula de festa", "visant-refine"],
      ["o botão diz o que faz, a urgência vira dado", "visant-copy"],
    ],
  },
  {
    id: "pauta",
    nome: "Agenda",
    etapas: [
      ["uma ação primária, o resto é navegação", "visant-frontend"],
      ["evento é dado, sem confete", "visant-refine"],
      ["grade some, o horário fica", "visant-refine"],
      ["detalhe com hora exata e uma ação", "visant-copy"],
    ],
  },
  {
    id: "checkout",
    nome: "Checkout",
    etapas: [
      ["preço claro, sem relógio falso", "visant-copy"],
      ["campo com rótulo e ajuda no lugar certo", "visant-frontend"],
      ["ícone de biblioteca, seleção sem enfeite", "visant-killer"],
      ["o botão diz o que acontece e quanto", "visant-copy"],
    ],
  },
  {
    id: "landing",
    nome: "Landing",
    etapas: [
      ["menos links, ícone de verdade no botão", "visant-killer"],
      ["a headline afirma o que o produto faz", "visant-copy"],
      ["uma ação principal, prova com número", "visant-copy"],
      ["o produto é o herói", "visant-frontend"],
    ],
  },
  {
    id: "settings",
    nome: "Configurações",
    etapas: [
      ["navegação: ícone de biblioteca, ativo neutro", "visant-killer"],
      ["o rótulo diz o quê, a descrição diz quando", "visant-copy"],
      ["ação destrutiva diz a consequência", "visant-frontend"],
      ["status inline, sem toast de vidro", "visant-killer"],
    ],
  },
  {
    id: "kit",
    nome: "Componentes",
    etapas: [
      ["escassez se conta", "visant-copy"],
      ["valor, delta e tendência numa anatomia só", "visant-refine"],
      ["medidor: número absoluto e quando renova", "visant-refine"],
      ["erro que ensina a consertar", "visant-frontend"],
      ["empty state que fala e tem uma ação", "visant-frontend"],
    ],
  },
];

/*
 * Cada tela é um trecho do filme `serie`: nele a tela inteira cabe no quadro, com
 * a varredura de antes e depois. Os filmes soltos têm câmera que entra no detalhe,
 * e aí a foto parada sai cortada ou borrada. Um arquivo só, baixado uma vez.
 */
const TRECHOS: Record<string, { de: number; poster: string }> = {
  kit: { de: 5.25, poster: pKit },
  checkout: { de: 10.45, poster: pCheckout },
  settings: { de: 15.65, poster: pSettings },
  landing: { de: 20.85, poster: pLanding },
  mata: { de: 26.05, poster: pMata },
  pauta: { de: 31.25, poster: pPauta },
};

export function TelasKiller() {
  const [id, setId] = React.useState("pauta");
  const tela = TELAS.find((t) => t.id === id) ?? TELAS[0];
  return (
    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-2 lg:items-center lg:gap-16" data-demo="telas">
      <Video
        key={tela.id}
        nome="serie"
        poster={TRECHOS[tela.id].poster}
        trecho={[TRECHOS[tela.id].de, TRECHOS[tela.id].de + 4.7]}
        alt={`Antes e depois da tela de ${tela.nome}`}
      />
      <div className="min-w-0">
        <h3 className="text-casa-xl font-medium">Seis telas, e o que mudou em cada uma</h3>
        <div className="mt-5 flex flex-wrap gap-1" role="group" aria-label="Escolher a tela">
          {TELAS.map((t) => (
            <Opcao key={t.id} ativa={t.id === id} onClick={() => setId(t.id)} data-tela={t.id}>
              {t.nome}
            </Opcao>
          ))}
        </div>
        <ol key={tela.id} className={cx("mt-6", ANIMA_OPACIDADE)}>
          {tela.etapas.map(([texto, skill], i) => (
            <li key={texto} className="flex flex-wrap items-baseline gap-x-3 border-t border-casa-line py-3">
              <span className="font-casa-mono text-casa-sm tabular-nums text-casa-fg-3">0{i + 1}</span>
              <span className="min-w-0 flex-1 basis-48 text-casa-base">{texto}</span>
              <a href={`#${skill}`} className={cx(LINK, "font-casa-mono text-casa-sm text-casa-fg-2")}>
                {skill}
              </a>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-casa-sm text-casa-fg-2">
          O filme foi montado em Remotion a partir das regras. As marcas são inventadas e os números são de exemplo.
        </p>
      </div>
    </div>
  );
}
