/**
 * A porta pro agente, na dobra: uma pílula com os logos empilhados.
 *
 * Com `onAbrir`, são dois gestos num corpo só: o texto abre o painel e o ícone do fim copia
 * direto, pra quem já sabe o que quer. São dois botões irmãos, não um dentro do outro.
 * Sem `onAbrir`, a pílula inteira copia: um toque e está pronto pra colar. Quem precisa de um passo
 * antes de copiar passa `onToque` e `feito`, e a cópia fica por conta de quem chamou.
 */

import { Check, Copy } from "lucide-react";
import { siClaude, siCursor, siOpenai } from "simple-icons";
import { cn } from "@/lib/utils";
import { LogoAgente } from "./conectar-sinal";
import { useCopy } from "./copy-command";

const AGENTES = [siClaude, siOpenai, siCursor];
const FOCO = "focus-visible:outline-none focus-visible:[box-shadow:var(--focus)] transition-colors [transition-duration:var(--dur-fast)]";

function Logos() {
  return (
    <span className="flex" aria-hidden>
      {AGENTES.map((icone, i) => (
        <span
          key={icone.slug}
          className={cn(
            // casa-lint/pilula: o selo do agente é um círculo de verdade
            "grid size-7 place-items-center rounded-full border border-casa-line bg-casa-bg text-casa-fg",
            i > 0 && "-ml-2",
          )}
        >
          <LogoAgente icone={icone} />
        </span>
      ))}
    </span>
  );
}

export function PilulaAgente({
  comando,
  rotulo,
  copiado = "Copiado",
  onAbrir,
  onToque,
  feito,
}: {
  comando: string;
  rotulo: string;
  /** O que a pílula diz depois do toque, quando ela inteira copia. */
  copiado?: string;
  onAbrir?: () => void;
  onToque?: () => void;
  feito?: boolean;
}) {
  const proprio = useCopy(comando);
  const done = feito ?? proprio.done;
  const copy = proprio.copy;
  const Icon = done ? Check : Copy;

  if (!onAbrir) {
    return (
      <button
        type="button"
        data-copiar-agente
        onClick={onToque ?? copy}
        title={comando}
        // casa-lint/pilula: a pílula é o pedido do dono (referência de onboarding de agente), não chip genérico
        className={cn("inline-flex h-11 w-fit shrink-0 items-center gap-2.5 rounded-full bg-casa-cta pl-2 pr-4 text-casa-base font-medium text-casa-cta-fg hover:opacity-90", FOCO)}
      >
        <Logos />
        <span aria-live="polite">{done ? copiado : rotulo}</span>
        <Icon className="size-4" aria-hidden />
      </button>
    );
  }

  return (
    // casa-lint/pilula: a pílula é o pedido do dono (referência de onboarding de agente), não chip genérico
    <div className="inline-flex w-fit shrink-0 items-center rounded-full border border-casa-line bg-casa-tile p-1 text-casa-fg">
      <button
        type="button"
        onClick={onAbrir}
        // casa-lint/pilula: o alvo de foco acompanha a pílula
        className={cn("flex items-center gap-2.5 rounded-full py-0.5 pl-0.5 pr-2 hover:text-casa-fg-2 pointer-coarse:min-h-11", FOCO)}
      >
        <Logos />
        <span className="text-sm font-medium">{rotulo}</span>
      </button>
      <button
        type="button"
        onClick={copy}
        aria-label={done ? "Comando copiado" : `Copiar: ${comando}`}
        title={comando}
        // casa-lint/pilula: o alvo de foco do ícone é um círculo, dentro da pílula
        className={cn("grid size-7 place-items-center rounded-full text-casa-fg-2 hover:text-casa-fg pointer-coarse:size-11", FOCO)}
      >
        <Icon className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
