"use client";

/**
 * A ficha de um projeto, onde cada valor abre o campo certo no próprio lugar:
 * texto, lista ou número. A linha não pula e o vizinho não se mexe. As setas
 * trocam a resposta do servidor: é na falha que a peça se paga, porque o valor
 * só troca depois que a promessa resolve, e o que foi digitado continua no campo.
 */

import * as React from "react";

import { InlineEdit } from "../../../registry/visant/ui/inline-edit";
import type { DemoProps } from "../catalog";
import { Trocador, useUmPorVez } from "./um-por-vez";

const RESPOSTAS = ["salva", "demora", "falha"] as const;
const ESPERA = { salva: 500, demora: 2000, falha: 900 };
const STATUS = ["Rascunho", "Em revisão", "Aprovado"];

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
const brl = (v: string) => `R$ ${Number(v).toLocaleString("pt-BR")}`;

const CAMPO =
  "h-[var(--ie-h)] w-full min-w-0 rounded-[var(--r-control,0.5rem)] border border-border bg-background px-1.5 outline-none focus-visible:[box-shadow:var(--focus)]";
const TITULO = "text-2xl font-semibold tracking-tight";
const LINHA = "text-sm pointer-coarse:text-base";
const ROTULO = "w-14 shrink-0 pl-1.5 text-sm text-muted-foreground";

type Id = "nome" | "status" | "verba";

export default function InlineEditDemo({ props }: DemoProps) {
  const { atual, passo, repetir } = useUmPorVez(RESPOSTAS);
  const [valores, setValores] = React.useState<Record<Id, string>>({
    nome: "Lançamento de inverno",
    status: "Em revisão",
    verba: "12000",
  });
  const [aberto, setAberto] = React.useState<Id | null>(null);
  const [rascunho, setRascunho] = React.useState("");
  const [falhou, setFalhou] = React.useState(false);

  function campo(id: Id, leitura: React.ReactNode, editor: React.ReactNode) {
    return (
      <InlineEdit
        className="min-w-0 flex-1 [--ie-h:2.75rem]"
        showButtons
        {...props}
        isEditing={aberto === id}
        value={leitura}
        onStartEdit={() => {
          setRascunho(valores[id]);
          setFalhou(false);
          setAberto(id);
        }}
        onSave={async () => {
          setFalhou(false);
          await espera(ESPERA[atual]);
          if (atual === "falha") {
            setFalhou(true);
            throw new Error("O servidor recusou");
          }
          const limpo = rascunho.trim();
          if (limpo) setValores((v) => ({ ...v, [id]: limpo }));
          setAberto(null);
        }}
        onCancel={() => {
          setFalhou(false);
          setAberto(null);
        }}
      >
        {editor}
      </InlineEdit>
    );
  }

  const aoMudar = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setRascunho(e.target.value);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6">
      <div className="flex w-[360px] max-w-full flex-col text-foreground">
        <div className="flex">
          {campo(
            "nome",
            <span className={TITULO}>{valores.nome}</span>,
            <input
              autoFocus
              aria-label="Nome do projeto"
              value={rascunho}
              onChange={aoMudar}
              onFocus={(e) => e.currentTarget.select()}
              className={`${CAMPO} ${TITULO}`}
            />,
          )}
        </div>
        <div className="flex items-center">
          <span className={ROTULO}>Status</span>
          {campo(
            "status",
            <span className={LINHA}>{valores.status}</span>,
            <select autoFocus aria-label="Status" value={rascunho} onChange={aoMudar} className={`${CAMPO} ${LINHA}`}>
              {STATUS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>,
          )}
        </div>
        <div className="flex items-center">
          <span className={ROTULO}>Verba</span>
          {campo(
            "verba",
            <span className={`${LINHA} tabular-nums`}>{brl(valores.verba)}</span>,
            <input
              autoFocus
              aria-label="Verba em reais"
              type="number"
              inputMode="numeric"
              min={0}
              step={100}
              value={rascunho}
              onChange={aoMudar}
              className={`${CAMPO} ${LINHA} tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
            />,
          )}
        </div>
        <p role="status" className="h-5 px-1.5 text-sm text-muted-foreground">
          {falhou ? "Não salvou. Tente de novo ou cancele." : ""}
        </p>
      </div>
      <Trocador nome={atual} onPasso={passo} onRepetir={repetir} rotulo="resposta" />
    </div>
  );
}
