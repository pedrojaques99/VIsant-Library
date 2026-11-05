"use client";

/**
 * As linhas do painel. O controle tem a forma do dado: número limitado é a própria linha
 * virando slider, cor é amostra com hex, escolha com imagem é miniatura. Toda linha tem a
 * mesma altura e a mesma ordem: rótulo à esquerda, valor à direita, unidade um tom abaixo.
 */

import * as React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { ChevronRight, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

/** Número em português: vírgula na tela, seja no tempo, seja no slider. */
export const numero = (n: number, casas = 0) => n.toFixed(casas).replace(".", ",");

/** O nome e o atalho de um botão de ícone. No toque não aparece: lá o `aria-label` e o desenho bastam. */
export function Dica({ texto, tecla, children }: { texto: string; tecla?: string; children: React.ReactNode }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="mk-dica casa" sideOffset={6}>
          {texto}
          {tecla ? <kbd>{tecla}</kbd> : null}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/* ── Pasta ─────────────────────────────────────────────────────────────── */

export function Pasta({
  titulo,
  sujo,
  onReset,
  abertaDeInicio = true,
  children,
}: {
  titulo: string;
  /** O reset só existe depois que algo aqui mudou: é sinal antes de ser ação. */
  sujo?: boolean;
  onReset?: () => void;
  abertaDeInicio?: boolean;
  children: React.ReactNode;
}) {
  const [aberta, setAberta] = React.useState(abertaDeInicio);
  // Campo opcional que ganhou conteúdo abre sozinho: escolher Close liga o foco, e o foco precisa aparecer.
  React.useEffect(() => {
    if (abertaDeInicio) setAberta(true);
  }, [abertaDeInicio]);
  return (
    <section className="mk-pasta" data-aberta={aberta || undefined}>
      <header className="mk-pasta-topo">
        <button type="button" className="mk-pasta-titulo" aria-expanded={aberta} onClick={() => setAberta(!aberta)}>
          <ChevronRight size={13} aria-hidden />
          {titulo}
        </button>
        {sujo && onReset ? (
          <Dica texto={`Restaurar ${titulo}`}>
            <button type="button" className="mk-reset" aria-label={`Restaurar ${titulo}`} onClick={onReset}>
              <RotateCcw size={12} />
            </button>
          </Dica>
        ) : null}
      </header>
      <div className="mk-pasta-corpo">
        <div>{children}</div>
      </div>
    </section>
  );
}

/* ── Linha que é slider ────────────────────────────────────────────────── */

export function Slider({
  rotulo,
  valor,
  min,
  max,
  passo = 1,
  padrao,
  unidade = "",
  casas = 0,
  onChange,
}: {
  rotulo: string;
  valor: number;
  min: number;
  max: number;
  passo?: number;
  /** Marca na trilha, e destino do duplo clique. */
  padrao?: number;
  unidade?: string;
  casas?: number;
  onChange: (v: number) => void;
}) {
  const [editando, setEditando] = React.useState(false);
  const [rascunho, setRascunho] = React.useState("");
  const gesto = React.useRef<{ x: number; y: number; v: number; ativo: boolean; toque: boolean; w: number } | null>(null);

  const prende = (n: number) => {
    const snap = Math.round(n / passo) * passo;
    return Math.min(max, Math.max(min, +snap.toFixed(4)));
  };
  const pct = (n: number) => ((n - min) / (max - min)) * 100;
  // Faixa que cruza o zero enche a partir do zero: enchido da esquerda, -50 leria como um quarto de algo.
  const origem = min < 0 && max > 0 ? pct(0) : 0;
  const atual = pct(valor);
  const texto = numero(valor, casas);

  const confirmar = () => {
    const n = Number(rascunho.replace(",", "."));
    if (Number.isFinite(n)) onChange(prende(n));
    setEditando(false);
  };

  return (
    <div
      className="mk-slider"
      role="slider"
      tabIndex={editando ? -1 : 0}
      aria-label={rotulo}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={valor}
      aria-valuetext={`${texto}${unidade}`}
      onPointerDown={(e) => {
        if (editando) return;
        const toque = e.pointerType !== "mouse";
        gesto.current = { x: e.clientX, y: e.clientY, v: valor, ativo: false, toque, w: e.currentTarget.getBoundingClientRect().width };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const g = gesto.current;
        if (!g) return;
        const dx = e.clientX - g.x;
        if (!g.ativo) {
          // O dedo diz o eixo primeiro: arrasto em pé é rolagem do painel, e o valor fica onde está.
          if (Math.abs(dx) < 4) return;
          if (g.toque && Math.abs(e.clientY - g.y) > Math.abs(dx)) {
            gesto.current = null;
            return;
          }
          g.ativo = true;
        }
        const fino = e.shiftKey ? 0.2 : 1;
        onChange(prende(g.v + (dx / g.w) * (max - min) * fino));
      }}
      onPointerUp={() => {
        const g = gesto.current;
        gesto.current = null;
        // Clique sem arrasto digita: as três entradas de um número são arrastar, digitar e setas.
        if (g && !g.ativo) {
          setRascunho(texto);
          setEditando(true);
        }
      }}
      onPointerCancel={() => (gesto.current = null)}
      onDoubleClick={() => {
        if (padrao === undefined) return;
        setEditando(false);
        onChange(padrao);
      }}
      onKeyDown={(e) => {
        if (editando) return;
        const d = (e.shiftKey ? 10 : 1) * passo;
        const alvo = ({ ArrowRight: valor + d, ArrowUp: valor + d, ArrowLeft: valor - d, ArrowDown: valor - d, Home: min, End: max } as Record<string, number>)[e.key];
        if (alvo === undefined) return;
        e.preventDefault();
        onChange(prende(alvo));
      }}
    >
      <span className="mk-slider-cheio" style={{ left: `${Math.min(origem, atual)}%`, width: `${Math.abs(atual - origem)}%` }} aria-hidden />
      {padrao !== undefined ? <span className="mk-slider-marca" style={{ left: `${pct(padrao)}%` }} aria-hidden /> : null}
      <span className="mk-rotulo">{rotulo}</span>
      {editando ? (
        <input
          className="mk-slider-campo"
          autoFocus
          inputMode="decimal"
          aria-label={`Valor de ${rotulo}`}
          value={rascunho}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setRascunho(e.target.value)}
          onBlur={confirmar}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmar();
            if (e.key === "Escape") setEditando(false);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="mk-valor">
          {texto}
          <i>{unidade}</i>
        </span>
      )}
    </div>
  );
}

/* ── Escolha entre poucos ──────────────────────────────────────────────── */

export function Segmentos<T extends string>({
  rotulo,
  valor,
  opcoes,
  onChange,
}: {
  rotulo: string;
  valor: T;
  opcoes: { valor: T; nome: string; desligada?: boolean }[];
  onChange: (v: T) => void;
}) {
  const i = Math.max(0, opcoes.findIndex((o) => o.valor === valor));
  return (
    <div className="mk-seg" role="radiogroup" aria-label={rotulo} style={{ "--n": opcoes.length, "--i": i } as React.CSSProperties}>
      <span className="mk-seg-luz" aria-hidden />
      {opcoes.map((o) => (
        <button key={o.valor} type="button" role="radio" aria-checked={o.valor === valor} disabled={o.desligada} onClick={() => onChange(o.valor)}>
          {o.nome}
        </button>
      ))}
    </div>
  );
}

/* ── Miniaturas ────────────────────────────────────────────────────────── */

export function Miniaturas({ rotulo, colunas = 3, children }: { rotulo: string; colunas?: number; children: React.ReactNode }) {
  return (
    <div className="mk-minis" role="radiogroup" aria-label={rotulo} style={{ "--colunas": colunas } as React.CSSProperties}>
      {children}
    </div>
  );
}

export function Miniatura({ nome, ativa, onClick, children }: { nome: string; ativa: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="mk-mini" role="radio" aria-checked={ativa} aria-label={nome} onClick={onClick}>
      <span className="mk-mini-arte">{children}</span>
      <span className="mk-mini-nome">{nome}</span>
    </button>
  );
}

/** O aparelho em miniatura: a pose se lê sem ler o nome. */
export function FoneMini({ rot, classe, modelo = "phone", arte }: { rot?: { x: number; y: number; z: number }; classe?: string; modelo?: "phone" | "tablet" | "laptop"; arte?: string }) {
  return (
    <span className="mk-fone-palco" aria-hidden>
      <span
        className={cn("mk-fone", classe)}
        data-modelo={modelo}
        data-com-arte={arte ? true : undefined}
        style={{
          transform: rot ? `rotateX(${rot.x}deg) rotateY(${rot.y}deg) rotateZ(${rot.z}deg)` : undefined,
          backgroundImage: arte ? `url(${arte})` : undefined,
        }}
      />
    </span>
  );
}

/** Onde o foco cai: a tela do aparelho em miniatura, e o ponto se arrasta sobre ela. `raio` é sobre a largura da tela. */
export function Alvo({
  rotulo,
  x,
  y,
  aspecto,
  raio,
  arte,
  onChange,
}: {
  rotulo: string;
  x: number;
  y: number;
  aspecto: number;
  raio: number;
  arte?: string;
  onChange: (x: number, y: number) => void;
}) {
  const prende = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const seguir = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onChange(prende(((e.clientX - r.left) / r.width) * 100), prende(((e.clientY - r.top) / r.height) * 100));
  };
  return (
    <div
      className="mk-alvo"
      role="slider"
      tabIndex={0}
      aria-label={rotulo}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={x}
      aria-valuetext={`${x}% na horizontal, ${y}% na vertical`}
      // Sem conteúdo em fluxo a largura precisa vir de fora: a miniatura cabe no painel e nunca passa de 11rem de altura.
      style={{ aspectRatio: String(aspecto), width: `min(100%, calc(11rem * ${aspecto}))` }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        seguir(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) seguir(e);
      }}
      onKeyDown={(e) => {
        const d = e.shiftKey ? 10 : 2;
        const seta = ({ ArrowRight: [d, 0], ArrowLeft: [-d, 0], ArrowDown: [0, d], ArrowUp: [0, -d] } as Record<string, number[]>)[e.key];
        if (!seta) return;
        e.preventDefault();
        onChange(prende(x + seta[0]), prende(y + seta[1]));
      }}
    >
      {arte ? <img src={arte} alt="" className="mk-arte-img" draggable={false} /> : null}
      <span className="mk-alvo-ponto" style={{ left: `${x}%`, top: `${y}%`, width: `${raio * 200}%` }} aria-hidden />
    </div>
  );
}

/* ── Cor ───────────────────────────────────────────────────────────────── */

const HEX = /^#?[0-9a-f]{6}$/i;

export function Amostras({ rotulo, valor, cores, onChange }: { rotulo: string; valor: string; cores: string[]; onChange: (c: string) => void }) {
  return (
    <div className="mk-amostras" role="radiogroup" aria-label={rotulo}>
      {cores.map((c) => (
        <button key={c} type="button" role="radio" aria-checked={valor.toUpperCase() === c.toUpperCase()} aria-label={c} style={{ background: c }} onClick={() => onChange(c)} />
      ))}
    </div>
  );
}

export function CampoCor({ rotulo, valor, onChange }: { rotulo: string; valor: string; onChange: (c: string) => void }) {
  const [texto, setTexto] = React.useState(valor);
  React.useEffect(() => setTexto(valor), [valor]);
  return (
    <div className="mk-linha mk-cor">
      <span className="mk-rotulo">{rotulo}</span>
      <input
        className="mk-cor-hex"
        aria-label={`${rotulo} em hexadecimal`}
        spellCheck={false}
        value={texto}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          setTexto(e.target.value);
          if (HEX.test(e.target.value)) onChange(`#${e.target.value.replace("#", "").toUpperCase()}`);
        }}
        onBlur={() => setTexto(valor)}
      />
      <label className="mk-cor-poco" style={{ background: valor }}>
        <span className="sr-only">Escolher {rotulo}</span>
        <input type="color" value={valor} onChange={(e) => onChange(e.target.value.toUpperCase())} />
      </label>
    </div>
  );
}

/* ── Vetor: um valor com partes ────────────────────────────────────────── */

export function Vetor({
  rotulo,
  partes,
}: {
  rotulo: string;
  partes: { letra: string; valor: number; min: number; max: number; unidade?: string; onChange: (v: number) => void }[];
}) {
  return (
    <div className="mk-vetor" role="group" aria-label={rotulo}>
      {partes.map((p) => (
        <Parte key={p.letra} {...p} rotulo={rotulo} />
      ))}
    </div>
  );
}

function Parte({ letra, valor, min, max, unidade = "", onChange, rotulo }: { letra: string; valor: number; min: number; max: number; unidade?: string; onChange: (v: number) => void; rotulo: string }) {
  const [texto, setTexto] = React.useState<string | null>(null);
  const gesto = React.useRef<{ x: number; v: number } | null>(null);
  const prende = (n: number) => Math.min(max, Math.max(min, Math.round(n)));
  return (
    <label className="mk-parte">
      <span
        className="mk-parte-letra"
        onPointerDown={(e) => {
          gesto.current = { x: e.clientX, v: valor };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (gesto.current) onChange(prende(gesto.current.v + (e.clientX - gesto.current.x) * 0.5));
        }}
        onPointerUp={() => (gesto.current = null)}
        onPointerCancel={() => (gesto.current = null)}
      >
        {letra}
      </span>
      <input
        inputMode="numeric"
        aria-label={`${rotulo} ${letra}`}
        value={texto ?? `${valor}${unidade}`}
        onFocus={(e) => {
          setTexto(String(valor));
          requestAnimationFrame(() => e.target.select());
        }}
        onChange={(e) => {
          setTexto(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value !== "" && Number.isFinite(n)) onChange(prende(n));
        }}
        onBlur={() => setTexto(null)}
        onKeyDown={(e) => {
          if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
          e.preventDefault();
          const n = prende(valor + (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? 10 : 1));
          onChange(n);
          setTexto(String(n));
        }}
      />
    </label>
  );
}
