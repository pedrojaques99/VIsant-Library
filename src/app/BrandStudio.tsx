"use client";

/**
 * Marca: o brand book da marca escolhida.
 *
 * Quem chega quer duas coisas: saber como usar a marca sem errar (qual texto em
 * qual fundo, em claro e em escuro) e levar os valores pro projeto. Cada valor
 * copia no clique, a busca leva até o token, e trocar de marca mantém a linha
 * que se está lendo: comparar é trocar e olhar o mesmo lugar.
 *
 * Tudo aqui é lido de `brands.json`, do tema compilado e do tema vivo. O que o
 * índice público não traz (voz, estratégia, personas) não aparece: `brands-sync.mjs`
 * só publica o que pode sair do vault, e seção inventada numa guideline é pior
 * que seção ausente. A lógica mora em `marca/tokens.ts`; a tela fica toda neste
 * arquivo porque é ele que o `check:casa` lê.
 */

import * as React from "react";
import { Check, Copy } from "lucide-react";
import {
  fetchBrandTheme,
  useBrandTheme,
  type BrandSummary,
  type BrandThemeItem,
} from "@/lib/brand-theme";
import { onThemeChange } from "@/lib/css-color";
import { cn } from "@/lib/utils";
import { Chip } from "../../registry/visant/ui/chip";
import { CtaAction, CtaSurface } from "../../registry/visant/ui/cta-surface";
import { ProfileForm, type ProfileValue } from "../../registry/visant/ui/profile-form";
import { SearchField } from "../../registry/visant/ui/search-field";
import { SegmentedControl } from "../../registry/visant/ui/segmented-control";
import { fold } from "./catalog";
import { Codigo } from "./codigo";
import { CopyCommand, useCopy } from "./copy-command";
import { Trocador, useUmPorVez } from "./demos/um-por-vez";
import {
  NOMES_VIVOS,
  TOKENS_DE_COR,
  alvoDaPaleta,
  buscar,
  exportarCss,
  exportarJson,
  exportarTailwind,
  formatarRazao,
  grau,
  indiceDaBusca,
  nomeDa,
  papelDa,
  paresDaPaleta,
  razao,
  type Modo,
  type Resultado,
} from "./marca/tokens";
import { DEFAULT_BRAND, REGISTRY_URL, installCommand } from "./registry-meta";

// --- o sistema, como dado -----------------------------------------------------

const RAIOS = ["r-control", "r-surface", "r-pill"] as const;
const ELEVACOES = ["e-flat", "e-raised", "e-overlay", "e-modal"] as const;
const ESPACOS = ["control-h", "pad-card", "gap-zone"] as const;
const CURVAS = ["ease-out", "ease-in-out", "ease-drawer"] as const;
const DURACOES = ["dur-press", "dur-fast", "dur-base", "dur-slow"] as const;
const TAMANHOS = ["72px", "48px", "32px", "20px"] as const;
const GLIFOS = "Aa Ãã Çç Éé Õõ 0123456789 R$ % & @ ?!";

const CAPITULOS = [
  { id: "identidade", titulo: "Identidade" },
  { id: "cor", titulo: "Cor" },
  { id: "tipografia", titulo: "Tipografia" },
  { id: "forma", titulo: "Forma" },
  { id: "movimento", titulo: "Movimento" },
  { id: "aplicacao", titulo: "Aplicação" },
  { id: "exportar", titulo: "Exportar" },
] as const;
type CapituloId = (typeof CAPITULOS)[number]["id"];

const MODOS: { modo: Modo; titulo: string }[] = [
  { modo: "light", titulo: "Claro" },
  { modo: "dark", titulo: "Escuro" },
];

// --- leitura dos tokens ---------------------------------------------------------

/**
 * Lê os tokens do `:root` DEPOIS de a folha da marca entrar. `getComputedStyle`
 * mostra o que o browser resolveu, não o que o JSON prometeu; `onThemeChange`
 * cobre a troca de claro/escuro, que não muda a marca.
 */
function useTokensVivos(marca: unknown) {
  const [valores, setValores] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    const ler = () => {
      const cs = getComputedStyle(document.documentElement);
      setValores(Object.fromEntries(NOMES_VIVOS.map((t) => [t, cs.getPropertyValue(`--${t}`).trim()])));
    };
    // Dois quadros: um para a folha entrar, outro para a View Transition acabar.
    const raf = requestAnimationFrame(() => requestAnimationFrame(ler));
    const t = setTimeout(ler, 320);
    const parar = onThemeChange(ler);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      parar();
    };
  }, [marca]);
  return valores;
}

/**
 * O tema compilado inteiro. Só ele tem claro E escuro ao mesmo tempo: o `:root`
 * mostra um modo por vez, e o `preview` do índice é amostra incompleta.
 */
function useTemaCompilado(marca: BrandSummary | null) {
  const [tema, setTema] = React.useState<{ slug: string; item: BrandThemeItem } | null>(null);
  const slug = marca?.slug;
  const nome = marca?.theme;
  React.useEffect(() => {
    if (!slug || !nome) return;
    let vivo = true;
    fetchBrandTheme(nome, REGISTRY_URL)
      .then((item) => {
        if (vivo) setTema({ slug, item });
      })
      .catch(() => {
        if (vivo) setTema(null);
      });
    return () => {
      vivo = false;
    };
  }, [slug, nome]);
  return tema && tema.slug === slug ? tema.item : null;
}

/** Declarar as variáveis no elemento repinta só ele: dá os dois modos lado a lado. */
function varsDoModo(marca: BrandSummary, item: BrandThemeItem | null, modo: Modo) {
  const vars = { ...item?.cssVars.theme, ...marca.preview[modo], ...item?.cssVars[modo] };
  return {
    valores: vars as Record<string, string>,
    estilo: Object.fromEntries(Object.entries(vars).map(([k, v]) => [`--${k}`, v])) as React.CSSProperties,
  };
}

// --- ir até um token e manter a leitura -------------------------------------------

const movimentoReduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function irAoToken(alvo: string) {
  const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-token="${CSS.escape(alvo)}"]`));
  if (!els.length) return;
  els[0].scrollIntoView({ block: "center", behavior: movimentoReduzido() ? "auto" : "smooth" });
  // Anel de duas cores: aparece sobre qualquer cor da paleta.
  const anel = "inset 0 0 0 2px var(--casa-fg), inset 0 0 0 4px var(--casa-bg)";
  for (const el of els) {
    el.animate(
      [
        { boxShadow: anel, offset: 0 },
        { boxShadow: anel, offset: 0.8 },
        { boxShadow: "inset 0 0 0 0 transparent", offset: 1 },
      ],
      { duration: 2200, easing: "ease-out" },
    );
  }
}

/** Abaixo da faixa fixa do topo: é ali que os olhos estão. */
const LINHA_DE_LEITURA = 140;

/**
 * Prende a linha que se está lendo durante a troca de marca. A paleta muda de
 * tamanho, a fonte muda de altura e o tema compilado chega depois: por uns
 * quadros, o texto sob os olhos é devolvido ao mesmo lugar a cada mudança.
 */
function prenderLeitura() {
  const ancoras = Array.from(document.querySelectorAll<HTMLElement>("[data-ancora]"));
  const ancora = ancoras.find((el) => el.getBoundingClientRect().bottom > LINHA_DE_LEITURA);
  if (!ancora || window.scrollY < 40) return () => {};
  const chave = ancora.dataset.ancora;
  const topo = ancora.getBoundingClientRect().top;
  return () => {
    let quadros = 60;
    const passo = () => {
      const el = document.querySelector<HTMLElement>(`[data-ancora="${chave}"]`);
      if (el) {
        const desvio = el.getBoundingClientRect().top - topo;
        if (Math.abs(desvio) > 0.5) window.scrollBy({ top: desvio, behavior: "instant" });
      }
      if (--quadros > 0) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  };
}

// --- peças da página -----------------------------------------------------------

function Capitulo({ id, titulo, children }: { id: CapituloId; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} data-capitulo={id} className="scroll-mt-36 pb-20 lg:scroll-mt-20">
      <h2 data-ancora={id} className="casa mb-5 text-casa-lg font-medium">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

/** O ladrilho onde a marca acontece. Fora dele, tudo é casa. */
function Palco({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("palco overflow-hidden rounded-tile", className)}>{children}</div>;
}

function Subtitulo({ children, ancora }: { children: React.ReactNode; ancora: string }) {
  return (
    <h3 data-ancora={ancora} className="casa mb-3 mt-10 text-casa-sm text-casa-fg-2 first:mt-0">
      {children}
    </h3>
  );
}

/** Um valor da marca: clicar copia, e o valor continua legível o tempo todo. */
function Valor({ nome, valor }: { nome: string; valor: string }) {
  const { done, copy } = useCopy(valor);
  return (
    <button
      type="button"
      onClick={copy}
      disabled={!valor}
      aria-label={`Copiar ${nome}: ${valor}`}
      className="casa alvo-toque block w-full min-w-0 rounded-control px-4 py-3 text-left outline-none transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-casa-tile-2 focus-visible:[box-shadow:var(--focus)]"
    >
      <code className="block truncate text-casa-sm text-casa-fg">{nome}</code>
      <code className="flex items-start gap-1.5 text-casa-sm text-casa-fg-3">
        <span className="min-w-0 [overflow-wrap:anywhere]">{valor || "ausente"}</span>
        {done ? <Check className="size-3 shrink-0 text-casa-fg" aria-label="Copiado" /> : null}
      </code>
    </button>
  );
}

/** Uma cor da paleta com todo texto possível sobre ela, do melhor para o pior. */
function FaixaDaPaleta({
  fundo,
  legenda,
  textos,
  ordem,
}: ReturnType<typeof paresDaPaleta>[number] & { ordem: number }) {
  const hex = useCopy(fundo.hex);
  const papel = papelDa(fundo);
  return (
    <div
      data-token={alvoDaPaleta(fundo)}
      data-ancora={`paleta-${ordem}`}
      className="grid gap-3 p-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6 sm:p-5"
      style={{ background: fundo.hex, color: legenda }}
    >
      <button
        type="button"
        onClick={hex.copy}
        aria-label={`Copiar ${nomeDa(fundo)}: ${fundo.hex}`}
        className="alvo-toque min-w-0 self-center text-left outline-none focus-visible:underline"
      >
        <span className="block truncate text-base font-medium">{nomeDa(fundo)}</span>
        <code className="flex items-center gap-1.5 text-casa-sm">
          {fundo.hex}
          {hex.done ? <Check className="size-3" aria-label="Copiado" /> : null}
        </code>
        {fundo.name && papel ? <span className="block text-casa-sm">{papel}</span> : null}
      </button>
      {textos.length ? (
        <div
          className="grid grid-cols-2 gap-x-2 gap-y-3 sm:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
          style={{ "--n": textos.length } as React.CSSProperties}
        >
          {textos.map((t) => (
            <ParDeTexto key={t.cor.hex} fundo={fundo.hex} cor={t.cor.hex} nome={nomeDa(t.cor)} razao={t.razao} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** A célula é a prova: o "Aa" na cor real. Clicar leva o par como CSS. */
function ParDeTexto({ fundo, cor, nome, razao: r }: { fundo: string; cor: string; nome: string; razao: number }) {
  const g = grau(r);
  const { done, copy } = useCopy(`background: ${fundo}; color: ${cor};`);
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copiar par ${nome} sobre ${fundo}: ${formatarRazao(r)}, ${g}`}
      className="alvo-toque min-w-0 text-left outline-none focus-visible:underline"
    >
      <span
        className={cn("block text-[2rem] leading-none tracking-[-0.02em]", g === "Evitar" && "line-through")}
        style={{ color: cor, fontFamily: "var(--font-display, inherit)" }}
        aria-hidden
      >
        Aa
      </span>
      <span className="mt-1.5 block truncate text-casa-sm">{nome}</span>
      <code className="flex items-center gap-1 text-casa-sm">
        {done ? <Check className="size-3" aria-label="Copiado" /> : null}
        <span className="truncate">
          {formatarRazao(r)} <span className="font-medium">{g}</span>
        </span>
      </code>
    </button>
  );
}

/** Um token do tema, pintado com o próprio modo, com a razão do par em que é lido. */
function LinhaDeToken({ token, valores }: { token: (typeof TOKENS_DE_COR)[number]; valores: Record<string, string> }) {
  const valor = valores[token.nome] ?? "";
  const { done, copy } = useCopy(valor);
  const r = token.sobre ? razao(valor, valores[token.sobre] ?? "") : null;
  const veredito = r == null ? null : token.naoEhTexto ? "Fundo e borda, não texto" : grau(r);
  return (
    <button
      type="button"
      data-token={`--${token.nome}`}
      onClick={copy}
      disabled={!valor}
      aria-label={`Copiar --${token.nome}: ${valor}`}
      className="alvo-toque grid w-full min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-center gap-3 px-4 py-2.5 text-left outline-none transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-[var(--muted)] focus-visible:[box-shadow:inset_0_0_0_2px_var(--foreground)] sm:px-5"
    >
      <span
        aria-hidden
        className="size-8 rounded-control"
        style={{ background: valor, boxShadow: "inset 0 0 0 1px var(--border)" }}
      />
      <span className="min-w-0">
        <code className="flex items-center gap-1.5 text-casa-sm">
          <span className="truncate">--{token.nome}</span>
          {done ? <Check className="size-3 shrink-0" aria-label="Copiado" /> : null}
        </code>
        <code className="block truncate text-casa-sm" style={{ color: "var(--muted-foreground)" }}>
          {valor || "ausente"}
        </code>
        {r != null ? (
          <code className="block text-casa-sm" style={{ color: "var(--muted-foreground)" }}>
            {formatarRazao(r)} sobre --{token.sobre}, <span style={{ color: "var(--foreground)" }}>{veredito}</span>
          </code>
        ) : null}
      </span>
    </button>
  );
}

type Degrau = { chave: string; px: number; peso: string; altura: string; familia: string; font: string };

/**
 * A escala que a marca usa de fato: medida nas peças de Aplicação, não declarada.
 * O tema não define tamanhos de texto, então a única verdade é o que renderiza.
 */
function useEscalaMedida(chave: unknown) {
  const [degraus, setDegraus] = React.useState<Degrau[]>([]);
  React.useEffect(() => {
    const medir = () => {
      const raiz = document.querySelector("[data-medir]");
      if (!raiz) return;
      const achados = new Map<string, Degrau>();
      raiz.querySelectorAll("*").forEach((el) => {
        const temTexto = Array.from(el.childNodes).some(
          (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim(),
        );
        if (!temTexto) return;
        const cs = getComputedStyle(el);
        const px = parseFloat(cs.fontSize);
        const familia = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
        const altura = cs.lineHeight === "normal" ? "normal" : `${Math.round(parseFloat(cs.lineHeight))}px`;
        const peso = cs.fontWeight;
        const id = `${px}|${peso}|${familia}`;
        const tam = Number(px.toFixed(1));
        if (!achados.has(id)) {
          achados.set(id, { chave: id, px: tam, peso, altura, familia, font: `${peso} ${tam}px/${altura} "${familia}"` });
        }
      });
      setDegraus(Array.from(achados.values()).sort((a, b) => b.px - a.px || Number(b.peso) - Number(a.peso)));
    };
    const t = setTimeout(medir, 500);
    const t2 = setTimeout(medir, 1500);
    window.addEventListener("resize", medir);
    void document.fonts?.ready.then(medir);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
      window.removeEventListener("resize", medir);
    };
  }, [chave]);
  return degraus;
}

function LinhaDeEscala({ degrau, texto }: { degrau: Degrau; texto: string }) {
  const { done, copy } = useCopy(`font: ${degrau.font};`);
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copiar ${degrau.font}`}
      className="alvo-toque grid w-full grid-cols-[minmax(0,1fr)] items-baseline gap-x-6 gap-y-0.5 px-5 py-3 text-left outline-none transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-[var(--muted)] focus-visible:[box-shadow:inset_0_0_0_2px_var(--foreground)] sm:grid-cols-[minmax(0,1fr)_auto] sm:px-6"
    >
      <span
        className="truncate leading-tight"
        style={{ fontFamily: `"${degrau.familia}", inherit`, fontSize: degrau.px, fontWeight: degrau.peso }}
      >
        {texto}
      </span>
      <code className="flex items-center gap-1.5 text-casa-sm" style={{ color: "var(--muted-foreground)" }}>
        {done ? <Check className="size-3" aria-label="Copiado" /> : null}
        {degrau.px}px, {degrau.peso}, {degrau.familia}
      </code>
    </button>
  );
}

function Tipografia({
  marca,
  fontes,
  chaveDaMedida,
}: {
  marca: BrandSummary | null;
  fontes: { display: string; sans: string };
  chaveDaMedida: unknown;
}) {
  // Nasce com a frase da própria marca; digitar por cima segue valendo entre marcas.
  const [digitado, setDigitado] = React.useState<string | null>(null);
  const texto = digitado ?? marca?.tagline ?? marca?.name ?? "";
  const tamanho = useUmPorVez(TAMANHOS);
  const escala = useEscalaMedida(chaveDaMedida);
  const display = marca?.fonts.display ?? "—";
  const sans = marca?.fonts.sans ?? "—";
  return (
    <>
      <Palco className="px-6 py-12 sm:px-10">
        {/* O espécime é o próprio campo: digitar aqui já é testar a face. */}
        <textarea
          rows={1}
          value={texto}
          onChange={(e) => setDigitado(e.target.value)}
          aria-label="Texto de teste da face de títulos"
          className="block w-full min-w-0 resize-none overflow-hidden break-normal bg-transparent leading-[1.05] tracking-[-0.03em] outline-none [field-sizing:content]"
          style={{ fontFamily: "var(--font-display, inherit)", fontSize: `min(${tamanho.atual}, 8.5vw)` }}
        />
        <p className="mt-6 max-w-[62ch] leading-relaxed" style={{ fontFamily: "var(--font-sans, inherit)" }}>
          {texto || "Texto corrido"}
        </p>
        <p
          className="mt-2 leading-relaxed [overflow-wrap:anywhere]"
          style={{ fontFamily: "var(--font-sans, inherit)", color: "var(--muted-foreground)" }}
        >
          {GLIFOS}
        </p>
      </Palco>
      <div className="casa mt-3 flex items-center justify-end">
        <Trocador nome={tamanho.atual} onPasso={tamanho.passo} rotulo="tamanho" />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div data-token="--font-display" className="overflow-hidden rounded-tile bg-casa-tile">
          <Valor nome={`${display}, títulos`} valor={fontes.display} />
        </div>
        <div data-token="--font-sans" className="overflow-hidden rounded-tile bg-casa-tile">
          <Valor nome={`${sans}, texto`} valor={fontes.sans} />
        </div>
      </div>
      {escala.length ? (
        <>
          <Subtitulo ancora="escala">Escala em uso, medida nas peças de Aplicação</Subtitulo>
          <Palco className="py-2">
            {escala.map((d) => (
              <LinhaDeEscala key={d.chave} degrau={d} texto={texto || marca?.name || ""} />
            ))}
          </Palco>
        </>
      ) : null}
    </>
  );
}

/** Uma curva ou duração, andando de verdade com o token dela. */
function Trilha({ nome, valor, curva, duracao }: { nome: string; valor: string; curva: string; duracao: string }) {
  const [fim, setFim] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* Parado, todo cartão mostra o mesmo ponto no fim. A diferença entre curvas e
       durações só existe em movimento, então a trilha roda enquanto está à vista. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let relogio: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(relogio);
      if (e.isIntersecting) {
        setFim(true);
        relogio = setInterval(() => setFim((v) => !v), 1600);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(relogio);
    };
  }, []);
  return (
    <div ref={ref} data-token={`--${nome}`} className="overflow-hidden rounded-tile bg-casa-tile">
      <button
        type="button"
        onClick={() => setFim((v) => !v)}
        aria-label={`Rodar ${nome}`}
        className="palco block w-full px-5 py-5 outline-none focus-visible:[box-shadow:var(--focus)]"
      >
        <span className="relative block h-3">
          <span
            // casa-lint/pilula: o ponto da trilha é um círculo, não um chip
            className="absolute top-0 size-3 rounded-full motion-reduce:transition-none"
            style={{
              // casa-lint/marca-na-casca: o ponto está no palco; a cor é a marca aplicada
              background: "var(--brand)",
              left: fim ? "calc(100% - 0.75rem)" : "0",
              transitionProperty: "left",
              transitionTimingFunction: `var(--${curva})`,
              transitionDuration: duracao,
            }}
          />
        </span>
      </button>
      <Valor nome={`--${nome}`} valor={valor} />
    </div>
  );
}

/** Amostra de forma: a marca desenha no palco, o valor copia na casa. */
function Forma({ token, valor, altura, children }: { token: string; valor: string; altura: string; children: React.ReactNode }) {
  return (
    <div data-token={`--${token}`} className="overflow-hidden rounded-tile bg-casa-tile">
      <div className={cn("palco grid place-items-center", altura)}>{children}</div>
      <Valor nome={`--${token}`} valor={valor} />
    </div>
  );
}

/** As peças do registry, sem cartão em volta: a superfície já é o painel do modo. */
function PecasNaMarca({ marca }: { marca: BrandSummary | null }) {
  const [perfil, setPerfil] = React.useState<ProfileValue>({ name: "Marina", email: "marina@exemplo.com" });
  const [filtro, setFiltro] = React.useState("Todos");
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <CtaSurface
        variant="card"
        tone="brand"
        title={marca?.tagline ?? marca?.name ?? ""}
        actions={
          <>
            <CtaAction>Começar</CtaAction>
            <CtaAction variant="outline">Ver detalhes</CtaAction>
          </>
        }
      />
      <div className="flex flex-wrap gap-2">
        {["Todos", "Novos", "Salvos"].map((f) => (
          <Chip key={f} pressed={filtro === f} mark={false} onClick={() => setFiltro(f)}>
            {f}
          </Chip>
        ))}
      </div>
      <ProfileForm
        className="gap-3 border-0 bg-transparent p-0"
        value={perfil}
        emailVerified
        onSave={async (proximo) => {
          await new Promise((r) => setTimeout(r, 900));
          setPerfil(proximo);
        }}
      />
    </div>
  );
}

function PainelDoModo({
  marca,
  item,
  modo,
  titulo,
  children,
  medir,
}: {
  marca: BrandSummary;
  item: BrandThemeItem | null;
  modo: Modo;
  titulo: string;
  children: React.ReactNode;
  medir?: boolean;
}) {
  const { estilo } = varsDoModo(marca, item, modo);
  return (
    <div
      data-modo={modo}
      data-medir={medir ? "" : undefined}
      className="palco min-w-0 overflow-hidden rounded-tile"
      style={estilo}
    >
      <p className="px-4 pb-1 pt-4 text-casa-sm font-medium sm:px-5" style={{ color: "var(--muted-foreground)" }}>
        {titulo}
      </p>
      {children}
    </div>
  );
}

type Formato = "css" | "json" | "tailwind";

const FORMATOS: { value: Formato; label: string }[] = [
  { value: "css", label: "CSS vars" },
  { value: "json", label: "JSON" },
  { value: "tailwind", label: "Tailwind" },
];

function Exportar({ marca, item }: { marca: BrandSummary | null; item: BrandThemeItem | null }) {
  const [formato, setFormato] = React.useState<Formato>("css");
  const codigo = !item || !marca
    ? ""
    : formato === "json"
      ? exportarJson(marca, item)
      : formato === "tailwind"
        ? exportarTailwind(item)
        : exportarCss(item);
  const { done, copy } = useCopy(codigo);
  const Icone = done ? Check : Copy;
  const rotulo = FORMATOS.find((f) => f.value === formato)?.label ?? "";
  return (
    <div className="casa">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          aria-label="Formato da exportação"
          value={formato}
          onChange={setFormato}
          options={FORMATOS}
          className="w-full max-w-xs"
        />
        <button
          type="button"
          onClick={copy}
          disabled={!codigo}
          className="alvo-toque inline-flex items-center gap-2 rounded-control bg-casa-tile-2 px-3 py-2 text-casa-sm text-casa-fg outline-none transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-casa-tile focus-visible:[box-shadow:var(--focus)]"
        >
          <Icone className="size-3.5" aria-hidden />
          {done ? "Copiado" : `Copiar ${rotulo}`}
        </button>
      </div>
      <div className="rounded-tile bg-casa-tile p-4 sm:p-5">
        {codigo ? (
          <Codigo codigo={codigo} linguagem={formato === "json" ? "json" : "css"} className="max-h-96" />
        ) : (
          <p className="text-casa-sm text-casa-fg-2">O tema compilado desta marca não carregou.</p>
        )}
      </div>
      <div className="mt-6 max-w-xl space-y-2">
        <CopyCommand text={installCommand("brand-selector")} />
        <p className="text-casa-sm text-casa-fg-2">Instala o seletor e o runtime, pro app trocar de marca no ar.</p>
      </div>
    </div>
  );
}

// --- navegação -------------------------------------------------------------------

function Indice({
  capitulo,
  className,
  rolavel,
}: {
  capitulo: CapituloId;
  className?: string;
  rolavel?: boolean;
}) {
  const ref = React.useRef<HTMLElement>(null);
  /* Na faixa do celular, o capítulo atual tem de estar à vista dentro da rolagem. */
  React.useEffect(() => {
    if (!rolavel) return;
    const nav = ref.current;
    const el = nav?.querySelector<HTMLElement>('[aria-current="location"]');
    if (nav && el) nav.scrollTo({ left: el.offsetLeft - 8 });
  }, [capitulo, rolavel]);
  return (
    <nav ref={ref} aria-label="Capítulos" className={className}>
      {CAPITULOS.map((c) => (
        <a
          key={c.id}
          href={`#${c.id}`}
          aria-current={capitulo === c.id ? "location" : undefined}
          className={cn(
            "alvo-toque shrink-0 rounded-control px-2 py-1.5 text-casa-sm outline-none transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:text-casa-fg focus-visible:[box-shadow:var(--focus)]",
            capitulo === c.id ? "bg-casa-tile text-casa-fg" : "text-casa-fg-2",
          )}
        >
          {c.titulo}
        </a>
      ))}
    </nav>
  );
}

function SeletorDeMarcas({
  marcas,
  atual,
  onTrocar,
}: {
  marcas: BrandSummary[];
  atual?: string;
  onTrocar: (slug: string) => void;
}) {
  return (
    <div role="group" aria-label="Marca" className="flex flex-col gap-0.5">
      {marcas.map((m) => (
        <button
          key={m.slug}
          type="button"
          aria-pressed={m.slug === atual}
          onClick={() => onTrocar(m.slug)}
          className={cn(
            "alvo-toque flex items-center gap-2.5 rounded-control px-2 py-1.5 text-left text-casa-sm outline-none transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:text-casa-fg focus-visible:[box-shadow:var(--focus)]",
            m.slug === atual ? "bg-casa-tile text-casa-fg" : "text-casa-fg-2",
          )}
        >
          <span aria-hidden className="flex h-4 w-8 shrink-0 overflow-hidden rounded-[4px] outline outline-1 outline-casa-line">
            {m.palette.map((c) => (
              <span key={c.hex} className="flex-1" style={{ background: c.hex }} />
            ))}
          </span>
          <span className="truncate">{m.name}</span>
        </button>
      ))}
    </div>
  );
}

function BuscaNaMarca({ indice, marca }: { indice: Resultado[]; marca?: string }) {
  const [busca, setBusca] = React.useState("");
  const [aberto, setAberto] = React.useState(false);
  const [foco, setFoco] = React.useState(0);
  const termo = fold(busca.trim());
  const resultados = React.useMemo(() => buscar(indice, termo, fold), [indice, termo]);
  const mostrar = aberto && termo.length > 0;

  React.useEffect(() => setFoco(0), [termo]);

  const escolher = (r?: Resultado) => {
    if (!r) return;
    setAberto(false);
    setBusca("");
    irAoToken(r.alvo);
  };

  return (
    <div className="relative">
      <SearchField
        id="busca-na-marca"
        value={busca}
        onChange={(v) => {
          setBusca(v);
          setAberto(true);
        }}
        delay={0}
        placeholder="Buscar, tecla /"
        aria-label="Buscar na marca: nome, papel, valor ou token"
        role="combobox"
        aria-expanded={mostrar}
        aria-controls="resultados-da-marca"
        aria-activedescendant={mostrar && resultados[foco] ? `resultado-${foco}` : undefined}
        autoComplete="off"
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            const n = resultados.length || 1;
            setFoco((f) => (f + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
          } else if (e.key === "Enter") {
            e.preventDefault();
            escolher(resultados[foco]);
          } else if (e.key === "Escape") {
            setBusca("");
            setAberto(false);
          }
        }}
      />
      {mostrar ? (
        <div
          id="resultados-da-marca"
          role="listbox"
          aria-label="Resultados"
          className="absolute left-0 top-full z-40 mt-1 w-full overflow-hidden rounded-tile bg-casa-tile p-1 [box-shadow:var(--casa-shadow)] lg:w-80"
        >
          {resultados.length ? (
            resultados.map((r, i) => (
              <button
                key={r.alvo}
                id={`resultado-${i}`}
                type="button"
                role="option"
                aria-selected={i === foco}
                onMouseEnter={() => setFoco(i)}
                // Sem isto o campo perde o foco antes do clique e a lista fecha.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => escolher(r)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-left",
                  i === foco && "bg-casa-tile-2",
                )}
              >
                {r.cor ? (
                  <span
                    aria-hidden
                    className="size-5 shrink-0 rounded-[5px] [box-shadow:inset_0_0_0_1px_var(--casa-line)]"
                    style={{ background: r.cor }}
                  />
                ) : null}
                <span className="min-w-0">
                  <code className="block truncate text-casa-sm text-casa-fg">{r.nome}</code>
                  <code className="block truncate text-casa-sm text-casa-fg-3">
                    {r.detalhe}, {r.valor || "ausente"}
                  </code>
                </span>
              </button>
            ))
          ) : (
            <p className="px-2.5 py-2 text-casa-sm text-casa-fg-2">
              Nada com “{busca.trim()}” em {marca ?? "esta marca"}. Tente um papel (fundo, texto), um valor ou um
              token (--brand).
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

// --- o livro -------------------------------------------------------------------

export function BrandStudioBody() {
  const { active, brand, brands, setBrand, status } = useBrandTheme();
  const shown = active ?? brand;
  const slug = shown?.slug;
  const tokens = useTokensVivos(active?.slug ?? "none");
  const item = useTemaCompilado(shown);
  const [atual, setAtual] = React.useState<CapituloId>("identidade");

  const indice = React.useMemo(() => indiceDaBusca(shown, tokens, fold), [shown, tokens]);
  const pares = React.useMemo(() => paresDaPaleta(shown?.palette ?? []), [shown]);

  /* O índice acompanha a leitura: marca o capítulo na faixa alta da tela. */
  React.useEffect(() => {
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) setAtual((e.target as HTMLElement).dataset.capitulo as CapituloId);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    document.querySelectorAll("[data-capitulo]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const trocar = React.useCallback(
    (proxima: string) => {
      if (proxima === slug) return;
      const soltar = prenderLeitura();
      void setBrand(proxima).then(soltar);
    },
    [setBrand, slug],
  );

  const passoDaMarca = React.useCallback(
    (d: number) => {
      if (!brands.length) return;
      const i = brands.findIndex((b) => b.slug === slug);
      trocar(brands[(i + d + brands.length) % brands.length].slug);
    },
    [brands, slug, trocar],
  );

  /* `/` vai à busca; `[` e `]` trocam de marca sem tirar os olhos do lugar. */
  React.useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      if (alvo.closest("input, textarea, select, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "/") {
        e.preventDefault();
        document.getElementById("busca-na-marca")?.focus();
      } else if (e.key === "[") passoDaMarca(-1);
      else if (e.key === "]") passoDaMarca(1);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [passoDaMarca]);

  /* O cabeçalho do app quebra em duas linhas no celular: a faixa gruda na altura real. */
  const [alturaDoTopo, setAlturaDoTopo] = React.useState(56);
  React.useEffect(() => {
    const topo = document.querySelector("header");
    if (!topo) return;
    const ro = new ResizeObserver(() => setAlturaDoTopo(topo.getBoundingClientRect().height));
    ro.observe(topo);
    return () => ro.disconnect();
  }, []);

  const fundoDaPaleta = shown?.palette.find((c) => c.role === "background")?.hex;

  return (
    <main className="shell pb-24 pt-6 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12 lg:pt-10">
      {/* No celular a troca de marca fica à mão em qualquer ponto da leitura. */}
      <div
        className="casa sticky z-30 -mx-4 mb-4 flex items-center gap-2 bg-casa-bg px-4 py-1.5 sm:-mx-6 sm:px-6 lg:hidden"
        style={{ top: alturaDoTopo }}
      >
        <div className="shrink-0 [&_button:nth-child(2)]:max-w-28 [&_button:nth-child(2)]:truncate">
          <Trocador nome={shown?.name ?? "Marca"} onPasso={passoDaMarca} rotulo="marca" />
        </div>
        <Indice capitulo={atual} rolavel className="relative flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none]" />
      </div>

      <aside className="casa mb-8 lg:sticky lg:top-20 lg:mb-0 lg:self-start">
        <BuscaNaMarca indice={indice} marca={shown?.name} />
        <div className="mt-6 hidden lg:block" title="Teclas [ e ] trocam de marca e mantêm a posição de leitura">
          <SeletorDeMarcas marcas={brands} atual={slug} onTrocar={trocar} />
        </div>
        <Indice capitulo={atual} className="mt-6 hidden flex-col gap-1 lg:flex" />
      </aside>

      <div className="min-w-0">
        <section id="identidade" data-capitulo="identidade" className="scroll-mt-36 pb-16 lg:scroll-mt-20">
          <h2 className="sr-only">Identidade</h2>
          <Palco>
            <div data-ancora="identidade" className="px-6 py-12 sm:px-12 sm:py-20">
              {shown?.logo ? (
                /* O arquivo do logo é fixo e o tema muda: sobre o fundo da própria paleta ele
                   nunca some, e não precisa de filtro alterando a marca. */
                <div
                  className="mb-10 inline-block p-5"
                  // casa-lint/raio-da-marca: a placa está no palco e veste o raio da marca
                  style={{ background: fundoDaPaleta ?? "var(--card)", borderRadius: "var(--r-surface)" }}
                >
                  <img src={shown.logo.url} alt={`Logo ${shown.name}`} className="h-12 w-auto object-contain" />
                </div>
              ) : null}
              <h1
                className="text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.98] tracking-[-0.03em]"
                style={{ fontFamily: "var(--font-display, inherit)" }}
              >
                {status === "loading" ? "Lendo o vault" : (shown?.name ?? "Escolha uma marca")}
              </h1>
              {shown?.tagline ? (
                <p className="mt-5 max-w-xl text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {shown.tagline}
                </p>
              ) : null}
            </div>
            <div aria-hidden className="flex h-14">
              {shown?.palette.map((c) => (
                <span key={c.hex} className="flex-1" style={{ background: c.hex }} />
              ))}
            </div>
          </Palco>
          <div className="casa mt-3">
            <CopyCommand variant="cta" text={installCommand(`theme-${shown?.slug ?? DEFAULT_BRAND}`)} />
          </div>
        </section>

        <Capitulo id="cor" titulo="Cor">
          {pares.length ? (
            <>
              <Subtitulo ancora="pares">Paleta e o texto que cabe em cada fundo, do melhor para o pior</Subtitulo>
              <Palco>
                {pares.map((p, i) => (
                  <FaixaDaPaleta key={p.fundo.hex} {...p} ordem={i} />
                ))}
              </Palco>
            </>
          ) : null}
          {shown ? (
            <>
              <Subtitulo ancora="tema">Tema, claro e escuro</Subtitulo>
              <div className="grid gap-3 md:grid-cols-2">
                {MODOS.map(({ modo, titulo }) => {
                  const { valores } = varsDoModo(shown, item, modo);
                  return (
                    <PainelDoModo key={modo} marca={shown} item={item} modo={modo} titulo={titulo}>
                      <div className="pb-2">
                        {TOKENS_DE_COR.map((t) => (
                          <LinhaDeToken key={t.nome} token={t} valores={valores} />
                        ))}
                      </div>
                    </PainelDoModo>
                  );
                })}
              </div>
            </>
          ) : null}
        </Capitulo>

        <Capitulo id="tipografia" titulo="Tipografia">
          <Tipografia
            marca={shown}
            fontes={{ display: tokens["font-display"] ?? "", sans: tokens["font-sans"] ?? "" }}
            chaveDaMedida={`${slug}|${item ? 1 : 0}`}
          />
        </Capitulo>

        <Capitulo id="forma" titulo="Forma">
          <Subtitulo ancora="raio">Raio</Subtitulo>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {RAIOS.map((t) => (
              <Forma key={t} token={t} valor={tokens[t] ?? ""} altura="h-28">
                <div
                  className="h-14 w-24"
                  style={{ background: "var(--card)", boxShadow: "inset 0 0 0 1px var(--border)", borderRadius: `var(--${t})` }}
                />
              </Forma>
            ))}
          </div>
          <Subtitulo ancora="elevacao">Elevação</Subtitulo>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {ELEVACOES.map((t) => (
              <Forma key={t} token={t} valor={tokens[t] ?? ""} altura="h-28">
                <div
                  className="h-14 w-24"
                  // casa-lint/raio-da-marca: a amostra está no palco; vestir o raio da marca é a prova
                  style={{ background: "var(--card)", boxShadow: `var(--${t})`, borderRadius: "var(--r-surface)" }}
                />
              </Forma>
            ))}
          </div>
          <Subtitulo ancora="espaco">Espaço</Subtitulo>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ESPACOS.map((t) => (
              <Forma key={t} token={t} valor={tokens[t] ?? ""} altura="h-20">
                {/* casa-lint/marca-na-casca: a barra está no palco; a cor é a marca aplicada */}
                <div className="h-2" style={{ width: `var(--${t})`, background: "var(--brand)" }} />
              </Forma>
            ))}
          </div>
        </Capitulo>

        <Capitulo id="movimento" titulo="Movimento">
          <Subtitulo ancora="curvas">Curvas, em 800ms pra ler a forma</Subtitulo>
          <div className="grid gap-3 sm:grid-cols-3">
            {CURVAS.map((t) => (
              <Trilha key={t} nome={t} valor={tokens[t] ?? ""} curva={t} duracao="800ms" />
            ))}
          </div>
          <Subtitulo ancora="duracoes">Durações</Subtitulo>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {DURACOES.map((t) => (
              <Trilha key={t} nome={t} valor={tokens[t] ?? ""} curva="ease-out" duracao={`var(--${t})`} />
            ))}
          </div>
        </Capitulo>

        <Capitulo id="aplicacao" titulo="Aplicação">
          {shown ? (
            <div className="grid gap-3 md:grid-cols-2">
              {MODOS.map(({ modo, titulo }, i) => (
                <PainelDoModo key={modo} marca={shown} item={item} modo={modo} titulo={titulo} medir={i === 0}>
                  <PecasNaMarca marca={shown} />
                </PainelDoModo>
              ))}
            </div>
          ) : null}
        </Capitulo>

        <Capitulo id="exportar" titulo="Exportar">
          <Exportar marca={shown} item={item} />
        </Capitulo>
      </div>
    </main>
  );
}
