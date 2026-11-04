"use client";

/**
 * O estúdio de mockups: o palco é a obra, o painel é a ferramenta.
 *
 * Arrastar o palco gira o aparelho, e o painel acompanha: a mão e o número falam da mesma
 * coisa. Tudo que dá pra deduzir é deduzido: subir um vídeo põe a cena em movimento com a
 * duração dele; pedir fundo transparente troca MP4 por imagem; as cores da tela viram amostras.
 */

import * as React from "react";
import { useMotionValue, useMotionValueEvent, motion } from "motion/react";
import { Download, Pause, Play, Plus, Redo2, Undo2, X } from "lucide-react";

import { DeviceFrame } from "../../../registry/visant/ui/device-frame";
import { SensorDial } from "../../../registry/visant/ui/sensor-dial";
import { Amostras, CampoCor, FoneMini, Miniatura, Miniaturas, Pasta, Segmentos, Slider, Vetor } from "./controles";
import { codecDisponivel, exportarImagem, exportarVideo } from "./exportar";
import {
  ACABAMENTOS,
  ASPECTO,
  CORES,
  GIF,
  FOTOS_DE_FUNDO,
  MOVIMENTOS,
  PADRAO,
  POSES,
  PRESETS,
  TELAS,
  animado,
  dimensoes,
  dimensoesGif,
  emLoop,
  fundoCss,
  movimentoEm,
  paletaDe,
  type Acabamento,
  type Cena,
  type Proporcao,
  type Tela,
  type TipoMovimento,
} from "./modelo";
import "./estudio.css";

const CHAVE = "visant:mockup";
// A largura lógica do quadro. A saída é escala dela, então o desenho não muda com a resolução.
const BASE = 1080;
const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const lerSalvo = (): Cena => {
  try {
    const s = localStorage.getItem(CHAVE);
    return s ? { ...PADRAO, ...JSON.parse(s) } : PADRAO;
  } catch {
    return PADRAO;
  }
};

/** Desfazer por pacote: um arrasto inteiro é um passo, não sessenta. */
function useHistorico() {
  const [cena, setCenaCru] = React.useState<Cena>(lerSalvo);
  const passado = React.useRef<Cena[]>([]);
  const futuro = React.useRef<Cena[]>([]);
  const pacote = React.useRef<Cena | null>(null);
  const relogio = React.useRef(0);
  const segurando = React.useRef(false);
  const [, marcar] = React.useReducer((n: number) => n + 1, 0);

  const fechar = React.useCallback(() => {
    // Sem pacote aberto não há o que fechar: soltar o clique do próprio Desfazer não pode apagar o futuro.
    if (segurando.current || !pacote.current) return;
    passado.current = [...passado.current.slice(-49), pacote.current];
    pacote.current = null;
    futuro.current = [];
    marcar();
  }, []);
  // Enquanto o dedo está na tela, o gesto é um passo só, por mais devagar que ele vá.
  React.useEffect(() => {
    const desce = () => (segurando.current = true);
    const sobe = () => {
      segurando.current = false;
      window.clearTimeout(relogio.current);
      relogio.current = window.setTimeout(fechar, 120);
    };
    window.addEventListener("pointerdown", desce, true);
    window.addEventListener("pointerup", sobe, true);
    window.addEventListener("pointercancel", sobe, true);
    return () => {
      window.removeEventListener("pointerdown", desce, true);
      window.removeEventListener("pointerup", sobe, true);
      window.removeEventListener("pointercancel", sobe, true);
    };
  }, [fechar]);

  const setCena = React.useCallback((f: (c: Cena) => Cena) => {
    setCenaCru((c) => {
      const n = f(c);
      if (n === c) return c;
      if (!pacote.current) pacote.current = c;
      window.clearTimeout(relogio.current);
      relogio.current = window.setTimeout(fechar, 350);
      return n;
    });
  }, [fechar]);
  const andar = (de: React.MutableRefObject<Cena[]>, para: React.MutableRefObject<Cena[]>) => {
    const alvo = de.current[de.current.length - 1];
    if (!alvo) return;
    de.current = de.current.slice(0, -1);
    setCenaCru((c) => {
      para.current = [...para.current, c];
      return alvo;
    });
    marcar();
  };
  return {
    cena,
    setCena,
    desfazer: () => andar(passado, futuro),
    refazer: () => andar(futuro, passado),
    podeDesfazer: passado.current.length > 0,
    podeRefazer: futuro.current.length > 0,
  };
}

export function Estudio() {
  const { cena, setCena, desfazer, refazer, podeDesfazer, podeRefazer } = useHistorico();
  const [enviadas, setEnviadas] = React.useState<Tela[]>([]);
  const [paleta, setPaleta] = React.useState<string[]>([]);
  const [tocando, setTocando] = React.useState(true);
  const [estado, setEstado] = React.useState<{ feito: number; total: number; resta: number } | null>(null);
  const [aviso, setAviso] = React.useState<string | null>(null);
  const [semMp4, setSemMp4] = React.useState(false);

  const telas = React.useMemo(() => [...enviadas, ...TELAS], [enviadas]);
  const tela = telas.find((t) => t.id === cena.telaId) ?? TELAS[0];
  const anima = animado(cena);
  const { w: baseW, h: baseH } = dimensoes(cena.proporcao, BASE);
  const transparente = cena.fundo.modo === "nenhum";

  const edita = React.useCallback(<K extends keyof Cena>(chave: K, valor: Cena[K] | ((v: Cena[K]) => Cena[K])) => {
    setCena((c) => ({ ...c, [chave]: typeof valor === "function" ? (valor as (v: Cena[K]) => Cena[K])(c[chave]) : valor }));
  }, [setCena]);

  React.useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(cena));
    } catch {
      /* sem armazenamento: vale só nesta visita */
    }
  }, [cena]);

  React.useEffect(() => {
    let vivo = true;
    void codecDisponivel("mp4", 1080, 1920).then((c) => vivo && setSemMp4(!c));
    return () => {
      vivo = false;
    };
  }, []);

  // A tela sugere o fundo: as cores dela viram amostras no painel.
  React.useEffect(() => {
    const fonte = tela.poster ?? (tela.tipo === "imagem" ? tela.url : undefined);
    if (!fonte) return setPaleta(["#8FA39A", "#0B1020"]);
    let vivo = true;
    paletaDe(fonte).then((p) => vivo && setPaleta(p), () => vivo && setPaleta([]));
    return () => {
      vivo = false;
    };
  }, [tela]);

  /* ── O tempo e o que ele move ───────────────────────────────────────── */
  const tempo = useMotionValue(0);
  const rotX = useMotionValue(cena.rot.x);
  const rotY = useMotionValue(cena.rot.y);
  const rotZ = useMotionValue(cena.rot.z);
  const dy = useMotionValue("0%");
  const escala = useMotionValue(1);
  const opacidade = useMotionValue(1);

  const aplicar = React.useCallback(
    (c: Cena, t: number) => {
      const m = movimentoEm(c, t);
      rotX.set(c.rot.x + m.x);
      rotY.set(c.rot.y + m.y);
      rotZ.set(c.rot.z + m.z);
      dy.set(`${m.dy}%`);
      escala.set(m.escala);
      opacidade.set(m.opacidade);
    },
    [rotX, rotY, rotZ, dy, escala, opacidade],
  );
  const cenaAtual = React.useRef(cena);
  cenaAtual.current = cena;
  React.useEffect(() => aplicar(cena, tempo.get()), [cena, aplicar, tempo]);
  useMotionValueEvent(tempo, "change", (t) => aplicar(cenaAtual.current, t));

  const exportando = estado !== null;
  React.useEffect(() => {
    if (!anima || !tocando || exportando || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let antes = performance.now();
    const passo = (agora: number) => {
      const c = cenaAtual.current;
      const t = tempo.get() + (agora - antes) / 1000 / c.movimento.duracao;
      antes = agora;
      // Quem não é loop descansa um instante no fim, pra pose final ser vista antes de recomeçar.
      tempo.set(t >= (emLoop(c) ? 1 : 1.25) ? 0 : t);
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [anima, tocando, exportando, tempo]);
  React.useEffect(() => {
    if (!anima) tempo.set(0);
  }, [anima, tempo]);

  /* ── O palco: encaixe e gesto ───────────────────────────────────────── */
  const palco = React.useRef<HTMLDivElement>(null);
  const quadro = React.useRef<HTMLDivElement>(null);
  const [encaixe, setEncaixe] = React.useState(0.4);
  React.useLayoutEffect(() => {
    const el = palco.current;
    if (!el) return;
    const medir = () => {
      const r = el.getBoundingClientRect();
      setEncaixe(Math.min((r.width - 32) / baseW, (r.height - 32) / baseH));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [baseW, baseH]);

  const gesto = React.useRef<{ x: number; y: number; rot: Cena["rot"]; pos: Cena["pos"]; mover: boolean } | null>(null);
  const noPalco = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      // A peça viva dentro da tela continua sendo dela: o gesto só é do palco fora dos controles.
      if ((e.target as Element).closest("button, input, [role=slider]")) return;
      gesto.current = { x: e.clientX, y: e.clientY, rot: cena.rot, pos: cena.pos, mover: e.altKey || e.shiftKey };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      const g = gesto.current;
      if (!g) return;
      const dx = e.clientX - g.x;
      const dyy = e.clientY - g.y;
      if (g.mover) {
        const k = 100 / (baseW * encaixe);
        edita("pos", { x: Math.round(g.pos.x + dx * k), y: Math.round(g.pos.y + dyy * k) });
      } else {
        const lim = (n: number) => Math.max(-75, Math.min(75, Math.round(n)));
        edita("rot", { ...g.rot, y: lim(g.rot.y + dx * 0.4), x: lim(g.rot.x - dyy * 0.3) });
      }
    },
    onPointerUp: () => (gesto.current = null),
    onPointerCancel: () => (gesto.current = null),
    onWheel: (e: React.WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      edita("tamanho", (v) => Math.max(20, Math.min(120, Math.round(v - e.deltaY * 0.15))));
    },
  };

  /* ── Teclado ────────────────────────────────────────────────────────── */
  React.useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      if (alvo.closest("input, textarea, [role=slider]")) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) refazer();
        else desfazer();
      } else if (e.code === "Space" && !alvo.closest("button") && animado(cenaAtual.current)) {
        e.preventDefault();
        setTocando((v) => !v);
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  });

  /* ── Envio de arquivo ───────────────────────────────────────────────── */
  const seletor = React.useRef<HTMLInputElement>(null);
  const receber = (f: File | undefined) => {
    if (!f) return;
    const video = f.type.startsWith("video/");
    if (!video && !f.type.startsWith("image/")) return setAviso("Envie uma imagem ou um vídeo.");
    const url = URL.createObjectURL(f);
    const id = `arquivo-${Date.now()}`;
    setEnviadas((l) => [{ id, tipo: video ? "video" : "imagem", url, nome: f.name.replace(/\.\w+$/, "").slice(0, 14) || "Arquivo" }, ...l]);
    setAviso(null);
    if (!video) {
      edita("telaId", id);
      return;
    }
    // Vídeo já é movimento: a cena sobe junto, com a duração dele.
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;
    v.onloadedmetadata = () =>
      setCena((c) => ({
        ...c,
        telaId: id,
        movimento: {
          ...c.movimento,
          tipo: c.movimento.tipo === "parado" ? "flutuar" : c.movimento.tipo,
          duracao: Math.max(1, Math.min(30, Math.round(v.duration))),
        },
      }));
    v.onerror = () => setAviso("Não consegui ler esse vídeo.");
  };

  /* ── Exportar ───────────────────────────────────────────────────────── */
  const cancelar = React.useRef<AbortController | null>(null);
  const emVideo = anima && !transparente;
  const { w: saidaW, h: saidaH } = anima && !transparente && cena.saida.video === "gif" ? dimensoesGif(cena.proporcao) : dimensoes(cena.proporcao, cena.saida.largura);
  const nome = `mockup-${cena.proporcao.replace(":", "x")}-${saidaW}x${saidaH}`;
  const formatoVideo = semMp4 && cena.saida.video === "mp4" ? "webm" : cena.saida.video;
  const emGif = emVideo && formatoVideo === "gif";
  const fps = emGif ? GIF.fps : cena.saida.fps;
  const totalQuadros = Math.round(cena.movimento.duracao * fps);
  // Medido em 1080p no Chrome: uns 350 ms por quadro. A conta real assume assim que começar.
  const estimativa = totalQuadros * 0.4 * (emGif ? 1 : (cena.saida.largura / 1080) ** 2);

  const exportar = async () => {
    const el = quadro.current;
    if (!el || exportando) return;
    setAviso(null);
    const q = { el, w: baseW, h: baseH };
    const antes = tempo.get();
    try {
      if (!emVideo) {
        setEstado({ feito: 0, total: 1, resta: 0 });
        await exportarImagem(q, saidaW, cena.saida.imagem, nome);
      } else {
        const ctrl = new AbortController();
        cancelar.current = ctrl;
        setEstado({ feito: 0, total: totalQuadros, resta: estimativa });
        await exportarVideo({
          quadro: q,
          saidaW,
          saidaH,
          duracao: cena.movimento.duracao,
          fps,
          formato: formatoVideo,
          nome,
          irPara: (t) => tempo.set(t),
          onProgresso: (feito, total, resta) => setEstado({ feito, total, resta }),
          sinal: ctrl.signal,
        });
      }
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "A exportação falhou.");
    } finally {
      tempo.set(antes);
      cancelar.current = null;
      setEstado(null);
    }
  };

  const fundo = cena.fundo;
  const mostra = (ativo: boolean) => (ativo ? undefined : ("hidden" as const));

  return (
    <div className="mk-estudio casa">
      <div className="mk-area">
        <div className="mk-palco" ref={palco} data-transparente={transparente || undefined} {...noPalco}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            receber(e.dataTransfer.files[0]);
          }}
        >
          <div className="mk-escala" style={{ width: baseW, height: baseH, transform: `translate(-50%, -50%) scale(${encaixe})` }}>
            <div
              ref={quadro}
              className="mk-quadro"
              style={{ width: baseW, height: baseH, background: fundoCss(fundo) }}
            >
              {fundo.modo === "foto" ? (
                <img src={fundo.foto} alt="" className="mk-foto" style={{ filter: fundo.desfoque ? `blur(${fundo.desfoque}px)` : undefined }} />
              ) : null}
              <Composicao
                cena={cena}
                tela={tela}
                baseW={baseW}
                baseH={baseH}
                rotX={rotX}
                rotY={rotY}
                rotZ={rotZ}
                dy={dy}
                escala={escala}
                opacidade={opacidade}
              />
            </div>
          </div>
          <div className="mk-historico">
            <button type="button" aria-label="Desfazer" disabled={!podeDesfazer} onClick={desfazer}><Undo2 size={15} /></button>
            <button type="button" aria-label="Refazer" disabled={!podeRefazer} onClick={refazer}><Redo2 size={15} /></button>
          </div>
        </div>
        {anima ? (
          <Linha
            tempo={tempo}
            duracao={cena.movimento.duracao}
            tocando={tocando}
            loop={emLoop(cena)}
            onTocar={() => setTocando((v) => !v)}
            onBuscar={(t) => {
              setTocando(false);
              tempo.set(t);
            }}
          />
        ) : null}
      </div>

      <aside className="mk-painel" aria-label="Controles do mockup">
        <div className="mk-rolagem">
          <Pasta titulo="Início">
            <Miniaturas rotulo="Ponto de partida" colunas={4}>
              {PRESETS.map((p) => {
                const f = p.aplica.fundo!;
                return (
                  <Miniatura key={p.id} nome={p.nome} ativa={false} onClick={() => setCena((c) => ({ ...c, ...p.aplica }))}>
                    <span className="mk-arte-fundo" style={f.modo === "foto" ? { backgroundImage: `url(${f.foto})` } : { background: fundoCss(f) }} />
                    <FoneMini rot={p.aplica.rot} classe={p.aplica.acabamento === "prata" ? "mk-fone-claro" : undefined} />
                  </Miniatura>
                );
              })}
            </Miniaturas>
          </Pasta>

          <Pasta titulo="Tela" sujo={cena.telaId !== PADRAO.telaId} onReset={() => edita("telaId", PADRAO.telaId)}>
            <Miniaturas rotulo="Tela do aparelho">
              <button type="button" className="mk-mini mk-enviar" onClick={() => seletor.current?.click()}>
                <span className="mk-mini-arte"><Plus size={16} aria-hidden /></span>
                <span className="mk-mini-nome">Enviar</span>
              </button>
              {telas.map((t) => (
                <Miniatura key={t.id} nome={t.nome} ativa={tela.id === t.id} onClick={() => edita("telaId", t.id)}>
                  {t.tipo === "vivo" ? (
                    <span className="mk-arte-sensor" />
                  ) : t.tipo === "video" && !t.poster ? (
                    <video src={t.url} muted playsInline preload="metadata" className="mk-arte-img" />
                  ) : (
                    <img src={t.poster ?? t.url} alt="" className="mk-arte-img" loading="lazy" />
                  )}
                </Miniatura>
              ))}
            </Miniaturas>
            <input ref={seletor} type="file" accept="image/*,video/*" hidden onChange={(e) => { receber(e.target.files?.[0]); e.target.value = ""; }} />
            {tela.tipo !== "vivo" ? (
              <Segmentos
                rotulo="Ajuste na tela"
                valor={cena.ajuste}
                opcoes={[{ valor: "cover", nome: "Preencher" }, { valor: "contain", nome: "Caber" }]}
                onChange={(v) => edita("ajuste", v)}
              />
            ) : null}
          </Pasta>

          <Pasta
            titulo="Pose"
            sujo={!igual([cena.rot, cena.tamanho, cena.pos, cena.lente], [PADRAO.rot, PADRAO.tamanho, PADRAO.pos, PADRAO.lente])}
            onReset={() => setCena((c) => ({ ...c, rot: PADRAO.rot, tamanho: PADRAO.tamanho, pos: PADRAO.pos, lente: PADRAO.lente }))}
          >
            <Miniaturas rotulo="Pose do aparelho">
              {POSES.map((p) => (
                <Miniatura key={p.id} nome={p.nome} ativa={igual(p.rot, cena.rot)} onClick={() => edita("rot", p.rot)}>
                  <FoneMini rot={p.rot} />
                </Miniatura>
              ))}
            </Miniaturas>
            <Vetor
              rotulo="Rotação"
              partes={(["x", "y", "z"] as const).map((k) => ({
                letra: k.toUpperCase(),
                valor: cena.rot[k],
                min: -180,
                max: 180,
                unidade: "°",
                onChange: (v: number) => edita("rot", (r) => ({ ...r, [k]: v })),
              }))}
            />
            <Slider rotulo="Tamanho" valor={cena.tamanho} min={20} max={120} padrao={PADRAO.tamanho} unidade="%" onChange={(v) => edita("tamanho", v)} />
            <Slider rotulo="Lente" valor={cena.lente} min={18} max={135} padrao={PADRAO.lente} unidade=" mm" onChange={(v) => edita("lente", v)} />
            <Vetor
              rotulo="Posição"
              partes={(["x", "y"] as const).map((k) => ({
                letra: k.toUpperCase(),
                valor: cena.pos[k],
                min: -100,
                max: 100,
                unidade: "%",
                onChange: (v: number) => edita("pos", (p) => ({ ...p, [k]: v })),
              }))}
            />
          </Pasta>

          <Pasta
            titulo="Aparelho"
            sujo={!igual([cena.acabamento, cena.reflexo, cena.sombra], [PADRAO.acabamento, PADRAO.reflexo, PADRAO.sombra])}
            onReset={() => setCena((c) => ({ ...c, acabamento: PADRAO.acabamento, reflexo: PADRAO.reflexo, sombra: PADRAO.sombra }))}
          >
            <div className="mk-linha">
              <span className="mk-rotulo">Acabamento</span>
              <span className="mk-valor">{ACABAMENTOS[cena.acabamento].nome}</span>
            </div>
            <div className="mk-amostras" role="radiogroup" aria-label="Acabamento">
              {(Object.keys(ACABAMENTOS) as Acabamento[]).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={cena.acabamento === k} aria-label={ACABAMENTOS[k].nome} style={{ background: `linear-gradient(135deg, ${ACABAMENTOS[k].borda}, ${ACABAMENTOS[k].corpo})` }} onClick={() => edita("acabamento", k)} />
              ))}
            </div>
            <Slider rotulo="Reflexo" valor={cena.reflexo} min={0} max={30} padrao={PADRAO.reflexo} unidade="%" onChange={(v) => edita("reflexo", v)} />
            <Slider rotulo="Sombra" valor={cena.sombra} min={0} max={100} padrao={PADRAO.sombra} unidade="%" onChange={(v) => edita("sombra", v)} />
          </Pasta>

          <Pasta titulo="Fundo" sujo={!igual(cena.fundo, PADRAO.fundo)} onReset={() => edita("fundo", PADRAO.fundo)}>
            <Segmentos
              rotulo="Tipo de fundo"
              valor={fundo.modo}
              opcoes={[{ valor: "cor", nome: "Cor" }, { valor: "degrade", nome: "Degradê" }, { valor: "foto", nome: "Foto" }, { valor: "nenhum", nome: "Nenhum" }]}
              onChange={(v) => edita("fundo", (f) => ({ ...f, modo: v }))}
            />
            {fundo.modo === "cor" ? (
              <>
                <CampoCor rotulo="Cor" valor={fundo.cor} onChange={(c) => edita("fundo", (f) => ({ ...f, cor: c }))} />
                <Amostras rotulo="Cores" valor={fundo.cor} cores={[...paleta, ...CORES].slice(0, 12)} onChange={(c) => edita("fundo", (f) => ({ ...f, cor: c }))} />
              </>
            ) : null}
            {fundo.modo === "degrade" ? (
              <>
                <div className="mk-barra" style={{ background: `linear-gradient(90deg, ${fundo.a}, ${fundo.b})` }} aria-hidden />
                <CampoCor rotulo="Início" valor={fundo.a} onChange={(c) => edita("fundo", (f) => ({ ...f, a: c }))} />
                <CampoCor rotulo="Fim" valor={fundo.b} onChange={(c) => edita("fundo", (f) => ({ ...f, b: c }))} />
                <Slider rotulo="Ângulo" valor={fundo.angulo} min={0} max={360} padrao={PADRAO.fundo.angulo} unidade="°" onChange={(v) => edita("fundo", (f) => ({ ...f, angulo: v }))} />
                {paleta.length > 1 ? (
                  <button type="button" className="mk-sugestao" onClick={() => edita("fundo", (f) => ({ ...f, a: paleta[0], b: paleta[1] }))}>
                    <span style={{ background: `linear-gradient(90deg, ${paleta[0]}, ${paleta[1]})` }} aria-hidden />
                    Usar as cores da tela
                  </button>
                ) : null}
              </>
            ) : null}
            {fundo.modo === "foto" ? (
              <>
                <Miniaturas rotulo="Foto de fundo" colunas={4}>
                  {FOTOS_DE_FUNDO.map((u) => (
                    <Miniatura key={u} nome={u.split("/").pop()!.replace(/\.\w+$/, "").replace(/^\w+-/, "")} ativa={fundo.foto === u} onClick={() => edita("fundo", (f) => ({ ...f, foto: u }))}>
                      <img src={u} alt="" className="mk-arte-img" loading="lazy" />
                    </Miniatura>
                  ))}
                </Miniaturas>
                <Slider rotulo="Desfoque" valor={fundo.desfoque} min={0} max={60} padrao={0} unidade=" px" onChange={(v) => edita("fundo", (f) => ({ ...f, desfoque: v }))} />
              </>
            ) : null}
          </Pasta>

          <Pasta titulo="Quadro" sujo={cena.proporcao !== PADRAO.proporcao} onReset={() => edita("proporcao", PADRAO.proporcao)}>
            <Miniaturas rotulo="Proporção" colunas={4}>
              {(Object.keys(ASPECTO) as Proporcao[]).map((p) => (
                <Miniatura key={p} nome={p} ativa={cena.proporcao === p} onClick={() => edita("proporcao", p)}>
                  <span className="mk-arte-proporcao" style={{ aspectRatio: String(ASPECTO[p]) }} />
                </Miniatura>
              ))}
            </Miniaturas>
          </Pasta>

          <Pasta titulo="Movimento" sujo={!igual(cena.movimento, PADRAO.movimento)} onReset={() => edita("movimento", PADRAO.movimento)}>
            <Miniaturas rotulo="Movimento">
              {MOVIMENTOS.map((m) => (
                <Miniatura key={m.id} nome={m.nome} ativa={cena.movimento.tipo === m.id} onClick={() => edita("movimento", (v) => ({ ...v, tipo: m.id as TipoMovimento }))}>
                  <FoneMini classe={`mk-anima-${m.id}`} />
                </Miniatura>
              ))}
            </Miniaturas>
            <div className="mk-dependente" hidden={mostra(anima) !== undefined}>
              <Slider rotulo="Duração" valor={cena.movimento.duracao} min={1} max={30} passo={0.5} padrao={PADRAO.movimento.duracao} unidade=" s" casas={1} onChange={(v) => edita("movimento", (m) => ({ ...m, duracao: v }))} />
              <Slider rotulo="Intensidade" valor={cena.movimento.intensidade} min={0} max={100} padrao={PADRAO.movimento.intensidade} unidade="%" onChange={(v) => edita("movimento", (m) => ({ ...m, intensidade: v }))} />
            </div>
          </Pasta>
        </div>

        <footer className="mk-saida">
          <div className="mk-saida-par">
          {emVideo ? (
            <Segmentos
              rotulo="Formato do vídeo"
              valor={formatoVideo}
              opcoes={[{ valor: "mp4", nome: "MP4", desligada: semMp4 }, { valor: "webm", nome: "WebM" }, { valor: "gif", nome: "GIF" }]}
              onChange={(v) => edita("saida", (s) => ({ ...s, video: v }))}
            />
          ) : (
            <Segmentos
              rotulo="Formato da imagem"
              valor={cena.saida.imagem}
              opcoes={[{ valor: "png", nome: "PNG" }, { valor: "webp", nome: "WebP" }]}
              onChange={(v) => edita("saida", (s) => ({ ...s, imagem: v }))}
            />
          )}
          {emGif ? (
            <div className="mk-seg mk-seg-fixo"><span>{saidaW}×{saidaH}</span></div>
          ) : (
          <Segmentos
            rotulo="Resolução"
            valor={String(cena.saida.largura) as "1080" | "1440" | "2160"}
            opcoes={[{ valor: "1080", nome: "1080p" }, { valor: "1440", nome: "2K" }, { valor: "2160", nome: "4K" }]}
            onChange={(v) => edita("saida", (s) => ({ ...s, largura: Number(v) as 1080 | 1440 | 2160 }))}
          />
          )}
          </div>
          {emVideo && !emGif ? (
            <Segmentos
              rotulo="Quadros por segundo"
              valor={String(cena.saida.fps) as "30" | "60"}
              opcoes={[{ valor: "30", nome: "30 fps" }, { valor: "60", nome: "60 fps" }]}
              onChange={(v) => edita("saida", (s) => ({ ...s, fps: Number(v) as 30 | 60 }))}
            />
          ) : null}
          <p className="mk-resumo" aria-live="polite">
            {aviso ??
              (anima && transparente
                ? `Fundo transparente sai como imagem · ${saidaW}×${saidaH}`
                : emVideo
                  ? `${saidaW}×${saidaH} · ${totalQuadros} quadros · cerca de ${duracaoFalada(estimativa)}`
                  : `${saidaW}×${saidaH}${transparente ? " · com transparência" : ""}`)}
          </p>
          {estado && emVideo ? (
            <div className="mk-progresso" role="status">
              <div><span style={{ transform: `scaleX(${estado.feito / estado.total})` }} /></div>
              <p>
                {estado.feito}/{estado.total} · falta {duracaoFalada(estado.resta)}
                <button type="button" aria-label="Cancelar exportação" onClick={() => cancelar.current?.abort()}><X size={13} /></button>
              </p>
            </div>
          ) : (
            <button type="button" className="mk-exportar" disabled={exportando} onClick={exportar}>
              <Download size={15} aria-hidden />
              {exportando ? "Gerando…" : `Exportar ${emVideo ? formatoVideo.toUpperCase() : cena.saida.imagem.toUpperCase()}`}
            </button>
          )}
          <p className="mk-beta">Beta. Testado só no Chrome por enquanto.</p>
        </footer>
      </aside>
    </div>
  );
}

function duracaoFalada(s: number) {
  if (s < 60) return `${Math.max(1, Math.round(s))} s`;
  return `${Math.round(s / 60)} min`;
}

/* ── A composição: o que entra no arquivo ─────────────────────────────── */

type MV = ReturnType<typeof useMotionValue<number>>;

const Composicao = React.memo(function Composicao({
  cena,
  tela,
  baseW,
  baseH,
  rotX,
  rotY,
  rotZ,
  dy,
  escala,
  opacidade,
}: {
  cena: Cena;
  tela: Tela;
  baseW: number;
  baseH: number;
  rotX: MV;
  rotY: MV;
  rotZ: MV;
  dy: ReturnType<typeof useMotionValue<string>>;
  escala: MV;
  opacidade: MV;
}) {
  // `tamanho` é a altura do aparelho sobre o lado menor disponível, então 62% quer dizer o mesmo em todo quadro.
  const alturaFone = (Math.min(baseH, baseW * 1.78) * cena.tamanho) / 100;
  const larguraFone = alturaFone / 2.05;
  const a = ACABAMENTOS[cena.acabamento];
  const perspectiva = larguraFone * (cena.lente / 50) * 3.4;
  const rotation = React.useMemo(() => ({ x: rotX, y: rotY, z: rotZ }), [rotX, rotY, rotZ]);
  return (
    <motion.div
      className="mk-pose"
      style={{
        left: `${50 + cena.pos.x / 2}%`,
        top: `${50 + cena.pos.y / 2}%`,
        width: larguraFone,
        height: alturaFone,
        marginLeft: -larguraFone / 2,
        marginTop: -alturaFone / 2,
        y: dy,
        scale: escala,
        opacity: opacidade,
        perspective: perspectiva,
      }}
    >
      {cena.sombra > 0 ? (
        <motion.div
          className="mk-sombra"
          style={{
            rotateX: rotX,
            rotateY: rotY,
            rotateZ: rotZ,
            x: "6%",
            y: "5%",
            opacity: cena.sombra / 100,
            filter: `blur(${larguraFone * 0.11}px)`,
          }}
        />
      ) : null}
      <DeviceFrame
        rotation={rotation}
        intro={false}
        style={
          {
            "--device-body": a.corpo,
            "--device-edge": a.borda,
            "--device-perspective": `${perspectiva}px`,
            "--device-glare": `${cena.reflexo}%`,
          } as React.CSSProperties
        }
      >
        <ConteudoDaTela tela={tela} ajuste={cena.ajuste} />
      </DeviceFrame>
    </motion.div>
  );
});

function ConteudoDaTela({ tela, ajuste }: { tela: Tela; ajuste: Cena["ajuste"] }) {
  if (tela.tipo === "vivo") {
    return (
      <div className="mk-tela-sensor">
        <div className="mk-tela-camera" aria-hidden />
        <div className="mk-tela-folha"><SensorDial /></div>
      </div>
    );
  }
  if (tela.tipo === "video") {
    return <video key={tela.url} src={tela.url} autoPlay muted loop playsInline className="mk-tela-midia" style={{ objectFit: ajuste }} />;
  }
  return <img src={tela.url} alt="" className="mk-tela-midia" style={{ objectFit: ajuste }} />;
}

/* ── A linha do tempo ─────────────────────────────────────────────────── */

function Linha({
  tempo,
  duracao,
  tocando,
  loop,
  onTocar,
  onBuscar,
}: {
  tempo: ReturnType<typeof useMotionValue<number>>;
  duracao: number;
  tocando: boolean;
  loop: boolean;
  onTocar: () => void;
  onBuscar: (t: number) => void;
}) {
  const leitura = React.useRef<HTMLSpanElement>(null);
  const agulha = React.useRef<HTMLSpanElement>(null);
  const pintar = (t: number) => {
    const p = Math.min(1, t);
    if (agulha.current) agulha.current.style.transform = `scaleX(${p})`;
    if (leitura.current) leitura.current.textContent = `${(p * duracao).toFixed(1)} s`;
  };
  useMotionValueEvent(tempo, "change", pintar);
  React.useEffect(() => pintar(tempo.get()));
  const buscar = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onBuscar(Math.max(0, Math.min(0.999, (e.clientX - r.left) / r.width)));
  };
  return (
    <div className="mk-linha-tempo">
      <button type="button" aria-label={tocando ? "Pausar" : "Tocar"} onClick={onTocar}>
        {tocando ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
      </button>
      <div
        className="mk-trilha"
        role="slider"
        tabIndex={0}
        aria-label="Tempo"
        aria-valuemin={0}
        aria-valuemax={duracao}
        aria-valuenow={Math.round(Math.min(1, tempo.get()) * duracao * 10) / 10}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          buscar(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons || e.pointerType !== "mouse") buscar(e);
        }}
        onKeyDown={(e) => {
          const d = ({ ArrowRight: 0.02, ArrowLeft: -0.02 } as Record<string, number>)[e.key];
          if (!d) return;
          e.preventDefault();
          onBuscar(Math.max(0, Math.min(0.999, tempo.get() + d)));
        }}
      >
        <span ref={agulha} aria-hidden />
      </div>
      <p className="mk-tempo">
        <span ref={leitura}>0.0 s</span>
        <i> / {duracao.toFixed(1)} s{loop ? " · loop" : ""}</i>
      </p>
    </div>
  );
}
