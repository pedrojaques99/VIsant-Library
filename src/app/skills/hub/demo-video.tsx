"use client";

/**
 * As três skills de vídeo. Nada aqui é vídeo de verdade: são desenhos fiéis ao que
 * cada ferramenta faz. Ao nascer, a coisa acontecendo. Parâmetro e código na folha.
 */

import * as React from "react";
import { SimSlider } from "../../../../registry/visant/ui/sim-slider";
import { SegmentedControl } from "../../../../registry/visant/ui/segmented-control";
import { Acao, cx, Dobra, Terminal, useAoEntrar, useMenosMovimento, useSequencia } from "./base";
import { fotoPequena } from "./fotos";

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

export function DemoEditor() {
  const [margem, setMargem] = React.useState(0.25);
  const [cortado, setCortado] = React.useState(false);
  const [p, setP] = React.useState(0);
  const raf = React.useRef(0);
  const pAtual = React.useRef(0);
  const seq = useSequencia();
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
      const u = Math.min(1, (agora - inicio) / 900);
      const e = 1 - (1 - u) ** 3;
      pAtual.current = de + (alvo - de) * e;
      setP(pAtual.current);
      if (u < 1) raf.current = requestAnimationFrame(passo);
    };
    raf.current = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf.current);
  }, [cortado, menos]);

  const palco = useAoEntrar<HTMLDivElement>(() => seq.depois(1100, () => setCortado(true)));

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
    <Dobra
      nome="visant-video-editor"
      faixa
      como={
        <>
          <p>Decupa o bruto, tira o silêncio sem comer palavra, nivela o áudio e marca os capítulos. A lista de cortes passa por você antes de qualquer render.</p>
          <SimSlider
            className="mt-3 [&]:p-3"
            style={{ "--muted": "var(--casa-tile)", "--secondary": "var(--casa-tile)", "--card": "transparent", "--border": "transparent" } as React.CSSProperties}
            label="Respiro em volta da fala"
            min={0}
            max={0.5}
            step={0.05}
            defaultValue={margem}
            format={(v) => `${v.toFixed(2).replace(".", ",")} s`}
            onValueChange={setMargem}
            outputs={[{ label: "Soa", value: (v) => (v < 0.2 ? "robótico" : v <= 0.3 ? "natural" : "folgado") }]}
            assumption="Take de exemplo, desenhado aqui. Medido no repo: 7 s com 3 s de silêncio e --margin 0.2s vira 4,43 s."
          />
          <Terminal>auto-editor take.mp4 --margin {margem.toFixed(2)}s -o take-clean.mp4</Terminal>
        </>
      }
    >
      <div ref={palco} className="flex min-w-0 flex-col gap-3" data-demo="editor">
        <div className="rounded-tile bg-casa-bg p-4 lg:p-8">
          <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="h-44 w-full lg:h-72" aria-hidden="true">
            <path d={traco(false)} stroke="var(--casa-fg)" className="[stroke-width:1.25px] lg:[stroke-width:2.5px]" vectorEffect="non-scaling-stroke" fill="none" />
            <path d={traco(true)} stroke="var(--destructive)" opacity={1 - p} className="[stroke-width:1.25px] lg:[stroke-width:2.5px]" vectorEffect="non-scaling-stroke" fill="none" />
          </svg>
          <div className="relative mt-2 h-2 overflow-hidden lg:h-11" aria-hidden="true">
            {FALAS.map((f) => {
              const de = posicao(f.de);
              const ate = posicao(f.ate);
              return (
                <span key={f.de} style={{ left: `${de}%`, width: `${ate - de}%` }} className="absolute inset-y-0 overflow-hidden whitespace-nowrap rounded-[4px] bg-casa-tile-2 text-casa-sm text-casa-fg-2 lg:p-1.5">
                  <span className="hidden lg:inline">{f.texto}</span>
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex min-h-11 items-center justify-between gap-3">
          <p data-duracao className="text-[2rem] font-medium leading-none tabular-nums" aria-live="off">
            {segundos(duracao)}
          </p>
          <Acao
            onClick={() => {
              seq.limpar();
              setCortado((v) => !v);
            }}
            secundaria={cortado}
            data-acao="editor"
          >
            {cortado ? "Bruto" : "Cortar"}
          </Acao>
        </div>
      </div>
    </Dobra>
  );
}

/* ---- site-reels ---- */

const CENAS = {
  abertura: {
    rotulo: "Abertura",
    arquivo: "01-abertura",
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
    arquivo: "02-rolagem",
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
    arquivo: "03-produto",
    codigo: `{
  name: "03-produto",
  path: "/",
  async prepare(page, { scrollTo, wait }) {
    await scrollTo(page, "#produto", 800)
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

/** O site gravado: três telas empilhadas, rolando dentro da janela. */
function MiniSite({ deslocamento, entrou }: { deslocamento: number; entrou: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-casa-bg">
      <div style={{ transform: `translateY(${-deslocamento}%)`, transition: `transform ${FILMAGEM_MS}ms var(--ease-in-out)`, opacity: entrou ? 1 : 0 }}>
        {[fotoPequena("landing-d"), fotoPequena("mata-d"), fotoPequena("pauta-d")].map((src) => (
          <img key={src} src={src} alt="" loading="lazy" className="block w-full" />
        ))}
      </div>
    </div>
  );
}

const POSE: Record<CenaId, { inicio: number; fim: number }> = {
  abertura: { inicio: 0, fim: 0 },
  rolagem: { inicio: 0, fim: 62 },
  produto: { inicio: 33, fim: 33 },
};

export function DemoReels() {
  const [cena, setCena] = React.useState<CenaId>("rolagem");
  const [gravando, setGravando] = React.useState(false);
  const [desloca, setDesloca] = React.useState(0);
  const [entrou, setEntrou] = React.useState(true);
  const [clipes, setClipes] = React.useState<CenaId[]>([]);
  const seq = useSequencia();
  const menos = useMenosMovimento();

  const gravar = (c: CenaId) => {
    seq.limpar();
    const pose = POSE[c];
    const guardar = () => setClipes((l) => [...l.filter((x) => x !== c), c]);
    if (menos) {
      setDesloca(pose.fim);
      guardar();
      return;
    }
    setDesloca(pose.inicio);
    setEntrou(c !== "abertura");
    setGravando(true);
    seq.depois(120, () => {
      setDesloca(pose.fim);
      setEntrou(true);
    });
    seq.depois(FILMAGEM_MS + 200, () => {
      setGravando(false);
      guardar();
    });
  };
  const palco = useAoEntrar<HTMLDivElement>(() => gravar("rolagem"));

  return (
    <Dobra
      nome="site-reels"
      como={
        <>
          <p>Você escreve as cenas em código, o Chrome grava e sai um MP4 1080p pronto pro deck. Sem gravador de tela.</p>
          <Terminal>{CENAS[cena].codigo}</Terminal>
        </>
      }
    >
      <div ref={palco} className="flex min-w-0 flex-col gap-3 lg:mx-auto lg:w-full lg:max-w-2xl" data-demo="reels">
        <div className="relative aspect-video overflow-hidden rounded-tile bg-casa-tile-2">
          <div className="absolute left-3 top-2 z-10 flex h-5 items-center gap-2" data-rec={gravando}>
            <span className={cx("size-2 rounded-[2px]", gravando ? "bg-[color:var(--destructive)]" : "bg-casa-fg-3")} aria-hidden="true" />
            {gravando ? <span className="font-casa-mono text-casa-sm text-casa-fg-2">REC</span> : null}
          </div>
          <div className="absolute inset-x-1.5 bottom-1.5 top-8 overflow-hidden rounded-[14px]">
            <MiniSite deslocamento={desloca} entrou={entrou} />
          </div>
        </div>
        {/* Três vagas desde o começo: o MP4 entra na dele, sem empurrar nada. */}
        <ul className="grid grid-cols-3 gap-2" aria-live="polite">
          {(Object.keys(CENAS) as CenaId[]).map((c) => (
            <li key={c} data-clipe={clipes.includes(c) ? c : undefined} className="min-w-0">
              <span className="relative block aspect-video overflow-hidden rounded-[8px] bg-casa-tile">
                {clipes.includes(c) ? <MiniSite deslocamento={POSE[c].fim} entrou /> : null}
              </span>
              <span className={cx("mt-1 block truncate font-casa-mono text-casa-sm", clipes.includes(c) ? "text-casa-fg-2" : "text-casa-fg-3")}>{CENAS[c].arquivo}</span>
            </li>
          ))}
        </ul>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <SegmentedControl
            aria-label="Escolher a cena"
            value={cena}
            onChange={(c) => {
              seq.limpar();
              setGravando(false);
              setCena(c);
              setDesloca(POSE[c].inicio);
              setEntrou(true);
            }}
            options={(Object.keys(CENAS) as CenaId[]).map((c) => ({ value: c, label: CENAS[c].rotulo }))}
            className="min-w-0 max-w-xs flex-1 [&_button]:min-h-11"
          />
          <Acao onClick={() => gravar(cena)} disabled={gravando} secundaria={gravando} data-acao="reels">
            Gravar
          </Acao>
        </div>
      </div>
    </Dobra>
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

export function DemoPremiere() {
  const [montado, setMontado] = React.useState(0);
  const seq = useSequencia();
  const menos = useMenosMovimento();
  const duracoes = PLANO.map((c) => (c.still ? c.still * FPS : (c.src_out_f ?? 0) - (c.src_in_f ?? 0)));
  const total = duracoes.reduce((a, b) => a + b, 0);
  let cursor = 0;
  const blocos = PLANO.map((c, i) => {
    const de = cursor;
    cursor += duracoes[i];
    return { ...c, de, dur: duracoes[i], i };
  });
  const errada = blocos.find((b) => b.src_in_f != null && pelaMcp(b.src_in_f) !== b.src_in_f);

  const montar = () => {
    seq.limpar();
    if (menos) return setMontado(PLANO.length);
    setMontado(0);
    PLANO.forEach((_, i) => seq.depois(300 + i * 450, () => setMontado(i + 1)));
  };
  const palco = useAoEntrar<HTMLDivElement>(montar);

  const Trilha = ({ nome, mcp }: { nome: string; mcp?: boolean }) => (
    <div className="flex items-center gap-3">
      <span className="w-8 shrink-0 font-casa-mono text-casa-sm text-casa-fg-2">{nome}</span>
      <div className="relative h-20 min-w-0 flex-1 overflow-hidden rounded-[8px] bg-casa-tile-2 lg:h-32">
        {/* Pelo MCP o still vira 12 h: vai até o fim da régua, e o que vem depois dele nem aparece. */}
        {blocos.filter((b) => b.i < montado && (!mcp || b.i <= blocos.findIndex((c) => c.still))).map((b) => (
          <span
            key={b.id}
            style={{ left: `${(b.de / total) * 100}%`, width: `${mcp && b.still ? 100 - (b.de / total) * 100 : (b.dur / total) * 100}%` }}
            className={cx(
              "absolute inset-y-1.5 rounded-[4px] border-x border-casa-tile-2",
              mcp && b.still ? "z-10 bg-[color:var(--destructive)]" : mcp ? "bg-casa-fg-3" : "bg-casa-fg-2",
            )}
          >
            {mcp && b.still ? <span className="block whitespace-nowrap p-2 text-casa-base font-medium text-casa-bg">12 h</span> : null}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <Dobra
      nome="visant-premiere-editor"
      como={
        <>
          <p>Transforma um JSON de cortes num XML que o Premiere importa no frame exato. Corte a corte pelo MCP, o Premiere arredonda pra baixo e um PNG vira 12 horas.</p>
          <Terminal>
            {`"cuts": [\n`}
            {PLANO.map((c) => (c.still ? `  { "type": "still", "file": "${c.file}", "duration_s": ${c.still} },\n` : `  { "file": "${c.file}", "src_in_f": ${c.src_in_f}, "src_out_f": ${c.src_out_f} },\n`))}
            {`]`}
          </Terminal>
        </>
      }
    >
      <div ref={palco} className="flex min-w-0 flex-col gap-4 lg:mx-auto lg:w-full lg:max-w-4xl" data-demo="premiere">
        <Trilha nome="XML" />
        <Trilha nome="MCP" mcp />
        <div className="flex min-h-11 items-center justify-between gap-3">
          <p className="font-casa-mono text-casa-base text-casa-fg-2" data-erro-frame>
            {errada && montado > 0 ? `${errada.src_in_f} vira ${pelaMcp(errada.src_in_f ?? 0)}` : ""}
          </p>
          <Acao secundaria onClick={montar} data-acao="premiere">
            De novo
          </Acao>
        </div>
      </div>
    </Dobra>
  );
}
