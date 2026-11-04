/**
 * Um vazio por vez, cada um com o motivo de estar vazio.
 *
 * Vazio não é um estado só: "ainda não tem nada", "a busca não achou", "deu erro",
 * "acabou tudo" e "você não pode ver" pedem frases, artes e ações diferentes, e é
 * isso que a demo compara. Todas usam a mesma peça, sem caixa dentro do painel
 * (`framed={false}`), exceto a de primeiro uso, que é a faixa de arte com caixa.
 * Os knobs da ficha mexem no selo gerado (`EmptyArt`), onde houver.
 */

import * as React from "react";
import { Bookmark, Inbox, Lock, RefreshCw, Search, UploadCloud, WifiOff, type LucideIcon } from "lucide-react";

import { Chip } from "../../../registry/visant/ui/chip";
import { EmptyState, EmptyArt } from "../../../registry/visant/ui/empty-state";
import type { DemoProps } from "../catalog";
import { Trocador, useUmPorVez } from "./um-por-vez";

const VARIANTES = ["coleção", "primeiro uso", "busca", "soltar arquivo", "tudo em dia", "erro", "sem acesso"] as const;

/** O selo de ícone: um círculo neutro. Ícone na cor da marca é o que mais grita num vazio. */
function Selo({ icone: Icone }: { icone: LucideIcon }) {
  return (
    <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
      <Icone className="size-5" strokeWidth={1.5} aria-hidden="true" />
    </span>
  );
}

function Painel({ titulo, icone: Icone, contagem, children }: { titulo: string; icone: LucideIcon; contagem: string; children: React.ReactNode }) {
  return (
    <section className="flex w-[360px] max-w-full flex-col rounded-[var(--r-surface,0.875rem)] border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Icone className="size-4 text-muted-foreground" aria-hidden="true" />
          {titulo}
        </h3>
        <span className="text-xs tabular-nums text-muted-foreground">{contagem}</span>
      </header>
      {children}
    </section>
  );
}

function Cena({ qual, props }: { qual: (typeof VARIANTES)[number]; props: DemoProps["props"] }) {
  switch (qual) {
    case "coleção":
      return (
        <Painel titulo="Favoritos" icone={Bookmark} contagem="0">
          <EmptyState
            framed={false}
            className="px-2 py-4"
            title="Nada salvo ainda."
            art={<EmptyArt seed="favoritos-vazio" className="size-14 rounded-full border border-border" {...props} />}
            action={<Chip size="sm">Explorar o acervo</Chip>}
          >
            Marque um item e ele aparece aqui, já no ponto em que você parou.
          </EmptyState>
        </Painel>
      );
    case "primeiro uso":
      return (
        <EmptyState
          className="w-[360px] max-w-full"
          art={<EmptyArt seed="primeiro-uso-b" intensity="cheia" className="h-28" {...props} />}
          title="Comece o primeiro projeto."
          action={<Chip size="sm" pressed>Criar projeto</Chip>}
        >
          Os projetos da equipe aparecem aqui, do mais recente para o mais antigo.
        </EmptyState>
      );
    case "busca":
      return (
        <Painel titulo="Busca" icone={Search} contagem="0 de 48">
          <EmptyState framed={false} className="px-2 py-4" title="Nada com esse termo." art={<Selo icone={Search} />} action={<Chip size="sm">Limpar a busca</Chip>}>
            Tente uma palavra mais curta, ou tire um dos filtros.
          </EmptyState>
        </Painel>
      );
    case "soltar arquivo":
      return (
        // EXCEPTION to noise-scan/usage-instruction: esta frase é o próprio estado de zona de soltar que a demo mostra
        <EmptyState
          framed={false}
          className="w-[360px] max-w-full rounded-[var(--r-surface,0.875rem)] border border-dashed border-border bg-card px-4 py-6"
          title="Solte os arquivos aqui."
          art={<Selo icone={UploadCloud} />}
          action={<Chip size="sm">Escolher do computador</Chip>}
        >
          PDF, PNG ou JPG, até 20 MB cada.
        </EmptyState>
      );
    case "tudo em dia":
      return (
        <Painel titulo="Entrada" icone={Inbox} contagem="0">
          <EmptyState framed={false} className="px-2 py-4" title="Tudo em dia." art={<EmptyArt seed="entrada-dia" className="size-14 rounded-full border border-border" {...props} />}>
            Quando algo novo chegar, ele entra aqui sem você precisar atualizar.
          </EmptyState>
        </Painel>
      );
    case "erro":
      return (
        <Painel titulo="Relatório" icone={RefreshCw} contagem="—">
          <EmptyState framed={false} className="px-2 py-4" title="Não deu para carregar." art={<Selo icone={WifiOff} />} action={<Chip size="sm">Tentar de novo</Chip>}>
            A conexão caiu no meio do caminho. Nada do que você fez se perdeu.
          </EmptyState>
        </Painel>
      );
    case "sem acesso":
      return (
        <Painel titulo="Financeiro" icone={Lock} contagem="—">
          <EmptyState framed={false} className="px-2 py-4" title="Esta área é restrita." art={<Selo icone={Lock} />} action={<Chip size="sm">Pedir acesso</Chip>}>
            Quem administra o espaço recebe o pedido e responde por aqui.
          </EmptyState>
        </Painel>
      );
  }
}

export default function EmptyStateDemo({ props }: DemoProps) {
  const { atual, rodada, passo, repetir } = useUmPorVez(VARIANTES);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-2">
      <div
        key={`${atual}-${rodada}`}
        className="flex w-full justify-center animate-in fade-in-0 zoom-in-[0.98] [animation-duration:var(--dur-base,200ms)] [animation-timing-function:var(--ease-out,ease)] motion-reduce:animate-none"
      >
        <Cena qual={atual} props={props} />
      </div>
      <Trocador nome={atual} onPasso={passo} onRepetir={repetir} rotulo="variante" />
    </div>
  );
}
