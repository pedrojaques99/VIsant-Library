"use client";

/**
 * visant-refine: o gráfico sai de montado para desenhado sozinho ao entrar em
 * vista, e um arrasto leva e traz. Só a regra da vez aparece por escrito. Regras de
 * `visant-refine/references/charts.md`, dados de exemplo.
 */

import * as React from "react";
import { CORES_MONTADO, DELTA_MONTADO, TITULO_MONTADO } from "./amostras";
import { ANIMA_OPACIDADE, Dobra, useAoEntrar, useLargo, useMenosMovimento, useSequencia } from "./base";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const ACUMULADO = [6, 13, 19, 26, 33, 41, 48, 56, 64, 73, 82, 90];
const TETO = 80;

const REGRAS = [
  "Rótulo, valor e delta numa anatomia só",
  "Acumulado pede área, sem barra por mês",
  "Cor por função, nunca por barra",
  "Grade recua, e nunca dois eixos y",
  "Limite é linha com nome",
  "Marca onde cruzou",
];

export function DemoRefine() {
  const [n, setN] = React.useState(0);
  const seq = useSequencia();
  const menos = useMenosMovimento();
  const largo = useLargo();
  const tem = (i: number) => n > i;

  const W = largo ? 760 : 400;
  const H = largo ? 320 : 280;
  const M = { l: 32, r: largo ? 44 : 34, t: 14, b: 26 };
  const fonte = largo ? 12 : 13;
  const x = (i: number) => M.l + (i / (MESES.length - 1)) * (W - M.l - M.r);
  const y = (v: number) => H - M.b - (v / 100) * (H - M.t - M.b);
  const linha = ACUMULADO.map((v, i) => `${i ? "L" : "M"}${x(i)} ${y(v)}`).join("");
  const area = `${linha}L${x(11)} ${y(0)}L${x(0)} ${y(0)}Z`;
  const iC = ACUMULADO.findIndex((v) => v >= TETO);
  const xC = x(iC - 1) + (x(iC) - x(iC - 1)) * ((TETO - ACUMULADO[iC - 1]) / (ACUMULADO[iC] - ACUMULADO[iC - 1]));

  const raiz = useAoEntrar<HTMLDivElement>(() => {
    if (menos) return setN(REGRAS.length);
    REGRAS.forEach((_, i) => seq.depois(900 + i * 600, () => setN(i + 1)));
  });

  const anima = ANIMA_OPACIDADE;

  return (
    <Dobra
      nome="visant-refine"
      como={
        <>
          <p>Faz gráfico, medidor e painel parecerem da mesma família. As seis regras, na ordem:</p>
          <ol className="mt-2 list-inside list-decimal text-casa-fg-2">
            {REGRAS.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
          <p className="mt-2 text-casa-sm text-casa-fg-2">Os dados são de exemplo.</p>
        </>
      }
    >
      <div ref={raiz} className="flex min-w-0 flex-col gap-2 lg:mx-auto lg:w-full lg:max-w-4xl" data-demo="refine">
        <figure className="min-w-0 rounded-tile bg-casa-tile p-3 lg:p-6">
          <figcaption className="min-h-[3.75rem]">
            {tem(0) ? (
              <p className="flex flex-wrap items-baseline gap-x-2 text-[1.75rem] font-medium tabular-nums">
                R$ 90 mil
                <span className="font-casa-mono text-casa-sm font-normal text-casa-fg-2">+R$ 8 mil</span>
              </p>
            ) : (
              <p className="text-casa-lg font-medium">
                {TITULO_MONTADO} <span className="text-casa-sm text-casa-fg-2">{DELTA_MONTADO}</span>
              </p>
            )}
          </figcaption>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" role="img" aria-label="Faturamento acumulado por mês contra um teto, dados de exemplo">
            <g className={anima} opacity={tem(3) ? 0 : 1}>
              {[0, 20, 40, 60, 80, 100].map((v) => (
                <line key={v} x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} stroke="var(--casa-fg-3)" />
              ))}
              {MESES.map((_, i) => (
                <line key={i} x1={x(i)} x2={x(i)} y1={M.t} y2={H - M.b} stroke="var(--casa-fg-3)" />
              ))}
              {[0, 50, 100].map((v) => (
                <text key={v} x={W - M.r + 4} y={y(v) + 4} fontSize={fonte} fill="var(--casa-fg-2)">
                  {v}%
                </text>
              ))}
            </g>
            <g className={anima} opacity={tem(3) ? 1 : 0}>
              {[0, 50, 100].map((v) => (
                <line key={v} x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} stroke="var(--casa-line)" />
              ))}
            </g>
            {[0, 50, 100].map((v) => (
              <text key={v} x={M.l - 6} y={y(v) + 4} fontSize={fonte} textAnchor="end" fill="var(--casa-fg-2)">
                {v}
              </text>
            ))}
            {MESES.map((m, i) =>
              i % 3 === 0 ? (
                <text key={m} x={x(i)} y={H - 6} fontSize={fonte} textAnchor="middle" fill="var(--casa-fg-2)">
                  {m}
                </text>
              ) : null,
            )}
            <g className={anima} opacity={tem(1) ? 0 : 1}>
              {ACUMULADO.map((v, i) => (
                <rect
                  key={i}
                  x={x(i) - (largo ? 11 : 8)}
                  y={y(v)}
                  width={largo ? 22 : 16}
                  height={y(0) - y(v)}
                  rx={largo ? 11 : 8}
                  fill={tem(2) ? "var(--casa-fg-2)" : CORES_MONTADO[i % CORES_MONTADO.length]}
                />
              ))}
            </g>
            <g className={anima} opacity={tem(1) ? 1 : 0}>
              <path d={area} fill={tem(2) ? "var(--casa-fg)" : CORES_MONTADO[1]} opacity="0.1" />
              <path d={linha} fill="none" stroke={tem(2) ? "var(--casa-fg)" : CORES_MONTADO[1]} strokeWidth="2" />
            </g>
            <g className={anima} opacity={tem(4) ? 1 : 0}>
              <line x1={M.l} x2={W - M.r} y1={y(TETO)} y2={y(TETO)} stroke="var(--destructive)" strokeDasharray="4 4" />
              <text x={M.l + 4} y={y(TETO) - 6} fontSize={fonte} fill="var(--casa-fg-2)">
                Teto
              </text>
            </g>
            <g className={anima} opacity={tem(5) ? 1 : 0}>
              <circle cx={xC} cy={y(TETO)} r="4" fill="var(--casa-tile)" stroke="var(--destructive)" strokeWidth="2" />
              <text x={xC - 8} y={y(TETO) - 8} fontSize={fonte + 1} textAnchor="end" fill="var(--casa-fg)">
                Estoura em novembro
              </text>
            </g>
          </svg>
        </figure>
        <p className="min-h-5 text-center text-casa-base text-casa-fg-2" aria-live="polite" data-regra-atual>
          {n > 0 ? REGRAS[n - 1] : ""}
        </p>
        <input
          type="range"
          min={0}
          max={REGRAS.length}
          step={1}
          value={n}
          data-arrasto="refine"
          aria-label="Aplicar as regras uma a uma"
          aria-valuetext={n > 0 ? REGRAS[n - 1] : "Gráfico montado"}
          onPointerDown={() => seq.limpar()}
          onChange={(e) => {
            seq.limpar();
            setN(Number(e.target.value));
          }}
          className="h-11 w-full cursor-grab [accent-color:var(--casa-fg)] [touch-action:pan-y]"
        />
      </div>
    </Dobra>
  );
}
