"use client";

/**
 * /skills/como-usar: o primeiro uso, sem terminal.
 *
 * Quem instala é o agente: a pessoa copia uma mensagem e cola na conversa. Depois vêm os dois
 * jeitos de pedir, uma skill ou um componente, um por tela. As setas do teclado também andam.
 */

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Copy } from "lucide-react";
import { useCopy } from "../copy-command";
import { Acao, cx, DUR, EASE_OUT, useMenosMovimento } from "./hub/base";
import { COMANDO_COMPLETO } from "./hub/dock";
import { PedirEmail, PedirFeedback, useLiberado } from "./hub/interesse";

/* O llms.txt ensina o agente a ligar o registry: nada disso precisa ficar na mensagem. */
const MENSAGEM = `Instale as skills da Visant neste projeto:
${COMANDO_COMPLETO}

Depois leia https://ui.visantlabs.com/llms.txt e use a library @visant/ui quando eu pedir um componente.`;

type Passo = { titulo: string; texto: string; escrita: string; copiar?: boolean };

const PASSOS: Passo[] = [
  {
    titulo: "Envie isso para o seu agente de IA.",
    texto: "Deixe seu e-mail, copie a mensagem e cole na conversa. Ele instala tudo sozinho.",
    escrita: MENSAGEM,
    copiar: true,
  },
  {
    titulo: "Chame uma skill.",
    texto: "Escreva como falaria com alguém. Ele escolhe a skill certa.",
    escrita: "tá com cara de IA, audita essa tela",
  },
  {
    titulo: "Peça um componente.",
    texto: "Ele acha a peça na library e coloca no seu projeto.",
    escrita: "coloca um kanban da Visant nessa tela",
  },
];

function Digitando({ texto }: { texto: string }) {
  const menos = useMenosMovimento();
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    setN(0);
    if (menos) return;
    const passo = Math.max(1, Math.round(texto.length / 40));
    const id = setInterval(() => {
      setN((v) => {
        if (v + passo >= texto.length) clearInterval(id);
        return Math.min(texto.length, v + passo);
      });
    }, 28);
    return () => clearInterval(id);
  }, [texto, menos]);
  const fim = menos || n >= texto.length;
  return (
    <>
      {menos ? texto : texto.slice(0, n)}
      {fim ? null : <span aria-hidden="true" className="ml-0.5 inline-block h-[1em] w-[0.5ch] translate-y-[0.15em] bg-casa-fg" />}
    </>
  );
}

export function ComoUsar() {
  const [i, setI] = React.useState(0);
  const [sentido, setSentido] = React.useState(1);
  const [copiou, setCopiou] = React.useState(false);
  const [liberado, liberar] = useLiberado();
  const menos = useMenosMovimento();
  const total = PASSOS.length;
  const fim = i === total;
  const passo = PASSOS[i];
  const titulo = React.useRef<HTMLHeadingElement>(null);
  const primeira = React.useRef(true);
  const { done, copy } = useCopy(MENSAGEM);
  const Icone = done ? Check : Copy;

  /* No primeiro passo o e-mail vem antes: sem ele, seguir pularia a própria porta. */
  const preso = i === 0 && !liberado;

  const andar = React.useCallback(
    (d: number) => {
      if (d > 0 && preso) return;
      setSentido(d);
      setI((v) => Math.min(total, Math.max(0, v + d)));
    },
    [total, preso],
  );

  React.useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") andar(1);
      if (e.key === "ArrowLeft") andar(-1);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [andar]);

  /* Quem navega por teclado ou leitor de tela chega no passo novo, e não fica no botão. */
  React.useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    titulo.current?.focus({ preventScroll: true });
  }, [i]);

  const deslize = menos ? 0 : 24 * sentido;
  const classeDoTitulo = "text-[clamp(2.25rem,7vw,4rem)] font-medium leading-[1.08] tracking-[-0.02em] outline-none [text-wrap:balance]";

  return (
    <main data-como-usar className="casa shell flex min-h-[calc(100svh-var(--shell-header-h)-3.5rem)] flex-col py-4 lg:mx-auto lg:min-h-[calc(100svh-var(--shell-header-h))] lg:max-w-2xl lg:py-8">
      <div role="progressbar" aria-label="Progresso" aria-valuemin={0} aria-valuemax={total} aria-valuenow={i} className="flex gap-1.5">
        {PASSOS.map((p, k) => (
          <span key={p.titulo} className="h-1 flex-1 overflow-hidden rounded-[2px] bg-casa-tile-2">
            <span
              className="block h-full origin-left bg-casa-fg transition-transform [transition-duration:var(--dur-slow)] [transition-timing-function:var(--ease-out)]"
              style={{ transform: `scaleX(${k < i ? 1 : 0})` }}
            />
          </span>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-start pb-8 pt-[10svh]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={i}
            initial={{ opacity: 0, x: deslize }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -deslize }}
            transition={{ duration: DUR.base, ease: EASE_OUT }}
          >
            {fim ? (
              <>
                <motion.span
                  initial={menos ? false : { opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: DUR.base, ease: EASE_OUT, delay: 0.1 }}
                  className="mb-6 grid size-14 place-items-center rounded-tile bg-casa-cta text-casa-cta-fg"
                >
                  <Check className="size-6" aria-hidden="true" />
                </motion.span>
                <h1 ref={titulo} tabIndex={-1} className={classeDoTitulo}>
                  Pronto.
                </h1>
                <p className="mt-3 text-casa-lg text-casa-fg-2 [text-wrap:pretty]">Agora é só continuar pedindo.</p>
                <div className="mt-8">
                  <PedirFeedback origem="como-usar" />
                </div>
              </>
            ) : (
              <>
                <h1 ref={titulo} tabIndex={-1} className={classeDoTitulo}>
                  {passo.titulo}
                </h1>
                <p className="mt-3 text-casa-lg text-casa-fg-2 [text-wrap:pretty]">{passo.texto}</p>
                {passo.copiar && !liberado ? (
                  <div className="mt-6">
                    <PedirEmail origem="como-usar" onLiberar={liberar} />
                  </div>
                ) : (
                <>
                <p
                  aria-label={passo.escrita}
                  data-escrita
                  className="mt-6 min-h-20 whitespace-pre-wrap rounded-tile bg-casa-tile p-4 font-casa-mono text-casa-sm text-casa-fg [overflow-wrap:anywhere]"
                >
                  <Digitando key={passo.escrita} texto={passo.escrita} />
                </p>
                {passo.copiar ? (
                  <Acao
                    data-copiar-mensagem
                    className="mt-3 w-full"
                    onClick={() => {
                      copy();
                      setCopiou(true);
                    }}
                  >
                    <Icone className="size-4" aria-hidden="true" />
                    {done ? "Copiado" : "Copiar"}
                  </Acao>
                ) : null}
                </>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <nav aria-label="Passos" className="flex items-center justify-between gap-3 pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={() => andar(-1)}
          aria-label="Voltar"
          className={cx(
            "grid size-11 place-items-center rounded-control text-casa-fg-2 outline-none hover:text-casa-fg focus-visible:[box-shadow:var(--focus)]",
            i === 0 && "invisible",
          )}
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        {fim ? (
          <a
            href="/skills"
            className="inline-flex h-11 items-center justify-center rounded-control bg-casa-cta px-5 text-casa-base font-medium text-casa-cta-fg outline-none focus-visible:[box-shadow:var(--focus)]"
          >
            Ver as skills
          </a>
        ) : (
          /* No primeiro passo a ação é copiar: Continuar só vira a principal depois disso. */
          <Acao secundaria={i === 0 && !copiou} onClick={() => andar(1)} data-continuar className={preso ? "invisible" : undefined}>
            Continuar
            <ArrowRight className="size-4" aria-hidden="true" />
          </Acao>
        )}
      </nav>
    </main>
  );
}
