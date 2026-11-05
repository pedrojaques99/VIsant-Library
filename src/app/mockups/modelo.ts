/**
 * A cena de um mockup: tudo o que o painel edita, e nada do que só a tela sabe.
 *
 * O movimento é função pura do tempo (`movimentoEm`), e é isso que sustenta o estúdio:
 * o preview e a exportação quadro a quadro chamam a mesma conta, então o vídeo baixado é
 * o que se viu, e não uma regravação aproximada.
 */

/** `cheio` não tem medida própria: o quadro é o palco, então acompanha a tela de quem está usando. */
export type Proporcao = "cheio" | "9:16" | "4:5" | "1:1" | "16:9";
export type TipoMovimento = "parado" | "flutuar" | "balancar" | "pendulo" | "aproximar" | "entrada" | "varredura" | "close";
export type ModoFundo = "cor" | "degrade" | "foto" | "nenhum";
export type FormatoImagem = "png" | "webp";
export type FormatoVideo = "mp4" | "webm" | "gif";
export type Orientacao = "retrato" | "paisagem";
/** `real` tem volume e reflexo; `plano` é chapado; `contorno` é só o traço. */
export type EstiloAparelho = "real" | "plano" | "contorno";
export type EstiloSombra = "suave" | "longa";
export type EstiloReflexo = "nenhum" | "janela" | "estudio" | "faixa";
export type Acabamento = keyof typeof ACABAMENTOS;
export type Modelo = keyof typeof MODELOS;

export interface Tela {
  id: string;
  /** `vivo` é a peça React rodando dentro do aparelho. */
  tipo: "vivo" | "imagem" | "video";
  url?: string;
  /** A mesma tela em versão larga, para tablet e notebook. */
  largo?: string;
  /** Na largura de um celular deitado: a versão de desktop ali viraria texto de poucos pixels. */
  deitada?: string;
  poster?: string;
  nome: string;
}

export interface Cena {
  modelo: Modelo;
  telaId: string;
  ajuste: "cover" | "contain";
  /** A forma da tela, não a do aparelho: um celular em `paisagem` deita, um tablet em `paisagem` fica como nasceu. */
  orientacao: Orientacao;
  rot: { x: number; y: number; z: number };
  tamanho: number;
  pos: { x: number; y: number };
  lente: number;
  acabamento: Acabamento;
  aparelhoEstilo: EstiloAparelho;
  /** `cor` nula acompanha o fundo. A espessura é em px do quadro, então vale igual nos três aparelhos. */
  traco: { cor: string | null; espessura: number };
  reflexo: number;
  reflexoEstilo: EstiloReflexo;
  sombra: number;
  sombraEstilo: EstiloSombra;
  /** `x` e `y` em % da tela do aparelho; `area` em % do lado menor do quadro, como se vê no close. */
  foco: { ativo: boolean; x: number; y: number; zoom: number; area: number; desfoque: number };
  fundo: { modo: ModoFundo; cor: string; a: string; b: string; angulo: number; foto: string; desfoque: number };
  proporcao: Proporcao;
  movimento: { tipo: TipoMovimento; duracao: number; intensidade: number };
  saida: { largura: 1080 | 1440 | 2160; fps: 30 | 60; imagem: FormatoImagem; video: FormatoVideo };
}

/**
 * `moldura` é a borda em volta da tela, sobre a largura do aparelho: espelha o `padding` de cada um em device-frame.
 * O notebook tem a base abaixo da tampa, que é a caixa medida: `escala` e `subida` fazem o conjunto caber e ficar
 * centrado, e `distancia` afasta a câmera para a borda da frente da base não crescer demais.
 */
export const MODELOS = {
  phone: { nome: "Celular", aspecto: 1 / 2.05, moldura: 0.035, escala: 1, subida: 0, distancia: 3.4 },
  tablet: { nome: "Tablet", aspecto: 4 / 3, moldura: 0.024, escala: 1, subida: 0, distancia: 3.4 },
  laptop: { nome: "MacBook", aspecto: 16 / 10, moldura: 0.011, escala: 0.8, subida: 0.2, distancia: 4.6 },
} as const;

export const ACABAMENTOS = {
  grafite: { nome: "Grafite", corpo: "oklch(0.25 0 0)", borda: "oklch(0.36 0 0)" },
  prata: { nome: "Prata", corpo: "oklch(0.86 0.004 250)", borda: "oklch(0.95 0.002 250)" },
  titanio: { nome: "Titânio", corpo: "oklch(0.56 0.012 70)", borda: "oklch(0.68 0.012 70)" },
  areia: { nome: "Areia", corpo: "oklch(0.8 0.03 75)", borda: "oklch(0.89 0.025 75)" },
  noite: { nome: "Noite", corpo: "oklch(0.3 0.05 255)", borda: "oklch(0.42 0.06 255)" },
} as const;

export const PADRAO: Cena = {
  modelo: "phone",
  telaId: "pagina",
  ajuste: "cover",
  orientacao: "retrato",
  rot: { x: 14, y: -12, z: 6 },
  tamanho: 76,
  pos: { x: 0, y: 0 },
  lente: 50,
  acabamento: "grafite",
  aparelhoEstilo: "real",
  traco: { cor: null, espessura: 6 },
  reflexo: 22,
  reflexoEstilo: "janela",
  sombra: 55,
  sombraEstilo: "suave",
  foco: { ativo: false, x: 50, y: 50, zoom: 1.6, area: 45, desfoque: 10 },
  fundo: { modo: "degrade", cor: "#16181D", a: "#3B3F49", b: "#14151A", angulo: 160, foto: "/media/textura-neon.webp", desfoque: 0 },
  proporcao: "cheio",
  movimento: { tipo: "parado", duracao: 6, intensidade: 50 },
  saida: { largura: 1080, fps: 30, imagem: "png", video: "mp4" },
};

export const TELAS: Tela[] = [
  { id: "pagina", tipo: "imagem", url: "/media/telas/pagina-retrato.webp", largo: "/media/telas/pagina-largo.webp", deitada: "/media/telas/pagina-deitado.webp", nome: "Site" },
  { id: "mesa", tipo: "imagem", url: "/media/telas/mesa-retrato.webp", largo: "/media/telas/mesa-largo.webp", deitada: "/media/telas/mesa-deitado.webp", nome: "App" },
  { id: "marca", tipo: "imagem", url: "/media/telas/marca-retrato.webp", largo: "/media/telas/marca-largo.webp", deitada: "/media/telas/marca-deitado.webp", nome: "Marca" },
  { id: "sensor", tipo: "vivo", nome: "Sensor" },
  { id: "vazia", tipo: "imagem", nome: "Vazia" },
  { id: "composicao", tipo: "video", url: "/media/video-composicao.mp4", poster: "/media/video-composicao.webp", nome: "Vídeo" },
];

export const FOTOS_DE_FUNDO = ["/media/textura-neon.webp", "/media/textura-bruma.webp", "/media/efeito-gradiente.webp", "/media/textura-papel.webp"];

export const CORES = ["#0B0B0D", "#16181D", "#F4F3F0", "#E9DDD0", "#8FA39A", "#93A6AD", "#6A4A3A", "#2B3A67"];

export const POSES: { id: string; nome: string; rot: Cena["rot"] }[] = [
  { id: "frente", nome: "Frente", rot: { x: 0, y: 0, z: 0 } },
  { id: "heroi", nome: "Herói", rot: { x: 14, y: -12, z: 6 } },
  { id: "esquerda", nome: "Esquerda", rot: { x: 6, y: 28, z: -3 } },
  { id: "direita", nome: "Direita", rot: { x: 6, y: -28, z: 3 } },
  { id: "mesa", nome: "Mesa", rot: { x: 54, y: 0, z: -24 } },
  { id: "queda", nome: "Queda", rot: { x: -18, y: 22, z: 16 } },
];

/* O notebook tem base: visto de baixo ela some de perfil, então ele só olha de cima (X negativo) e não inclina em Z. */
export const POSES_NOTEBOOK: typeof POSES = [
  { id: "frente", nome: "Frente", rot: { x: -8, y: 0, z: 0 } },
  { id: "heroi", nome: "Herói", rot: { x: -14, y: -22, z: 0 } },
  { id: "esquerda", nome: "Esquerda", rot: { x: -12, y: 34, z: 0 } },
  { id: "direita", nome: "Direita", rot: { x: -12, y: -34, z: 0 } },
  { id: "mesa", nome: "Mesa", rot: { x: -34, y: -18, z: 0 } },
  { id: "baixo", nome: "Rasante", rot: { x: -2, y: 26, z: 0 } },
];
export const posesDe = (m: Modelo) => (m === "laptop" ? POSES_NOTEBOOK : POSES);
export const heroiDe = (m: Modelo) => posesDe(m)[1].rot;

export const MOVIMENTOS: { id: TipoMovimento; nome: string; emLoop: boolean }[] = [
  { id: "parado", nome: "Parado", emLoop: false },
  { id: "flutuar", nome: "Flutuar", emLoop: true },
  { id: "balancar", nome: "Balançar", emLoop: true },
  { id: "pendulo", nome: "Pêndulo", emLoop: true },
  { id: "aproximar", nome: "Aproximar", emLoop: true },
  { id: "entrada", nome: "Entrada", emLoop: false },
  { id: "varredura", nome: "Varredura", emLoop: false },
  { id: "close", nome: "Close", emLoop: true },
];

/** Pontos de partida inteiros: trocam a cena, mas nunca a tela nem a saída de quem já escolheu. */
export const PRESETS: { id: string; nome: string; rotNotebook: Cena["rot"]; aplica: Partial<Cena> }[] = [
  { id: "estudio", nome: "Estúdio", rotNotebook: POSES_NOTEBOOK[1].rot, aplica: { aparelhoEstilo: "real", rot: { x: 14, y: -12, z: 6 }, tamanho: 76, acabamento: "grafite", sombra: 55, sombraEstilo: "suave", reflexo: 22, reflexoEstilo: "janela", fundo: { ...PADRAO.fundo, modo: "degrade", a: "#3B3F49", b: "#14151A", angulo: 160 } } },
  { id: "papel", nome: "Papel", rotNotebook: POSES_NOTEBOOK[0].rot, aplica: { aparelhoEstilo: "real", rot: { x: 0, y: 0, z: 0 }, tamanho: 78, acabamento: "grafite", sombra: 30, sombraEstilo: "longa", reflexo: 0, reflexoEstilo: "nenhum", fundo: { ...PADRAO.fundo, modo: "cor", cor: "#F4F3F0" } } },
  { id: "noite", nome: "Noite", rotNotebook: POSES_NOTEBOOK[4].rot, aplica: { aparelhoEstilo: "real", rot: { x: 54, y: 0, z: -24 }, tamanho: 82, acabamento: "noite", sombra: 80, sombraEstilo: "suave", reflexo: 40, reflexoEstilo: "estudio", fundo: { ...PADRAO.fundo, modo: "cor", cor: "#0B0B0D" } } },
  { id: "foto", nome: "Foto", rotNotebook: POSES_NOTEBOOK[2].rot, aplica: { aparelhoEstilo: "real", rot: { x: 6, y: 28, z: -3 }, tamanho: 76, acabamento: "titanio", sombra: 70, sombraEstilo: "suave", reflexo: 25, reflexoEstilo: "janela", fundo: { ...PADRAO.fundo, modo: "foto", foto: "/media/textura-neon.webp", desfoque: 12 } } },
  { id: "plano", nome: "Plano", rotNotebook: { x: 0, y: 0, z: 0 }, aplica: { aparelhoEstilo: "plano", rot: { x: 0, y: 0, z: 0 }, tamanho: 78, acabamento: "grafite", sombra: 0, sombraEstilo: "suave", fundo: { ...PADRAO.fundo, modo: "cor", cor: "#E9DDD0" } } },
  { id: "contorno", nome: "Contorno", rotNotebook: { x: 0, y: 0, z: 0 }, aplica: { aparelhoEstilo: "contorno", rot: { x: 0, y: 0, z: 0 }, tamanho: 78, sombra: 0, sombraEstilo: "suave", fundo: { ...PADRAO.fundo, modo: "cor", cor: "#F4F3F0" } } },
];

export const ASPECTO: Record<Exclude<Proporcao, "cheio">, number> = { "9:16": 9 / 16, "4:5": 4 / 5, "1:1": 1, "16:9": 16 / 9 };

/** A dimensão de saída: `largura` é o lado MENOR, como se fala de vídeo. Sempre par, que o encoder exige. */
export function dimensoes(a: number, largura: number) {
  const par = (n: number) => Math.round(n / 2) * 2;
  return a < 1 ? { w: largura, h: par(largura / a) } : { w: par(largura * a), h: largura };
}

/** GIF pesa rápido e só tem 256 cores: tamanho e cadência fixos, como no exportador do visantlabs-os. */
export const GIF = { fps: 15, maiorLado: 640 };
export function dimensoesGif(a: number) {
  const par = (n: number) => Math.round(n / 2) * 2;
  return a < 1 ? { w: par(GIF.maiorLado * a), h: GIF.maiorLado } : { w: GIF.maiorLado, h: par(GIF.maiorLado / a) };
}

/** O quadro `cheio` acompanha o palco na tela, mas o arquivo sai numa medida que serve em qualquer lugar. */
export const ASPECTO_DO_ARQUIVO_CHEIO = 16 / 9;

const NATURAL: Record<Modelo, Orientacao> = { phone: "retrato", tablet: "paisagem", laptop: "paisagem" };
export const orientacaoNatural = (m: Modelo) => NATURAL[m];
/** Sensor é peça de celular em pé, e notebook não deita. */
export const podeGirar = (c: Pick<Cena, "modelo" | "telaId">) => c.modelo !== "laptop" && c.telaId !== "sensor";
export const girada = (c: Cena) => podeGirar(c) && c.orientacao !== NATURAL[c.modelo];
/** O quarto de volta do aparelho deitado. A tela gira o mesmo ao contrário, então o conteúdo fica de pé. */
export const giroDaOrientacao = (c: Cena) => (girada(c) ? 90 : 0);

export const animado = (c: Cena) => c.movimento.tipo !== "parado";
export const emLoop = (c: Cena) => MOVIMENTOS.find((m) => m.id === c.movimento.tipo)?.emLoop ?? false;

const suave = (t: number) => t * t * (3 - 2 * t);
const saida = (t: number) => 1 - (1 - t) ** 3;

/** O desvio da pose em `t` (0 a 1). Quem entra em loop fecha em si mesmo: t = 0 e t = 1 são o mesmo quadro. */
export function movimentoEm(c: Cena, t: number) {
  const i = c.movimento.intensidade / 50;
  const o = t * Math.PI * 2;
  const m = { x: 0, y: 0, z: 0, dy: 0, escala: 1, opacidade: 1, foco: 1 };
  switch (c.movimento.tipo) {
    case "flutuar":
      m.x = Math.sin(o) * 3 * i;
      m.y = Math.cos(o) * 5 * i;
      m.dy = Math.sin(o) * 1.4 * i;
      break;
    case "balancar":
      m.y = Math.sin(o) * 20 * i;
      m.x = Math.sin(o * 2) * 2 * i;
      break;
    case "pendulo":
      m.z = Math.sin(o) * 7 * i;
      break;
    case "aproximar":
      m.escala = 1 + (1 - Math.cos(o)) * 0.12 * i;
      break;
    case "entrada": {
      const e = saida(Math.min(1, t / 0.6));
      m.x = (1 - e) * 38 * i;
      m.y = -(1 - e) * 26 * i;
      m.z = (1 - e) * 6 * i;
      m.dy = (1 - e) * 16 * i;
      m.opacidade = Math.min(1, t / 0.2);
      break;
    }
    case "varredura":
      m.y = (suave(t) - 0.5) * 70 * i;
      break;
    case "close":
      m.foco = t < 0.3 ? suave(t / 0.3) : t > 0.7 ? suave((1 - t) / 0.3) : 1;
      break;
  }
  return m;
}

/** O tamanho do aparelho: `tamanho` é a altura sobre o lado disponível, então 62% quer dizer o mesmo em todo quadro. */
export function medidasDoAparelho(c: Cena, baseW: number, baseH: number) {
  const { aspecto, escala, subida, distancia } = MODELOS[c.modelo];
  // Deitado, o lado comprido do aparelho é a largura do quadro: quem limita troca de eixo.
  const limite = girada(c) ? Math.min(baseW * 0.8683, baseH / aspecto) : Math.min(baseH, (baseW / aspecto) * 0.8683);
  const h = (limite * c.tamanho * escala) / 100;
  const w = h * aspecto;
  return { w, h, subida: h * subida, perspectiva: w * (c.lente / 50) * distancia };
}

/**
 * Onde o ponto de foco cai no quadro em `t`: a mesma conta que o CSS faz, rotateX · rotateY · rotateZ
 * e depois a perspectiva. Assim o close acompanha o aparelho girando, sem medir nada na tela.
 */
export function pontoDeFoco(c: Cena, t: number, baseW: number, baseH: number) {
  const m = movimentoEm(c, t);
  const { w, h, subida, perspectiva } = medidasDoAparelho(c, baseW, baseH);
  const borda = MODELOS[c.modelo].moldura * w;
  const u = c.foco.x / 100 - 0.5;
  const v = c.foco.y / 100 - 0.5;
  // Deitado, x e y do foco falam da tela como ela é vista: viram eixos trocados no corpo do aparelho.
  const lx = girada(c) ? v * (w - borda * 2) : u * (w - borda * 2);
  const ly = girada(c) ? -u * (h - borda * 2) : v * (h - borda * 2);
  const rad = (g: number) => (g * Math.PI) / 180;
  const [a, b, g] = [rad(c.rot.x + m.x), rad(c.rot.y + m.y), rad(c.rot.z + m.z + giroDaOrientacao(c))];
  const x1 = lx * Math.cos(g) - ly * Math.sin(g);
  const y1 = lx * Math.sin(g) + ly * Math.cos(g);
  const x2 = x1 * Math.cos(b);
  const z2 = -x1 * Math.sin(b);
  const y3 = y1 * Math.cos(a) - z2 * Math.sin(a);
  const z3 = y1 * Math.sin(a) + z2 * Math.cos(a);
  const k = perspectiva / (perspectiva - z3);
  return {
    x: (baseW * (50 + c.pos.x / 2)) / 100 + m.escala * x2 * k,
    y: (baseH * (50 + c.pos.y / 2)) / 100 - subida + (m.dy / 100) * h + m.escala * y3 * k,
  };
}

/** A câmera do foco em `t`. O centro da vista é preso ao quadro: um close na beira não mostra o que fica fora dele. */
export function cameraEm(c: Cena, t: number, baseW: number, baseH: number) {
  const f = c.foco.ativo ? movimentoEm(c, t).foco : 0;
  if (f < 0.001) return { x: 0, y: 0, zoom: 1, desfoque: 0, mascara: "none" };
  const alvo = pontoDeFoco(c, t, baseW, baseH);
  const zoom = 1 + (c.foco.zoom - 1) * f;
  const prende = (n: number, lado: number) => Math.max(lado / (2 * zoom), Math.min(lado - lado / (2 * zoom), n));
  const vx = prende(baseW / 2 + (alvo.x - baseW / 2) * f, baseW);
  const vy = prende(baseH / 2 + (alvo.y - baseH / 2) * f, baseH);
  const raio = ((c.foco.area / 100) * Math.min(baseW, baseH)) / zoom;
  return {
    x: baseW / 2 - vx * zoom,
    y: baseH / 2 - vy * zoom,
    zoom,
    desfoque: (c.foco.desfoque * f) / zoom,
    mascara: `radial-gradient(circle ${raio.toFixed(1)}px at ${alvo.x.toFixed(1)}px ${alvo.y.toFixed(1)}px, black 62%, transparent 100%)`,
  };
}

const luz = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
/** A cor do traço: a que escolheram ou, sem escolha, a que aparece sobre este fundo. */
export function corDoTraco(c: Cena) {
  if (c.traco.cor) return c.traco.cor;
  const f = c.fundo;
  if (f.modo === "foto") return "#FFFFFF";
  if (f.modo === "nenhum") return "#111114";
  const claro = f.modo === "cor" ? luz(f.cor) : (luz(f.a) + luz(f.b)) / 2;
  return claro > 0.5 ? "#111114" : "#FFFFFF";
}

export const fundoCss = (f: Cena["fundo"]) =>
  f.modo === "cor" ? f.cor : f.modo === "degrade" ? `linear-gradient(${f.angulo}deg, ${f.a}, ${f.b})` : "transparent";

/** O que a tela recomenda como fundo: as cores dominantes dela, sem cinza e sem repetir tom. */
export async function paletaDe(url: string): Promise<string[]> {
  const img = new Image();
  img.src = url;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, 32, 32);
  const { data } = ctx.getImageData(0, 0, 32, 32);
  const baldes = new Map<string, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const chave = `${data[i] >> 5}-${data[i + 1] >> 5}-${data[i + 2] >> 5}`;
    const b = baldes.get(chave) ?? { n: 0, r: 0, g: 0, b: 0 };
    b.n++;
    b.r += data[i];
    b.g += data[i + 1];
    b.b += data[i + 2];
    baldes.set(chave, b);
  }
  const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0").toUpperCase();
  return [...baldes.values()]
    .sort((a, z) => z.n - a.n)
    .slice(0, 4)
    .map((b) => `#${hex(b.r / b.n)}${hex(b.g / b.n)}${hex(b.b / b.n)}`);
}
