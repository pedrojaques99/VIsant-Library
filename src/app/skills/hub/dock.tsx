"use client";

/**
 * O rodapé fixo: as 12 skills no polegar e o único "Instalar" da página.
 * A fileira rola de lado de propósito, com snap de três em três colunas, então nome
 * nenhum sai cortado. A barrinha em cima diz onde se está e onde a lista termina.
 * O instalador é um <dialog>: foco, Esc e fundo inerte vêm do navegador.
 */

import * as React from "react";
import { motion } from "motion/react";
import { Check, Copy, X } from "lucide-react";
import { useCopy } from "../../copy-command";
import { ANIMA_COR, cx, DUR, EASE_OUT, useMenosMovimento, useSequencia } from "./base";
import { PedirEmail, useLiberado } from "./interesse";

export const INDICE = [
  { id: "visant-killer", curto: "killer", grupo: "Interface" },
  { id: "visant-design", curto: "design", grupo: "Interface" },
  { id: "visant-frontend", curto: "frontend", grupo: "Interface" },
  { id: "visant-copy", curto: "copy", grupo: "Interface" },
  { id: "visant-motion", curto: "motion", grupo: "Interface" },
  { id: "visant-refine", curto: "refine", grupo: "Interface" },
];

const BASE = "npx skills add pedrojaques99/visant-skills-public";
/* Sempre com `--skill`: sem ele o comando instala também as de vídeo e projeto, que a página não mostra. */
export const COMANDO_COMPLETO = `${BASE} --skill ${INDICE.map((s) => s.id).join(" ")}`;

export function Dock({ onInstalar }: { onInstalar: () => void }) {
  const [ativo, setAtivo] = React.useState<string | null>(null);
  const trilho = React.useRef<HTMLDivElement>(null);
  const menos = useMenosMovimento();

  React.useEffect(() => {
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) if (e.isIntersecting) setAtivo(e.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    document.querySelectorAll("[data-dobra]").forEach((d) => io.observe(d));
    return () => io.disconnect();
  }, []);

  /* Rola só o trilho: scrollIntoView aqui puxaria a página junto. */
  React.useEffect(() => {
    const t = trilho.current;
    const el = t?.querySelector<HTMLElement>(`[data-ir="${ativo}"]`);
    if (!t || !el) return;
    t.scrollTo({ left: el.offsetLeft - el.offsetWidth, behavior: menos ? "auto" : "smooth" });
  }, [ativo, menos]);

  return (
    <nav
      aria-label="As skills"
      data-dock
      className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-casa-line bg-casa-bg pb-[env(safe-area-inset-bottom)] pr-2 lg:inset-x-auto lg:bottom-4 lg:left-1/2 lg:-translate-x-1/2 lg:rounded-tile lg:border-t-0 lg:bg-casa-tile-2 lg:py-1 lg:pl-2 lg:[box-shadow:var(--casa-shadow)]"
    >
      <span aria-hidden="true" className="absolute left-0 top-0 h-0.5 w-full lg:hidden">
        <span
          data-posicao
          style={{ transform: `translateX(${Math.max(0, INDICE.findIndex((s) => s.id === ativo)) * 100}%)` }}
          className="block h-full w-[calc(100%/6)] bg-casa-fg transition-transform [transition-duration:var(--dur-slow)] [transition-timing-function:var(--ease-out)]"
        />
      </span>
      <div className="min-w-0 flex-1 [container-type:inline-size] lg:[container-type:normal]">
      <div
        ref={trilho}
        data-trilho
        className="relative grid snap-x snap-mandatory auto-cols-[33.3333cqw] grid-flow-col items-center overflow-x-auto py-2 [scrollbar-width:none] lg:flex lg:snap-none lg:overflow-visible lg:py-0 [&::-webkit-scrollbar]:hidden"
      >
        {INDICE.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            data-ir={s.id}
            aria-current={ativo === s.id ? "true" : undefined}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(s.id)?.scrollIntoView({ behavior: menos ? "auto" : "smooth", block: "start" });
            }}
            className={cx(
              "flex h-11 shrink-0 snap-start items-center justify-center rounded-control px-1 text-casa-base lg:px-3 outline-none focus-visible:[box-shadow:var(--focus)]",
              ANIMA_COR,
              ativo === s.id ? "bg-casa-tile-2 text-casa-fg lg:bg-casa-bg" : "text-casa-fg-2 hover:text-casa-fg",
            )}
          >
            {s.curto}
          </a>
        ))}
      </div>
      </div>
      <button
        type="button"
        data-instalar
        onClick={onInstalar}
        className="h-11 shrink-0 rounded-control bg-casa-cta px-4 text-casa-base font-medium text-casa-cta-fg outline-none transition-transform [transition-duration:var(--dur-press)] [transition-timing-function:var(--ease-out)] active:scale-[0.97] focus-visible:[box-shadow:var(--focus)] lg:bg-transparent lg:text-casa-fg"
      >
        {/* EXCEPTION to noise-scan/verb-per-item: é a única ação do rodapé, não uma lista de itens com o mesmo verbo */}
        Instalar
      </button>
    </nav>
  );
}

export function Instalador({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const folha = React.useRef<HTMLDivElement>(null);
  const opener = React.useRef<HTMLElement | null>(null);
  const toque = React.useRef<{ y: number; t: number; arrastou: boolean } | null>(null);
  const seq = useSequencia();
  const [marcadas, setMarcadas] = React.useState<Set<string>>(new Set(INDICE.map((s) => s.id)));
  const [customizando, setCustomizando] = React.useState(false);
  const [liberado, liberar] = useLiberado();

  /* showModal prende o foco e o Esc. O resto é nosso: travar o fundo e devolver o foco. */
  React.useEffect(() => {
    const d = ref.current;
    if (!d || !aberto) return;
    opener.current = document.activeElement as HTMLElement | null;
    if (!d.open) d.showModal();
    d.style.transform = "";
    d.style.transition = "";
    /*
     * Trava pelo gesto e não com overflow: hidden, que no celular devolvia a página
     * ao topo. O scrollY fica onde estava e nada anda atrás da folha.
     */
    const travar = (e: Event) => {
      if (e.target instanceof Node && d.contains(e.target) && d.scrollHeight > d.clientHeight) return;
      e.preventDefault();
    };
    document.addEventListener("touchmove", travar, { passive: false });
    document.addEventListener("wheel", travar, { passive: false });
    return () => {
      document.removeEventListener("touchmove", travar);
      document.removeEventListener("wheel", travar);
      if (d.open) d.close();
      opener.current?.focus();
    };
  }, [aberto]);

  /* Arrastar pra baixo de qualquer ponto da folha fecha. Toque sem arrasto segue sendo toque. */
  const pousar = (e: React.PointerEvent) => {
    toque.current = { y: e.clientY, t: performance.now(), arrastou: false };
  };
  const mover = (e: React.PointerEvent) => {
    const t = toque.current;
    const f = ref.current;
    if (!t || !f) return;
    const dy = e.clientY - t.y;
    if (!t.arrastou && dy > 8) {
      t.arrastou = true;
      folha.current?.setPointerCapture(e.pointerId);
      f.style.transition = "none";
    }
    if (t.arrastou) f.style.transform = `translateY(${Math.max(0, dy)}px)`;
  };
  const soltar = (e: React.PointerEvent) => {
    const t = toque.current;
    const f = ref.current;
    toque.current = null;
    if (!t?.arrastou || !f) return;
    const dy = e.clientY - t.y;
    const rapido = dy / Math.max(1, performance.now() - t.t) > 0.6;
    f.style.transition = "transform var(--dur-slow) var(--ease-out)";
    if (dy > 90 || rapido) {
      f.style.transform = "translateY(100%)";
      seq.depois(220, onFechar);
    } else {
      f.style.transform = "translateY(0)";
    }
  };

  /* Sempre com `--skill`: sem ele o comando instala também as de vídeo e projeto, que esta página não mostra. */
  const comando = `${BASE} --skill ${INDICE.filter((s) => marcadas.has(s.id)).map((s) => s.id).join(" ")}`;
  const { done, copy } = useCopy(comando);
  const Icone = done ? Check : Copy;

  const alternar = (id: string) =>
    setMarcadas((m) => {
      const n = new Set(m);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <dialog
      ref={ref}
      data-instalador
      aria-label="Instalar skills"
      onClose={onFechar}
      onClick={(e) => e.target === ref.current && onFechar()}
      className="casa m-0 mt-auto max-h-[88svh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-tile bg-casa-tile p-0 text-casa-fg backdrop:bg-black/60 sm:mx-auto sm:max-w-lg lg:my-auto lg:rounded-tile"
    >
      {aberto ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.base, ease: EASE_OUT }}
        >
          <div
            ref={folha}
            data-folha-instalar
            onPointerDown={pousar}
            onPointerMove={mover}
            onPointerUp={soltar}
            onPointerCancel={soltar}
            className={cx("bg-casa-tile p-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] [touch-action:none] lg:pt-4", liberado && "select-none")}
          >
          <span aria-hidden="true" className="mx-auto mb-1 block h-1 w-10 rounded-[2px] bg-casa-fg-3 lg:hidden" />
          <div className="flex items-center justify-between">
            <div className={cx("flex min-w-0 flex-wrap gap-1", !liberado && "invisible")}>
              <button
                type="button"
                data-customizar
                aria-expanded={customizando}
                onClick={() => {
                  /* Fechar a lista volta a instalar todas: o comando sempre diz o que a tela mostra. */
                  if (customizando) setMarcadas(new Set(INDICE.map((s) => s.id)));
                  setCustomizando(!customizando);
                }}
                className={cx("h-11 rounded-control px-3 text-casa-base outline-none focus-visible:[box-shadow:var(--focus)]", ANIMA_COR, customizando ? "bg-casa-tile-2 text-casa-fg" : "text-casa-fg-2 hover:text-casa-fg")}
              >
                Customizar
              </button>
            </div>
            <button type="button" aria-label="Fechar" onClick={onFechar} className="grid size-11 shrink-0 place-items-center rounded-control text-casa-fg-2 outline-none focus-visible:[box-shadow:var(--focus)]">
              <X className="size-4" />
            </button>
          </div>
          {!liberado ? (
            <div className="mt-1">
              <p className="mb-3 text-casa-lg font-medium">Deixe seu e-mail para liberar o comando.</p>
              <PedirEmail origem="instalador" onLiberar={liberar} />
            </div>
          ) : null}
          {liberado && customizando ? (
          <ul className="mt-2 grid grid-cols-2 gap-x-2">
            {INDICE.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={marcadas.has(s.id)}
                  data-marca={s.id}
                  onClick={() => alternar(s.id)}
                  className={cx(
                    "flex h-11 w-full items-center gap-2.5 rounded-control px-2 text-left text-casa-base outline-none focus-visible:[box-shadow:var(--focus)]",
                    ANIMA_COR,
                    marcadas.has(s.id) ? "text-casa-fg" : "text-casa-fg-3",
                  )}
                >
                  <span aria-hidden="true" className={cx("grid size-4 shrink-0 place-items-center rounded-[4px] border", marcadas.has(s.id) ? "border-casa-fg bg-casa-fg text-casa-bg" : "border-casa-fg-3")}>
                    {marcadas.has(s.id) ? <Check className="size-3" /> : null}
                  </span>
                  {s.curto}
                </button>
              </li>
            ))}
          </ul>
          ) : null}
          {liberado ? (
          <button
            type="button"
            data-copiar
            disabled={marcadas.size === 0}
            onClick={copy}
            className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-control bg-casa-cta px-3.5 py-2.5 text-left text-casa-cta-fg outline-none focus-visible:[box-shadow:var(--focus)] disabled:opacity-50"
          >
            <code className="min-w-0 flex-1 font-casa-mono text-casa-sm [overflow-wrap:anywhere]">{comando}</code>
            <Icone className="size-4 shrink-0" aria-label={done ? "Copiado" : "Copiar"} />
          </button>
          ) : null}
          </div>
        </motion.div>
      ) : null}
    </dialog>
  );
}
