"use client";

/**
 * As três skills de vídeo. Nada aqui é vídeo de verdade: são desenhos fiéis ao
 * que cada ferramenta faz, com o parâmetro real na mão de quem mexe.
 */

import * as React from "react";
import { SimSlider } from "../../../../registry/visant/ui/sim-slider";
import { SegmentedControl } from "../../../../registry/visant/ui/segmented-control";
import { StatusTicker } from "../../../../registry/visant/ui/status-ticker";
import { Acao, ANIMA_COR, cx, Terminal, useMenosMovimento, useSequencia } from "./base";

/* ---- visant-video-editor ---- */

const FALAS = [
  { de: 1.2, ate: 5.4, texto: "Oi, nessa aula" },
  { de: 9.1, ate: 13.8, texto: "a gente corta o silêncio" },
  { de: 15.1, ate: 19.2, texto: "sem comer palavra" },
  { de: 25.6, ate: 31.4, texto: "e nivela o áudio em -16 LUFS" },
  { de: 33.4, ate: 38.2, texto: "com capítulos prontos" },
];
const TOTAL = 40;
const BARRAS = 200;

/** Ruído pseudoaleatório fixo: a mesma onda a cada carregamento. */
const onda = Array.from({ length: BARRAS }, (_, i) => {
  const t = ((i + 0.5) / BARRAS) * TOTAL;
  const fala = FALAS.some((f) => t >= f.de && t <= f.ate);
  const r = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
  return { t, a: fala ? 0.3 + r * 0.7 : 0.02 + r * 0.03 };
});

function cortes(margem: number) {
  const lista: { de: number; ate: number }[] = [];
  let anterior = 0;
  for (const f of FALAS) {
    const de = anterior === 0 ? 0 : anterior + margem;
    const ate = f.de - margem;
    if (ate > de) lista.push({ de, ate });
    anterior = f.ate;
  }
  const fim = anterior + margem;
  if (TOTAL > fim) lista.push({ de: fim, ate: TOTAL });
  return lista;
}

const segundos = (s: number) => `${s.toFixed(1).replace(".", ",")} s`;

export function DemoEditor({ cabeca }: { cabeca: React.ReactNode }) {
  const [margem, setMargem] = React.useState(0.25);
  const [cortado, setCortado] = React.useState(false);
  const [p, setP] = React.useState(0);
  const raf = React.useRef(0);
  const pAtual = React.useRef(0);
  const menos = useMenosMovimento();

  const lista = React.useMemo(() => cortes(margem), [margem]);
  const fora = lista.reduce((s, c) => s + (c.ate - c.de), 0);

  React.useEffect(() => {
    cancelAnimationFrame(raf.current);
    const alvo = cortado ? 1 : 0;
    if (menos) {
      pAtual.current = alvo;
      setP(alvo);
      return;
    }
    const inicio = performance.now();
    const de = pAtual.current;
    const passo = (agora: number) => {
      const u = Math.min(1, (agora - inicio) / 700);
      const e = 1 - (1 - u) ** 3;
      pAtual.current = de + (alvo - de) * e;
      setP(pAtual.current);
      if (u < 1) raf.current = requestAnimationFrame(passo);
    };
    raf.current = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf.current);
  }, [cortado, menos]);

  /* O tempo do bruto vira posição na linha, comprimindo o que foi cortado. */
  const duracao = TOTAL - fora * p;
  const posicao = (t: number) => {
    let antes = 0;
    for (const c of lista) {
      if (t >= c.ate) antes += c.ate - c.de;
      else if (t > c.de) antes += t - c.de;
    }
    return ((t - antes * p) / duracao) * 100;
  };
  const noCorte = (t: number) => lista.some((c) => t > c.de && t < c.ate);

  const traco = (dentro: boolean) =>
    onda
      .filter((b) => noCorte(b.t) === dentro)
      .map((b) => {
        const px = posicao(b.t) * 10;
        const h = b.a * 46;
        return `M${px.toFixed(1)} ${(50 - h).toFixed(1)}V${(50 + h).toFixed(1)}`;
      })
      .join("");

  return (
    <div className="min-w-0" data-demo="editor">
      <div className="grid min-w-0 items-end gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        {cabeca}
      <div className="min-w-0">
        {/* Na casa o trilho e o cartão têm o mesmo tom: sem isto o resto do curso some. */}
        <SimSlider
          style={{ "--muted": "var(--casa-tile-2)", "--secondary": "var(--casa-tile-2)" } as React.CSSProperties}
          label="Respiro em volta da fala"
          min={0}
          max={0.5}
          step={0.05}
          defaultValue={0.25}
          format={(v) => `${v.toFixed(2).replace(".", ",")} s`}
          onValueChange={setMargem}
          outputs={[
            { label: "Duração final", value: (v) => segundos(TOTAL - cortes(v).reduce((s, c) => s + c.ate - c.de, 0)), primary: true },
            { label: "Como soa", value: (v) => (v < 0.2 ? "robótico" : v <= 0.3 ? "natural" : "folgado") },
          ]}
          assumption="Take de exemplo, desenhado aqui. A faixa de 0,2 a 0,3 s é a do manual. Medido no repo: take de 7 s com 3 s de silêncio e --margin 0.2s vira 4,43 s."
        />
      </div>
      </div>
      <div className="mt-6 rounded-tile bg-casa-bg p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-casa-mono text-casa-sm text-casa-fg-2">
          <span>aula-03.mov</span>
          <span data-duracao className="tabular-nums text-casa-fg">{segundos(duracao)}</span>
        </div>
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="mt-3 h-24 w-full sm:h-44" aria-hidden="true">
          <path d={traco(false)} stroke="var(--casa-fg)" className="[stroke-width:1.25px] sm:[stroke-width:2.5px]" vectorEffect="non-scaling-stroke" fill="none" />
          <path d={traco(true)} stroke="var(--destructive)" opacity={1 - p} className="[stroke-width:1.25px] sm:[stroke-width:2.5px]" vectorEffect="non-scaling-stroke" fill="none" />
        </svg>
        <div className="relative mt-2 h-2 overflow-hidden sm:h-14" aria-hidden="true">
          {FALAS.map((f) => {
            const de = posicao(f.de);
            const ate = posicao(f.ate);
            return (
              <span
                key={f.de}
                style={{ left: `${de}%`, width: `${ate - de}%` }}
                className="absolute inset-y-0 overflow-hidden rounded-[4px] bg-casa-tile-2 text-casa-sm leading-4 text-casa-fg-2 sm:p-1.5"
              >
                <span className="hidden sm:inline">{f.texto}</span>
              </span>
            );
          })}
        </div>
        <ul className="sr-only">
          {FALAS.map((f) => (
            <li key={f.de}>{f.texto}</li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Acao onClick={() => setCortado((v) => !v)} data-acao="editor">
            {cortado ? "Voltar ao bruto" : "Cortar o silêncio"}
          </Acao>
          <code className="min-w-0 max-w-full overflow-x-auto whitespace-nowrap font-casa-mono text-casa-sm text-casa-fg-2">
            auto-editor take.mp4 --margin {margem.toFixed(2)}s -o take-clean.mp4
          </code>
        </div>
      </div>
    </div>
  );
}

/* ---- site-reels ---- */

const CENAS = {
  abertura: {
    rotulo: "Abertura",
    codigo: `{
  name: "01-abertura",
  path: "/",
  trim: 0.6,
  async act(page, { wait }) {
    await page.reload({ waitUntil: "domcontentloaded" })
    await wait(3000)
  },
}`,
  },
  rolagem: {
    rotulo: "Rolagem",
    codigo: `{
  name: "02-rolagem",
  path: "/",
  async act(page, { scrollThrough }) {
    await scrollThrough(page, null, 3000, 0, 1)
  },
}`,
  },
  produto: {
    rotulo: "Produto",
    codigo: `{
  name: "03-produto",
  path: "/",
  async prepare(page, { scrollTo, wait }) {
    await scrollTo(page, "#produto", 800)
    await wait(500)
  },
  async act(page, { wait }) {
    await wait(3000)
  },
}`,
  },
};
type CenaId = keyof typeof CENAS;

/* Duração da rolagem filmada: movimento longo e deliberado de propósito. */
const FILMAGEM_MS = 3000;

/** O site gravado. Mede em `cqw`, então cabe igual no palco e na miniatura. */
function MiniSite({ deslocamento, entrou }: { deslocamento: number; entrou: boolean }) {
  return (
    <div className="[container-type:inline-size] absolute inset-0 overflow-hidden bg-casa-bg">
      <div
        style={{
          transform: `translateY(${-deslocamento}%)`,
          transition: `transform ${FILMAGEM_MS}ms var(--ease-in-out)`,
        }}
        className="p-[5cqw]"
      >
        <div
          style={{
            opacity: entrou ? 1 : 0,
            transition: `opacity 1000ms var(--ease-out)`,
          }}
        >
          <p className="text-[6.5cqw] font-medium leading-[1.05] text-casa-fg">Cardume</p>
          <p className="mt-[1.5cqw] max-w-[60cqw] text-[2.4cqw] leading-[1.35] text-casa-fg-2">
            Marca, site e mockup no mesmo lugar.
          </p>
          <span className="mt-[2.5cqw] inline-block rounded-[1cqw] bg-casa-cta px-[2.5cqw] py-[1.2cqw] text-[2.2cqw] text-casa-cta-fg">
            Começar
          </span>
        </div>
        <div className="mt-[6cqw] grid h-[30cqw] grid-cols-3 gap-[1.5cqw]">
          <span className="col-span-2 rounded-[1.5cqw] bg-casa-tile-2" />
          <span className="rounded-[1.5cqw] bg-casa-tile" />
        </div>
        <div className="mt-[6cqw] grid grid-cols-4 gap-[1.5cqw]">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <span key={i} className="h-[14cqw] rounded-[1cqw] bg-casa-tile" />
          ))}
        </div>
        <p className="mt-[6cqw] text-[4cqw] font-medium text-casa-fg">Pronto pra publicar</p>
      </div>
    </div>
  );
}

const POSE: Record<CenaId, { inicio: number; fim: number }> = {
  abertura: { inicio: 0, fim: 0 },
  rolagem: { inicio: 0, fim: 62 },
  produto: { inicio: 26, fim: 26 },
};

export function DemoReels({ cabeca }: { cabeca: React.ReactNode }) {
  const [cena, setCena] = React.useState<CenaId>("rolagem");
  const [gravando, setGravando] = React.useState(false);
  const [desloca, setDesloca] = React.useState(0);
  const [entrou, setEntrou] = React.useState(true);
  const [clipes, setClipes] = React.useState<CenaId[]>([]);
  const seq = useSequencia();
  const menos = useMenosMovimento();

  const gravar = () => {
    seq.limpar();
    const pose = POSE[cena];
    if (menos) {
      setDesloca(pose.fim);
      setClipes((c) => [...c.filter((x) => x !== cena), cena]);
      return;
    }
    setDesloca(pose.inicio);
    setEntrou(cena !== "abertura");
    setGravando(true);
    seq.depois(120, () => {
      setDesloca(pose.fim);
      setEntrou(true);
    });
    seq.depois(FILMAGEM_MS + 200, () => {
      setGravando(false);
      setClipes((c) => [...c.filter((x) => x !== cena), cena]);
    });
  };

  const trocar = (c: CenaId) => {
    seq.limpar();
    setGravando(false);
    setCena(c);
    setDesloca(POSE[c].inicio);
    setEntrou(true);
  };

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12" data-demo="reels">
      <div className="min-w-0 lg:order-2">
        {cabeca}
        <Terminal className="mt-5">{CENAS[cena].codigo}</Terminal>
        <div className="mt-4 min-h-16 min-w-0 font-casa-mono text-casa-sm" aria-live="polite">
          {gravando ? (
            <StatusTicker
              steps={["puppeteer-core abre", "CDP grava a cena", "ffmpeg fecha o MP4"]}
              rotateEverySec={1}
              loop={false}
              showTimer={false}
              variant="etapas"
            />
          ) : clipes.length === 0 ? (
            <p className="py-1 text-casa-fg-2">Os MP4 entram aqui.</p>
          ) : null}
          {!gravando ? (
            <ul>
              {clipes.map((c) => (
                <li key={c} data-clipe={c} className="flex items-center gap-3 border-b border-casa-line py-2">
                  <span className="relative block aspect-video w-20 shrink-0 overflow-hidden rounded-[6px]">
                    <MiniSite deslocamento={POSE[c].fim} entrou />
                  </span>
                  <span className="min-w-0 text-casa-fg-2">
                    <span className="text-casa-fg">{CENAS[c].codigo.match(/name: "([^"]+)"/)?.[1]}.mp4</span>
                    <br />
                    x264, 1080p
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="min-w-0 lg:order-1">
      <div className="relative aspect-video overflow-hidden rounded-tile bg-casa-tile-2">
        <div className="absolute inset-x-0 top-0 flex h-8 items-center gap-2 px-3">
          <span className={cx("size-2 rounded-[2px]", gravando ? "bg-[color:var(--destructive)]" : "bg-casa-fg-3")} />
          <span className="truncate font-casa-mono text-casa-sm text-casa-fg-2" data-rec>
            {gravando ? "gravando 1920×1080, 30 fps" : "localhost:3100"}
          </span>
        </div>
        <div className="absolute inset-x-1.5 bottom-1.5 top-8 overflow-hidden rounded-[14px]">
          <MiniSite deslocamento={desloca} entrou={entrou} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Acao onClick={gravar} disabled={gravando} data-acao="reels">
          {gravando ? "Gravando" : "Gravar a cena"}
        </Acao>
        <SegmentedControl
          aria-label="Escolher a cena"
          value={cena}
          onChange={trocar}
          options={(Object.keys(CENAS) as CenaId[]).map((c) => ({ value: c, label: CENAS[c].rotulo }))}
          size="sm"
          className="w-full max-w-xs"
        />
      </div>

      </div>
    </div>
  );
}

/* ---- visant-premiere-editor ---- */

const FPS = 24;
/** Plano de corte. O primeiro `src_in_f` é o exemplo do próprio premiere_xml.py. */
const PLANO = [
  { id: "a", file: "aula.mov", src_in_f: 221, src_out_f: 365 },
  { id: "b", file: "aula.mov", src_in_f: 490, src_out_f: 610 },
  { id: "c", file: "card.png", still: 3 },
  { id: "d", file: "aula.mov", src_in_f: 733, src_out_f: 925 },
] as { id: string; file: string; src_in_f?: number; src_out_f?: number; still?: number }[];

/** O que o corte a corte faz: segundos com 4 casas, e o Premiere arredonda pra baixo. */
const pelaMcp = (f: number) => Math.floor(Number((f / FPS).toFixed(4)) * FPS);

export function DemoPremiere({ cabeca }: { cabeca: React.ReactNode }) {
  const [montado, setMontado] = React.useState(true);
  const duracoes = PLANO.map((c) => (c.still ? c.still * FPS : (c.src_out_f ?? 0) - (c.src_in_f ?? 0)));
  const total = duracoes.reduce((a, b) => a + b, 0);
  let cursor = 0;
  const blocos = PLANO.map((c, i) => {
    const de = cursor;
    cursor += duracoes[i];
    return { ...c, de, dur: duracoes[i] };
  });
  const erradas = blocos.filter((b) => b.src_in_f != null && pelaMcp(b.src_in_f) !== b.src_in_f);

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-12" data-demo="premiere">
      <div className="min-w-0">
      {cabeca}
      <Terminal className="mt-5">
        {`"cuts": [\n`}
        {PLANO.map((c) =>
          c.still
            ? `  { "type": "still", "file": "${c.file}", "duration_s": ${c.still} },\n`
            : `  { "file": "${c.file}", "src_in_f": ${c.src_in_f}, "src_out_f": ${c.src_out_f} },\n`,
        )}
        {`]`}
      </Terminal>
      </div>
      <div className="min-w-0 lg:pt-2">
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-casa-sm text-casa-fg-2">Pelo XML</p>
          <div className="relative h-9 overflow-hidden rounded-[6px] bg-casa-tile-2">
            {montado
              ? blocos.map((b) => (
                  <span
                    key={b.id}
                    style={{ left: `${(b.de / total) * 100}%`, width: `${(b.dur / total) * 100}%` }}
                    className="absolute inset-y-1 rounded-[3px] border-x border-casa-tile-2 bg-casa-fg-2"
                  />
                ))
              : null}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-casa-sm text-casa-fg-2">Corte a corte pelo MCP</p>
          <div className="relative h-9 overflow-hidden rounded-[6px] bg-casa-tile-2">
            {montado
              ? blocos.map((b) => (
                  <span
                    key={b.id}
                    style={{
                      left: `${(b.de / total) * 100}%`,
                      width: b.still ? "100%" : `${(b.dur / total) * 100}%`,
                    }}
                    className={cx(
                      "absolute inset-y-1 rounded-[3px] border-x border-casa-tile-2",
                      b.still ? "z-10 bg-[color:var(--destructive)]" : "bg-casa-fg-3",
                    )}
                  >
                    {b.still ? (
                      <span className="block px-2 text-casa-sm leading-7 text-casa-bg">PNG virou 12 h</span>
                    ) : null}
                  </span>
                ))
              : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Acao onClick={() => setMontado((v) => !v)} data-acao="premiere">
          {montado ? "Limpar a linha" : "Montar pelos dois"}
        </Acao>
      </div>
      <ul className={cx("mt-4 font-casa-mono text-casa-sm", ANIMA_COR, montado ? "text-casa-fg-2" : "text-transparent")} aria-hidden={!montado}>
        {erradas.map((b) => (
          <li key={b.id} data-erro-frame>
            frame {b.src_in_f} virou {pelaMcp(b.src_in_f ?? 0)}
          </li>
        ))}
      </ul>
      </div>
    </div>
  );
}
