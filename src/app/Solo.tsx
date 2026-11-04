"use client";

/**
 * Modo solo: uma demo, um documento, nenhuma casca.
 *
 * Existe por um motivo só, e ele é uma correção de honestidade da vitrine.
 *
 * O preset de viewport da ficha de foco **mentia**. Ele desenhava a peça no
 * tamanho declarado e aplicava `scale` para caber em 360px — o que muda o
 * tamanho na tela e **não muda nada para o CSS**. Media query lê o viewport, não
 * o container: com a janela em 1440, `sm:` continua valendo dentro do "celular".
 * Prova do estrago: no preset de 360 a barra do `cta-surface` não empilhava, e o
 * título espremia em cinco linhas ao lado do botão. A peça estava certa; o palco
 * é que não testava.
 *
 * A única forma de um breakpoint valer de verdade é um viewport de verdade —
 * ou seja, um iframe. Esta rota (`/c/<nome>?solo=1`) é o que roda dentro dele:
 * mesmo bundle, mesmo CSS, mesmo componente, viewport próprio.
 *
 * Duas coisas que o solo faz e a ficha não teria como fazer sozinha:
 *
 * - **Devolve a própria altura** por `postMessage`. Sem isso o pai teria de
 *   chutar a altura do iframe, e chute de altura foi exatamente o que produziu
 *   os palcos com um terço de vazio na versão anterior da vitrine.
 * - **Herda a marca e o tema do pai** por query (`?brand=`, `?dark=1`). Um
 *   iframe é outro documento: sem isso a peça apareceria na marca padrão
 *   enquanto o resto da tela está em outra, e a vitrine passaria a mentir num
 *   segundo lugar depois de parar de mentir no primeiro.
 */

import * as React from "react";
import { CATALOG, previewOf, sangra } from "./catalog";
import { CAIXA_DO_PALCO } from "./stage";

/** O pai escuta por este nome; mudar aqui quebra a medição do iframe. */
export const MSG_ALTURA = "visant:solo:altura";

/**
 * O pai manda por este nome os valores dos knobs.
 *
 * Podia ir tudo pela URL, e a primeira versão foi assim — mas mudar a query
 * recarrega o iframe, e recarregar a cada quadro de um slider transforma o
 * controle numa apresentação de slides. A query entra uma vez, no primeiro
 * paint (é o que faz um link com knobs configurados abrir configurado); daí em
 * diante quem fala é o `postMessage`.
 */
export const MSG_PROPS = "visant:solo:props";

/**
 * A peça manda por este nome o valor que a mão mudou: o caminho inverso de `MSG_PROPS`.
 *
 * Sem ele, o painel da ficha ficava com o valor antigo nos modos celular e tablet.
 */
export const MSG_KNOB = "visant:solo:knob";

/** `?p={"gap":32}` — o estado inicial dos knobs, pra link compartilhado abrir igual. */
export function propsDaQuery(params: URLSearchParams): Record<string, unknown> {
  const bruto = params.get("p");
  if (!bruto) return {};
  try {
    const lido = JSON.parse(decodeURIComponent(bruto));
    // Só objeto raso de valores primitivos: aceitar qualquer JSON aqui seria
    // deixar a URL montar as props de um componente.
    if (!lido || typeof lido !== "object" || Array.isArray(lido)) return {};
    return Object.fromEntries(
      Object.entries(lido).filter(([, v]) => ["string", "number", "boolean"].includes(typeof v)),
    );
  } catch {
    return {};
  }
}

export function Solo({
  name,
  props: iniciais,
  caixa = false,
}: {
  name: string;
  props?: Record<string, unknown>;
  /**
   * `?caixa=1`: a peça na caixa `w×h` do palco, no canto, sem fundo.
   *
   * É o enquadramento da captura (`npm run build:shots`). O ladrilho da grade
   * mostra a foto dentro do MESMO `PalcoFixo` que depois monta a peça viva —
   * então a foto precisa ter exatamente a geometria daquela caixa. Fotografada
   * no viewport solto, recortada no conteúdo e encaixada com `object-contain`,
   * ela tinha outra escala e outro centro, e o hover dava um pulo.
   *
   * Sem fundo pelo mesmo motivo: a foto sai na marca padrão, e o ladrilho veste
   * a marca escolhida. Transparente, a foto herda o chão da marca atual.
   */
  caixa?: boolean;
}) {
  const item = CATALOG.find((i) => i.name === name);
  const Demo = item?.demo;
  const ref = React.useRef<HTMLDivElement>(null);
  const [props, setProps] = React.useState<Record<string, unknown>>(iniciais ?? {});

  React.useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return;
    const ouvir = (e: MessageEvent) => {
      // `e.origin` não é checado de propósito: o pai e o iframe são o MESMO
      // documento servido do mesmo host, e o conteúdo aceito é filtrado abaixo
      // — só chave de prop e valor primitivo entram.
      if (e.data?.type !== MSG_PROPS || e.data?.name !== name) return;
      const recebido = e.data.props;
      if (!recebido || typeof recebido !== "object") return;
      setProps(
        Object.fromEntries(
          Object.entries(recebido).filter(([, v]) =>
            ["string", "number", "boolean"].includes(typeof v),
          ),
        ),
      );
    };
    window.addEventListener("message", ouvir);
    return () => window.removeEventListener("message", ouvir);
  }, [name]);

  /*
   * A mão mudou a peça. Grava aqui também: restaurar só faz efeito se `props` sabe do
   * valor. Valor igual ao que já está em `props` veio do painel e não volta para ele.
   */
  const atuais = React.useRef(props);
  atuais.current = props;
  const avisarPai = React.useCallback(
    (prop: string, valor: string | number | boolean) => {
      if (typeof window === "undefined" || window.parent === window) return;
      if (atuais.current[prop] === valor) return;
      atuais.current = { ...atuais.current, [prop]: valor };
      setProps(atuais.current);
      window.parent.postMessage({ type: MSG_KNOB, name, prop, valor }, window.location.origin);
    },
    [name],
  );

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined" || window.parent === window) return;

    const avisar = () => {
      // `scrollHeight` do conteúdo, não do documento: o `<body>` pode ter margem
      // e altura mínima que não têm nada a ver com a peça.
      window.parent.postMessage({ type: MSG_ALTURA, name, altura: el.scrollHeight }, "*");
    };

    avisar();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(avisar) : null;
    ro?.observe(el);
    // Fonte que chega depois muda a altura do texto; sem este segundo aviso o
    // iframe fica com a altura de antes da fonte carregar.
    const t = setTimeout(avisar, 600);
    return () => {
      ro?.disconnect();
      clearTimeout(t);
    };
  }, [name]);

  if (!Demo) {
    return (
      <div className="p-6 text-corpo text-muted-foreground">
        <span className="font-mono">{name}</span> não tem demo.
      </div>
    );
  }

  if (caixa) {
    const { w, h } = previewOf(item!);
    return (
      <div data-caixa style={{ width: w, height: h, position: "relative", ...CAIXA_DO_PALCO }}>
        <React.Suspense fallback={null}>
          <Demo props={props} />
        </React.Suspense>
      </div>
    );
  }

  return (
    // `overflow-x-clip`: o viewport do preset nunca rola de lado, mesmo com peça que
    // sangra de propósito (a fita do marquee).
    <div ref={ref} className={sangra(item!) ? "h-svh overflow-hidden" : "flex min-h-svh flex-col justify-center overflow-x-clip p-4"}>
      {/* A demo é um `React.lazy`. Sem esta fronteira o documento do iframe
          suspende inteiro e o pai mede altura zero. */}
      <React.Suspense fallback={<div className="h-40 w-full animate-pulse bg-muted/40" />}>
        <Demo props={props} onKnob={avisarPai} />
      </React.Suspense>
    </div>
  );
}

/**
 * O fundo do solo, por query (`?bg=%23ffffff`).
 *
 * A peça normalmente senta no `--background` do tema — que na marca da casa é um
 * papel quente, não branco puro. Só que ela vai ser instalada em site de cliente
 * com fundo branco de verdade, e é lá que um texto claro demais ou uma borda de
 * 4% de contraste some. Poder forçar a cor do fundo é o que transforma "acho que
 * funciona no branco" em teste.
 */
export function fundoDoSolo(params: URLSearchParams): string | undefined {
  const bg = params.get("bg");
  // Só cor literal: aceitar qualquer string aqui seria deixar a URL escrever CSS.
  return bg && /^#[0-9a-fA-F]{3,8}$/.test(bg) ? bg : undefined;
}

/** A rota `?solo=1` inteira: a casca não sabe nada de peça, e por isso nem o catálogo baixa. */
export function RotaSolo({ params }: { params: URLSearchParams }) {
  const nome = decodeURIComponent(window.location.pathname.split("/").filter(Boolean)[1] ?? "");
  const fundo = fundoDoSolo(params);
  if (params.get("caixa") === "1") {
    // A captura no enquadramento do palco: sem fundo nenhum, nem o da casa.
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    return (
      <div className="palco" style={{ background: "transparent" }}>
        <Solo name={nome} props={propsDaQuery(params)} caixa />
      </div>
    );
  }
  return (
    <div
      className={fundo ? "text-foreground" : "bg-background text-foreground"}
      style={{ fontFamily: "var(--font-sans, ui-sans-serif, system-ui)", background: fundo }}
    >
      <Solo name={nome} props={propsDaQuery(params)} />
    </div>
  );
}
