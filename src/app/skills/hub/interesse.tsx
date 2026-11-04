"use client";

/**
 * O e-mail que libera o comando na página e o pedido de feedback.
 *
 * O comando continua público no GitHub e no llms.txt: isto é um pedido na porta, sem tranca. Por
 * isso, se o banco falhar, libera do mesmo jeito: instalar não pode depender de a captura funcionar.
 *
 * Sem a tabela no ar, nem pede: pedir e-mail que se perderia é pior que não pedir. Quando
 * `admin/interesse.sql` rodar, o pedido liga sozinho.
 */

import * as React from "react";
import { Check } from "lucide-react";

const CHAVE = "visant:skills-liberado";

const lerLiberado = () => {
  try {
    return localStorage.getItem(CHAVE) === "1";
  } catch {
    return false;
  }
};

const enviar = (corpo: object) =>
  fetch("/api/interesse", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corpo) });

const CAMPO =
  "h-11 w-full min-w-0 rounded-control bg-casa-tile-2 px-3.5 text-casa-base text-casa-fg outline-none placeholder:text-casa-fg-3 focus-visible:[box-shadow:var(--focus)]";
const BOTAO =
  "inline-flex h-11 shrink-0 items-center justify-center rounded-control bg-casa-cta px-5 text-casa-base font-medium text-casa-cta-fg outline-none focus-visible:[box-shadow:var(--focus)] disabled:opacity-60";

/** Lido no efeito: a página é hidratada no cliente. */
export function useLiberado() {
  const [liberado, setLiberado] = React.useState(false);
  React.useEffect(() => {
    if (lerLiberado()) {
      setLiberado(true);
      return;
    }
    let vivo = true;
    fetch("/api/interesse")
      .then((r) => (r.ok ? (r.json() as Promise<{ interesse?: boolean }>) : null))
      .then((d) => {
        if (vivo && d?.interesse === false) setLiberado(true);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);
  const liberar = React.useCallback(() => {
    try {
      localStorage.setItem(CHAVE, "1");
    } catch {
      /* Sem armazenamento: pede de novo na próxima visita. */
    }
    setLiberado(true);
  }, []);
  return [liberado, liberar] as const;
}

export function PedirEmail({ origem, onLiberar }: { origem: string; onLiberar: () => void }) {
  const [email, setEmail] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const [erro, setErro] = React.useState(false);
  const isca = React.useRef<HTMLInputElement>(null);

  const aoEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setErro(false);
    try {
      const r = await enviar({ email, origem, site: isca.current?.value });
      if (r.status === 400) {
        setErro(true);
        setEnviando(false);
        return;
      }
    } catch {
      /* Rede ou banco fora não seguram a instalação. */
    }
    onLiberar();
  };

  return (
    <form data-pedir-email onSubmit={aoEnviar} noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Seu e-mail</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="seu@email.com"
            aria-invalid={erro}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={CAMPO}
          />
        </label>
        <input ref={isca} name="site" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        <button type="submit" disabled={enviando} data-liberar className={BOTAO}>
          Liberar o comando
        </button>
      </div>
      {erro ? <p className="mt-2 text-casa-sm text-casa-fg">Confira o e-mail: esse não parece completo.</p> : null}
      <p className="mt-2 text-casa-sm text-casa-fg-2">Usamos só para falar com você sobre as skills.</p>
    </form>
  );
}

export function PedirFeedback({ origem, pergunta = "O que faltou?" }: { origem: string; pergunta?: string }) {
  const [texto, setTexto] = React.useState("");
  const [estado, setEstado] = React.useState<"escrevendo" | "enviando" | "enviado" | "erro">("escrevendo");

  if (estado === "enviado") {
    return (
      <p data-feedback-enviado className="flex items-center gap-2 text-casa-base text-casa-fg-2">
        <Check className="size-4 shrink-0" aria-hidden="true" />
        Recebido. Obrigado.
      </p>
    );
  }

  const aoEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim() || estado === "enviando") return;
    setEstado("enviando");
    try {
      const r = await enviar({ feedback: texto, origem });
      setEstado(r.ok ? "enviado" : "erro");
    } catch {
      setEstado("erro");
    }
  };

  return (
    <form data-pedir-feedback onSubmit={aoEnviar}>
      <label className="block">
        <span className="text-casa-base font-medium">{pergunta}</span>
        <textarea
          name="feedback"
          rows={3}
          maxLength={2000}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="mt-2 w-full resize-none rounded-control bg-casa-tile-2 p-3.5 text-casa-base text-casa-fg outline-none focus-visible:[box-shadow:var(--focus)]"
        />
      </label>
      <div className="mt-2 flex items-center gap-3">
        <button type="submit" disabled={!texto.trim() || estado === "enviando"} data-enviar-feedback className={BOTAO}>
          Enviar
        </button>
        {estado === "erro" ? <p className="text-casa-sm text-casa-fg">Não foi. Tente de novo.</p> : null}
      </div>
    </form>
  );
}
