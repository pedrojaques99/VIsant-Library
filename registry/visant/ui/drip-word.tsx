"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";

import { useTilt } from "@/hooks/use-tilt";
import { onThemeChange, resolveCssColor } from "@/lib/css-color";
import { cn } from "@/lib/utils";

export interface DripWordProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** A palavra que escorre. Curta: é desenhada grande. */
  word?: string;
  /** A tinta. Qualquer cor CSS ou token. */
  ink?: string;
  /**
   * Quantos fios escorrem.
   * @min 0
   * @max 7
   * @step 1
   */
  drips?: number;
  /**
   * Velocidade da gota.
   * @min 0
   * @max 100
   * @step 1
   */
  speed?: number;
}

const MAX_FIOS = 7;
const VERT = `attribute vec2 a_pos;void main(){gl_Position=vec4(a_pos,0.0,1.0);}`;

const FRAG = `
#extension GL_OES_standard_derivatives : enable
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uMask;
uniform vec2 uRes;
uniform vec2 uTexel;
uniform float uAlcance;
uniform vec3 uInk;
uniform vec3 uLuz;
uniform float uTime;
uniform vec4 uFio[${MAX_FIOS}];
uniform vec2 uRaio[${MAX_FIOS}];

float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}

float fio(vec2 p,vec2 a,vec2 b,float rRaiz,float rGota){
  vec2 pa=p-a,ba=b-a;
  float compr=length(ba);
  float h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-5),0.,1.);
  // O afinamento conta em distância, não em fração: fio curto e fio longo têm o mesmo pescoço.
  float r=mix(rRaiz,rGota*.3,smoothstep(0.,.075,h*compr));
  float pescoco=length(pa-ba*h)-r;
  float gota=length(p-b)-rGota;
  return smin(pescoco,gota,.022);
}

float campo(vec2 q){
  return (texture2D(uMask,q).a-.5)*uAlcance;
}

void main(){
  float asp=uRes.x/uRes.y;
  vec2 uv=vec2(gl_FragCoord.x/uRes.x,1.-gl_FragCoord.y/uRes.y);
  vec2 p=vec2(uv.x*asp,uv.y);
  vec2 q=uv;
  q.x+=sin(uv.y*18.+uTime*.8)*.0011;
  q.y+=sin(uv.x*26.-uTime*.6)*.0014;
  // Cinco amostras do campo arredondam os cantos: tinta não tem quina de vetor.
  float d=campo(q)*.28;
  d+=campo(q+vec2(uTexel.x,0.))*.18;
  d+=campo(q-vec2(uTexel.x,0.))*.18;
  d+=campo(q+vec2(0.,uTexel.y))*.18;
  d+=campo(q-vec2(0.,uTexel.y))*.18;
  for(int i=0;i<${MAX_FIOS};i++){
    if(uRaio[i].y<=0.)continue;
    d=smin(d,fio(p,uFio[i].xy,uFio[i].zw,uRaio[i].x,uRaio[i].y),.03);
  }
#ifdef GL_OES_standard_derivatives
  float aa=max(fwidth(d),1e-4);
  vec2 n=vec2(dFdx(d),dFdy(d))/aa;
  float rim=smoothstep(-.012,0.,d);
  float brilho=pow(max(dot(normalize(n+1e-5),normalize(vec2(-.55,.8))),0.),3.)*rim;
#else
  float aa=1.5/uRes.y;
  float brilho=0.;
#endif
  float a=1.-smoothstep(-aa,aa,d);
  vec3 c=mix(uInk,uLuz,brilho*.42);
  gl_FragColor=vec4(c*a,a);
}
`;

const fracao = (v: number) => v - Math.floor(v);
const liso = (a: number, b: number, v: number) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

type Pe = { x: number; y: number };

const INF = 1e12;

/** Uma linha da transformada de distância (Felzenszwalb): quadrado da distância ao ponto mais perto. */
function linha(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array) {
  let k = 0;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}

/** Distância até os pixels marcados, nas duas direções da grade. */
function distancias(marcado: Uint8Array, w: number, h: number) {
  const m = Math.max(w, h);
  const f = new Float64Array(m);
  const d = new Float64Array(m);
  const v = new Int32Array(m);
  const z = new Float64Array(m + 1);
  const saida = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) saida[i] = marcado[i] ? 0 : INF;
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = saida[y * w + x];
    linha(f, h, d, v, z);
    for (let y = 0; y < h; y++) saida[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = saida[y * w + x];
    linha(f, w, d, v, z);
    for (let x = 0; x < w; x++) saida[y * w + x] = Math.sqrt(d[x]);
  }
  return saida;
}

/** O campo de distância da palavra em 8 bits: 0,5 é a borda, e `alcance` são os px cobertos. */
function campoDaPalavra(dado: ImageData, alcance: number) {
  const { width: w, height: h, data } = dado;
  const dentro = new Uint8Array(w * h);
  const fora = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const tinta = data[i * 4 + 3] > 127;
    dentro[i] = tinta ? 1 : 0;
    fora[i] = tinta ? 0 : 1;
  }
  const ateTinta = distancias(dentro, w, h);
  const ateFundo = distancias(fora, w, h);
  const campo = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const assinada = ateTinta[i] - ateFundo[i];
    campo[i] = Math.max(0, Math.min(255, Math.round((0.5 + assinada / alcance) * 255)));
  }
  return campo;
}

/** Os pés das letras: colunas onde a tinta encosta na linha de base, de onde a gota nasce. */
function acharPes(dado: ImageData, quantos: number): Pe[] {
  const { width: w, height: h, data } = dado;
  const fundo: number[] = [];
  for (let x = 0; x < w; x++) {
    let y = -1;
    for (let l = h - 1; l >= 0; l--) {
      if (data[(l * w + x) * 4 + 3] > 128) {
        y = l;
        break;
      }
    }
    fundo.push(y);
  }
  const base = Math.max(...fundo);
  if (base < 0) return [];
  const tolerancia = h * 0.018;
  const trechos: Pe[] = [];
  let ini = -1;
  for (let x = 0; x <= w; x++) {
    const no = x < w && fundo[x] >= base - tolerancia;
    if (no && ini < 0) ini = x;
    if (!no && ini >= 0) {
      trechos.push({ x: (ini + x - 1) / 2 / w, y: base / h });
      ini = -1;
    }
  }
  if (trechos.length <= quantos) return trechos;
  return Array.from({ length: quantos }, (_, i) => trechos[Math.round((i * (trechos.length - 1)) / Math.max(quantos - 1, 1))]);
}

/**
 * Drip Word: a palavra é tinta viscosa. Dos pés das letras nascem fios que descem, afinam
 * no pescoço, soltam a gota e recolhem, e arrastar de lado inclina a gravidade.
 *
 * - **Shader, não contorno animado.** A palavra vira um campo de distância, calculado uma
 *   vez por tamanho, e o desenho é esse campo cortado num limiar. Os fios entram no mesmo campo com união suave,
 *   então a raiz funde com a letra sem emenda nenhuma. É isso que lê como líquido.
 * - **Os fios nascem onde há tinta.** A máscara é lida uma vez e os pés saem da linha de
 *   base de verdade: funciona com qualquer palavra e qualquer fonte.
 * - **Minimal de propósito.** Uma tinta só, e um brilho curto na borda misturando a tinta
 *   com o fundo, sem cor nova. O brilho vem de `fwidth`, sem amostrar o campo três vezes,
 *   para caber no celular. A troca de tema relê os tokens em vez de repintar por quadro.
 * - **Um contexto só, e devolvido.** Canvas criado no efeito, contexto perdido de propósito
 *   no unmount, laço parado fora da tela. Sem WebGL, a palavra aparece em texto.
 * - **`pan-y`.** Arrastar de lado inclina; rolar em pé é da página. No celular, o primeiro
 *   toque pede o giroscópio, e inclinar o aparelho vira a gravidade.
 * - **Movimento reduzido:** um quadro parado com os fios já descidos, sem laço. O arrasto
 *   ainda inclina, sem balanço.
 */
export function DripWord({ word = "fluxo", ink = "var(--foreground)", drips = 6, speed = 40, className, ...rest }: DripWordProps) {
  const reduz = useReducedMotion();
  const caixa = React.useRef<HTMLDivElement>(null);
  const [semGl, setSemGl] = React.useState(false);
  const entrada = React.useRef({ alvo: 0.28, sensor: null as number | null });
  const redesenhar = React.useRef<() => void>(() => {});
  const preso = React.useRef<{ x: number; de: number; larg: number } | null>(null);

  const giro = useTilt((g) => {
    const v = Math.max(-1, Math.min(1, g / 28));
    entrada.current.sensor = v;
    if (!preso.current) entrada.current.alvo = v;
    redesenhar.current();
  });

  React.useEffect(() => {
    const host = caixa.current;
    if (!host) return;
    const canvas = document.createElement("canvas");
    canvas.className = "absolute inset-0 size-full";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) {
      canvas.remove();
      setSemGl(true);
      return;
    }
    gl.getExtension("OES_standard_derivatives");
    const compilar = (tipo: number, src: string) => {
      const s = gl.createShader(tipo)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compilar(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      canvas.remove();
      setSemGl(true);
      return;
    }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes");
    const uTexel = u("uTexel");
    const uAlcance = u("uAlcance");
    const uInk = u("uInk");
    const uLuz = u("uLuz");
    const uTime = u("uTime");
    const uFio = u("uFio");
    const uRaio = u("uRaio");
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let asp = 1;
    let pes: Pe[] = [];

    const lerCores = () => {
      gl.uniform3fv(uInk, resolveCssColor(ink, host));
      gl.uniform3fv(uLuz, resolveCssColor("var(--background)", host));
    };

    const montar = () => {
      const larg = host.clientWidth;
      const alt = host.clientHeight;
      if (!larg || !alt) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(larg * dpr);
      canvas.height = Math.round(alt * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      asp = larg / alt;

      const m = document.createElement("canvas");
      m.width = canvas.width;
      m.height = canvas.height;
      const c = m.getContext("2d", { willReadFrequently: true });
      if (!c) return;
      c.scale(dpr, dpr);
      const estilo = getComputedStyle(host);
      const familia = estilo.getPropertyValue("--font-display").trim() || estilo.fontFamily;
      c.font = `600 100px ${familia}`;
      const corpo = Math.min((0.88 * larg) / (c.measureText(word).width / 100), alt * 0.5);
      c.font = `600 ${corpo}px ${familia}`;
      c.textAlign = "center";
      c.textBaseline = "alphabetic";
      c.fillText(word, larg / 2, alt * 0.5);
      const dado = c.getImageData(0, 0, m.width, m.height);
      const alcance = 48 * dpr;
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, m.width, m.height, 0, gl.ALPHA, gl.UNSIGNED_BYTE, campoDaPalavra(dado, alcance));
      gl.uniform2f(uTexel, 1.6 / larg, 1.6 / alt);
      gl.uniform1f(uAlcance, alcance / m.height); // o campo em unidades de altura, como os fios
      pes = acharPes(dado, Math.min(drips, MAX_FIOS));
    };

    const fios = new Float32Array(MAX_FIOS * 4);
    const raios = new Float32Array(MAX_FIOS * 2);
    let inclina = entrada.current.alvo;
    let velocidade = 0;

    const pintar = (t: number) => {
      gl.uniform1f(uTime, t);
      fios.fill(0);
      raios.fill(0);
      pes.forEach((pe, i) => {
        const semente = fracao(Math.sin((i + 1) * 12.9898) * 43758.5453);
        const periodo = 8 + semente * 7;
        const fase = fracao(t / periodo + semente);
        const alcance = 0.1 + semente * 0.24;
        const cresce = liso(0, 0.68, fase) * alcance;
        const solta = Math.max(0, fase - 0.68) / 0.32;
        const queda = solta * solta * 1.1;
        const raiz = pe.y + solta * cresce;
        const ponta = pe.y + cresce + queda;
        const x = pe.x * asp;
        fios[i * 4] = x;
        fios[i * 4 + 1] = Math.min(raiz, ponta - 0.001);
        fios[i * 4 + 2] = x + inclina * 0.5 * (ponta - pe.y);
        fios[i * 4 + 3] = ponta;
        const nasce = liso(0, 0.1, fase);
        raios[i * 2] = 0.02 * (1 - solta * 0.85) * nasce;
        raios[i * 2 + 1] = (0.013 + semente * 0.01) * nasce;
      });
      gl.uniform4fv(uFio, fios);
      gl.uniform2fv(uRaio, raios);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const taxa = 0.3 + (speed / 100) * 1.6;
    let raf = 0;
    let rodando = false;
    let relogio = 7; // neste ponto do ciclo os fios já desceram e nenhum está no começo
    let antes = 0;
    const quadro = (agora: number) => {
      const dt = Math.min((agora - antes) / 1000, 0.05);
      antes = agora;
      relogio += dt * taxa;
      const balanco = entrada.current.sensor === null ? Math.sin(relogio * 0.4) * 0.05 : 0;
      velocidade += (entrada.current.alvo + balanco - inclina) * 26 * dt;
      velocidade *= Math.exp(-3.4 * dt);
      inclina += velocidade * dt * 4;
      pintar(relogio);
      if (rodando) raf = requestAnimationFrame(quadro);
    };
    const ligar = () => {
      if (rodando || reduz) return;
      rodando = true;
      antes = performance.now();
      raf = requestAnimationFrame(quadro);
    };
    const desligar = () => {
      rodando = false;
      cancelAnimationFrame(raf);
    };
    redesenhar.current = () => {
      if (!reduz) return;
      inclina = entrada.current.alvo;
      pintar(relogio);
    };

    lerCores();
    montar();
    pintar(relogio);

    const ro = new ResizeObserver(() => {
      montar();
      pintar(relogio);
    });
    ro.observe(host);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? ligar() : desligar()));
    io.observe(host);
    const soltarTema = onThemeChange(() => {
      lerCores();
      pintar(relogio);
    });
    let vivo = true;
    document.fonts?.ready.then(() => {
      if (!vivo) return;
      montar();
      pintar(relogio);
    });

    return () => {
      vivo = false;
      desligar();
      ro.disconnect();
      io.disconnect();
      soltarTema();
      redesenhar.current = () => {};
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, [word, ink, drips, speed, reduz]);

  return (
    <div
      ref={caixa}
      role="img"
      aria-label={word}
      onPointerDown={(e) => {
        if (e.pointerType === "touch") giro.enable();
        e.currentTarget.setPointerCapture(e.pointerId);
        preso.current = { x: e.clientX, de: entrada.current.alvo, larg: e.currentTarget.getBoundingClientRect().width || 1 };
      }}
      onPointerMove={(e) => {
        if (!preso.current) return;
        const d = (e.clientX - preso.current.x) / preso.current.larg;
        entrada.current.alvo = Math.max(-1, Math.min(1, preso.current.de + d * 2.4));
        redesenhar.current();
      }}
      onPointerUp={() => {
        preso.current = null;
        entrada.current.alvo = entrada.current.sensor ?? 0.28;
        redesenhar.current();
      }}
      onPointerCancel={() => (preso.current = null)}
      className={cn("relative aspect-[3/2] w-[min(100%,36rem)] cursor-grab touch-pan-y select-none text-foreground active:cursor-grabbing", className)}
      {...rest}
    >
      {semGl ? <span className="absolute inset-0 grid place-items-center text-6xl font-semibold [font-family:var(--font-display,inherit)]">{word}</span> : null}
    </div>
  );
}
