"use client";

/**
 * A ficha de um item — uma PÁGINA, não um diálogo.
 *
 * O card da grade responde "isso existe?". Ele não responde "isso serve pro meu
 * caso?" — pra isso a pessoa precisa *usar* a peça: arrastar o knob, largar um
 * card no board, ver o que acontece a 360px de largura. É o que esta vista faz.
 *
 * ── Por que é página, e não modal ──────────────────────────────────────────
 *
 * Ela nasceu como `Dialog` do Radix. Como página, `/c/<item>` tem o scroll do
 * documento (o modal tinha o seu, e a roda do mouse parava na borda), a grade
 * atrás deixa de ficar montada gastando CPU, e o endereço passa a ser um lugar
 * de verdade em vez de um estado por cima de outro lugar.
 *
 * O desenho é o do painel do Bench: um palco grande no fundo da marca, e uma
 * coluna de 340px da casa com nome, uma frase, os controles e as duas ações —
 * o destaque único é o comando de instalar.
 *
 * No celular a ordem é outra, porque quem abre decide em uma dobra: nome, palco
 * e comando sem rolar; controles, frase e pacotes depois. O palco tem altura de
 * tela (e a peça cabe nele inteira), e com controles ele gruda sob o cabeçalho:
 * mexer no slider sem ver o que ele muda é mexer no escuro. A ordem é só CSS: o
 * painel vira `display: contents` e cada parte ganha o seu `order`.
 *
 * O que se perde: `Esc` deixa de ser "fechar" e vira "voltar pra categoria" —
 * mesmo destino, outro nome. As setas continuam percorrendo, só que agora
 * trocando de rota, o que dá histórico de navegador de graça.
 *
 * Duas coisas que ficam:
 *
 * - **Presets de viewport.** A pergunta que mais aparece sobre um componente de
 *   library é se ele aguenta o celular. Aqui a resposta é um clique, não um
 *   devtools — e a peça é escalada, nunca cortada, quando o preset não cabe.
 * - **A rota é decidida pelo App.** Esta vista não conhece a URL: recebe o item
 *   e devolve eventos.
 */

import * as React from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  Copy,
  ListTree,
  Monitor,
  Smartphone,
  Tablet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FitStage, PalcoFixo, useElementWidth } from "./stage";
import { MSG_ALTURA, MSG_PROPS } from "./Solo";
import {
  Customize,
  controlesDe,
  snippetDeUso,
  useKnobs,
  type Controle,
  type ValorDeKnob,
} from "./controls";
import { useBrandTheme } from "@/lib/brand-theme";
import { previewOf, stageSurfaceOf, type CatalogItem } from "./catalog";
import { useCopy } from "./copy-command";
import { Instalar } from "./instalar";
import { CopiarPraIA } from "./copiar-pra-ia";
import { DepResumo } from "./dep-badges";
import { CodigoDoItem, TabelaDeProps } from "./ItemDocs";
import { Codigo } from "./codigo";
import { BugButton } from "./bug-report";
import { Avaliacao } from "./avaliacao";

/** Larguras de teste. `0` = o que couber na tela. */
const VIEWPORTS = [
  { value: "sm" as const, px: 360, icon: Smartphone, ariaLabel: "Largura de celular (360px)" },
  { value: "md" as const, px: 768, icon: Tablet, ariaLabel: "Largura de tablet (768px)" },
  { value: "full" as const, px: 0, icon: Monitor, ariaLabel: "Largura cheia" },
];

type ViewportKey = (typeof VIEWPORTS)[number]["value"];

/**
 * As três perguntas que se faz sobre um item, na ordem em que se fazem: como é,
 * como se escreve, o que aceita.
 */
const ABAS = [
  { value: "demo" as const, rotulo: "Peça", icon: Box },
  { value: "codigo" as const, rotulo: "Código", icon: Code2 },
  { value: "props" as const, rotulo: "Props", icon: ListTree },
];

type Aba = (typeof ABAS)[number]["value"];

/** Altura mínima do palco em foco: abaixo disso a peça encosta nas bordas. */
const MIN_STAGE_H = 340;

/* Sem coluna ao lado, a ficha é uma pilha: é aqui que o palco fica compacto. */
const SEM_COLUNA = "(max-width: 1023px)";
const assinarColuna = (avisar: () => void) => {
  const mq = window.matchMedia(SEM_COLUNA);
  mq.addEventListener("change", avisar);
  return () => mq.removeEventListener("change", avisar);
};
const useSemColuna = () =>
  React.useSyncExternalStore(assinarColuna, () => window.matchMedia(SEM_COLUNA).matches, () => false);

/**
 * O palco da pilha: a caixa tem altura de tela e a peça cabe nela inteira.
 *
 * A altura declarada no catálogo é a do desktop, e o kanban que empilha no celular
 * ocupa menos que ela. Então a escala sai do que a peça desenhou, medido nos
 * primeiros instantes e depois fechado: acompanhar para sempre faria o palco
 * pulsar a cada frase de um ticker.
 */
function PalcoDaPilha({ w, h, children }: { w: number; h: number; children: React.ReactNode }) {
  const caixa = React.useRef<HTMLDivElement>(null);
  const [tela, setTela] = React.useState({ w: 0, h: 0 });
  const [peca, setPeca] = React.useState({ w, h });

  React.useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTela({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    const miolo = caixa.current?.querySelector("[data-palco] > div");
    if (!miolo) return;
    const medir = () => {
      let altura = 0;
      let largura = w;
      for (const filho of Array.from(miolo.children) as HTMLElement[]) {
        altura = Math.max(altura, filho.offsetHeight);
        largura = Math.max(largura, filho.scrollWidth);
      }
      if (altura) setPeca({ w: largura, h: altura });
    };
    const ro = new ResizeObserver(medir);
    let fim: ReturnType<typeof setTimeout> | undefined;
    const armar = () => {
      ro.disconnect();
      for (const filho of Array.from(miolo.children)) ro.observe(filho);
      medir();
      fim ??= miolo.children.length ? setTimeout(soltar, 900) : undefined;
    };
    const mo = new MutationObserver(armar);
    const soltar = () => {
      ro.disconnect();
      mo.disconnect();
    };
    mo.observe(miolo, { childList: true });
    armar();
    return () => {
      clearTimeout(fim);
      soltar();
    };
  }, [w]);

  return (
    <div ref={caixa} className="h-full w-full">
      {tela.h ? (
        <PalcoFixo w={peca.w} h={peca.h} ratio={tela.w / tela.h}>
          {children}
        </PalcoFixo>
      ) : null}
    </div>
  );
}

/**
 * A peça rodando num viewport de verdade.
 *
 * O iframe carrega a MESMA aplicação em `?solo=1` — mesmo bundle, mesmo CSS,
 * mesmo componente. Não é um preview reimplementado: é a peça, num documento com
 * a largura do preset, que é a única condição em que uma media query diz a
 * verdade.
 *
 * A altura vem de dentro por `postMessage`. Chutar altura de iframe é como
 * chutar altura de palco — foi o que encheu a vitrine antiga de vazio.
 */
function SoloFrame({
  item,
  largura,
  escala,
  alturaMinima,
  props,
}: {
  item: CatalogItem;
  largura: number;
  escala: number;
  alturaMinima: number;
  /** Os valores dos knobs. Entram na query no primeiro paint e por mensagem depois. */
  props: Record<string, ValorDeKnob>;
}) {
  const [altura, setAltura] = React.useState(alturaMinima);
  const { brand } = useBrandTheme();
  const frame = React.useRef<HTMLIFrameElement>(null);

  /*
   * A primeira carga leva os knobs na query; as seguintes vão por mensagem.
   *
   * `propsIniciais` é congelado por item de propósito: se a query acompanhasse
   * cada mexida do slider, o `src` mudaria e o iframe recarregaria a cada quadro
   * — o controle viraria apresentação de slides. A query serve pra abrir
   * configurado (link compartilhado, `←`/`→` entre itens), não pra transmitir.
   */
  const propsIniciais = React.useMemo(() => props, [item.name]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    frame.current?.contentWindow?.postMessage(
      { type: MSG_PROPS, name: item.name, props },
      window.location.origin,
    );
  }, [props, item.name]);

  React.useEffect(() => {
    const ouvir = (e: MessageEvent) => {
      // Só a nossa mensagem, e só deste item: a vitrine pode ter outro iframe.
      if (e.origin !== window.location.origin) return;
      const d = e.data as { type?: string; name?: string; altura?: number };
      if (d?.type !== MSG_ALTURA || d.name !== item.name || !d.altura) return;
      setAltura(Math.max(alturaMinima, d.altura));
    };
    window.addEventListener("message", ouvir);
    return () => window.removeEventListener("message", ouvir);
  }, [item.name, alturaMinima]);

  const escuro = document.documentElement.classList.contains("dark");
  const query = new URLSearchParams({ solo: "1" });
  // `slug`, que é como o provider procura a marca — passar o id faria o iframe
  // cair na marca padrão e a peça aparecer fora da marca do resto da tela.
  if (brand?.slug) query.set("brand", brand.slug);
  if (escuro) query.set("dark", "1");
  if (Object.keys(propsIniciais).length) query.set("p", JSON.stringify(propsIniciais));

  return (
    <div
      className="overflow-hidden rounded-control"
      // A caixa encolhe junto com a escala, senão sobra um buraco do tamanho da
      // diferença embaixo da peça.
      style={{ width: largura * escala, height: altura * escala }}
    >
      <iframe
        ref={frame}
        // A chave amarra o iframe ao item: trocar de peça com `←`/`→` recarrega
        // o documento em vez de reaproveitar o anterior e piscar o conteúdo velho.
        key={item.name}
        title={`${item.name} em ${largura}px`}
        src={`/c/${encodeURIComponent(item.name)}?${query}`}
        style={{
          width: largura,
          height: altura,
          border: 0,
          transform: `scale(${escala})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

/**
 * O código que escreve a peça do jeito que ela está no palco agora.
 *
 * É a diferença entre uma vitrine e um catálogo: a pessoa mexeu até chegar no
 * que queria, e a linha pra colar no projeto já está pronta — sem traduzir de
 * cabeça três knobs em três props. Só o que fugiu do padrão aparece. Mora no
 * topo da aba de código, que é onde quem quer código vai procurar.
 */
function UsoAoVivo({
  componente,
  controles,
  props,
}: {
  componente: string;
  controles: Controle[];
  props: Record<string, ValorDeKnob>;
}) {
  const codigo = snippetDeUso(componente, controles, props);
  const { done, copy } = useCopy(codigo);

  return (
    <div data-uso className="mx-5 mt-5 rounded-control bg-casa-tile-2 sm:mx-6">
      <div className="flex items-center gap-2 pl-4 pr-1 pt-1">
        <span className="text-casa-sm text-casa-fg-3">Com os seus ajustes</span>
        <button
          type="button"
          onClick={copy}
          aria-label={done ? "Copiado" : "Copiar"}
          title="Copiar"
          className="casa-icone alvo-toque ml-auto"
        >
          {done ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <Codigo codigo={codigo} className="px-4 pb-3" />
    </div>
  );
}

/** Botão de ícone num grupo sobre o palco: o ativo é um tom acima. */
function IconeDoPalco({
  ativo,
  onClick,
  rotulo,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      aria-label={rotulo}
      title={rotulo}
      className={cn(
        "alvo-toque grid h-8 w-8 place-items-center rounded-[8px] pointer-coarse:size-11 transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
        ativo ? "bg-casa-tile-2 text-casa-fg" : "text-casa-fg-3 hover:text-casa-fg",
      )}
    >
      {children}
    </button>
  );
}

export function ComponentFocus({
  item,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  item: CatalogItem;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [aba, setAba] = React.useState<Aba>(() => (item.demo ? "demo" : "codigo"));
  const [viewport, setViewport] = React.useState<ViewportKey>("full");
  const [stageRef, available] = useElementWidth<HTMLDivElement>();
  const Demo = item.demo;
  const natural = previewOf(item);

  // `controles` é null quando a demo ainda não declarou `knobs` no catálogo —
  // e aí a ficha fica exatamente como era antes de o painel existir.
  const controles = controlesDe(item.name, item.knobs);
  const knobs = useKnobs(controles?.controles ?? []);

  // Setas percorrem a família. Ignoradas enquanto alguém digita dentro da demo —
  // várias peças aqui têm input, e roubar a seta do cursor seria hostil.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      // Controle que anda com seta (knob do painel, slider da demo, seletor): a seta é dele.
      if (el?.closest('[role="slider"],[role="radiogroup"],[role="tablist"],[role="listbox"],[role="menu"],select')) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onPrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onNext();
      }
      // `Esc` volta pra categoria de onde a peça foi aberta.
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onPrev, onNext, onClose]);

  const preset = VIEWPORTS.find((v) => v.value === viewport)!;
  // O palco tem respiro de 32px de cada lado; a peça mede o que sobra.
  const util = Math.max(available - (available < 640 ? 40 : 64), 0);
  const frameW = preset.px || Math.max(util, 320);
  const frameH = Math.max(natural.h, MIN_STAGE_H);
  const semColuna = useSemColuna();
  const compacto = semColuna && !preset.px && aba === "demo";

  return (
    <article
      /* Âncora única da ficha: os cards da grade também são `article`. */
      data-ficha={item.name}
      aria-labelledby="ficha-titulo"
      /*
       * `min-w-0` em cada nível que é `flex-1`: item de flex nasce com
       * `min-width: auto`, e o palco de 1370px empurraria a ficha inteira pra
       * fora da tela.
       */
      className="shell flex min-w-0 flex-col gap-3 pb-8 pt-1 lg:flex-row lg:items-start lg:py-4"
    >
      {/*
       * O palco: um ladrilho grande, no fundo da MARCA (`.palco`) quando mostra a
       * peça, e no tom da casa quando mostra código ou props.
       *
       * Os controles do palco (o que ver, largura de teste) flutuam no canto,
       * dentro dele, como no Bench — em vez de duas barras de cromo empilhadas
       * acima da peça.
       */}
      <section
        ref={stageRef}
        className={cn(
          "relative isolate min-w-0 overflow-hidden [contain:paint] lg:flex-1 lg:rounded-tile",
          /* Na pilha o palco sangra até as bordas: grudado, canto redondo deixaria o conteúdo vazar por trás. */
          "max-lg:order-2 max-lg:-mx-[var(--shell-pad)]",
          aba === "demo" && Demo ? "palco" : "casa bg-casa-tile",
          compacto && controles
            ? "z-20 [@media(max-width:1023px)_and_(min-height:560px)]:sticky [@media(max-width:1023px)_and_(min-height:560px)]:top-[var(--shell-header-h)]"
            : null,
        )}
        style={aba === "demo" && Demo ? stageSurfaceOf(item) : undefined}
      >
        <div className="casa pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2 pointer-coarse:inset-x-1.5 pointer-coarse:top-1.5">
          <div className="pointer-events-auto flex gap-0.5 rounded-[12px] bg-casa-bg p-1 pointer-coarse:p-0.5">
            {ABAS.filter((a) => a.value !== "demo" || Demo).map(({ value, rotulo, icon: Icone }) => (
              <IconeDoPalco key={value} ativo={aba === value} onClick={() => setAba(value)} rotulo={rotulo}>
                <Icone className="h-4 w-4" />
              </IconeDoPalco>
            ))}
          </div>

          {/* Largura de teste não faz sentido num celular: ele já é a largura. */}
          {aba === "demo" && Demo ? (
            <div className="pointer-events-auto hidden gap-0.5 rounded-[12px] bg-casa-bg p-1 md:flex">
              {VIEWPORTS.map(({ value, ariaLabel, icon: Icone }) => (
                <IconeDoPalco
                  key={value}
                  ativo={viewport === value}
                  onClick={() => setViewport(value)}
                  rotulo={ariaLabel}
                >
                  <Icone className="h-4 w-4" />
                </IconeDoPalco>
              ))}
            </div>
          ) : null}
        </div>

        {aba === "codigo" ? (
          <div className="pt-12 pointer-coarse:pt-14 pointer-coarse:[&_button:not(.casa-icone)]:min-h-11">
            <CodigoDoItem
              name={item.name}
              antes={
                controles && knobs.sujo ? (
                  <UsoAoVivo
                    componente={item.knobs!}
                    controles={controles.controles}
                    props={knobs.props}
                  />
                ) : null
              }
            />
          </div>
        ) : null}

        {aba === "props" ? (
          <div className="overflow-auto pt-12 pointer-coarse:pt-14">
            <TabelaDeProps name={item.name} />
          </div>
        ) : null}

        {aba === "demo" && Demo && compacto ? (
          <div className={cn("px-3 pb-2 pt-14", controles ? "h-[max(14rem,38svh)]" : "h-[max(15rem,44svh)]")}>
            <PalcoDaPilha w={frameW} h={natural.h}>
              <ErrorBoundary fallback={null}>
                <React.Suspense fallback={null}>
                  <Demo props={knobs.props} />
                </React.Suspense>
              </ErrorBoundary>
            </PalcoDaPilha>
          </div>
        ) : aba === "demo" && Demo ? (
          <div
            /*
             * O palco cresce com a peça, com piso — não com a tela. Esticar até
             * o fim da viewport dava 200px de vazio em cima de peça pequena.
             */
            className="flex min-h-[min(48vh,420px)] items-center justify-center overflow-auto px-5 pb-8 pt-16 sm:px-8 lg:min-h-[min(72vh,640px)]"
          >
            {preset.px ? (
              /*
               * Preset de largura = iframe, sem discussão: media query lê o
               * viewport, não o container. Com `scale` a peça encolhia na tela e
               * `sm:` continuava valendo dentro do "celular". O iframe tem
               * viewport próprio; quando não cabe, encolhe inteiro por
               * `transform` e a largura INTERNA continua a do preset.
               */
              <SoloFrame
                item={item}
                largura={preset.px}
                escala={Math.min(1, (util || preset.px) / preset.px)}
                alturaMinima={MIN_STAGE_H}
                props={knobs.props}
              />
            ) : (
              <div style={{ width: Math.min(frameW, util || frameW) }}>
                {/* Escala só entra quando a peça não cabe — nunca amplia. */}
                <FitStage w={frameW} h={frameH} maxScale={1}>
                  <ErrorBoundary fallback={<div className="h-full w-full" />}>
                    <React.Suspense fallback={<div className="h-full w-full" />}>
                      <Demo props={knobs.props} />
                    </React.Suspense>
                  </ErrorBoundary>
                </FitStage>
              </div>
            )}
          </div>
        ) : null}
      </section>

      {/*
       * O painel da peça, no modelo do Bench: nome e fechar no topo, uma frase,
       * os controles, e as duas ações no pé — o destaque único é o comando de
       * instalar. Gruda no topo enquanto o palco rola.
       */}
      <aside className="casa flex w-full shrink-0 flex-col gap-5 rounded-tile bg-casa-tile p-5 max-lg:contents lg:sticky lg:top-[calc(var(--shell-header-h)+1rem)] lg:min-h-[min(72vh,640px)] lg:w-[340px]">
        <header className="flex items-start gap-2 max-lg:order-1 max-lg:items-center">
          <h1 id="ficha-titulo" className="min-w-0 flex-1 pt-1 text-casa-lg font-medium">
            {item.title}
          </h1>
          <div className="-mr-1.5 -mt-0.5 flex shrink-0 items-center">
            <BugButton item={item.name} />
            <button
              type="button"
              onClick={onPrev}
              aria-label="Peça anterior"
              title={`Anterior (${index + 1} de ${total})`}
              className="casa-icone alvo-toque"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Próxima peça"
              title={`Próxima (${index + 1} de ${total})`}
              className="casa-icone alvo-toque"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Voltar pra grade"
              title="Voltar pra grade"
              className="casa-icone alvo-toque"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <p className="text-casa-base text-casa-fg-2 max-lg:order-6 lg:-mt-3">{item.description}</p>

        {controles && aba === "demo" ? (
          <Customize
            className="max-lg:order-5"
            controles={controles.controles}
            presets={controles.presets}
            {...knobs}
          />
        ) : null}

        <div className="max-lg:contents lg:mt-auto lg:space-y-3">
          {/* Curadoria do dono (só em dev): nota, comentário, arquivar ou excluir. */}
          <div className="empty:hidden max-lg:order-8">
            <Avaliacao item={item.name} />
          </div>
          <div className="empty:hidden max-lg:order-7 pointer-coarse:[&_a]:inline-flex pointer-coarse:[&_a]:min-h-11 pointer-coarse:[&_a]:items-center">
            <DepResumo name={item.name} />
          </div>
          <div className="max-lg:order-4">
            <CopiarPraIA item={item} controles={controles?.controles ?? []} props={knobs.props} />
          </div>
          <Instalar name={item.name} className="max-lg:order-3" />
        </div>
      </aside>
    </article>
  );
}