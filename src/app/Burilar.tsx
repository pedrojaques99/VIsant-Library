"use client";

/**
 * /burilar: um duelo de cada vez entre duas frases, só para admin.
 *
 * Cada voto ensina a `visant-copy` (PLANO-BURILACAO.md). As rodadas moram em `burilacao/rodadas/`
 * e entram no bundle; os votos vão para `/api/burilacao`. O lado de cada frase é sorteado pelo id,
 * para a posição não votar no lugar da pessoa.
 */

import * as React from "react";
import MOTIVOS from "../../burilacao/motivos.json";
import { cx } from "./skills/hub/base";

type Opcao = { texto: string; valor?: string; real?: boolean };
type Duelo = { id: string; tipo?: "imitacao"; onde: string; dimensao?: string; a: Opcao; b: Opcao };
type Rodada = { data: string; duelos: Duelo[] };
type Estado = { login: boolean; store: boolean; admin: boolean; meus: string[] };
type Escolha = "a" | "b" | "nenhuma" | "minha";

const MODULOS = import.meta.glob<{ default: Rodada }>("../../burilacao/rodadas/*.json", { eager: true });
const RODADA = Object.values(MODULOS)
  .map((m) => m.default)
  .sort((x, y) => x.data.localeCompare(y.data))
  .slice(-1)[0];

const invertido = (id: string) => [...id].reduce((s, c) => s + c.charCodeAt(0), 0) % 2 === 1;

const ACAO = "inline-flex min-h-11 items-center justify-center rounded-control px-4 text-casa-base font-medium outline-none focus-visible:[box-shadow:var(--focus)]";

function Aviso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div data-aviso className="mx-auto max-w-xl py-16">
      <h1 className="text-[2rem] font-medium leading-tight tracking-[-0.02em]">{titulo}</h1>
      <p className="mt-3 text-casa-lg text-casa-fg-2">{children}</p>
    </div>
  );
}

export function Burilar() {
  const [estado, setEstado] = React.useState<Estado | null | "falhou">(null);
  const [feitos, setFeitos] = React.useState<string[]>([]);
  const [escolhido, setEscolhido] = React.useState<Escolha | null>(null);
  const [motivos, setMotivos] = React.useState<string[]>([]);
  const [escrevendo, setEscrevendo] = React.useState(false);
  const [frase, setFrase] = React.useState("");
  const [erro, setErro] = React.useState(false);
  const [acertos, setAcertos] = React.useState<boolean[]>([]);

  React.useEffect(() => {
    fetch("/api/burilacao", { credentials: "same-origin" })
      .then((r) => (r.ok ? (r.json() as Promise<Estado>) : Promise.reject()))
      .then((e) => {
        setEstado(e);
        setFeitos(e.meus ?? []);
      })
      .catch(() => setEstado("falhou"));
  }, []);

  const pendentes = RODADA?.duelos.filter((d: Duelo) => !feitos.includes(d.id)) ?? [];
  const duelo = pendentes[0];

  const gravar = async (corpo: { escolha: Escolha; motivos?: string[]; escrita?: string }) => {
    setErro(false);
    try {
      const r = await fetch("/api/burilacao", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ duelo: duelo.id, ...corpo }),
      });
      if (!r.ok) throw new Error();
      return true;
    } catch {
      setErro(true);
      return false;
    }
  };

  const avancar = () => {
    setFeitos((f) => [...f, duelo.id]);
    setEscolhido(null);
    setMotivos([]);
    setEscrevendo(false);
    setFrase("");
  };

  const votar = async (escolha: Escolha, escrita?: string) => {
    if (!(await gravar({ escolha, escrita }))) return;
    if (duelo.tipo === "imitacao" && (escolha === "a" || escolha === "b")) setAcertos((a) => [...a, Boolean(duelo[escolha].real)]);
    if (escolha === "a" || escolha === "b") setEscolhido(escolha);
    else avancar();
  };

  const proximo = async () => {
    if (motivos.length && escolhido && !(await gravar({ escolha: escolhido, motivos }))) return;
    avancar();
  };

  let corpo: React.ReactNode;
  if (estado === null) corpo = <div className="min-h-[60svh]" />;
  else if (estado === "falhou") corpo = <Aviso titulo="Não consegui abrir a rodada.">A API não respondeu. Recarregue daqui a pouco.</Aviso>;
  else if (!estado.admin) corpo = <Aviso titulo="Esta rota é só de admin.">Entre pelo botão Entrar, no alto da página.</Aviso>;
  else if (!estado.store) corpo = <Aviso titulo="Os votos ainda não têm onde ficar.">Falta aplicar burilacao/supabase.sql no Supabase do lab.</Aviso>;
  else if (!RODADA || !duelo) {
    const certos = acertos.filter(Boolean).length;
    corpo = (
      <Aviso titulo="Rodada feita.">
        {acertos.length ? `Você reconheceu a frase real em ${certos} de ${acertos.length}. ` : ""}
        Amanhã tem outra.
      </Aviso>
    );
  } else {
    const total = RODADA.duelos.length;
    const imitacao = duelo.tipo === "imitacao";
    const lados: ("a" | "b")[] = invertido(duelo.id) ? ["b", "a"] : ["a", "b"];

    corpo = (
      <div data-duelo={duelo.id} className="mx-auto flex min-h-[calc(100svh-9rem)] w-full max-w-5xl flex-col gap-4 py-4 lg:justify-center">
        <div>
          <p className="font-casa-mono text-casa-sm text-casa-fg-3">
            {total - pendentes.length + 1} de {total}
          </p>
          <h1 className="mt-1 text-casa-xl font-medium">{imitacao ? "Qual foi a gente que escreveu?" : "Qual soa mais como a gente?"}</h1>
          <p className="mt-1 text-casa-base text-casa-fg-2">{duelo.onde}</p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {lados.map((lado, i) => {
            const opcao = duelo[lado];
            const eleito = escolhido === lado;
            const revelar = imitacao && escolhido;
            return (
              <button
                key={lado}
                type="button"
                data-opcao={lado}
                aria-pressed={eleito}
                disabled={Boolean(escolhido) || escrevendo}
                onClick={() => void votar(lado)}
                className={cx(
                  "flex min-h-40 flex-col justify-between gap-4 rounded-tile p-5 text-left outline-none transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] focus-visible:[box-shadow:var(--focus)] lg:min-h-64 lg:p-8",
                  eleito ? "bg-casa-cta text-casa-cta-fg" : "bg-casa-tile text-casa-fg",
                  escolhido && !eleito && "text-casa-fg-3",
                )}
              >
                <span className="font-casa-mono text-casa-sm">{i === 0 ? "A" : "B"}</span>
                <span className="text-[clamp(1.5rem,3vw,2.25rem)] font-medium leading-[1.15] tracking-[-0.01em]">{opcao.texto}</span>
                {revelar ? <span className="font-casa-mono text-casa-sm" data-revelado>{opcao.real ? "Essa é nossa." : "Essa foi gerada."}</span> : null}
              </button>
            );
          })}
        </div>

        {erro ? <p role="alert" className="text-casa-base text-casa-fg">Não gravou. Tente de novo.</p> : null}

        {escolhido ? (
          <div data-depois className="flex flex-col gap-3">
            {!imitacao ? (
              <div>
                <p className="text-casa-base text-casa-fg-2">O que pesou contra a outra?</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {MOTIVOS.map((m) => {
                    const ligado = motivos.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        aria-pressed={ligado}
                        onClick={() => setMotivos((l) => (ligado ? l.filter((x) => x !== m) : [...l, m]))}
                        className={cx(ACAO, ligado ? "bg-casa-fg text-casa-bg" : "bg-casa-tile-2 text-casa-fg")}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <button type="button" data-proximo onClick={() => void proximo()} className={cx(ACAO, "min-h-14 bg-casa-cta text-casa-lg text-casa-cta-fg lg:self-end lg:px-8")}>
              Próximo
            </button>
          </div>
        ) : escrevendo ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (frase.trim()) void votar("minha", frase);
            }}
          >
            <textarea
              data-frase
              autoFocus
              rows={2}
              maxLength={280}
              value={frase}
              aria-label="Sua frase"
              onChange={(e) => setFrase(e.target.value)}
              className="w-full rounded-control bg-casa-tile p-4 text-casa-lg text-casa-fg outline-none focus-visible:[box-shadow:var(--focus)]"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={!frase.trim()} className={cx(ACAO, "flex-1 bg-casa-cta text-casa-cta-fg disabled:opacity-50 lg:flex-none")}>
                Enviar
              </button>
              <button type="button" onClick={() => setEscrevendo(false)} className={cx(ACAO, "bg-casa-tile-2 text-casa-fg")}>
                Voltar
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" data-nenhuma onClick={() => void votar("nenhuma")} className={cx(ACAO, "flex-1 bg-casa-tile-2 text-casa-fg lg:flex-none")}>
              Nenhuma das duas
            </button>
            {!imitacao ? (
              <button type="button" data-minha onClick={() => setEscrevendo(true)} className={cx(ACAO, "flex-1 bg-casa-tile-2 text-casa-fg lg:flex-none")}>
                Escrever a minha
              </button>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  return <main className="casa shell min-h-[60svh] overflow-x-clip">{corpo}</main>;
}
