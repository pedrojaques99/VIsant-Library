"use client";

/**
 * visant-refine: o mesmo gráfico sai de montado para desenhado, uma regra por
 * vez. As regras são as de `visant-refine/references/charts.md`. Dados de
 * exemplo: faturamento acumulado contra um teto, a forma que o próprio
 * arquivo recomenda para responder "quando eu estouro o limite".
 */

import * as React from "react";
import { CORES_MONTADO, DELTA_MONTADO, TITULO_MONTADO } from "./amostras";
import { Acao, ANIMA_OPACIDADE, cx, useMenosMovimento, useSequencia } from "./base";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const ACUMULADO = [6, 13, 19, 26, 33, 41, 48, 56, 64, 73, 82, 90];
const TETO = 80;

const W = 640;
const H = 280;
const M = { l: 40, r: 44, t: 16, b: 28 };
const x = (i: number) => M.l + (i / (MESES.length - 1)) * (W - M.l - M.r);
const y = (v: number) => H - M.b - (v / 100) * (H - M.t - M.b);

const linha = ACUMULADO.map((v, i) => `${i ? "L" : "M"}${x(i)} ${y(v)}`).join("");
const area = `${linha}L${x(11)} ${y(0)}L${x(0)} ${y(0)}Z`;
/* Interpola o mês em que o acumulado cruza o teto: entre outubro e novembro. */
const iCruza = ACUMULADO.findIndex((v) => v >= TETO);
const fCruza = (TETO - ACUMULADO[iCruza - 1]) / (ACUMULADO[iCruza] - ACUMULADO[iCruza - 1]);
const xCruza = x(iCruza - 1) + (x(iCruza) - x(iCruza - 1)) * fCruza;

const REGRAS = [
  { id: "anatomia", nome: "Rótulo, valor e delta numa anatomia só" },
  { id: "forma", nome: "Acumulado pede área, não barra por mês" },
  { id: "cor", nome: "Cor por função, nunca por barra" },
  { id: "eixo", nome: "Grade recua, e nunca dois eixos y" },
  { id: "teto", nome: "Limite é linha com nome" },
  { id: "cruza", nome: "Marca onde cruzou" },
] as const;

type Id = (typeof REGRAS)[number]["id"];

export function DemoRefine({ cabeca }: { cabeca: React.ReactNode }) {
  const [ligadas, setLigadas] = React.useState<Set<Id>>(new Set());
  const seq = useSequencia();
  const menos = useMenosMovimento();
  const tem = (id: Id) => ligadas.has(id);
  const tudo = ligadas.size === REGRAS.length;

  const alternar = (id: Id) => {
    seq.limpar();
    setLigadas((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const aplicar = () => {
    seq.limpar();
    if (tudo) {
      setLigadas(new Set());
      return;
    }
    if (menos) {
      setLigadas(new Set(REGRAS.map((r) => r.id)));
      return;
    }
    setLigadas(new Set());
    REGRAS.forEach((r, i) =>
      seq.depois(i * 450, () => setLigadas((s) => new Set(s).add(r.id))),
    );
  };

  /* Uma vez só, quando entra em vista: quem só passa rolando também vê o antes e o depois. */
  const raiz = React.useRef<HTMLElement>(null);
  const tocou = React.useRef(false);
  React.useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || tocou.current) return;
        tocou.current = true;
        seq.depois(700, aplicar);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anima = ANIMA_OPACIDADE;

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12" data-demo="refine">
      <div className="min-w-0 lg:order-2">
        {cabeca}
        <div className="mt-5">

        <ul>
          {REGRAS.map((r) => (
            <li key={r.id} className="border-t border-casa-line first:border-t-0">
              <button
                type="button"
                aria-pressed={tem(r.id)}
                data-regra={r.id}
                onClick={() => alternar(r.id)}
                className={cx(
                  "alvo-toque flex w-full items-center gap-3 rounded-control py-3 text-left text-casa-base outline-none focus-visible:[box-shadow:var(--focus)]",
                  "transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
                  tem(r.id) ? "text-casa-fg" : "text-casa-fg-2 hover:text-casa-fg",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    "size-3 shrink-0 rounded-[3px] border",
                    tem(r.id) ? "border-casa-fg bg-casa-fg" : "border-casa-fg-3",
                  )}
                />
                {r.nome}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Acao onClick={aplicar} data-acao="refine">
            {tudo ? "Voltar ao montado" : "Aplicar as seis"}
          </Acao>
          <p className="text-casa-sm text-casa-fg-2">Dados de exemplo.</p>
        </div>
        </div>
      </div>
      <figure ref={raiz} className="min-w-0 rounded-tile bg-casa-tile p-4 sm:p-6 lg:order-1">
        <figcaption className="min-h-[4.5rem]">
          {tem("anatomia") ? (
            <>
              <p className="text-casa-sm text-casa-fg-2">Faturado no ano</p>
              <p className="mt-1 flex flex-wrap items-baseline gap-x-3 text-casa-xl font-medium tabular-nums">
                R$ 90 mil
                <span className="font-casa-mono text-casa-sm font-normal text-casa-fg-2">+R$ 8 mil em dezembro</span>
              </p>
            </>
          ) : (
            <p className="text-casa-lg font-medium">
              {TITULO_MONTADO} <span className="text-casa-sm text-casa-fg-2">{DELTA_MONTADO}</span>
            </p>
          )}
        </figcaption>

        <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label="Faturamento acumulado por mês contra um teto, dados de exemplo">
          {/* grade pesada: só no estado montado */}
          <g className={anima} opacity={tem("eixo") ? 0 : 1}>
            {[0, 20, 40, 60, 80, 100].map((v) => (
              <line key={v} x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} stroke="var(--casa-fg-3)" />
            ))}
            {MESES.map((_, i) => (
              <line key={i} x1={x(i)} x2={x(i)} y1={M.t} y2={H - M.b} stroke="var(--casa-fg-3)" />
            ))}
            {[0, 25, 50, 75, 100].map((v) => (
              <text key={v} x={W - M.r + 6} y={y(v) + 4} fontSize="11" fill="var(--casa-fg-2)">
                {v}%
              </text>
            ))}
          </g>
          <g className={anima} opacity={tem("eixo") ? 1 : 0}>
            {[0, 50, 100].map((v) => (
              <line key={v} x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} stroke="var(--casa-line)" />
            ))}
          </g>
          {[0, 50, 100].map((v) => (
            <text key={v} x={M.l - 8} y={y(v) + 4} fontSize="11" textAnchor="end" fill="var(--casa-fg-2)">
              {v}
            </text>
          ))}
          {MESES.map((m, i) =>
            i % 2 === 0 ? (
              <text key={m} x={x(i)} y={H - 8} fontSize="11" textAnchor="middle" fill="var(--casa-fg-2)">
                {m}
              </text>
            ) : null,
          )}

          {/* barras */}
          <g className={anima} opacity={tem("forma") ? 0 : 1}>
            {ACUMULADO.map((v, i) => (
              <rect
                key={i}
                x={x(i) - 11}
                y={y(v)}
                width="22"
                height={y(0) - y(v)}
                rx="11"
                fill={tem("cor") ? "var(--casa-fg-2)" : CORES_MONTADO[i % CORES_MONTADO.length]}
              />
            ))}
          </g>

          {/* área */}
          <g className={anima} opacity={tem("forma") ? 1 : 0}>
            <path d={area} fill={tem("cor") ? "var(--casa-fg)" : CORES_MONTADO[1]} opacity="0.1" />
            <path d={linha} fill="none" stroke={tem("cor") ? "var(--casa-fg)" : CORES_MONTADO[1]} strokeWidth="2" />
          </g>

          {/* teto */}
          <g className={anima} opacity={tem("teto") ? 1 : 0}>
            <line x1={M.l} x2={W - M.r} y1={y(TETO)} y2={y(TETO)} stroke="var(--destructive)" strokeDasharray="4 4" />
            <text x={M.l + 4} y={y(TETO) - 6} fontSize="11" fill="var(--casa-fg-2)">
              Teto de exemplo: R$ 80 mil
            </text>
          </g>

          {/* cruzou */}
          <g className={anima} opacity={tem("cruza") ? 1 : 0}>
            <circle cx={xCruza} cy={y(TETO)} r="4" fill="var(--casa-tile)" stroke="var(--destructive)" strokeWidth="2" />
            <text x={xCruza - 8} y={y(TETO) - 10} fontSize="12" textAnchor="end" fill="var(--casa-fg)">
              Estoura em novembro
            </text>
          </g>
        </svg>
      </figure>
    </div>
  );
}
