"use client";

/**
 * /skills/filme: a página é um filme, e a rolagem é o play.
 *
 * Tudo acontece num palco fixo com uma única timeline do GSAP presa à rolagem, em
 * que 1 unidade de tempo vale 1vh. Por isso a duração de cada cena se lê como
 * "quanto a pessoa rola", e voltar a rolagem volta o filme.
 */

import * as React from "react";
import { useDobraAssentada } from "@/lib/rede";
import { Check, Copy } from "lucide-react";
import { CopyCommand, useCopy } from "../copy-command";
import skills from "./skills.generated.json";
import {
  ABERTURA,
  CAPITULOS,
  COMANDO,
  FUNCAO,
  PARES,
  REGRAS_MOTION,
  midia,
  type Par,
  type Tema,
} from "./filme/roteiro";
import { trilhaVideo, type Trilha } from "./filme/quadros";
import "./filme/filme.css";

/*
 * O GSAP só dirige a rolagem: a abertura é CSS puro e pinta sem ele (`.filme:not([data-rodando])`
 * em filme.css). Em Slow 4G os 45 KB dele não podem vir antes da foto da abertura.
 */
const carregarGsap = () =>
  Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ default: gsap }, { ScrollTrigger }]) => {
    gsap.registerPlugin(ScrollTrigger);
    return { gsap, ScrollTrigger };
  });

/* O filme é dirigido pela rolagem: o `duration` do GSAP aqui é trecho da linha do
   tempo, medido em vh rolados. Não são segundos, então os tokens de DUR não se aplicam. */
/* A diferença entre o `bottom` de `.filme-palavra` e o de `.filme-legenda`, em filme.css. */
const FOLGA_DA_LEGENDA = 56;

const VH = {
  fio: 1,
  letra: 0.5,
  rotulo: 3,
  frase: 6,
  legenda: 8,
  regra: 10,
  longo: 14,
  saida: 22,
  letras: 24,
  palavra: 30,
  lajeH: 38,
  lajeV: 40,
} as const;

const estiloTema = (t: Tema) => ({ "--t-bg": t.bg, "--t-fg": t.fg, "--t-fg2": t.fg2 }) as React.CSSProperties;

/** Quanto a rolagem anda por quadro de vídeo, em vh. */
const VH_POR_QUADRO = 1.6;

function Letras({ texto }: { texto: string }) {
  return (
    <>
      <span className="sr-only">{texto}</span>
      <span aria-hidden="true">
        {[...texto].map((c, i) => (
          <span className="c" key={i}>
            <span data-c>{c}</span>
          </span>
        ))}
      </span>
    </>
  );
}

/** `adiada`: a cena fica fora de quadro na abertura, e `loading="lazy"` não ajuda porque o palco cobre a tela. */
function ImagemPar({ par, adiada }: { par: Par; adiada?: boolean }) {
  const fonte = (nome: string, depois = adiada) => (depois ? { "data-src": midia(nome) } : { src: midia(nome) });
  return (
    <div className="filme-imagem par">
      <img {...fonte(`${par.id}-antes.webp`)} alt={`${par.nome} Antes das skills.`} decoding="async" />
      <div className="filme-depois">
        {/* Fora de quadro até a pessoa rolar: desce quando o GSAP chega, não junto com a primeira foto. */}
        <img {...fonte(`${par.id}-depois.webp`, true)} alt={`${par.nome} Depois das skills.`} decoding="async" />
      </div>
      <div className="filme-linha" data-linha />
    </div>
  );
}

function usarMidia(q: string) {
  const [v, setV] = React.useState(() => (typeof window === "undefined" ? false : window.matchMedia(q).matches));
  React.useEffect(() => {
    const m = window.matchMedia(q);
    const f = () => setV(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, [q]);
  return v;
}

const ORDEM = Object.keys(FUNCAO);

function Creditos() {
  return (
    <section className="filme-creditos" aria-label="Todas as skills">
      <h2>As {skills.length} skills</h2>
      <ul>
        {[...(skills as { nome: string; instalar: string }[])]
          .sort((a, b) => ORDEM.indexOf(a.nome) - ORDEM.indexOf(b.nome))
          .map((s) => (
            <li key={s.nome}>
              <span className="funcao">{FUNCAO[s.nome]}</span>
              <span className="nome">{s.nome}</span>
              <CopyCommand text={s.instalar} variant="chip" />
            </li>
          ))}
      </ul>
      <p className="filme-nota">As marcas, os preços e os números dessas telas são de mentira. As skills são de verdade, grátis, com licença MIT.</p>
    </section>
  );
}

/** O botão do corte final: o comando já está gigante na tela, aqui só a ação. */
function BotaoCopiar() {
  const { done, copy } = useCopy(COMANDO);
  const Icone = done ? Check : Copy;
  return (
    <button type="button" className="filme-copiar" onClick={copy} aria-live="polite">
      <Icone size={18} aria-hidden="true" />
      {done ? "Copiado" : "Copiar comando"}
    </button>
  );
}

const TITULO = "Tire a cara de IA da sua interface.";
const SUBTITULO = `${skills.length} skills grátis pro Claude Code. Role a página e veja esta tela ficar limpa.`;
const ETIQUETA = "Antes: um checkout de mentira, do jeito que a IA costuma entregar.";
const PEDIDO = "Depois é só pedir: “tá com cara de IA”.";

function FilmeRolado({ vertical }: { vertical: boolean }) {
  const raiz = React.useRef<HTMLDivElement>(null);
  const [saltar, setSaltar] = React.useState<(id: string) => void>(() => () => {});

  const marcas = React.useMemo(
    () => [
      { id: "abertura", nome: "Abertura", peso: 150 },
      ...CAPITULOS.map((c) => ({ id: c.id, nome: c.palavra, peso: 78 + c.quadros * VH_POR_QUADRO })),
      { id: "move", nome: "Move.", peso: 212 },
      { id: "pares", nome: "Antes e depois", peso: 312 },
      { id: "instalar", nome: "Instalar", peso: 120 },
    ],
    [],
  );

  /* Tela cheia desde o primeiro quadro: o palco sobe por cima do cabeçalho do site, que
     volta nos créditos. A altura é medida porque no celular o cabeçalho tem duas linhas. */
  React.useLayoutEffect(() => {
    const r = raiz.current!;
    r.style.marginTop = "0px";
    r.style.marginTop = `${-(r.getBoundingClientRect().top + window.scrollY)}px`;
  }, []);

  const assentada = useDobraAssentada();
  const [motor, setMotor] = React.useState<Awaited<ReturnType<typeof carregarGsap>> | null>(null);
  React.useEffect(() => {
    if (!assentada) return;
    let vivo = true;
    void carregarGsap().then((m) => {
      if (vivo) setMotor(m);
    });
    return () => {
      vivo = false;
    };
  }, [assentada]);

  React.useEffect(() => {
    if (!motor) return;
    const { gsap, ScrollTrigger } = motor;
    const r = raiz.current!;
    ScrollTrigger.config({ ignoreMobileResize: true });
    const cenas = [...r.querySelectorAll<HTMLElement>(".filme-cena")];
    const trilhas = new Map<number, Trilha>();

    const ctx = gsap.context(() => {
      const fonteBarra = parseFloat(getComputedStyle(r).getPropertyValue("--palavra-barra"));
      const tl = gsap.timeline({ defaults: { ease: "none" }, paused: true });
      const inicio: Record<string, number> = {};
      const faixas: { i: number; ate: number; tema: Tema }[] = [];

      /*
       * Recorte tocado por um número, sem string do GSAP: o navegador devolve
       * `inset(50% 0%)` resumido e o GSAP, lendo isso como início, pareava os valores
       * errado. A fenda abria só de cima e a metade de baixo vinha pronta.
       */
      const recorte = (
        el: HTMLElement,
        de: [number, number, number, number],
        ate: [number, number, number, number],
        duracao: number,
        ease: string,
        em: number,
      ) => {
        const pinta = (k: number) => {
          const v = de.map((d, i) => d + (ate[i]! - d) * k);
          el.style.clipPath = `inset(${v[0]}% ${v[1]}% ${v[2]}% ${v[3]}%)`;
        };
        pinta(0);
        const p = { k: 0 };
        tl.to(p, { k: 1, duration: duracao, ease, onUpdate: () => pinta(p.k) }, em);
      };

      /* Corte em fenda: a cena nova abre do meio, a anterior some quando fechou. */
      const entrarCena = (i: number, t: number) => {
        tl.set(cenas[i]!, { visibility: "visible" }, t);
        recorte(cenas[i]!, [50, 0, 50, 0], [0, 0, 0, 0], 28, "expo.inOut", t);
        tl.set(cenas[i - 1]!, { visibility: "hidden" }, t + 28);
      };

      const dividir = (c: HTMLElement, t: number, dur: number) => {
        const depois = c.querySelector<HTMLElement>(".filme-depois")!;
        const antes = c.querySelector<HTMLElement>("[data-antes]")!;
        const dps = c.querySelector<HTMLElement>("[data-depois]")!;
        if (vertical) {
          /* No celular as duas ficam na tela: a de cima espera, a de baixo sobe. */
          tl.fromTo(depois, { yPercent: 100 }, { yPercent: 0, duration: dur, ease: "power2.out" }, t);
        } else {
          const linha = c.querySelector<HTMLElement>("[data-linha]")!;
          recorte(depois, [0, 100, 0, 0], [0, 0, 0, 0], dur, "power1.inOut", t);
          /* A linha só existe enquanto divide: parada em x=0 ela era um fio branco na borda. */
          tl.fromTo(linha, { left: "0%", autoAlpha: 0 }, { left: "100%", duration: dur, ease: "power1.inOut" }, t);
          tl.to(linha, { autoAlpha: 1, duration: VH.fio }, t);
          tl.to(linha, { autoAlpha: 0, duration: VH.fio }, t + dur - 1);
        }
        tl.set(dps, { autoAlpha: 0 }, 0);
        /* Um rótulo sai antes de o outro entrar: nunca dois na mesma linha. */
        tl.to(antes, { autoAlpha: 0, duration: VH.rotulo }, t + dur * 0.46);
        tl.to(dps, { autoAlpha: 1, duration: VH.rotulo }, t + dur * 0.5);
      };

      let t = 0;
      let n = 0;

      /* Abertura: a laje desce e a tela se conserta. */
      {
        const c = cenas[n]!;
        inicio.abertura = 0;
        tl.set(c, { visibility: "visible" }, 0);
        tl.to(c.querySelectorAll("[data-sai]"), { autoAlpha: 0, y: 24, duration: VH.saida, stagger: 2 }, 6);
        tl.to(c.querySelector(".filme-etiqueta"), { autoAlpha: 0, duration: VH.longo }, 6);
        /* No desktop a tela vem do canto e cresce até encher; no celular a laje só desce. */
        if (vertical) {
          tl.to(c.querySelector(".filme-laje"), { yPercent: 100, duration: VH.lajeV, ease: "power2.inOut" }, 12);
        } else {
          tl.to(c.querySelector(".filme-laje"), { xPercent: -100, duration: VH.lajeH, ease: "power2.inOut" }, 10);
          tl.fromTo(
            c.querySelector(".filme-imagem"),
            { scale: 0.56, x: "23%" },
            { scale: 1, x: "0%", duration: VH.lajeH, ease: "power2.inOut" },
            10,
          );
        }
        tl.fromTo(c.querySelector(".filme-legenda"), { autoAlpha: 0 }, { autoAlpha: 1, duration: VH.legenda }, 44);
        dividir(c, 50, 80);
        t = 150;
        faixas.push({ i: n, ate: t, tema: ABERTURA.tema });
        n++;
      }

      /* Capítulos com vídeo: palavra grande, a cortina sobe, a rolagem dirige os quadros. */
      for (const cap of CAPITULOS) {
        const c = cenas[n]!;
        inicio[cap.id] = t;
        const palavra = c.querySelector<HTMLElement>(".filme-palavra")!;
        const imagem = c.querySelector<HTMLElement>(".filme-imagem")!;
        const dur = cap.quadros * VH_POR_QUADRO;
        entrarCena(n, t);
        tl.fromTo(
          palavra.querySelectorAll("[data-c]"),
          { yPercent: 112 },
          { yPercent: 0, duration: VH.letras, ease: "expo.out", stagger: 2 },
          t + 8,
        );
        const escala = fonteBarra / parseFloat(getComputedStyle(palavra).fontSize);
        recorte(imagem, [100, 0, 0, 0], [0, 0, 0, 0], 30, "expo.inOut", t + 44);
        /* Grande, a palavra fica acima da legenda; encolhida, ela desce e assenta na barra. */
        tl.to(palavra, { scale: escala, y: vertical ? 0 : FOLGA_DA_LEGENDA, duration: VH.palavra, ease: "expo.inOut" }, t + 44);

        const lado = vertical ? "v-" : "h-";
        const trilha = trilhaVideo(
          midia(`${lado}${cap.clipe}.mp4`),
          midia(`e-${lado}${cap.clipe}.webp`),
          midia(`f-${cap.clipe}.webp`),
          30,
        );
        trilha.el.setAttribute("role", "img");
        trilha.el.setAttribute("aria-label", `${cap.skill} corrigindo uma tela. ${cap.legendas.join(" ")}`);
        imagem.append(trilha.el);
        trilhas.set(n, trilha);
        const agulha = { q: 0 };
        tl.to(agulha, { q: cap.quadros - 1, duration: dur, onUpdate: () => trilha.irPara(Math.round(agulha.q)) }, t + 66);

        const frases = c.querySelectorAll<HTMLElement>("[data-frase]");
        frases.forEach((f, j) => {
          if (j === 0) return;
          const em = t + 66 + (dur * j) / frases.length;
          tl.set(f, { autoAlpha: 0 }, 0);
          tl.to(frases[j - 1]!, { autoAlpha: 0, duration: VH.frase }, em);
          tl.to(f, { autoAlpha: 1, duration: VH.frase }, em + 4);
        });
        t += 78 + dur;
        faixas.push({ i: n, ate: t, tema: cap.tema });
        n++;
      }

      /* Move.: a curva. Nenhum reel mostra esta skill, então aqui não tem vídeo. */
      {
        const c = cenas[n]!;
        inicio.move = t;
        entrarCena(n, t);
        tl.fromTo(
          c.querySelectorAll(".filme-palavra [data-c]"),
          { yPercent: 112 },
          { yPercent: 0, duration: VH.letras, ease: "expo.out", stagger: 3 },
          t + 8,
        );
        const curva = c.querySelector<SVGPathElement>("[data-curva]")!;
        const ponto = c.querySelector<SVGCircleElement>("[data-ponto]")!;
        const L = curva.getTotalLength();
        const d = 170;
        tl.fromTo(curva, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: d }, t + 36);
        /* O ponto anda no mesmo comprimento do traço: nunca descola da linha. */
        const px = { l: 0 };
        tl.to(
          px,
          {
            l: L,
            duration: d,
            onUpdate: () => {
              const p = curva.getPointAtLength(px.l);
              ponto.setAttribute("cx", String(p.x));
              ponto.setAttribute("cy", String(p.y));
            },
          },
          t + 36,
        );
        const regras = c.querySelectorAll<HTMLElement>("[data-regra]");
        regras.forEach((f, j) => {
          const em = t + 40 + (d * j) / regras.length;
          tl.fromTo(f, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: VH.regra, ease: "expo.out" }, em);
          if (j < regras.length - 1) tl.to(f, { autoAlpha: 0, duration: VH.frase }, em + d / regras.length - 6);
        });
        t += 212;
        faixas.push({ i: n, ate: t, tema: ABERTURA.tema });
        n++;
      }

      /* Antes e depois: três telas inteiras dividindo. */
      PARES.forEach((par, j) => {
        const c = cenas[n]!;
        if (j === 0) inicio.pares = t;
        entrarCena(n, t);
        dividir(c, t + 24, 70);
        t += 104;
        faixas.push({ i: n, ate: t, tema: par.tema });
        n++;
      });

      /* O corte final: o comando se digita. */
      {
        const c = cenas[n]!;
        inicio.instalar = t;
        entrarCena(n, t);
        tl.fromTo(
          c.querySelectorAll(".filme-palavra [data-c]"),
          { yPercent: 112 },
          { yPercent: 0, duration: VH.letras, ease: "expo.out", stagger: 2 },
          t + 8,
        );
        const letras = c.querySelectorAll(".filme-comando [data-c]");
        tl.fromTo(letras, { autoAlpha: 0 }, { autoAlpha: 1, duration: VH.letra, stagger: 1 }, t + 30);
        const fimTipo = t + 30 + letras.length;
        tl.fromTo(
          c.querySelector(".filme-acoes"),
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: VH.longo, ease: "expo.out" },
          fimTipo,
        );
        t = fimTipo + 30;
        faixas.push({ i: n, ate: t, tema: ABERTURA.tema });
      }

      tl.set({}, {}, t);
      tl.progress(1).progress(0);

      /* O trilho mede exatamente o filme, em vh, mais a tela do próprio palco. */
      const trilho = r.querySelector<HTMLElement>(".filme-trilho")!;
      trilho.style.height = `calc(${t}vh + 100vh)`;

      /* O que depende de onde a agulha está: cor da linha do tempo e carga sob demanda. */
      const palco = r.querySelector<HTMLElement>(".filme-palco")!;
      const cheios = [...r.querySelectorAll<HTMLElement>(".filme-marca > i")];
      const segmentos = marcas.map((m, i) => {
        const prox = marcas[i + 1];
        return { de: inicio[m.id]!, ate: prox ? inicio[prox.id]! : t };
      });
      let atual = -1;
      let jaAndou = false;
      const aplicar = () => {
        const agora = tl.time();
        segmentos.forEach((s, i) => {
          cheios[i]!.style.transform = `scaleX(${Math.max(0, Math.min(1, (agora - s.de) / (s.ate - s.de)))})`;
        });
        const f = faixas.find((x) => agora < x.ate) ?? faixas[faixas.length - 1]!;
        const andou = agora > 0 && !jaAndou;
        if (f.i === atual && !andou) return;
        jaAndou = agora > 0;
        atual = f.i;
        palco.style.setProperty("--tempo-fg", f.tema.fg);
        cenas.forEach((cena, i) => {
          if (Math.abs(i - atual) > 1) return;
          cena.querySelectorAll<HTMLImageElement>("img[data-src]").forEach((img) => {
            img.src = img.dataset.src!;
            img.removeAttribute("data-src");
          });
        });
        for (const [i, tr] of trilhas) {
          const d = Math.abs(i - atual);
          if (d <= 1) {
            tr.preparar();
            /* Na abertura ninguém rolou: o vídeo do capítulo seguinte só desce quando o filme anda. */
            if (agora > 0) tr.carregar();
          }
          /* Só o celular devolve o vídeo: voltar a rolagem no desktop não pode recarregar nada. */
          else if (vertical && d > 2) tr.soltar();
        }
      };
      tl.eventCallback("onUpdate", aplicar);

      const st = ScrollTrigger.create({
        trigger: trilho,
        start: "top top",
        end: "bottom bottom",
        animation: tl,
        scrub: 0.35,
      });
      aplicar();
      ScrollTrigger.refresh();
      /* Só aqui: até este ponto quem desenha a abertura é a CSS, e não pode haver quadro sem nenhum dos dois. */
      r.dataset.rodando = "";

      /* Corte seco, sem atravessar o filme. O fim da cena é onde o comando já está inteiro. */
      setSaltar(() => (id: string) => {
        const alvo = id === "abertura" ? 0 : id === "instalar" ? t : inicio[id]! + 30;
        window.scrollTo({ top: st.start + ((st.end - st.start) * alvo) / t });
        ScrollTrigger.update();
        st.getTween()?.progress(1);
      });
    }, r);

    return () => {
      delete r.dataset.rodando;
      ctx.revert();
      for (const tr of trilhas.values()) {
        tr.soltar();
        tr.el.remove();
      }
    };
  }, [vertical, marcas, motor]);

  return (
    <div ref={raiz} role="main" className="filme casa dark" data-vertical={vertical}>
      <div className="filme-trilho">
        <div className="filme-palco">
          <div className="filme-cenas">
          <section className="filme-cena" style={estiloTema(ABERTURA.tema)}>
            <ImagemPar par={ABERTURA} />
            <p className="filme-etiqueta">{ETIQUETA}</p>
            <div className="filme-laje">
              <h1 className="filme-titulo" data-sai>
                {TITULO}
              </h1>
              <p className="filme-sub" data-sai>
                {SUBTITULO}
              </p>
              <button type="button" className="filme-copiar" data-sai onClick={() => saltar("instalar")}>
                Instalar as skills
              </button>
            </div>
            <div className="filme-rotulo" data-antes>
              Antes
            </div>
            <div className="filme-rotulo" data-depois>
              Depois
            </div>
            <div className="filme-legenda">
              <span className="filme-frase">{ABERTURA.nome}</span>
            </div>
          </section>

          {CAPITULOS.map((c) => (
            <section className="filme-cena" key={c.id} style={estiloTema(c.tema)}>
              <div className="filme-imagem" />
              <h2 className="filme-palavra">
                <Letras texto={c.palavra} />
              </h2>
              <div className="filme-legenda">
                <div className="pilha">
                  {c.legendas.map((l) => (
                    <span className="filme-frase" data-frase key={l}>
                      {l}
                    </span>
                  ))}
                </div>
                <span className="filme-mono">
                  {c.skill}
                  {c.nota ? `. ${c.nota}` : ""}
                </span>
              </div>
            </section>
          ))}

          <section className="filme-cena" style={estiloTema(ABERTURA.tema)}>
            <div className="filme-regras">
              {REGRAS_MOTION.map((l) => (
                <span className="filme-regra" data-regra key={l}>
                  {l}
                </span>
              ))}
            </div>
            <svg className="filme-curva" viewBox="0 0 100 100" aria-hidden="true">
              <path className="eixo" d="M0 0 V100 H100" />
              <path data-curva d="M0 100 C23 0 32 0 100 0" />
              <circle data-ponto r="1.6" cx="0" cy="100" fill="currentColor" />
            </svg>
            <h2 className="filme-palavra">
              <Letras texto="Move." />
            </h2>
            <div className="filme-legenda">
              <span className="filme-frase">A curva padrão da skill.</span>
              <span className="filme-mono">visant-motion</span>
            </div>
          </section>

          {PARES.map((p) => (
            <section className="filme-cena" key={p.id} style={estiloTema(p.tema)}>
              <ImagemPar par={p} adiada />
              <div className="filme-rotulo" data-antes>
                Antes
              </div>
              <div className="filme-rotulo" data-depois>
                Depois
              </div>
              <div className="filme-legenda">
                <span className="filme-frase">{p.nome}</span>
              </div>
            </section>
          ))}

          <section className="filme-cena" style={estiloTema(ABERTURA.tema)}>
            <div className="filme-fim">
              <p className="filme-comando" aria-label={COMANDO}>
                {[...COMANDO].map((ch, i) => (
                  <React.Fragment key={i}>
                    <span data-c aria-hidden="true">
                      {ch}
                    </span>
                    {ch === "/" && <wbr />}
                  </React.Fragment>
                ))}
              </p>
              <div className="filme-acoes">
                <BotaoCopiar />
              </div>
            </div>
            <h2 className="filme-palavra">
              <Letras texto="Instala." />
            </h2>
            <div className="filme-legenda">
              <span className="filme-frase">{PEDIDO}</span>
              <span className="filme-mono">Claude Code</span>
            </div>
          </section>
          </div>

          <nav className="filme-tempo" aria-label="Capítulos do filme">
            {marcas.map((m) => (
              <button
                type="button"
                className="filme-marca"
                data-marca={m.id}
                key={m.id}
                title={m.nome}
                aria-label={m.nome}
                style={{ flexGrow: m.peso, flexBasis: 0 }}
                onClick={() => saltar(m.id)}
              >
                <i />
              </button>
            ))}
          </nav>
        </div>
      </div>
      <Creditos />
    </div>
  );
}

function ParParado({ par }: { par: Par }) {
  return (
    <div className="parado-par">
      <figure>
        <img src={midia(`${par.id}-antes.webp`)} alt={`${par.nome} Antes das skills.`} loading="lazy" />
        <figcaption>Antes. {par.nome}</figcaption>
      </figure>
      <figure>
        <img src={midia(`${par.id}-depois.webp`)} alt={`${par.nome} Depois das skills.`} loading="lazy" />
        <figcaption>Depois. {par.nome}</figcaption>
      </figure>
    </div>
  );
}

/** Sem movimento: as mesmas cenas, paradas, na mesma ordem. Nada some. */
function FilmeParado() {
  return (
    <div className="parado casa dark">
      <section className="parado-bloco">
        <h1>{TITULO}</h1>
        <p className="parado-legenda">{skills.length} skills públicas pro Claude Code.</p>
        <ParParado par={ABERTURA} />
      </section>
      {CAPITULOS.map((c) => (
        <section className="parado-bloco" key={c.id}>
          <h2>{c.palavra}</h2>
          <img
            src={midia(`f-${c.clipe}.webp`)}
            alt={`${c.skill} corrigindo uma tela. ${c.legendas.join(" ")}`}
            loading="lazy"
          />
          <p className="parado-legenda">{c.legendas.join(" ")}</p>
          <span className="filme-mono">
            {c.skill}
            {c.nota ? `. ${c.nota}` : ""}
          </span>
        </section>
      ))}
      <section className="parado-bloco">
        <h2>Move.</h2>
        <ol>
          {REGRAS_MOTION.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ol>
        <span className="filme-mono">visant-motion</span>
      </section>
      {PARES.map((p) => (
        <section className="parado-bloco" key={p.id}>
          <ParParado par={p} />
        </section>
      ))}
      <section className="parado-bloco">
        <p className="filme-comando">{COMANDO}</p>
        <div style={{ maxWidth: 360 }}>
          <CopyCommand text={COMANDO} variant="cta" />
        </div>
        <p className="parado-legenda">{PEDIDO}</p>
      </section>
      <Creditos />
    </div>
  );
}

export function Filme() {
  const parado = usarMidia("(prefers-reduced-motion: reduce)");
  const vertical = usarMidia("(max-width: 767px), (orientation: portrait)");
  if (parado) return <FilmeParado />;
  return <FilmeRolado key={String(vertical)} vertical={vertical} />;
}
