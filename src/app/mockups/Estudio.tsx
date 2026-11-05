"use client";

/**
 * O estúdio de mockups: o palco é a obra, o painel é a ferramenta.
 *
 * É uma tela inteira, sem o site em volta. Arrastar o palco gira o aparelho e o painel
 * acompanha: a mão e o número falam da mesma coisa. Tudo que dá pra deduzir é deduzido:
 * soltar um vídeo põe a cena em movimento com a duração dele, uma tela larga deita o
 * aparelho, e as cores da tela viram amostras de fundo.
 */

import * as React from "react";
import { flushSync } from "react-dom";
import { useMotionValue, useMotionValueEvent, useTransform, motion } from "motion/react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Popover from "@radix-ui/react-popover";
import * as Tooltip from "@radix-ui/react-tooltip";
import { ArrowDownUp, Check, ChevronUp, Copy, Crosshair, Download, Film, Focus, Image as ImagemIcone, Keyboard, MoveHorizontal, MoveVertical, Minus, Pause, Play, Plus, Redo2, RotateCcw, RotateCw, ScanLine, Square, Undo2, Upload, X, ZoomIn } from "lucide-react";

import { DeviceFrame } from "../../../registry/visant/ui/device-frame";
import { SensorDial } from "../../../registry/visant/ui/sensor-dial";
import { contarEstudio } from "../metricas";
import { guardarArquivo, lerArquivos } from "./arquivos";
import { Alvo, Amostras, CampoCor, Dica, FoneMini, MapaDaPagina, Miniatura, Miniaturas, Pasta, Segmentos, Slider, Vetor, numero } from "./controles";
import { baixar, codecDisponivel, exportarImagem, exportarVideo } from "./exportar";
import {
  ACABAMENTOS,
  ASPECTO,
  ASPECTO_DO_ARQUIVO_CHEIO,
  CORES,
  GIF,
  FOTOS_DE_FUNDO,
  MODELOS,
  MOVIMENTOS,
  PADRAO,
  PRESETS,
  TELAS,
  ZOOM,
  animado,
  cameraEm,
  corDoTraco,
  dimensoes,
  dimensoesGif,
  emLoop,
  fundoCss,
  girada,
  giroDaOrientacao,
  heroiDe,
  medidasDoAparelho,
  movimentoEm,
  orientacaoNatural,
  paletaDe,
  podeGirar,
  poseDe,
  posesDe,
  razaoDaTela,
  type Acabamento,
  type Cena,
  type EstiloAparelho,
  type EstiloReflexo,
  type EstiloSombra,
  type Modelo,
  type Tela,
  type TipoMovimento,
} from "./modelo";
import "./estudio.css";

const CHAVE = "visant:mockup:3";
const CHAVE_V2 = "visant:mockup:2";
// Quem abriu a primeira versão ficou com 9:16 salvo sem ter escolhido: herda o resto da cena, não o quadro.
const CHAVE_V1 = "visant:mockup";
const CHAVE_CUSTO = "visant:mockup:custo";
// A largura lógica do quadro. A saída é escala dela, então o desenho não muda com a resolução.
const BASE = 1080;
const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Da v2 para cá o reflexo foi de 0 a 30 para de 0 a 100, e as telas de exemplo mudaram. */
const migrar = (salvo: Partial<Cena>): Cena => {
  const reflexo = salvo.reflexo === undefined ? PADRAO.reflexo : Math.round(salvo.reflexo / 0.3);
  return { ...PADRAO, ...salvo, reflexo };
};
const lerSalvo = (): Cena => {
  try {
    const s = localStorage.getItem(CHAVE);
    if (s) return { ...PADRAO, ...JSON.parse(s) };
    const v2 = localStorage.getItem(CHAVE_V2);
    if (v2) return migrar(JSON.parse(v2));
    const v1 = localStorage.getItem(CHAVE_V1);
    return v1 ? { ...migrar(JSON.parse(v1)), proporcao: PADRAO.proporcao } : PADRAO;
  } catch {
    return PADRAO;
  }
};

/** Desfazer por pacote: um arrasto inteiro é um passo, não sessenta. */
function useHistorico() {
  const [cena, setCenaCru] = React.useState<Cena>(lerSalvo);
  const atual = React.useRef(cena);
  const passado = React.useRef<Cena[]>([]);
  const futuro = React.useRef<Cena[]>([]);
  const pacote = React.useRef<Cena | null>(null);
  const relogio = React.useRef(0);
  const segurando = React.useRef(false);
  const [, marcar] = React.useReducer((n: number) => n + 1, 0);

  const definir = React.useCallback((n: Cena) => {
    atual.current = n;
    setCenaCru(n);
  }, []);
  const fechar = React.useCallback((forcar = false) => {
    // Sem pacote aberto não há o que fechar: soltar o clique do próprio Desfazer não pode apagar o futuro.
    if ((segurando.current && !forcar) || !pacote.current) return;
    window.clearTimeout(relogio.current);
    // Mexer e voltar ao mesmo valor não é um passo.
    if (!igual(pacote.current, atual.current)) passado.current = [...passado.current.slice(-49), pacote.current];
    pacote.current = null;
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
    const c = atual.current;
    const n = f(c);
    if (n === c) return;
    if (!pacote.current) {
      pacote.current = c;
      futuro.current = [];
      marcar();
    }
    definir(n);
    window.clearTimeout(relogio.current);
    relogio.current = window.setTimeout(fechar, 350);
  }, [definir, fechar]);

  const andar = (de: React.MutableRefObject<Cena[]>, para: React.MutableRefObject<Cena[]>) => {
    // O pacote em aberto fecha antes: desfazer logo depois de editar volta um passo, não dois.
    fechar(true);
    const alvo = de.current[de.current.length - 1];
    if (!alvo) return;
    de.current = de.current.slice(0, -1);
    para.current = [...para.current, atual.current];
    definir(alvo);
    marcar();
  };
  return {
    cena,
    setCena,
    desfazer: () => andar(passado, futuro),
    refazer: () => andar(futuro, passado),
    podeDesfazer: passado.current.length > 0 || pacote.current !== null,
    podeRefazer: futuro.current.length > 0,
  };
}

/* ── O custo medido ───────────────────────────────────────────────────── */

/** Milissegundos por megapixel, medidos na exportação anterior desta máquina. Sem medida, a tela não chuta tempo. */
type Custo = { comVideo?: number; semVideo?: number };
const lerCusto = (): Custo => {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_CUSTO) ?? "{}");
  } catch {
    return {};
  }
};
const gravarCusto = (c: Custo) => {
  try {
    localStorage.setItem(CHAVE_CUSTO, JSON.stringify(c));
  } catch {
    /* sem armazenamento: mede de novo na próxima */
  }
};

function bytesFalados(n: number) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${numero(n / 1024 / 1024, 1)} MB`;
}
function duracaoFalada(s: number) {
  if (s < 60) return `${Math.max(1, Math.round(s))} s`;
  return `${Math.round(s / 60)} min`;
}

/** O grão que quebra as faixas do degradê escuro, sorteado uma vez. */
let graoEmCache: string | null = null;
function urlDoGrao() {
  if (graoEmCache) return graoEmCache;
  const c = document.createElement("canvas");
  c.width = c.height = 160;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  graoEmCache = c.toDataURL("image/png");
  return graoEmCache;
}

type Pronto = { url: string; nome: string; bytes: number; w: number; h: number; blob: Blob };
type Aba = "tela" | "cena" | "aparelho" | "movimento";
const ABAS: { id: Aba; nome: string }[] = [
  { id: "tela", nome: "Tela" },
  { id: "cena", nome: "Cena" },
  { id: "aparelho", nome: "Aparelho" },
  { id: "movimento", nome: "Movimento" },
];
const ICONE_DO_MOVIMENTO: Record<TipoMovimento, typeof Square> = {
  parado: Square,
  cenas: Film,
  rolar: ArrowDownUp,
  flutuar: MoveVertical,
  balancar: MoveHorizontal,
  pendulo: RotateCw,
  aproximar: ZoomIn,
  entrada: Crosshair,
  varredura: ScanLine,
  close: Focus,
};
const ATALHOS: [string, string][] = [
  ["Arrastar o palco", "Girar"],
  ["Alt + arrastar", "Mover"],
  ["Roda ou pinça", "Zoom"],
  ["+ e −", "Zoom"],
  ["0 ou duplo clique no palco", "Enquadrar"],
  ["K", "Marcar cena"],
  ["Ctrl + S", "Exportar"],
  ["Ctrl + Shift + S", "Só este quadro"],
  ["Shift + roda", "Rolar a tela"],
  ["Setas, Page Up e Page Down", "Rolar a tela"],
  ["Ctrl + V", "Colar a tela"],
  ["Ctrl + Z", "Desfazer"],
  ["Ctrl + Shift + Z", "Refazer"],
  ["Espaço", "Tocar e pausar"],
  ["Duplo clique no controle", "Voltar ao padrão"],
  ["Shift + arrastar controle", "Ajuste fino"],
];

export function Estudio({ onSair }: { onSair?: (e: React.MouseEvent<HTMLAnchorElement>) => void }) {
  const { cena, setCena: setCenaBase, desfazer, refazer, podeDesfazer, podeRefazer } = useHistorico();
  // A cena marcada que está aberta: mexer no aparelho enquanto ela está aberta é editar ela.
  const [cenaAberta, setCenaAberta] = React.useState<number | null>(cena.movimento.tipo === "cenas" ? 0 : null);
  const abertaRef = React.useRef(cenaAberta);
  abertaRef.current = cenaAberta;
  const setCena = React.useCallback((f: (c: Cena) => Cena) => {
    setCenaBase((c) => {
      const n = f(c);
      const i = abertaRef.current;
      if (n.movimento.tipo !== "cenas" || i === null || !n.chaves[i] || (n.rot === c.rot && n.pos === c.pos && n.tamanho === c.tamanho && n.rolagem === c.rolagem)) return n;
      return { ...n, chaves: n.chaves.map((k, j) => (j === i ? poseDe(n) : k)) };
    });
  }, [setCenaBase]);
  const [enviadas, setEnviadas] = React.useState<Tela[]>([]);
  const [restaurando, setRestaurando] = React.useState(() => cena.telaId.startsWith("arquivo-"));
  const [paleta, setPaleta] = React.useState<string[]>([]);
  const [tocando, setTocando] = React.useState(true);
  const [estado, setEstado] = React.useState<{ feito: number; total: number; resta: number | null } | null>(null);
  const [aviso, setAviso] = React.useState<string | null>(null);
  const [pronto, setPronto] = React.useState<Pronto | null>(null);
  const [copiado, setCopiado] = React.useState(false);
  const [semMp4, setSemMp4] = React.useState(false);
  const [aba, setAba] = React.useState<Aba>("tela");
  const [opcoesAbertas, setOpcoesAbertas] = React.useState(false);
  const [arrastando, setArrastando] = React.useState(false);
  const [atalhos, setAtalhos] = React.useState(false);
  const [custo, setCusto] = React.useState<Custo>(lerCusto);

  // A peça viva é uma tela de celular: em tablet e notebook ela sai da lista e a escolha volta quando o celular voltar.
  const telas = React.useMemo(() => [...enviadas, ...TELAS.filter((t) => t.tipo !== "vivo" || cena.modelo === "phone")], [enviadas, cena.modelo]);
  const tela: Tela = telas.find((t) => t.id === cena.telaId) ?? (restaurando ? { id: "espera", tipo: "imagem", nome: "" } : telas[0]);
  const anima = animado(cena);
  const [medida, setMedida] = React.useState({ w: 1600, h: 900 });
  const exportando = estado !== null;
  // Em `cheio` o palco manda na tela, e 16:9 manda no arquivo: a saída não pode depender do tamanho da janela.
  const aspectoDoArquivo = cena.proporcao === "cheio" ? ASPECTO_DO_ARQUIVO_CHEIO : ASPECTO[cena.proporcao];
  const aspecto = exportando ? aspectoDoArquivo : cena.proporcao === "cheio" ? medida.w / medida.h : ASPECTO[cena.proporcao];
  const { w: baseW, h: baseH } = dimensoes(aspecto, BASE);
  const transparente = cena.fundo.modo === "nenhum";

  const edita = React.useCallback(<K extends keyof Cena>(chave: K, valor: Cena[K] | ((v: Cena[K]) => Cena[K])) => {
    setCena((c) => ({ ...c, [chave]: typeof valor === "function" ? (valor as (v: Cena[K]) => Cena[K])(c[chave]) : valor }));
  }, [setCena]);

  // Grava depois que a mão para: um arrasto mexe na cena centenas de vezes, e o que importa é onde ele termina.
  const cenaParaGravar = React.useRef(cena);
  cenaParaGravar.current = cena;
  React.useEffect(() => {
    const gravar = () => {
      try {
        localStorage.setItem(CHAVE, JSON.stringify(cenaParaGravar.current));
      } catch {
        /* sem armazenamento: vale só nesta visita */
      }
    };
    const relogio = window.setTimeout(gravar, 300);
    window.addEventListener("pagehide", gravar);
    return () => {
      window.clearTimeout(relogio);
      window.removeEventListener("pagehide", gravar);
    };
  }, [cena]);

  React.useEffect(() => {
    let vivo = true;
    void codecDisponivel("mp4", 1080, 1920).then((c) => vivo && setSemMp4(!c));
    return () => {
      vivo = false;
    };
  }, []);

  // O que foi enviado antes volta: a pessoa recarrega a página e o trabalho continua aqui.
  React.useEffect(() => {
    let vivo = true;
    void lerArquivos().then((salvos) => {
      if (!vivo) return;
      setEnviadas(salvos.map((a) => ({ id: a.id, tipo: a.blob.type.startsWith("video/") ? "video" : "imagem", url: URL.createObjectURL(a.blob), nome: a.nome })));
      setRestaurando((r) => {
        if (r && !salvos.some((a) => a.id === cena.telaId)) setAviso("A tela enviada não está mais neste navegador. Envie de novo.");
        return false;
      });
    });
    return () => {
      vivo = false;
    };
    // Só na chegada: `cena.telaId` aqui é a escolha salva.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // O arquivo pronto fala da cena em que nasceu: mexeu, ele sai de cena.
  const cenaDoPronto = React.useRef<Cena | null>(null);
  React.useEffect(() => {
    if (pronto && cenaDoPronto.current !== cena) setPronto(null);
  }, [cena, pronto]);
  React.useEffect(() => {
    if (!pronto) return;
    const { url } = pronto;
    return () => URL.revokeObjectURL(url);
  }, [pronto]);

  /* ── O tempo e o que ele move ───────────────────────────────────────── */
  const tempo = useMotionValue(0);
  const rotX = useMotionValue(cena.rot.x);
  const rotY = useMotionValue(cena.rot.y);
  const rotZ = useMotionValue(cena.rot.z + giroDaOrientacao(cena));
  const dy = useMotionValue("0%");
  const dx = useMotionValue("0px");
  const escala = useMotionValue(1);
  const opacidade = useMotionValue(1);
  const camX = useMotionValue(0);
  const camY = useMotionValue(0);
  const camZoom = useMotionValue(1);
  const filtro = useMotionValue("blur(0px)");
  const mascara = useMotionValue("none");
  const rolagemMV = useMotionValue(`50% ${cena.rolagem}%`);

  const aplicar = React.useCallback(
    (c: Cena, t: number) => {
      const m = movimentoEm(c, t);
      rotX.set(c.rot.x + m.x);
      rotY.set(c.rot.y + m.y);
      rotZ.set(c.rot.z + m.z + giroDaOrientacao(c));
      dx.set(`${((m.px / 200) * baseW).toFixed(2)}px`);
      dy.set(m.py ? `calc(${m.dy}% + ${((m.py / 200) * baseH).toFixed(2)}px)` : `${m.dy}%`);
      escala.set(m.escala);
      opacidade.set(m.opacidade);
      rolagemMV.set(`50% ${m.rolagem.toFixed(3)}%`);
      const cam = cameraEm(c, t, baseW, baseH);
      camX.set(cam.x);
      camY.set(cam.y);
      camZoom.set(cam.zoom);
      filtro.set(`blur(${cam.desfoque.toFixed(2)}px)`);
      mascara.set(cam.mascara);
    },
    [rotX, rotY, rotZ, dx, dy, escala, opacidade, camX, camY, camZoom, filtro, mascara, rolagemMV, baseW, baseH],
  );
  const cenaAtual = React.useRef(cena);
  cenaAtual.current = cena;
  React.useEffect(() => aplicar(cena, tempo.get()), [cena, aplicar, tempo]);
  useMotionValueEvent(tempo, "change", (t) => aplicar(cenaAtual.current, t));

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
  // Cheio cobre o palco até a borda; o arredondamento para par não pode abrir fresta. Medida fixa ganha respiro.
  const encaixe = cena.proporcao === "cheio"
    ? Math.max(medida.w / baseW, medida.h / baseH)
    : Math.max(0.01, Math.min((medida.w - 32) / baseW, (medida.h - 32) / baseH));
  React.useLayoutEffect(() => {
    const el = palco.current;
    if (!el) return;
    const medir = () => {
      const r = el.getBoundingClientRect();
      // Janela mexida no meio de um vídeo não pode mudar o quadro que já está sendo gravado.
      if (!exportando && r.width > 0 && r.height > 0) setMedida({ w: r.width, h: r.height });
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [exportando]);

  /* ── Rolagem: a tela desce por dentro do aparelho ───────────────────── */
  const rolavelRef = React.useRef(false);
  const rolarPor = React.useCallback((d: number) => {
    setCena((c) => {
      const novo = Math.round(Math.max(0, Math.min(100, c.rolagem + d)) * 10) / 10;
      return novo === c.rolagem ? c : { ...c, rolagem: novo };
    });
  }, [setCena]);

  /* ── Zoom: uma conta só para roda, pinça, teclas e botões ────────────── */
  const prenderZoom = (v: number) => Math.max(ZOOM.min, Math.min(ZOOM.max, Math.round(v * 10) / 10));
  /** Com `ponto`, o que está sob o ponteiro fica onde está: é assim que zoom se comporta em todo editor. */
  const zoomPara = React.useCallback((calc: (v: number) => number, ponto?: { x: number; y: number }) => {
    setCena((c) => {
      const novo = Math.max(ZOOM.min, Math.min(ZOOM.max, Math.round(calc(c.tamanho) * 10) / 10));
      if (novo === c.tamanho) return c;
      if (!ponto) return { ...c, tamanho: novo };
      const k = novo / c.tamanho;
      const anda = (p: number, alvo: number) => Math.max(-100, Math.min(100, Math.round((alvo + (p - alvo) * k) * 10) / 10));
      return { ...c, tamanho: novo, pos: { x: anda(c.pos.x, ponto.x), y: anda(c.pos.y, ponto.y) } };
    });
  }, [setCena]);
  const enquadrar = React.useCallback(() => setCena((c) => ({ ...c, tamanho: PADRAO.tamanho, pos: PADRAO.pos })), [setCena]);
  /** Onde o ponteiro cai, na unidade de `pos`: -100 a 100 sobre o quadro. */
  const pontoNoQuadro = React.useCallback((clienteX: number, clienteY: number) => {
    const r = quadro.current?.getBoundingClientRect();
    if (!r || !r.width) return undefined;
    return { x: ((clienteX - r.left) / r.width - 0.5) * 200, y: ((clienteY - r.top) / r.height - 0.5) * 200 };
  }, []);

  /* ── Cenas marcadas ─────────────────────────────────────────────────── */
  const ehCenas = cena.movimento.tipo === "cenas";
  const irParaCena = (i: number, c: Cena = cena) => {
    const k = c.chaves[i];
    if (!k) return;
    setTocando(false);
    setCenaAberta(i);
    abertaRef.current = i;
    setCenaBase((atual) => ({ ...atual, ...k }));
    tempo.set(c.chaves.length > 1 ? i / (c.chaves.length - 1) : 0);
  };
  const marcarCena = () => {
    const i = cenaAberta ?? cena.chaves.length - 1;
    const chaves = [...cena.chaves.slice(0, i + 1), poseDe(cena), ...cena.chaves.slice(i + 1)];
    setTocando(false);
    setCenaAberta(i + 1);
    abertaRef.current = i + 1;
    // Cada passagem pede tempo para ser vista: dois segundos, até o teto do export.
    setCenaBase((c) => ({ ...c, chaves, movimento: { ...c.movimento, duracao: Math.max(2, Math.min(30, (chaves.length - 1) * 2)) } }));
    tempo.set((i + 1) / (chaves.length - 1));
  };
  const removerCena = () => {
    if (cenaAberta === null || cena.chaves.length < 2) return;
    const chaves = cena.chaves.filter((_, j) => j !== cenaAberta);
    const prox = Math.min(cenaAberta, chaves.length - 1);
    setCenaBase((c) => ({ ...c, chaves }));
    irParaCena(prox, { ...cena, chaves });
  };

  const gesto = React.useRef<{ x: number; y: number; rot: Cena["rot"]; pos: Cena["pos"]; mover: boolean } | null>(null);
  // Dois dedos: a distância é o zoom, e o meio dos dois arrasta.
  const dedos = React.useRef(new Map<number, { x: number; y: number }>());
  const pinca = React.useRef<{ d: number; tam: number; meio: { x: number; y: number }; pos: Cena["pos"] } | null>(null);
  const noPalco = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      // A peça viva dentro da tela continua sendo dela: o gesto só é do palco fora dos controles.
      if ((e.target as Element).closest("button, input, [role=slider]")) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dedos.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (dedos.current.size === 2) {
        const [a, b] = [...dedos.current.values()];
        gesto.current = null;
        pinca.current = { d: Math.hypot(a.x - b.x, a.y - b.y), tam: cena.tamanho, meio: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, pos: cena.pos };
        return;
      }
      if (dedos.current.size > 2) return;
      // Mexer no aparelho durante a animação abre a cena mais perto, em vez de brigar com o tempo.
      if (ehCenas && cenaAberta === null) irParaCena(Math.round(Math.min(1, tempo.get()) * Math.max(0, cena.chaves.length - 1)));
      gesto.current = { x: e.clientX, y: e.clientY, rot: cena.rot, pos: cena.pos, mover: e.altKey || e.shiftKey };
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      if (dedos.current.has(e.pointerId)) dedos.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const p = pinca.current;
      if (p && dedos.current.size >= 2) {
        const [a, b] = [...dedos.current.values()];
        const k = 100 / (baseW * encaixe);
        const meio = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        setCena((c) => ({
          ...c,
          tamanho: prenderZoom((p.tam * Math.hypot(a.x - b.x, a.y - b.y)) / Math.max(1, p.d)),
          pos: { x: Math.round(p.pos.x + (meio.x - p.meio.x) * 2 * k), y: Math.round(p.pos.y + (meio.y - p.meio.y) * 2 * k * (baseW / baseH)) },
        }));
        return;
      }
      const g = gesto.current;
      if (!g) return;
      const dx = e.clientX - g.x;
      const dyy = e.clientY - g.y;
      if (g.mover) {
        const k = 100 / (baseW * encaixe);
        edita("pos", { x: Math.round(g.pos.x + dx * k), y: Math.round(g.pos.y + dyy * k) });
      } else {
        edita("rot", { ...g.rot, y: limiteDoGiro(g.rot.y + dx * 0.4), x: limiteDoGiro(g.rot.x - dyy * 0.3) });
      }
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      dedos.current.delete(e.pointerId);
      gesto.current = null;
      if (dedos.current.size < 2) pinca.current = null;
    },
    onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => {
      dedos.current.delete(e.pointerId);
      gesto.current = null;
      if (dedos.current.size < 2) pinca.current = null;
    },
    onDoubleClick: (e: React.MouseEvent) => {
      if (!(e.target as Element).closest("button, input, [role=slider]")) enquadrar();
    },
  };
  // A roda precisa de `passive: false`: sem isso, a pinça do trackpad também dá zoom na página inteira.
  React.useEffect(() => {
    const el = palco.current;
    if (!el) return;
    const roda = (e: WheelEvent) => {
      e.preventDefault();
      if (e.shiftKey) {
        if (rolavelRef.current) rolarPor((e.deltaY || e.deltaX) * 0.04);
        return;
      }
      // A pinça chega como Ctrl + roda, em passos bem menores que os de um mouse.
      const fator = Math.exp(-e.deltaY * (e.ctrlKey || e.metaKey ? 0.01 : 0.0015));
      zoomPara((v) => v * fator, pontoNoQuadro(e.clientX, e.clientY));
    };
    el.addEventListener("wheel", roda, { passive: false });
    return () => el.removeEventListener("wheel", roda);
  }, [zoomPara, pontoNoQuadro, rolarPor]);

  const exportarRef = React.useRef<(modo?: "video" | "imagem") => Promise<void>>(async () => {});

  /* ── Teclado ────────────────────────────────────────────────────────── */
  React.useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      if (alvo.closest("input, textarea, [role=slider]")) return;
      const passoDeRolagem = ({ ArrowDown: 3, ArrowUp: -3, PageDown: 15, PageUp: -15, Home: -100, End: 100 } as Record<string, number>)[e.key];
      // Seta em aba ou em lista de escolha já tem dono: só no resto da tela ela rola.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void exportarRef.current(e.shiftKey ? "imagem" : undefined);
      } else if (passoDeRolagem && rolavelRef.current && !alvo.closest('[role="tablist"], [role="radiogroup"]')) {
        e.preventDefault();
        rolarPor(passoDeRolagem);
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomPara((v) => v * 1.1);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomPara((v) => v / 1.1);
      } else if (e.key === "0") {
        e.preventDefault();
        enquadrar();
      } else if (e.key.toLowerCase() === "k" && !e.metaKey && !e.ctrlKey && cenaAtual.current.movimento.tipo === "cenas") {
        marcarCena();
      } else if ((e.key === "Delete" || e.key === "Backspace") && cenaAtual.current.movimento.tipo === "cenas") {
        removerCena();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) refazer();
        else desfazer();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        refazer();
      } else if (e.key === "?") {
        setAtalhos((v) => !v);
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
  /**
   * A porta única de entrada de tela: arquivo solto, colado ou escolhido. A captura de site, quando
   * existir, entrega aqui uma imagem da página inteira, e rolagem, cenas e export já valem para ela.
   */
  const receber = async (f: (Blob & { name?: string }) | undefined) => {
    if (!f) return;
    const video = f.type.startsWith("video/");
    if (!video && !f.type.startsWith("image/")) return setAviso("Envie uma imagem ou um vídeo.");
    const url = URL.createObjectURL(f);
    const id = `arquivo-${Date.now()}`;
    const nome = (f.name ?? "").replace(/\.\w+$/, "").slice(0, 14) || "Arquivo";
    setAviso(null);
    let medidas: { w: number; h: number; duracao?: number };
    try {
      medidas = await medirArquivo(url, video);
    } catch {
      URL.revokeObjectURL(url);
      return setAviso(video ? "Não consegui ler esse vídeo." : "Não consegui ler essa imagem.");
    }
    setEnviadas((l) => [{ id, tipo: video ? "video" : "imagem", url, nome }, ...l]);
    void guardarArquivo(id, nome, f);
    contarEstudio("enviou-tela");
    setCena((c) => ({
      ...c,
      telaId: id,
      rolagem: 0,
      // A forma do arquivo decide a da tela, e o aparelho deita sozinho.
      orientacao: medidas.w > medidas.h * 1.05 ? "paisagem" : "retrato",
      // Vídeo já é movimento: a cena sobe junto, com a duração dele.
      movimento: video
        ? { ...c.movimento, tipo: c.movimento.tipo === "parado" ? "flutuar" : c.movimento.tipo, duracao: Math.max(1, Math.min(30, Math.round(medidas.duracao ?? c.movimento.duracao))) }
        : c.movimento,
    }));
    setAba("tela");
  };
  const receberRef = React.useRef(receber);
  receberRef.current = receber;
  React.useEffect(() => {
    const colar = (e: ClipboardEvent) => {
      const arquivo = e.clipboardData?.files[0];
      if (!arquivo) return;
      e.preventDefault();
      void receberRef.current(arquivo);
    };
    window.addEventListener("paste", colar);
    return () => window.removeEventListener("paste", colar);
  }, []);
  const profundidadeDoArrasto = React.useRef(0);
  const noArrasto = {
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault();
      if (!e.dataTransfer.types.includes("Files")) return;
      profundidadeDoArrasto.current++;
      setArrastando(true);
    },
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDragLeave: () => {
      profundidadeDoArrasto.current = Math.max(0, profundidadeDoArrasto.current - 1);
      if (profundidadeDoArrasto.current === 0) setArrastando(false);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      profundidadeDoArrasto.current = 0;
      setArrastando(false);
      void receber(e.dataTransfer.files[0]);
    },
  };

  /* ── Exportar ───────────────────────────────────────────────────────── */
  const cancelar = React.useRef<AbortController | null>(null);
  const emVideo = anima;
  const extensaoImagem = cena.saida.imagem;
  // Transparência em vídeo só existe em WebM: pedir fundo vazio decide o formato.
  const formatoVideo = transparente ? "webm" : semMp4 && cena.saida.video === "mp4" ? "webm" : cena.saida.video;
  const emGif = emVideo && formatoVideo === "gif";
  const { w: saidaW, h: saidaH } = emGif ? dimensoesGif(aspectoDoArquivo) : dimensoes(aspectoDoArquivo, cena.saida.largura);
  const fps = emGif ? GIF.fps : cena.saida.fps;
  const totalQuadros = Math.round(cena.movimento.duracao * fps);
  const comVideo = tela.tipo === "video";
  const megapixels = (saidaW * saidaH) / 1e6;
  const fatorFoco = cena.foco.ativo ? 2 : 1;
  const medidoPorQuadro = custo[comVideo ? "comVideo" : "semVideo"];
  const estimativa = medidoPorQuadro ? (totalQuadros * medidoPorQuadro * megapixels * fatorFoco) / 1000 : null;

  /** Vídeo com o movimento inteiro, ou imagem do quadro que está na tela, a qualquer momento. */
  const exportar = async (modo: "video" | "imagem" = emVideo ? "video" : "imagem") => {
    if (exportando) return;
    const comoVideo = modo === "video";
    const extensao = comoVideo ? formatoVideo : extensaoImagem;
    // O tamanho do arquivo de imagem nunca é o do GIF, mesmo com GIF escolhido para o vídeo.
    const { w: arqW, h: arqH } = comoVideo ? { w: saidaW, h: saidaH } : dimensoes(aspectoDoArquivo, cena.saida.largura);
    setAviso(null);
    setPronto(null);
    // O quadro assume a medida do arquivo antes de a captura começar: a primeira leitura já sai certa.
    const total = comoVideo ? totalQuadros : 1;
    flushSync(() => setEstado({ feito: 0, total, resta: null }));
    const el = quadro.current;
    if (!el) return setEstado(null);
    const { w, h } = dimensoes(aspectoDoArquivo, BASE);
    const q = { el, w, h };
    const antes = tempo.get();
    const cenaDoArquivo = cena;
    aplicarNoQuadro(cenaDoArquivo, antes);
    const t0 = performance.now();
    let blob: Blob | null = null;
    try {
      if (!comoVideo) {
        blob = await exportarImagem(q, arqW, cena.saida.imagem);
      } else {
        const ctrl = new AbortController();
        cancelar.current = ctrl;
        blob = await exportarVideo({
          quadro: q,
          saidaW,
          saidaH,
          duracao: cena.movimento.duracao,
          fps,
          formato: formatoVideo,
          transparente,
          irPara: (t) => tempo.set(t),
          // Os três primeiros quadros pagam o custo de abertura: antes deles, nenhum tempo é dito.
          onProgresso: (feito, totalDeQuadros, resta) => setEstado({ feito, total: totalDeQuadros, resta: feito >= 3 ? resta : null }),
          sinal: ctrl.signal,
        });
        if (!blob) setAviso("Exportação cancelada.");
        else if (!emGif) {
          const medido = (performance.now() - t0) / total / megapixels / fatorFoco;
          const novo = { ...custo, [comVideo ? "comVideo" : "semVideo"]: Math.round(medido) };
          setCusto(novo);
          gravarCusto(novo);
        }
      }
      if (blob) {
        const url = URL.createObjectURL(blob);
        const arquivo = `mockup-${arqW}x${arqH}.${extensao}`;
        baixar(url, arquivo);
        cenaDoPronto.current = cenaDoArquivo;
        setPronto({ url, nome: arquivo, bytes: blob.size, w: arqW, h: arqH, blob });
        setCopiado(false);
        contarEstudio(`exportou-${extensao}`);
      }
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "A exportação falhou.");
    } finally {
      tempo.set(antes);
      cancelar.current = null;
      setEstado(null);
    }
  };
  exportarRef.current = exportar;
  // Só PNG vai para a área de transferência: é o único formato de imagem que todo navegador aceita ali.
  const copiarImagem = async () => {
    if (!pronto) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ [pronto.blob.type]: pronto.blob })]);
      setCopiado(true);
    } catch {
      setAviso("O navegador não deixou copiar. Use Baixar de novo.");
    }
  };
  // Com a medida do arquivo já no quadro, a câmera do foco refaz a conta nela.
  const aplicarNoQuadro = (c: Cena, t: number) => {
    const { w, h } = dimensoes(aspectoDoArquivo, BASE);
    const cam = cameraEm(c, t, w, h);
    camX.set(cam.x);
    camY.set(cam.y);
    camZoom.set(cam.zoom);
    filtro.set(`blur(${cam.desfoque.toFixed(2)}px)`);
    mascara.set(cam.mascara);
  };

  const fundo = cena.fundo;
  const modelo = cena.modelo;
  const poses = posesDe(modelo);
  const estaGirada = girada(cena);
  const trocarModelo = (m: Modelo) =>
    // Celular e tablet dividem as poses; o notebook tem as dele, então a pose só acompanha quando cruza essa fronteira.
    setCena((c) => {
      if (c.modelo === m) return c;
      const ehArquivo = c.telaId.startsWith("arquivo-");
      return { ...c, modelo: m, orientacao: ehArquivo ? c.orientacao : orientacaoNatural(m), rot: (c.modelo === "laptop") === (m === "laptop") ? c.rot : heroiDe(m) };
    });
  const ligarFoco = (ativo: boolean) =>
    // Close sem foco não tem o que mostrar: um liga o outro, e desligar o foco não deixa o movimento vazio.
    setCena((c) => ({ ...c, foco: { ...c.foco, ativo }, movimento: !ativo && c.movimento.tipo === "close" ? { ...c.movimento, tipo: "parado" } : c.movimento }));
  const escolherMovimento = (id: TipoMovimento) => {
    if (id === "cenas") {
      // Começa pela pose de agora: a primeira cena já está pronta, e a pessoa só gira e marca a próxima.
      const chaves = cena.chaves.length ? cena.chaves : [poseDe(cena)];
      setCenaBase((c) => ({ ...c, chaves, movimento: { ...c.movimento, tipo: id, duracao: Math.max(2, (chaves.length - 1) * 2) } }));
      irParaCena(0, { ...cena, chaves });
      return;
    }
    setCenaAberta(null);
    setTocando(true);
    setCena((c) => (id === "close" ? { ...c, movimento: { ...c.movimento, tipo: id }, foco: { ...c.foco, ativo: id === "close" } } : { ...c, movimento: { ...c.movimento, tipo: id } }));
  };
  // 2D começa de frente e sem sombra, que é onde ele se explica. Voltar ao real devolve volume e sombra.
  const escolherEstilo = (e: EstiloAparelho) =>
    setCena((c) => (e === "real"
      ? { ...c, aparelhoEstilo: e, rot: heroiDe(c.modelo), sombra: PADRAO.sombra, sombraEstilo: PADRAO.sombraEstilo }
      : { ...c, aparelhoEstilo: e, rot: { x: 0, y: 0, z: 0 }, sombra: 0 }));
  const telaLarga = modelo === "laptop" || cena.orientacao === "paisagem";
  const urlDaTela = tela.tipo === "vivo" ? undefined : telaLarga ? (modelo === "phone" ? tela.deitada : tela.largo) ?? tela.url : tela.url;
  // Rola quem é mais comprido que a tela do aparelho. A medida vem do arquivo, seja ele qual for.
  const [razaoDoArquivo, setRazaoDoArquivo] = React.useState<number | null>(null);
  const ehVideo = tela.tipo === "video";
  React.useEffect(() => {
    if (!urlDaTela) return setRazaoDoArquivo(null);
    let vivo = true;
    medirArquivo(urlDaTela, ehVideo).then((m) => vivo && setRazaoDoArquivo(m.h / m.w), () => vivo && setRazaoDoArquivo(null));
    return () => {
      vivo = false;
    };
  }, [urlDaTela, ehVideo]);
  const telaDoAparelho = razaoDaTela(cena);
  const rolavel = cena.ajuste === "cover" && razaoDoArquivo !== null && razaoDoArquivo > telaDoAparelho * 1.02;
  rolavelRef.current = rolavel;
  const focoArte = tela.tipo === "vivo" ? undefined : tela.poster ?? urlDaTela;
  const arteDoFone = tela.tipo === "vivo" ? undefined : tela.poster ?? tela.url;
  const { w: larguraAparelho, h: alturaAparelho } = medidasDoAparelho(cena, baseW, baseH);
  const fotoDeFundo = fundo.modo === "foto" ? (
    <img src={fundo.foto} alt="" className="mk-foto" style={{ filter: fundo.desfoque ? `blur(${fundo.desfoque}px)` : undefined }} />
  ) : null;
  const grao = fundo.modo === "degrade" ? <span className="mk-grao" style={{ backgroundImage: `url(${urlDoGrao()})` }} aria-hidden /> : null;
  const escolherArquivo = React.useCallback(() => seletor.current?.click(), []);
  const composicao = (
    <Composicao cena={cena} tela={tela} urlDaTela={urlDaTela} baseW={baseW} baseH={baseH} rotX={rotX} rotY={rotY} rotZ={rotZ} dx={dx} dy={dy} escala={escala} opacidade={opacidade} rolagem={rolagemMV} onEscolher={escolherArquivo} />
  );
  const temTelaPropria = cena.telaId.startsWith("arquivo-") || enviadas.length > 0;
  // Até ter a tela da pessoa, é a própria tela do aparelho que pede: nada flutua sobre a obra.
  const pedindoTela = tela.tipo === "convite";
  const presetAtivo = (p: (typeof PRESETS)[number]) => {
    const alvo = { ...p.aplica, rot: modelo === "laptop" ? p.rotNotebook : p.aplica.rot };
    return (Object.keys(alvo) as (keyof Cena)[]).every((k) => igual(alvo[k as keyof typeof alvo], cena[k]));
  };
  const resumo = emVideo
    ? emGif
      ? `GIF, ${saidaW}×${saidaH}`
      : `${formatoVideo.toUpperCase()}, ${saidaW}×${saidaH}`
    : `${cena.saida.imagem.toUpperCase()}, ${saidaW}×${saidaH}`;

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="mk-estudio casa">
        <header className="mk-barra">
          <a href="/" className="mk-marca" onClick={onSair}>
            <span className="mk-marca-ponto" aria-hidden />
            visant/ui
          </a>
          <span className="mk-barra-nome">
            Mockups <i>beta</i>
          </span>
          <div className="mk-barra-acoes">
            <Dica texto="Desfazer" tecla="Ctrl Z">
              <button type="button" className="mk-icone" aria-label="Desfazer" disabled={!podeDesfazer} onClick={desfazer}><Undo2 size={15} /></button>
            </Dica>
            <Dica texto="Refazer" tecla="Ctrl Shift Z">
              <button type="button" className="mk-icone" aria-label="Refazer" disabled={!podeRefazer} onClick={refazer}><Redo2 size={15} /></button>
            </Dica>
            <Popover.Root open={atalhos} onOpenChange={setAtalhos}>
              <Dica texto="Atalhos" tecla="?">
                <Popover.Trigger asChild>
                  <button type="button" className="mk-icone mk-so-mouse" aria-label="Atalhos"><Keyboard size={15} /></button>
                </Popover.Trigger>
              </Dica>
              <Popover.Portal>
                <Popover.Content className="mk-atalhos casa" align="end" sideOffset={8}>
                  <dl>
                    {ATALHOS.map(([tecla, faz]) => (
                      <div key={tecla}>
                        <dt>{tecla}</dt>
                        <dd>{faz}</dd>
                      </div>
                    ))}
                  </dl>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>
        </header>

        <div className="mk-corpo">
          <div className="mk-area">
            <div className="mk-palco" ref={palco} data-transparente={transparente || undefined} data-arrastando={arrastando || undefined} {...noPalco} {...noArrasto}>
              <div className="mk-escala" style={{ width: baseW, height: baseH, transform: `translate(-50%, -50%) scale(${encaixe})` }}>
                <div
                  ref={quadro}
                  className="mk-quadro"
                  style={{ width: baseW, height: baseH, background: fundoCss(fundo) }}
                >
                  <motion.div className="mk-camera" style={{ x: camX, y: camY, scale: camZoom, originX: 0, originY: 0 }}>
                    {/* O desfoque é uma cópia inteira da cena embaixo, e a nítida por cima tem um furo em volta do foco. */}
                    {cena.foco.ativo ? (
                      <motion.div ref={inerte} className="mk-camada mk-camada-copia" aria-hidden style={{ filter: filtro, background: fundoCss(fundo) }}>
                        {fotoDeFundo}
                        {grao}
                        {composicao}
                      </motion.div>
                    ) : null}
                    <motion.div className="mk-camada" style={{ maskImage: mascara, background: cena.foco.ativo ? fundoCss(fundo) : undefined }}>
                      {fotoDeFundo}
                      {grao}
                      {composicao}
                    </motion.div>
                  </motion.div>
                </div>
              </div>
              {cena.proporcao === "cheio" && !exportando && medida.w / medida.h > ASPECTO_DO_ARQUIVO_CHEIO + 0.02 ? (
                <div className="mk-guia" style={{ width: medida.h * ASPECTO_DO_ARQUIVO_CHEIO }} aria-hidden />
              ) : null}
              {exportando ? null : (
                <div className="mk-zoom" role="group" aria-label="Zoom">
                  <Dica texto="Diminuir" tecla="−">
                    <button type="button" className="mk-icone" aria-label="Diminuir o zoom" onClick={() => zoomPara((v) => v / 1.1)}><Minus size={14} /></button>
                  </Dica>
                  <Dica texto="Enquadrar" tecla="0">
                    <button type="button" className="mk-zoom-valor" aria-label={`Zoom em ${Math.round(cena.tamanho)}%. Enquadrar`} onClick={enquadrar}>{Math.round(cena.tamanho)}%</button>
                  </Dica>
                  <Dica texto="Aumentar" tecla="+">
                    <button type="button" className="mk-icone" aria-label="Aumentar o zoom" onClick={() => zoomPara((v) => v * 1.1)}><Plus size={14} /></button>
                  </Dica>
                </div>
              )}
              {arrastando ? (
                <div className="mk-soltar" aria-hidden>
                  <span>Solte para pôr na tela</span>
                </div>
              ) : null}
            </div>
            {anima ? (
              <Linha
                tempo={tempo}
                duracao={cena.movimento.duracao}
                tocando={tocando}
                loop={emLoop(cena)}
                onTocar={() => {
                  if (ehCenas) setCenaAberta(null);
                  setTocando((v) => !v);
                }}
                onBuscar={(t) => {
                  setTocando(false);
                  if (ehCenas) setCenaAberta(null);
                  tempo.set(t);
                }}
                topo={ehCenas ? (
                  <div className="mk-cenas" role="group" aria-label="Cenas marcadas">
                    {cena.chaves.map((k, i) => (
                      <button key={i} type="button" className="mk-cena" aria-label={`Cena ${i + 1}`} aria-pressed={cenaAberta === i} onClick={() => irParaCena(i)}>
                        <FoneMini modelo={modelo} rot={k.rot} arte={arteDoFone} />
                      </button>
                    ))}
                    <Dica texto="Marcar cena" tecla="K">
                      <button type="button" className="mk-cena-nova" aria-label="Marcar cena" onClick={marcarCena}>
                        <Plus size={14} aria-hidden />
                        {cena.chaves.length < 2 ? <><span className="mk-so-mouse">Gire o aparelho e marque a próxima cena</span><span className="mk-so-toque">Gire e marque</span></> : null}
                      </button>
                    </Dica>
                    {cenaAberta !== null && cena.chaves.length > 1 ? (
                      <Dica texto="Apagar esta cena" tecla="Del">
                        <button type="button" className="mk-icone" aria-label="Apagar esta cena" onClick={removerCena}><X size={14} /></button>
                      </Dica>
                    ) : null}
                  </div>
                ) : null}
              />
            ) : null}
          </div>

          <aside className="mk-painel" aria-label="Controles do mockup">
            <Tabs.Root value={aba} onValueChange={(v) => setAba(v as Aba)} className="mk-abas-raiz">
              <Tabs.List className="mk-abas" aria-label="Partes do mockup">
                {ABAS.map((a) => (
                  <Tabs.Trigger key={a.id} value={a.id} className="mk-aba">{a.nome}</Tabs.Trigger>
                ))}
              </Tabs.List>

              <div className="mk-rolagem">
                <Tabs.Content value="tela" forceMount hidden={aba !== "tela"} className="mk-aba-corpo">
                  <Pasta titulo="Escolha a tela" sujo={cena.telaId !== PADRAO.telaId} onReset={() => setCena((c) => ({ ...c, telaId: PADRAO.telaId, rolagem: 0 }))}>
                    <Miniaturas rotulo="Tela do aparelho" colunas={4}>
                      <button type="button" className="mk-mini mk-enviar" data-destaque={pedindoTela || undefined} onClick={escolherArquivo}>
                        <span className="mk-mini-arte"><Plus size={16} aria-hidden /></span>
                        <span className="mk-mini-nome">Sua tela</span>
                      </button>
                      {telas.filter((t) => t.tipo !== "convite").map((t) => (
                        <Miniatura key={t.id} nome={t.nome} ativa={tela.id === t.id} onClick={() => setCena((c) => (c.telaId === t.id ? c : { ...c, telaId: t.id, rolagem: 0 }))}>
                          {t.tipo === "vivo" ? (
                            <span className="mk-arte-sensor" />
                          ) : t.id === "vazia" ? (
                            <FoneMini classe="mk-fone-contorno" />
                          ) : t.tipo === "video" && !t.poster ? (
                            <video src={t.url} muted playsInline preload="metadata" className="mk-arte-img" />
                          ) : (
                            <img src={t.poster ?? t.url} alt="" className="mk-arte-img" loading="lazy" />
                          )}
                        </Miniatura>
                      ))}
                    </Miniaturas>
                    {rolavel ? (
                      <div className="mk-rolagem-tela">
                        {tela.tipo === "imagem" && urlDaTela ? (
                          <MapaDaPagina arte={urlDaTela} visivel={telaDoAparelho / razaoDoArquivo!} valor={cena.rolagem} onChange={(v) => edita("rolagem", v)} />
                        ) : null}
                        <div>
                          <Slider rotulo="Rolagem" valor={cena.rolagem} min={0} max={100} padrao={0} unidade="%" onChange={(v) => edita("rolagem", v)} />
                          <p className="mk-nota mk-so-mouse">Shift + roda também rola.</p>
                        </div>
                      </div>
                    ) : null}
                    {podeGirar(cena) ? (
                      <Segmentos
                        rotulo="Orientação da tela"
                        valor={cena.orientacao}
                        opcoes={[{ valor: "retrato", nome: "Em pé" }, { valor: "paisagem", nome: "Deitada" }]}
                        onChange={(v) => edita("orientacao", v)}
                      />
                    ) : null}
                    {tela.tipo === "imagem" || tela.tipo === "video" ? (
                      <Segmentos
                        rotulo="Ajuste na tela"
                        valor={cena.ajuste}
                        opcoes={[{ valor: "cover", nome: "Preencher" }, { valor: "contain", nome: "Caber" }]}
                        onChange={(v) => edita("ajuste", v)}
                      />
                    ) : null}
                    <p className="mk-nota">Seu arquivo não sai deste navegador.</p>
                  </Pasta>
                </Tabs.Content>

                <Tabs.Content value="cena" forceMount hidden={aba !== "cena"} className="mk-aba-corpo">
                  <Pasta titulo="Cenas prontas">
                    <Miniaturas rotulo="Cena pronta" colunas={3}>
                      {PRESETS.map((p) => {
                        const f = p.aplica.fundo!;
                        return (
                          <Miniatura key={p.id} nome={p.nome} ativa={presetAtivo(p)} onClick={() => setCena((c) => ({ ...c, ...p.aplica, rot: c.modelo === "laptop" ? p.rotNotebook : p.aplica.rot! }))}>
                            <span className="mk-arte-fundo" style={f.modo === "foto" ? { backgroundImage: `url(${f.foto})` } : { background: fundoCss(f) }} />
                            <FoneMini modelo={modelo} arte={p.id === "contorno" ? undefined : arteDoFone} rot={modelo === "laptop" ? p.rotNotebook : p.aplica.rot} classe={p.id === "contorno" ? "mk-fone-contorno" : p.id === "papel" ? "mk-fone-claro" : undefined} />
                          </Miniatura>
                        );
                      })}
                    </Miniaturas>
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
                        <div className="mk-barra-cor" style={{ background: `linear-gradient(90deg, ${fundo.a}, ${fundo.b})` }} aria-hidden />
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
                            <Miniatura key={u} nome={nomeDaFoto(u)} ativa={fundo.foto === u} onClick={() => edita("fundo", (f) => ({ ...f, foto: u }))}>
                              <img src={u} alt="" className="mk-arte-img" loading="lazy" />
                            </Miniatura>
                          ))}
                        </Miniaturas>
                        <Slider rotulo="Desfoque" valor={fundo.desfoque} min={0} max={60} padrao={0} unidade=" px" onChange={(v) => edita("fundo", (f) => ({ ...f, desfoque: v }))} />
                      </>
                    ) : null}
                  </Pasta>

                  <Pasta titulo="Quadro" abertaDeInicio={cena.proporcao !== PADRAO.proporcao} sujo={cena.proporcao !== PADRAO.proporcao} onReset={() => edita("proporcao", PADRAO.proporcao)}>
                    <Miniaturas rotulo="Proporção" colunas={5}>
                      <Miniatura nome="Cheio" ativa={cena.proporcao === "cheio"} onClick={() => edita("proporcao", "cheio")}>
                        <span className="mk-arte-proporcao" style={{ aspectRatio: String(medida.w / medida.h) }} />
                      </Miniatura>
                      {(Object.keys(ASPECTO) as (keyof typeof ASPECTO)[]).map((p) => (
                        <Miniatura key={p} nome={p} ativa={cena.proporcao === p} onClick={() => edita("proporcao", p)}>
                          <span className="mk-arte-proporcao" style={{ aspectRatio: String(ASPECTO[p]) }} />
                        </Miniatura>
                      ))}
                    </Miniaturas>
                  </Pasta>
                </Tabs.Content>

                <Tabs.Content value="aparelho" forceMount hidden={aba !== "aparelho"} className="mk-aba-corpo">
                  <Pasta
                    titulo="Modelo"
                    sujo={cena.acabamento !== PADRAO.acabamento}
                    onReset={() => edita("acabamento", PADRAO.acabamento)}
                  >
                    <Miniaturas rotulo="Modelo do aparelho">
                      {(Object.keys(MODELOS) as Modelo[]).map((m) => (
                        <Miniatura key={m} nome={MODELOS[m].nome} ativa={modelo === m} onClick={() => trocarModelo(m)}>
                          <FoneMini modelo={m} />
                        </Miniatura>
                      ))}
                    </Miniaturas>
                    <Segmentos<EstiloAparelho>
                      rotulo="Estilo do aparelho"
                      valor={cena.aparelhoEstilo}
                      opcoes={[{ valor: "real", nome: "Realista" }, { valor: "plano", nome: "Plano" }, { valor: "contorno", nome: "Contorno" }]}
                      onChange={escolherEstilo}
                    />
                    {cena.aparelhoEstilo === "contorno" ? (
                      <>
                        <CampoCor rotulo="Traço" valor={corDoTraco(cena)} onChange={(cor) => edita("traco", (t) => ({ ...t, cor }))} />
                        <Slider rotulo="Espessura" valor={cena.traco.espessura} min={1} max={20} padrao={PADRAO.traco.espessura} unidade=" px" onChange={(v) => edita("traco", (t) => ({ ...t, espessura: v }))} />
                      </>
                    ) : (
                    <>
                    <div className="mk-linha">
                      <span className="mk-rotulo">Acabamento</span>
                      <span className="mk-valor">{ACABAMENTOS[cena.acabamento].nome}</span>
                    </div>
                    <div className="mk-amostras" role="radiogroup" aria-label="Acabamento">
                      {(Object.keys(ACABAMENTOS) as Acabamento[]).map((k) => (
                        <button key={k} type="button" role="radio" aria-checked={cena.acabamento === k} aria-label={ACABAMENTOS[k].nome} style={{ background: `linear-gradient(135deg, ${ACABAMENTOS[k].borda}, ${ACABAMENTOS[k].corpo})` }} onClick={() => edita("acabamento", k)} />
                      ))}
                    </div>
                    </>
                    )}
                  </Pasta>

                  <Pasta titulo="Pose" sujo={!igual(cena.rot, PADRAO.rot)} onReset={() => edita("rot", PADRAO.rot)}>
                    <Miniaturas rotulo="Pose do aparelho">
                      {poses.map((p) => (
                        <Miniatura key={p.id} nome={p.nome} ativa={igual(p.rot, cena.rot)} onClick={() => edita("rot", p.rot)}>
                          <FoneMini modelo={modelo} rot={p.rot} />
                        </Miniatura>
                      ))}
                    </Miniaturas>
                  </Pasta>

                  <Pasta
                    titulo="Luz"
                    sujo={!igual([cena.reflexo, cena.reflexoEstilo, cena.sombra, cena.sombraEstilo], [PADRAO.reflexo, PADRAO.reflexoEstilo, PADRAO.sombra, PADRAO.sombraEstilo])}
                    onReset={() => setCena((c) => ({ ...c, reflexo: PADRAO.reflexo, reflexoEstilo: PADRAO.reflexoEstilo, sombra: PADRAO.sombra, sombraEstilo: PADRAO.sombraEstilo }))}
                  >
                    {cena.aparelhoEstilo === "real" ? (
                    <Segmentos<EstiloReflexo>
                      rotulo="Reflexo no vidro"
                      valor={cena.reflexoEstilo}
                      opcoes={[{ valor: "nenhum", nome: "Sem" }, { valor: "janela", nome: "Janela" }, { valor: "estudio", nome: "Estúdio" }, { valor: "faixa", nome: "Faixa" }]}
                      onChange={(v) => edita("reflexoEstilo", v)}
                    />
                    ) : null}
                    {cena.aparelhoEstilo === "real" && cena.reflexoEstilo !== "nenhum" ? (
                      <Slider rotulo="Reflexo" valor={cena.reflexo} min={0} max={100} padrao={PADRAO.reflexo} unidade="%" onChange={(v) => edita("reflexo", v)} />
                    ) : null}
                    <Segmentos<EstiloSombra>
                      rotulo="Estilo da sombra"
                      valor={cena.sombraEstilo}
                      opcoes={[{ valor: "suave", nome: "Sombra suave" }, { valor: "longa", nome: "Sombra longa" }]}
                      onChange={(v) => edita("sombraEstilo", v)}
                    />
                    <Slider rotulo="Sombra" valor={cena.sombra} min={0} max={100} padrao={PADRAO.sombra} unidade="%" onChange={(v) => edita("sombra", v)} />
                  </Pasta>

                  <Pasta
                    titulo="Ajuste fino"
                    abertaDeInicio={!igual([cena.tamanho, cena.pos, cena.lente], [PADRAO.tamanho, PADRAO.pos, PADRAO.lente])}
                    sujo={!igual([cena.tamanho, cena.pos, cena.lente], [PADRAO.tamanho, PADRAO.pos, PADRAO.lente])}
                    onReset={() => setCena((c) => ({ ...c, tamanho: PADRAO.tamanho, pos: PADRAO.pos, lente: PADRAO.lente }))}
                  >
                    <Vetor
                      rotulo="Rotação"
                      partes={(["x", "y", "z"] as const).map((k) => ({
                        letra: k.toUpperCase(),
                        valor: cena.rot[k],
                        // X e Y param onde o arrasto para: passando disso, a espessura do aparelho deixa de convencer.
                        min: k === "z" ? -180 : -LIMITE_DO_GIRO,
                        max: k === "z" ? 180 : LIMITE_DO_GIRO,
                        unidade: "°",
                        onChange: (v: number) => edita("rot", (r) => ({ ...r, [k]: v })),
                      }))}
                    />
                    <Slider rotulo="Zoom" valor={cena.tamanho} min={ZOOM.min} max={ZOOM.max} padrao={PADRAO.tamanho} unidade="%" onChange={(v) => edita("tamanho", v)} />
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
                </Tabs.Content>

                <Tabs.Content value="movimento" forceMount hidden={aba !== "movimento"} className="mk-aba-corpo">
                  <Pasta titulo="Tipo de movimento" sujo={!igual(cena.movimento, PADRAO.movimento)} onReset={() => edita("movimento", PADRAO.movimento)}>
                    <Miniaturas rotulo="Movimento">
                      {MOVIMENTOS.map((m) => (
                        <Miniatura key={m.id} nome={m.nome} ativa={cena.movimento.tipo === m.id} onClick={() => escolherMovimento(m.id)}>
                          <FoneMini modelo={modelo} classe={`mk-anima-${m.id}`} />
                          <IconeDoMovimento tipo={m.id} />
                        </Miniatura>
                      ))}
                    </Miniaturas>
                    {anima ? (
                      <>
                        <Slider rotulo="Duração" valor={cena.movimento.duracao} min={1} max={30} passo={0.5} padrao={PADRAO.movimento.duracao} unidade=" s" casas={1} onChange={(v) => edita("movimento", (m) => ({ ...m, duracao: v }))} />
                        {ehCenas ? null : <Slider rotulo="Intensidade" valor={cena.movimento.intensidade} min={0} max={100} padrao={PADRAO.movimento.intensidade} unidade="%" onChange={(v) => edita("movimento", (m) => ({ ...m, intensidade: v }))} />}
                      </>
                    ) : null}
                  </Pasta>

                  <Pasta
                    titulo="Foco"
                    abertaDeInicio={cena.foco.ativo}
                    sujo={!igual(cena.foco, PADRAO.foco)}
                    onReset={() => setCena((c) => ({ ...c, foco: PADRAO.foco, movimento: c.movimento.tipo === "close" ? { ...c.movimento, tipo: "parado" } : c.movimento }))}
                  >
                    <Segmentos
                      rotulo="Foco"
                      valor={cena.foco.ativo ? "com" : "sem"}
                      opcoes={[{ valor: "sem", nome: "Sem foco" }, { valor: "com", nome: "Com foco" }]}
                      onChange={(v) => ligarFoco(v === "com")}
                    />
                    {cena.foco.ativo ? (
                      <>
                        <Alvo
                          rotulo="Área em foco"
                          x={cena.foco.x}
                          y={cena.foco.y}
                          aspecto={estaGirada ? 1 / MODELOS[modelo].aspecto : MODELOS[modelo].aspecto}
                          raio={((cena.foco.area / 100) * Math.min(baseW, baseH)) / cena.foco.zoom / (estaGirada ? alturaAparelho : larguraAparelho)}
                          arte={focoArte}
                          rolagem={cena.rolagem}
                          onChange={(x, y) => edita("foco", (f) => ({ ...f, x, y }))}
                        />
                        <Slider rotulo="Close" valor={cena.foco.zoom} min={1} max={4} passo={0.1} padrao={PADRAO.foco.zoom} unidade="×" casas={1} onChange={(v) => edita("foco", (f) => ({ ...f, zoom: v }))} />
                        <Slider rotulo="Área" valor={cena.foco.area} min={10} max={80} padrao={PADRAO.foco.area} unidade="%" onChange={(v) => edita("foco", (f) => ({ ...f, area: v }))} />
                        <Slider rotulo="Desfoque" valor={cena.foco.desfoque} min={0} max={48} padrao={PADRAO.foco.desfoque} unidade=" px" onChange={(v) => edita("foco", (f) => ({ ...f, desfoque: v }))} />
                      </>
                    ) : null}
                  </Pasta>
                </Tabs.Content>
              </div>
            </Tabs.Root>
            <input ref={seletor} type="file" accept="image/*,video/*" hidden onChange={(e) => { void receber(e.target.files?.[0]); e.target.value = ""; }} />

            <footer className="mk-saida">
              <div className="mk-saida-opcoes" data-aberta={opcoesAbertas || undefined} aria-hidden={!opcoesAbertas}>
                <div>
                  {emVideo ? (
                    <>
                    <Segmentos
                      rotulo="Formato do vídeo"
                      valor={formatoVideo}
                      opcoes={[{ valor: "mp4", nome: "MP4", desligada: semMp4 || transparente }, { valor: "webm", nome: "WebM" }, { valor: "gif", nome: "GIF", desligada: transparente }]}
                      onChange={(v) => edita("saida", (s) => ({ ...s, video: v }))}
                    />
                    </>
                  ) : null}
                  <Segmentos
                    rotulo="Formato da imagem"
                    valor={cena.saida.imagem}
                    opcoes={[{ valor: "png", nome: "PNG" }, { valor: "webp", nome: "WebP" }]}
                    onChange={(v) => edita("saida", (s) => ({ ...s, imagem: v }))}
                  />
                  {emVideo ? null : (
                    <button type="button" className="mk-sugestao" onClick={() => { setAba("movimento"); setOpcoesAbertas(false); }}>
                      <Play size={13} aria-hidden />
                      Para sair em vídeo, escolha um movimento
                    </button>
                  )}
                  {emGif ? null : (
                    <Segmentos
                      rotulo="Resolução"
                      valor={String(cena.saida.largura) as "1080" | "1440" | "2160"}
                      opcoes={[{ valor: "1080", nome: "Full HD" }, { valor: "1440", nome: "2K" }, { valor: "2160", nome: "4K" }]}
                      onChange={(v) => edita("saida", (s) => ({ ...s, largura: Number(v) as 1080 | 1440 | 2160 }))}
                    />
                  )}
                  {emVideo && !emGif ? (
                    <Segmentos
                      rotulo="Quadros por segundo"
                      valor={String(cena.saida.fps) as "30" | "60"}
                      opcoes={[{ valor: "30", nome: "30 fps" }, { valor: "60", nome: "60 fps" }]}
                      onChange={(v) => edita("saida", (s) => ({ ...s, fps: Number(v) as 30 | 60 }))}
                    />
                  ) : null}
                </div>
              </div>

              {aviso ? <p className="mk-aviso" role="status">{aviso}</p> : null}

              {estado && estado.total > 1 ? (
                <div className="mk-progresso" role="status">
                  <div><span style={{ transform: `scaleX(${estado.feito / estado.total})` }} /></div>
                  <p>
                    {estado.feito} de {estado.total}
                    {estado.resta !== null ? `, faltam ${duracaoFalada(estado.resta)}` : ""}
                    <button type="button" aria-label="Cancelar exportação" onClick={() => cancelar.current?.abort()}><X size={13} /></button>
                  </p>
                </div>
              ) : pronto ? (
                <div className="mk-pronto" role="status">
                  <p>Pronto: {pronto.nome.split(".").pop()!.toUpperCase()}, {pronto.w}×{pronto.h}<br />{bytesFalados(pronto.bytes)}</p>
                  <div>
                    {pronto.blob.type === "image/png" && typeof ClipboardItem !== "undefined" ? (
                      <Dica texto={copiado ? "Copiada" : "Copiar imagem"}>
                        <button type="button" className="mk-icone" aria-label={copiado ? "Imagem copiada" : "Copiar imagem"} onClick={() => void copiarImagem()}>
                          {copiado ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </Dica>
                    ) : null}
                    <button
                      type="button"
                      className="mk-secundario"
                      draggable
                      onDragStart={(e) => {
                        // Arrastar para fora da janela também baixa, no Chrome.
                        const tipo = pronto.nome.endsWith("mp4") ? "video/mp4" : pronto.nome.endsWith("webm") ? "video/webm" : pronto.nome.endsWith("gif") ? "image/gif" : `image/${pronto.nome.split(".").pop()}`;
                        e.dataTransfer.setData("DownloadURL", `${tipo}:${pronto.nome}:${pronto.url}`);
                      }}
                      onClick={() => baixar(pronto.url, pronto.nome)}
                    >
                      Baixar de novo
                    </button>
                    <button type="button" className="mk-icone" aria-label="Fechar" onClick={() => setPronto(null)}><X size={14} /></button>
                  </div>
                </div>
              ) : (
                <div className="mk-saida-linha">
                  <button type="button" className="mk-saida-resumo" aria-expanded={opcoesAbertas} onClick={() => setOpcoesAbertas((v) => !v)}>
                    <span className="mk-saida-texto"><span>{resumo}</span>
                    {emVideo && estimativa !== null ? <i>cerca de {duracaoFalada(estimativa)}</i> : null}</span>
                    <ChevronUp size={13} aria-hidden />
                  </button>
                  {emVideo && !exportando ? (
                    <Dica texto={`Só este quadro, em ${cena.saida.imagem.toUpperCase()}`}>
                      <button type="button" className="mk-exportar-quadro" aria-label={`Exportar este quadro em ${cena.saida.imagem.toUpperCase()}`} onClick={() => void exportar("imagem")}>
                        <ImagemIcone size={15} aria-hidden />
                      </button>
                    </Dica>
                  ) : null}
                  <button type="button" className="mk-exportar" data-quieto={pedindoTela || undefined} disabled={exportando} onClick={() => void exportar()}>
                    <Download size={15} aria-hidden />
                    {exportando ? "Gerando" : emVideo ? "Exportar vídeo" : "Exportar"}
                  </button>
                </div>
              )}
            </footer>
          </aside>
        </div>
      </div>
    </Tooltip.Provider>
  );
}

const nomeDaFoto = (u: string) => {
  const n = u.split("/").pop()!.replace(/\.\w+$/, "").replace(/^\w+-/, "");
  return n[0].toUpperCase() + n.slice(1);
};
const LIMITE_DO_GIRO = 75;
const limiteDoGiro = (n: number) => Math.max(-LIMITE_DO_GIRO, Math.min(LIMITE_DO_GIRO, Math.round(n)));

/** Parados, os desenhos de movimento se parecem: o ícone diz qual é sem precisar passar o mouse. */
function IconeDoMovimento({ tipo }: { tipo: TipoMovimento }) {
  const Icone = ICONE_DO_MOVIMENTO[tipo];
  return (
    <span className="mk-mini-selo" aria-hidden>
      <Icone size={11} />
    </span>
  );
}

/** A cópia desfocada é só imagem: nem ponteiro, nem Tab, nem leitor de tela chegam nela. */
const inerte = (el: HTMLDivElement | null) => {
  if (el) el.inert = true;
};

/** A medida do que chegou, para o aparelho já nascer na orientação certa. */
function medirArquivo(url: string, video: boolean) {
  return new Promise<{ w: number; h: number; duracao?: number }>((ok, falha) => {
    if (video) {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => ok({ w: v.videoWidth, h: v.videoHeight, duracao: v.duration });
      v.onerror = () => falha(new Error("video"));
      v.src = url;
    } else {
      const i = new Image();
      i.onload = () => ok({ w: i.naturalWidth, h: i.naturalHeight });
      i.onerror = () => falha(new Error("imagem"));
      i.src = url;
    }
  });
}

/** A sombra longa: o contorno do aparelho repetido na diagonal, sempre na mesma direção do quadro. */
function sombraLonga(comprimento: number, giroZ: number) {
  const a = ((45 - giroZ) * Math.PI) / 180;
  const passos = 28;
  return Array.from({ length: passos }, (_, i) => {
    const d = ((i + 1) / passos) * comprimento;
    const alfa = (1 - (i + 1) / passos) ** 2.4;
    return `${(Math.cos(a) * d).toFixed(1)}px ${(Math.sin(a) * d).toFixed(1)}px 0 oklch(0 0 0 / ${alfa.toFixed(3)})`;
  }).join(",");
}

/* ── A composição: o que entra no arquivo ─────────────────────────────── */

type MV = ReturnType<typeof useMotionValue<number>>;

const Composicao = React.memo(function Composicao({
  cena,
  tela,
  urlDaTela,
  baseW,
  baseH,
  rotX,
  rotY,
  rotZ,
  dx,
  dy,
  escala,
  opacidade,
  rolagem,
  onEscolher,
}: {
  cena: Cena;
  tela: Tela;
  urlDaTela?: string;
  baseW: number;
  baseH: number;
  rotX: MV;
  rotY: MV;
  rotZ: MV;
  dx: ReturnType<typeof useMotionValue<string>>;
  dy: ReturnType<typeof useMotionValue<string>>;
  escala: MV;
  opacidade: MV;
  rolagem: ReturnType<typeof useMotionValue<string>>;
  onEscolher: () => void;
}) {
  const { w: larguraFone, h: alturaFone, subida, perspectiva } = medidasDoAparelho(cena, baseW, baseH);
  const a = ACABAMENTOS[cena.acabamento];
  const rotation = React.useMemo(() => ({ x: rotX, y: rotY, z: rotZ }), [rotX, rotY, rotZ]);
  // O reflexo anda ao contrário do giro: é isso que faz o vidro parecer vidro.
  const reflexoX = useTransform(rotY, (y) => `${y * -1.1}%`);
  const estaGirada = girada(cena);
  const longa = cena.sombraEstilo === "longa";
  return (
    <motion.div
      className="mk-pose"
      style={{
        left: `${50 + cena.pos.x / 2}%`,
        top: `${50 + cena.pos.y / 2}%`,
        width: larguraFone,
        height: alturaFone,
        marginLeft: -larguraFone / 2,
        marginTop: -alturaFone / 2 - subida,
        x: dx,
        y: dy,
        scale: escala,
        opacity: opacidade,
        perspective: perspectiva,
        "--mk-traco": corDoTraco(cena),
        "--mk-traco-w": `${cena.traco.espessura}px`,
      } as React.ComponentProps<typeof motion.div>["style"]}
      data-traco={cena.aparelhoEstilo === "real" ? undefined : cena.aparelhoEstilo}
    >
      {cena.sombra > 0 ? (
        <motion.div
          className="mk-sombra"
          data-modelo={cena.modelo}
          data-estilo={cena.sombraEstilo}
          style={{
            rotateX: rotX,
            rotateY: rotY,
            rotateZ: rotZ,
            x: longa ? 0 : "6%",
            y: longa ? 0 : "5%",
            opacity: cena.sombra / 100,
            filter: `blur(${larguraFone * (longa ? 0.05 : 0.11)}px)`,
            boxShadow: longa ? sombraLonga(larguraFone * 0.7, cena.rot.z + giroDaOrientacao(cena)) : undefined,
          }}
        />
      ) : null}
      <DeviceFrame
        device={cena.modelo}
        rotation={rotation}
        intro={false}
        style={
          {
            "--device-body": a.corpo,
            "--device-edge": a.borda,
            "--device-perspective": `${perspectiva}px`,
            // O brilho de fábrica da peça sai: aqui quem reflete é a camada abaixo, com estilo e intensidade.
            "--device-glare": "0%",
          } as React.CSSProperties
        }
      >
        <div className={estaGirada ? "mk-tela-rotor" : "mk-tela-reta"}>
          <div className={estaGirada ? "mk-tela-girada" : "mk-tela-reta"}>
            <ConteudoDaTela tela={tela} url={urlDaTela} ajuste={cena.ajuste} rolagem={rolagem} onEscolher={onEscolher} />
          </div>
        </div>
        {cena.aparelhoEstilo === "real" && cena.reflexoEstilo !== "nenhum" && cena.reflexo > 0 ? (
          <motion.span className="mk-reflexo" data-estilo={cena.reflexoEstilo} style={{ x: reflexoX, opacity: cena.reflexo / 100 }} aria-hidden />
        ) : null}
      </DeviceFrame>
    </motion.div>
  );
});

function ConteudoDaTela({ tela, url, ajuste, rolagem, onEscolher }: { tela: Tela; url?: string; ajuste: Cena["ajuste"]; rolagem: ReturnType<typeof useMotionValue<string>>; onEscolher: () => void }) {
  if (tela.tipo === "convite") {
    return (
      <button type="button" className="mk-tela-convite" onClick={onEscolher}>
        <Upload aria-hidden />
        <strong className="mk-so-mouse">Solte sua tela aqui</strong>
        <strong className="mk-so-toque">Toque para pôr sua tela</strong>
        <span>Imagem ou vídeo<i className="mk-so-mouse">, ou cole com Ctrl + V</i></span>
      </button>
    );
  }
  if (tela.tipo === "vivo") {
    return (
      <div className="mk-tela-sensor">
        <div className="mk-tela-camera" aria-hidden />
        <div className="mk-tela-folha"><SensorDial /></div>
      </div>
    );
  }
  if (tela.tipo === "video") {
    return <motion.video key={url} src={url} autoPlay muted loop playsInline className="mk-tela-midia" style={{ objectFit: ajuste, objectPosition: rolagem }} />;
  }
  if (!url) return <div className="mk-tela-midia" />;
  // Em `cover`, a posição em % percorre exatamente o que sobra do arquivo: é a rolagem, sem medir nada.
  return <motion.img src={url} alt="" className="mk-tela-midia" style={{ objectFit: ajuste, objectPosition: rolagem }} />;
}

/* ── A linha do tempo ─────────────────────────────────────────────────── */

function Linha({
  tempo,
  duracao,
  tocando,
  loop,
  onTocar,
  onBuscar,
  topo,
}: {
  tempo: ReturnType<typeof useMotionValue<number>>;
  duracao: number;
  tocando: boolean;
  loop: boolean;
  onTocar: () => void;
  onBuscar: (t: number) => void;
  topo?: React.ReactNode;
}) {
  const leitura = React.useRef<HTMLSpanElement>(null);
  const agulha = React.useRef<HTMLSpanElement>(null);
  const pintar = (t: number) => {
    const p = Math.min(1, t);
    if (agulha.current) agulha.current.style.transform = `scaleX(${p})`;
    if (leitura.current) leitura.current.textContent = numero(p * duracao, 1);
  };
  useMotionValueEvent(tempo, "change", pintar);
  React.useEffect(() => pintar(tempo.get()));
  const buscar = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onBuscar(Math.max(0, Math.min(0.999, (e.clientX - r.left) / r.width)));
  };
  return (
    <div className="mk-linha-tempo">
      {topo}
      <div className="mk-linha-tempo-fila">
      <Dica texto={tocando ? "Pausar" : "Tocar"} tecla="Espaço">
        <button type="button" className="mk-icone" aria-label={tocando ? "Pausar" : "Tocar"} onClick={onTocar}>
          {tocando ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
        </button>
      </Dica>
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
        <span ref={leitura}>0,0</span>
        <i> de {numero(duracao, 1)} s</i>
        {loop ? <RotateCcw size={11} aria-label="Em loop" /> : null}
      </p>
      </div>
    </div>
  );
}
