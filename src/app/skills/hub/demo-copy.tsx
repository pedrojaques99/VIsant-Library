"use client";

/**
 * visant-copy: as regras do copy-lint rodando no navegador, em cima do que está
 * no campo. A reescrita é digitada letra a letra e o linter roda a cada letra,
 * então o que some da lista sumiu de verdade.
 */

import * as React from "react";
import { SegmentedControl } from "../../../../registry/visant/ui/segmented-control";
import { consertoMecanico, lintar, TEXTOS } from "./amostras";
import { Acao, useMenosMovimento } from "./base";

/** Pinta os trechos achados atrás do campo, com o mesmo corpo de texto. */
function Pintado({ texto, faixas }: { texto: string; faixas: { de: number; ate: number }[] }) {
  const partes: React.ReactNode[] = [];
  let i = 0;
  [...faixas]
    .sort((a, b) => a.de - b.de)
    .forEach((f, n) => {
      if (f.de < i) return;
      partes.push(texto.slice(i, f.de));
      partes.push(
        <mark key={n} className="rounded-[3px] bg-[color-mix(in_oklch,var(--destructive)_24%,transparent)] text-inherit">
          {texto.slice(f.de, f.ate)}
        </mark>,
      );
      i = f.ate;
    });
  partes.push(texto.slice(i));
  return <>{partes}</>;
}

export function DemoCopy({ cabeca }: { cabeca: React.ReactNode }) {
  const [amostra, setAmostra] = React.useState(TEXTOS[0].id);
  const base = TEXTOS.find((t) => t.id === amostra) ?? TEXTOS[0];
  const [texto, setTexto] = React.useState(base.antes.join("\n"));
  const [digitando, setDigitando] = React.useState(false);
  const raf = React.useRef(0);
  const menos = useMenosMovimento();

  React.useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const achados = React.useMemo(() => lintar(texto), [texto]);
  const original = texto === base.antes.join("\n");
  const limpo = achados.length === 0;

  const trocar = (id: string) => {
    cancelAnimationFrame(raf.current);
    setDigitando(false);
    setAmostra(id);
    setTexto((TEXTOS.find((t) => t.id === id) ?? TEXTOS[0]).antes.join("\n"));
  };

  /* Apaga até o prefixo comum e digita o resto. Oitenta caracteres por segundo. */
  const reescrever = () => {
    const alvo = original ? base.depois.join("\n") : consertoMecanico(texto);
    if (menos) {
      setTexto(alvo);
      return;
    }
    setDigitando(true);
    let comum = 0;
    while (comum < texto.length && texto[comum] === alvo[comum]) comum += 1;
    const apagar = texto.length - comum;
    const total = apagar + (alvo.length - comum);
    const inicio = performance.now();
    const passo = (agora: number) => {
      const n = Math.min(total, Math.floor(((agora - inicio) / 1000) * 240));
      setTexto(n <= apagar ? texto.slice(0, texto.length - n) : alvo.slice(0, comum + (n - apagar)));
      if (n < total) raf.current = requestAnimationFrame(passo);
      else setDigitando(false);
    };
    raf.current = requestAnimationFrame(passo);
  };

  const corpo = "whitespace-pre-wrap break-words p-4 text-casa-lg sm:p-5";

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" data-demo="copy">
      <div className="min-w-0">
        {cabeca}
        <div className="mt-6" />
        <SegmentedControl
          aria-label="Escolher o texto"
          value={amostra}
          onChange={trocar}
          options={TEXTOS.map((t) => ({ value: t.id, label: t.nome }))}
          size="sm"
          className="w-full max-w-xs"
        />
        <div className="relative mt-3 grid rounded-tile bg-casa-tile">
          <div aria-hidden="true" className={`${corpo} col-start-1 row-start-1 min-h-[12rem]`}>
            <Pintado texto={texto} faixas={achados} />
            {"\n"}
          </div>
          <textarea
            aria-label="Texto para o copy-lint"
            data-campo="copy"
            value={texto}
            spellCheck={false}
            readOnly={digitando}
            onChange={(e) => setTexto(e.target.value)}
            className={`${corpo} col-start-1 row-start-1 resize-none overflow-hidden rounded-tile bg-transparent text-transparent caret-casa-fg outline-none focus-visible:[box-shadow:var(--focus)]`}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Acao onClick={reescrever} disabled={digitando || limpo} data-acao="copy">
            Reescrever
          </Acao>
          <p className="min-w-0 flex-1 basis-56 text-casa-sm text-casa-fg-2">
            {digitando
              ? "Reescrevendo. O linter roda a cada letra."
              : limpo
              ? "Limpo. Escreve mais alguma coisa aí pra ver."
              : original
                ? "O campo é seu: cola um texto seu e o linter roda enquanto você digita."
                : "No seu texto, o botão só conserta pontuação e negação pendurada. O resto quem reescreve é o agente."}
          </p>
        </div>
      </div>

      <div className="min-w-0" aria-live="polite">
        <p className="flex items-baseline gap-3 text-casa-base text-casa-fg-2">
          <span data-contagem="copy" className="text-[clamp(3rem,6vw,5rem)] font-medium leading-none tabular-nums text-casa-fg">
            {achados.length}
          </span>
          {achados.length === 1 ? "achado do copy-lint" : "achados do copy-lint"}
        </p>
        <ul className="mt-3">
          {achados.map((a) => (
            <li key={`${a.id}-${a.linha}`} className="border-t border-casa-line py-2.5">
              <p className="font-casa-mono text-casa-sm text-casa-fg">
                {a.id} <span className="text-casa-fg-3">L{a.linha}</span>
              </p>
              <p className="mt-0.5 text-casa-sm text-casa-fg-2">{a.dica}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
