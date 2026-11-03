"use client";

/**
 * Dez sinais do slop-catalog, um por vez, os dois lados vivos.
 *
 * Passar o ponteiro escolhe; no toque e no teclado é clique e foco. A peça nasce
 * no primeiro sinal, sem esperar gesto nenhum.
 */

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ERRADO } from "./sinais-reu";

const CATALOGO = "https://github.com/pedrojaques99/visant-skills-public/blob/main/visant-killer/references/slop-catalog.md";

const Valor = ({ rotulo, valor, forte }: { rotulo: string; valor: string; forte?: boolean }) => (
  <div className="flex items-baseline justify-between gap-4 text-casa-base">
    <span className="text-casa-fg-2">{rotulo}</span>
    <span className={cn("tabular-nums", forte && "font-medium")}>{valor}</span>
  </div>
);

const SINAIS: { id: string; n: number; nome: string; teste: string; certo: React.ReactNode }[] = [
  {
    id: "arcoiris",
    n: 1,
    nome: "Card arco-íris",
    teste: "Mais de dois matizes no mesmo bloco de números: nenhum quer dizer nada.",
    certo: (
      <div className="grid w-full max-w-[240px] gap-2">
        <Valor rotulo="Receita" valor="R$ 12.400" />
        <Valor rotulo="Imposto" valor="− R$ 744" />
        <Valor rotulo="Isenção" valor="R$ 2.000" />
        <Valor rotulo="Base" valor="R$ 11.656" forte />
      </div>
    ),
  },
  {
    id: "mono",
    n: 2,
    nome: "Dinheiro em mono",
    teste: "Mono é pra serial, hash e código. Num valor, o card grita terminal.",
    certo: (
      <div className="text-center">
        <p className="text-casa-base text-casa-fg-2">Total da fatura</p>
        <p className="mt-1 text-casa-xl tabular-nums">R$ 1.249,90</p>
      </div>
    ),
  },
  {
    id: "alarme",
    n: 8,
    nome: "Alarme com exclamação",
    teste: "A exceção fala pela palavra e pela posição. Diga o fato e a consequência.",
    certo: <p className="max-w-[240px] text-center text-casa-lg">Você passou do limite do plano. A próxima fatura muda de faixa.</p>,
  },
  {
    id: "gritando",
    n: 13,
    nome: "Todo rótulo gritando",
    teste: "Se tudo é título de seção, não tem hierarquia. Um nível de rótulo por card.",
    certo: (
      <div className="grid w-full max-w-[240px] gap-2">
        {["Receita", "Clientes", "Período", "Status"].map((r) => (
          <Valor key={r} rotulo={r} valor="Ativo" />
        ))}
      </div>
    ),
  },
  {
    id: "destaque",
    n: 22,
    nome: "O destaque que destaca tudo",
    teste: "Três de três cards acesos: o item que importa some no meio dos outros.",
    certo: (
      <div className="grid w-full max-w-[280px] grid-cols-3 gap-2">
        {["Básico", "Pro", "Time"].map((p) => (
          <div
            key={p}
            className={cn(
              "rounded-control p-3 text-center text-casa-sm",
              p === "Pro" ? "bg-casa-cta text-casa-cta-fg" : "bg-casa-tile-2",
            )}
          >
            {p}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "pontos",
    n: 32,
    nome: "Fundo de grade de pontos",
    teste: "É textura copiada de landing pra preencher vazio. Fundo liso, do token.",
    certo: <div className="flex h-[150px] w-full max-w-[280px] items-center justify-center text-casa-base text-casa-fg-2">Nenhum projeto ainda</div>,
  },
  {
    id: "tags",
    n: 47,
    nome: "Tag em tudo",
    teste: "Apaga todas. Se nada se perdeu, elas não voltam.",
    certo: (
      <div className="max-w-[260px]">
        <p className="text-casa-lg font-medium">Relatório mensal</p>
        <p className="mt-1 text-casa-base text-casa-fg-2">PDF enviado pro time todo mês.</p>
      </div>
    ),
  },
  {
    id: "divisor",
    n: 51,
    nome: "Divisor entre tudo",
    teste: "Apaga os divisores. Se o agrupamento segue legível, eles ficam apagados.",
    certo: (
      <div className="grid w-full max-w-[240px] gap-5 text-casa-base">
        <div className="grid gap-1">
          <p>Nome</p>
          <p>E-mail</p>
        </div>
        <div className="grid gap-1">
          <p>Plano</p>
          <p>Fatura</p>
          <p>Time</p>
        </div>
      </div>
    ),
  },
  {
    id: "numerada",
    n: 56,
    nome: "Seção numerada",
    teste: "Troca duas seções de lugar. Se o número não muda o sentido, ele sai.",
    certo: (
      <div className="grid gap-4">
        <p className="text-casa-lg font-medium">O que a gente faz</p>
        <p className="text-casa-lg font-medium">Quanto custa</p>
      </div>
    ),
  },
  {
    id: "semunidade",
    n: 60,
    nome: "Número sem unidade",
    teste: "Cobre os rótulos: dá pra saber qual número é duração?",
    certo: (
      <div className="grid w-full max-w-[200px] gap-2 text-casa-base">
        {[
          ["Giro", "50", "°"],
          ["Zoom", "1.0", "x"],
          ["Raio", "16", "px"],
          ["Tempo", "0.50", "s"],
        ].map(([r, v, u]) => (
          <div key={r} className="flex justify-between">
            <span className="text-casa-fg-2">{r}</span>
            <span className="tabular-nums">
              {v}
              <span className="text-casa-fg-3">{u}</span>
            </span>
          </div>
        ))}
      </div>
    ),
  },
];

function Lado({ nome, children }: { nome: string; children: React.ReactNode }) {
  return (
    <figure className="flex min-h-[260px] flex-col rounded-tile bg-casa-tile p-5">
      <figcaption className="text-casa-base text-casa-fg-2">{nome}</figcaption>
      <div className="flex flex-1 items-center justify-center py-4">{children}</div>
    </figure>
  );
}

export function Sinais() {
  const [id, setId] = React.useState(SINAIS[0].id);
  const sinal = SINAIS.find((s) => s.id === id) ?? SINAIS[0];

  return (
    <section className="shell py-16 lg:py-28">
      <div className="max-w-[60ch]">
        <h2 className="text-casa-xl font-medium">Passe por um sinal e veja os dois lados.</h2>
        <p className="mt-3 text-casa-lg text-casa-fg-2">O catálogo tem 63, cada um com sintoma, causa e conserto. Estes dez cabem numa tela.</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-12">
        <div className="max-lg:order-2">
          <ul className="grid gap-0.5 max-lg:grid-cols-2">
            {SINAIS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  aria-pressed={s.id === id}
                  onPointerEnter={(e) => e.pointerType === "mouse" && setId(s.id)}
                  onFocus={() => setId(s.id)}
                  onClick={() => setId(s.id)}
                  className={`alvo-toque flex w-full items-baseline gap-3 rounded-control px-3 py-1.5 text-left text-casa-base transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] ${s.id === id ? "bg-casa-tile text-casa-fg" : "text-casa-fg-2 hover:text-casa-fg"}`}
                >
                  <span className="w-5 shrink-0 text-right text-casa-sm tabular-nums text-casa-fg-3">{s.n}</span>
                  {s.nome}
                </button>
              </li>
            ))}
          </ul>
          <a
            href={CATALOGO}
            target="_blank"
            rel="noreferrer"
            className="alvo-toque mt-4 inline-flex items-center gap-1 px-3 text-casa-base text-casa-fg-2 underline underline-offset-4 hover:text-casa-fg"
          >
            Ler os 63 no catálogo
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        </div>

        <div className="min-w-0 max-lg:order-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <Lado nome="Errado">{ERRADO[sinal.id]}</Lado>
            <Lado nome="Certo">{sinal.certo}</Lado>
          </div>
          <p className="mt-4 max-w-[60ch] text-casa-lg">{sinal.teste}</p>
        </div>
      </div>
    </section>
  );
}
