"use client";

/**
 * visant-copy: o texto de IA nasce pintado e se reescreve sozinho quando entra em
 * vista. O linter roda a cada letra, então o número cai de verdade. O campo é
 * editável: tocou, a reescrita automática para. As regras ficam na folha.
 */

import * as React from "react";
import { consertoMecanico, lintar, TEXTOS } from "./amostras";
import { Acao, Dobra, useAoEntrar, useMenosMovimento, useSequencia } from "./base";

function Pintado({ texto, faixas }: { texto: string; faixas: { de: number; ate: number }[] }) {
  const partes: React.ReactNode[] = [];
  let i = 0;
  [...faixas]
    .sort((a, b) => a.de - b.de)
    .forEach((f, n) => {
      if (f.de < i) return;
      partes.push(texto.slice(i, f.de));
      partes.push(
        <mark key={n} className="rounded-[3px] bg-[color-mix(in_oklch,var(--destructive)_28%,transparent)] text-inherit">
          {texto.slice(f.de, f.ate)}
        </mark>,
      );
      i = f.ate;
    });
  partes.push(texto.slice(i));
  return <>{partes}</>;
}

const BASE = TEXTOS[0];
const ORIGINAL = BASE.antes.join("\n");

export function DemoCopy() {
  const [texto, setTexto] = React.useState(ORIGINAL);
  const [digitando, setDigitando] = React.useState(false);
  const raf = React.useRef(0);
  const seq = useSequencia();
  const menos = useMenosMovimento();

  React.useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const achados = React.useMemo(() => lintar(texto), [texto]);
  const limpo = achados.length === 0;

  /* Apaga até o prefixo comum e digita o resto. O linter roda a cada letra. */
  const digitarAte = (alvo: string, de: string) => {
    if (menos) return setTexto(alvo);
    setDigitando(true);
    let comum = 0;
    while (comum < de.length && de[comum] === alvo[comum]) comum += 1;
    const apagar = de.length - comum;
    const total = apagar + (alvo.length - comum);
    const inicio = performance.now();
    const passo = (agora: number) => {
      const n = Math.min(total, Math.floor(((agora - inicio) / 1000) * 200));
      setTexto(n <= apagar ? de.slice(0, de.length - n) : alvo.slice(0, comum + (n - apagar)));
      if (n < total) raf.current = requestAnimationFrame(passo);
      else setDigitando(false);
    };
    raf.current = requestAnimationFrame(passo);
  };

  const reescrever = () => digitarAte(texto === ORIGINAL ? BASE.depois.join("\n") : consertoMecanico(texto), texto);

  const palco = useAoEntrar<HTMLDivElement>(() => seq.depois(1400, reescrever));

  const corpo = "whitespace-pre-wrap break-words p-4 text-casa-lg lg:p-8 lg:text-[1.5rem] lg:leading-9";

  return (
    <Dobra
      nome="visant-copy"
      como={
        <>
          <p>Escreve em português falado e reprova os tiques de IA. O campo é seu: cola um texto e o linter roda no seu navegador.</p>
          <ul className="mt-2">
            {achados.map((a) => (
              <li key={`${a.id}-${a.linha}`} className="border-t border-casa-line py-2">
                <p className="font-casa-mono text-casa-sm">{a.id}</p>
                <p className="text-casa-sm text-casa-fg-2">{a.dica}</p>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-casa-sm text-casa-fg-2">
            A reescrita da amostra foi feita à mão. No seu texto, o botão só conserta pontuação e negação pendurada.
          </p>
        </>
      }
    >
      <div ref={palco} className="flex min-w-0 flex-col gap-3 lg:mx-auto lg:w-full lg:max-w-4xl" data-demo="copy">
        <div className="relative grid rounded-tile bg-casa-tile">
          {/* O texto de IA, invisível, segura a altura: a reescrita não dá pulo. */}
          <div aria-hidden="true" className={`${corpo} invisible col-start-1 row-start-1`}>
            {ORIGINAL}
          </div>
          <div aria-hidden="true" className={`${corpo} col-start-1 row-start-1`}>
            <Pintado texto={texto} faixas={achados} />
            {"\n"}
          </div>
          <textarea
            aria-label="Texto para o copy-lint"
            data-campo="copy"
            value={texto}
            spellCheck={false}
            readOnly={digitando}
            onFocus={() => seq.limpar()}
            onChange={(e) => setTexto(e.target.value)}
            className={`${corpo} col-start-1 row-start-1 resize-none overflow-hidden rounded-tile bg-transparent text-transparent caret-casa-fg outline-none focus-visible:[box-shadow:var(--focus)]`}
          />
        </div>
        <div className="flex min-h-11 items-center justify-between gap-3">
          <p className="text-[2rem] font-medium leading-none tabular-nums" aria-live="polite" data-contagem="copy" aria-label={`${achados.length} achados`}>
            {achados.length}
          </p>
          <Acao
            onClick={() => {
              seq.limpar();
              if (limpo) digitarAte(ORIGINAL, texto);
              else reescrever();
            }}
            disabled={digitando}
            secundaria={limpo || digitando}
            data-acao="copy"
          >
            {limpo ? "De novo" : "Reescrever"}
          </Acao>
        </div>
      </div>
    </Dobra>
  );
}
