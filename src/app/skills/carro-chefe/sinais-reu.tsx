"use client";

/**
 * O lado errado do catálogo: dez sinais do slop-catalog desenhados de propósito.
 *
 * Este arquivo é o outro réu da página, e reprova nos detectores por construção.
 * O lado certo mora em `sinais.tsx`, que passa limpo.
 */

// noise-ignore-file: shouting-label, tag-everywhere, numbered-section, divider-everywhere, dot-grid, mono-everywhere, box-in-box, opacity-ladder, os exemplos errados do catálogo existem pra mostrar o defeito

const Linha = ({ rotulo, valor, cor }: { rotulo: string; valor: string; cor: string }) => (
  <div className="flex items-baseline justify-between gap-4 text-casa-base">
    <span className="text-casa-fg-2">{rotulo}</span>
    <span className={cor}>{valor}</span>
  </div>
);

export const ERRADO: Record<string, React.ReactNode> = {
  arcoiris: (
    <div className="grid w-full max-w-[240px] gap-2">
      {/* EXCEPTION to token-fallback/tailwind-palette: o sinal 1 é justamente uma cor de paleta por valor */}
      <Linha rotulo="Receita" valor="R$ 12.400" cor="text-green-500" />
      {/* EXCEPTION to token-fallback/tailwind-palette: o sinal 1 é justamente uma cor de paleta por valor */}
      <Linha rotulo="Imposto" valor="R$ 744" cor="text-red-500" />
      {/* EXCEPTION to token-fallback/tailwind-palette: o sinal 1 é justamente uma cor de paleta por valor */}
      <Linha rotulo="Isenção" valor="R$ 2.000" cor="text-purple-500" />
      {/* EXCEPTION to token-fallback/tailwind-palette: o sinal 1 é justamente uma cor de paleta por valor */}
      <Linha rotulo="Base" valor="R$ 11.656" cor="text-blue-500" />
    </div>
  ),
  mono: (
    <div className="text-center">
      <p className="text-casa-base text-casa-fg-2">Total da fatura</p>
      <p className="mt-1 font-mono text-casa-xl tabular-nums">R$ 1.249,90</p>
    </div>
  ),
  alarme: <p className="max-w-[240px] text-center text-casa-lg font-medium">Atenção! Excedeu o limite!! Migre agora!</p>,
  gritando: (
    <div className="grid w-full max-w-[240px] gap-3">
      {["Receita", "Clientes", "Período", "Status"].map((r) => (
        <div key={r} className="flex justify-between gap-4">
          <span className="font-mono text-casa-sm uppercase tracking-wider text-casa-fg-2">{r}</span>
          <span className="font-mono text-casa-sm uppercase tracking-wider text-casa-fg-2">Ativo</span>
        </div>
      ))}
    </div>
  ),
  destaque: (
    <div className="grid w-full max-w-[280px] grid-cols-3 gap-2">
      {["Básico", "Pro", "Time"].map((p) => (
        // EXCEPTION to token-fallback/tailwind-palette: o sinal 22 acende os três cards com a mesma cor de paleta
        <div key={p} className="rounded-control border-2 border-purple-500 p-3 text-center text-casa-sm">
          {p}
        </div>
      ))}
    </div>
  ),
  pontos: (
    <div
      className="flex h-[150px] w-full max-w-[280px] items-center justify-center rounded-control text-casa-base text-casa-fg-2"
      style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "14px 14px" }}
    >
      <span className="bg-casa-tile px-2">Nenhum projeto ainda</span>
    </div>
  ),
  tags: (
    <div className="max-w-[260px]">
      <div className="flex flex-wrap gap-1">
        {["Novo", "IA", "Beta", "Pro", "Popular", "Hot"].map((t) => (
          <span key={t} className="rounded-full bg-casa-tile-2 px-2 py-0.5 text-casa-sm">
            {t}
          </span>
        ))}
      </div>
      <p className="mt-3 text-casa-lg font-medium">Relatório mensal</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {["PDF", "Time", "Auto"].map((t) => (
          <span key={t} className="rounded-full bg-casa-tile-2 px-2 py-0.5 text-casa-sm">
            {t}
          </span>
        ))}
      </div>
    </div>
  ),
  divisor: (
    <div className="w-full max-w-[240px] divide-y divide-casa-fg-3 text-casa-base">
      {["Nome", "E-mail", "Plano", "Fatura", "Time"].map((r) => (
        <p key={r} className="py-1.5">
          {r}
        </p>
      ))}
    </div>
  ),
  numerada: (
    <div className="grid gap-4">
      {[
        ["01 / Serviços", "O que a gente faz"],
        ["02 / Preço", "Quanto custa"],
      ].map(([n, t]) => (
        <div key={n}>
          <p className="font-mono text-casa-sm text-casa-fg-3">{n}</p>
          <p className="text-casa-lg font-medium">{t}</p>
        </div>
      ))}
    </div>
  ),
  semunidade: (
    <div className="grid w-full max-w-[200px] gap-2 text-casa-base">
      {[
        ["Giro", "50"],
        ["Zoom", "1.0"],
        ["Raio", "16"],
        ["Tempo", "0.50"],
      ].map(([r, v]) => (
        <div key={r} className="flex justify-between">
          <span className="text-casa-fg-2">{r}</span>
          <span className="tabular-nums">{v}</span>
        </div>
      ))}
    </div>
  ),
};
