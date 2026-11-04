"use client";

/**
 * /skills/como-usar: o primeiro uso, para quem nunca abriu um terminal.
 *
 * Um passo por tela, com uma coisa só para fazer. Quando o passo pede um comando, ele aparece
 * sendo digitado e tem um botão de copiar. Sem rolagem, e as setas do teclado também andam.
 */

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy } from "lucide-react";
import { useCopy } from "../copy-command";
import { Acao, cx, DUR, EASE_OUT, useMenosMovimento } from "./hub/base";
import { COMANDO_COMPLETO } from "./hub/dock";

type Passo = {
  titulo: string;
  texto: string;
  /** O que a pessoa baixa antes de seguir. */
  link?: { href: string; rotulo: string };
  comando?: string;
  /** O que se escreve pro Claude: conversa, sem botão de copiar. */
  conversa?: string;
};

const PASSOS: Passo[] = [
  {
    titulo: "Instale o Node.js.",
    texto: "É ele que baixa as skills. Escolha a versão LTS e clique em avançar até o fim.",
    link: { href: "https://nodejs.org", rotulo: "Baixar o Node.js" },
  },
  {
    titulo: "Instale o Claude Code.",
    texto: "É o Claude trabalhando direto nos arquivos do seu projeto.",
    link: { href: "https://claude.com/claude-code", rotulo: "Baixar o Claude Code" },
  },
  {
    titulo: "Abra o terminal na pasta do projeto.",
    texto: "No Mac, abra o Terminal. No Windows, o PowerShell. Troque meu-projeto pelo nome da sua pasta.",
    comando: "cd meu-projeto",
  },
  {
    titulo: "Cole este comando.",
    texto: "Copie, cole no terminal e aperte Enter. Ele instala as seis skills.",
    comando: COMANDO_COMPLETO,
  },
  {
    titulo: "Abra o Claude.",
    texto: "Digite isto no mesmo terminal e aperte Enter.",
    comando: "claude",
  },
  {
    titulo: "Peça do seu jeito.",
    texto: "Escreva como falaria com alguém. O Claude escolhe a skill certa.",
    conversa: "tá com cara de IA, audita essa tela",
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

function Tela({ passo }: { passo: Passo }) {
  const texto = passo.comando ?? passo.conversa;
  const { done, copy } = useCopy(passo.comando ?? "");
  const Icone = done ? Check : Copy;
  if (!texto) return null;
  return (
    <div className="mt-6 flex min-h-20 items-start gap-3 rounded-tile bg-casa-tile p-4 font-casa-mono text-casa-base">
      <span aria-hidden="true" className="text-casa-fg-3">
        {passo.comando ? "$" : ">"}
      </span>
      <code className="min-w-0 flex-1 text-casa-fg [overflow-wrap:anywhere]" aria-label={texto}>
        <Digitando key={texto} texto={texto} />
      </code>
      {passo.comando ? (
        <button
          type="button"
          onClick={copy}
          data-copiar-passo
          aria-label={done ? "Copiado" : "Copiar"}
          className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center rounded-control bg-casa-tile-2 text-casa-fg outline-none focus-visible:[box-shadow:var(--focus)]"
        >
          <Icone className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export function ComoUsar() {
  const [i, setI] = React.useState(0);
  const [sentido, setSentido] = React.useState(1);
  const menos = useMenosMovimento();
  const total = PASSOS.length;
  const fim = i === total;
  const passo = PASSOS[i];
  const titulo = React.useRef<HTMLHeadingElement>(null);
  const primeira = React.useRef(true);

  const andar = React.useCallback(
    (d: number) => {
      setSentido(d);
      setI((v) => Math.min(total, Math.max(0, v + d)));
    },
    [total],
  );

  React.useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
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

  return (
    <main data-como-usar className="casa shell flex min-h-[calc(100svh-var(--shell-header-h))] flex-col py-4 lg:mx-auto lg:max-w-2xl lg:py-8">
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

      <div className="flex min-h-0 flex-1 flex-col justify-start pb-8 pt-[12svh]">
        <AnimatePresence mode="wait" initial={false} custom={sentido}>
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
                <h1 ref={titulo} tabIndex={-1} className="text-[clamp(2.25rem,7vw,4rem)] font-medium leading-[1.08] tracking-[-0.02em] outline-none">
                  Pronto.
                </h1>
                <p className="mt-3 text-casa-lg text-casa-fg-2 [text-wrap:pretty]">As skills já estão no seu projeto. É só continuar pedindo.</p>
              </>
            ) : (
              <>
                <p className="mb-3 font-casa-mono text-casa-sm text-casa-fg-3">
                  {i + 1} de {total}
                </p>
                <h1 ref={titulo} tabIndex={-1} className="text-[clamp(2.25rem,7vw,4rem)] font-medium leading-[1.08] tracking-[-0.02em] outline-none [text-wrap:balance]">
                  {passo.titulo}
                </h1>
                <p className="mt-3 text-casa-lg text-casa-fg-2 [text-wrap:pretty]">{passo.texto}</p>
                <Tela passo={passo} />
                {passo.link ? (
                  <a
                    href={passo.link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex h-11 items-center gap-2 rounded-control bg-casa-tile-2 px-5 text-casa-base font-medium text-casa-fg outline-none focus-visible:[box-shadow:var(--focus)]"
                  >
                    {passo.link.rotulo}
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                ) : null}
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
          <Acao onClick={() => andar(1)} data-continuar>
            Continuar
            <ArrowRight className="size-4" aria-hidden="true" />
          </Acao>
        )}
      </nav>
    </main>
  );
}
