"use client";

/**
 * Quatro cartões de uma pessoa só, e o detalhe que justifica abrir um: saldo e
 * os últimos movimentos. Os valores são da demo; quem consome passa o dele.
 *
 * No ladrilho do catálogo a moldura mostra só uma janela da caixa, e o cartão
 * aberto saía cortado em cima e embaixo. A demo mede essa janela e passa a altura
 * à carteira; a lista mostra as linhas que couberem inteiras.
 */

import * as React from "react";
import { ArrowDownLeft, ShoppingBasket, Users } from "lucide-react";

import { WalletStack, type WalletCard } from "../../../registry/visant/ui/wallet-stack";
import type { DemoProps } from "../catalog";

// Só o que se lê num cartão de longe: nome e final. Bandeira, titular e
// validade são dado de cartão aberto, não da pilha.
const CARTOES: WalletCard[] = [
  { id: "conta", title: "Conta", last4: "4821", tone: "brand" },
  { id: "reserva", title: "Reserva", last4: "0917", tone: "ink" },
  { id: "bilhete", title: "Transporte", last4: "3306", tone: "muted" },
  { id: "cafe", title: "Clube do café", last4: "7730", tone: "card" },
];

const SALDO: Record<string, string> = {
  conta: "R$ 3.248,60",
  reserva: "R$ 12.400,00",
  bilhete: "R$ 46,30",
  cafe: "R$ 89,90",
};

const MOVIMENTOS = [
  { icone: Users, nome: "Rafael", quando: "Racha do jantar, hoje", valor: "+R$ 36,50" },
  { icone: ShoppingBasket, nome: "Hortifruti da esquina", quando: "Mercado, ontem", valor: "-R$ 84,12" },
  { icone: ArrowDownLeft, nome: "Pagamento recebido", quando: "18 set", valor: "+R$ 2.860,00" },
];

/** Faixa do "Todos" (32) + vão (12): o que a carteira gasta acima da caixa. */
const FAIXA = 44;
const CAIXA_CHEIA = 440;

/** A altura que cabe na moldura, em px da peça. Fora de moldura, a caixa inteira. */
function useAlturaQueCabe() {
  const raiz = React.useRef<HTMLDivElement>(null);
  const [altura, setAltura] = React.useState(CAIXA_CHEIA);
  React.useLayoutEffect(() => {
    const el = raiz.current;
    const palco = el?.closest<HTMLElement>("[data-palco]");
    if (!el || !palco) return;
    const medir = () => {
      const escala = el.getBoundingClientRect().height / (el.offsetHeight || 1);
      if (!escala) return;
      const janela = palco.getBoundingClientRect().height / escala;
      setAltura(Math.max(300, Math.min(CAIXA_CHEIA, Math.floor(janela - FAIXA))));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(palco);
    // O palco mede a escala um quadro depois de montar.
    const t = setTimeout(medir, 120);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, []);
  return [raiz, altura] as const;
}

function Detalhe({ card }: { card: WalletCard }) {
  return (
    <div className="flex h-full flex-col gap-2 text-sm">
      <div className="flex shrink-0 items-baseline justify-between border-b border-border pb-2">
        <span className="text-muted-foreground">Disponível</span>
        <span className="text-xl font-medium tabular-nums text-foreground">{SALDO[card.id]}</span>
      </div>
      {/* `flex-wrap` numa coluna de altura fixa: a linha que não cabe inteira pula
          pra coluna seguinte, fora da vista. Nunca aparece linha pela metade. */}
      <ul className="flex min-h-0 flex-1 flex-col flex-wrap gap-x-4 gap-y-2 overflow-hidden">
        {MOVIMENTOS.map(({ icone: Icone, nome, quando, valor }) => (
          <li key={nome} className="flex w-full items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-[var(--r-pill)] bg-muted text-muted-foreground">
              <Icone aria-hidden="true" className="size-4" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-foreground">{nome}</span>
              <span className="block truncate text-xs text-muted-foreground">{quando}</span>
            </span>
            <span className="tabular-nums text-foreground">{valor}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function WalletStackDemo({ props }: DemoProps) {
  const [raiz, altura] = useAlturaQueCabe();
  return (
    <div ref={raiz} className="flex h-full w-full items-center justify-center p-4">
      <WalletStack cards={CARTOES} label="Cartões da Marina" height={altura} renderDetail={(c) => <Detalhe card={c} />} {...props} />
    </div>
  );
}
