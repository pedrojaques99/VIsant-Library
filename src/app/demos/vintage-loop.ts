/**
 * O loop curto das demos com som (bumbo, chimbau, baixo e arpejo), sintetizado aqui, e o
 * `AnalyserNode` que o tubo lê. Osciloscópio e TV dividem este arquivo: o que se ouve é
 * o que se vê nos dois.
 */

import * as React from "react";

/** 16 passos a 112 BPM: semicolcheia. */
const PASSO = 60 / 112 / 4;
const BAIXO = [55, 0, 0, 55, 0, 0, 65.4, 0, 49, 0, 0, 49, 0, 0, 73.4, 0];
const ARPEJO = [440, 0, 523, 0, 659, 0, 523, 0, 392, 0, 494, 0, 587, 0, 494, 0];

/** Uma amostra do mesmo desenho do loop, em função do tempo: bumbo, baixo e arpejo. */
function amostra(t: number) {
  const tempo = Math.floor(t / PASSO);
  const noPasso = (t % PASSO) / PASSO;
  const noTempo = (t % (PASSO * 4)) / (PASSO * 4);
  const bumbo = 0.7 * Math.sin(2 * Math.PI * 62 * t) * Math.exp(-5 * noTempo);
  const baixo = 0.22 * Math.sin(2 * Math.PI * (BAIXO[tempo % 16] || 55) * 2 * t);
  const arpejo = 0.2 * Math.sin(2 * Math.PI * (ARPEJO[tempo % 16] || 330) * t) * Math.exp(-2.5 * noPasso);
  return bumbo + baixo + arpejo;
}

/**
 * Um analisador de mentira, mudo, para o tubo nascer com sinal.
 *
 * Som sem pedido é proibido e o autoplay é bloqueado, então antes do PLAY não existe
 * `AudioContext`. A peça só chama estes dois membros do `AnalyserNode`, e é ela quem
 * pede a amostra a cada quadro: não há relógio aqui para parar.
 */
export const SINAL_DE_REPOUSO = {
  fftSize: 1024,
  getFloatTimeDomainData(saida: Float32Array) {
    const agora = performance.now() / 1000;
    for (let i = 0; i < saida.length; i++) saida[i] = amostra(agora + i / 44100);
  },
} as unknown as AnalyserNode;

/** O motor do loop: contexto, analisador e um agendador com folga. */
export function useLoop(ligado: boolean) {
  const [analyser, setAnalyser] = React.useState<AnalyserNode | null>(null);
  const ctxRef = React.useRef<AudioContext | null>(null);

  React.useEffect(() => {
    if (!ligado) return;
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = ctxRef.current ?? new AC();
    ctxRef.current = ctx;
    void ctx.resume();

    // O analisador lê o sinal ANTES do volume: o tubo desenha a forma cheia,
    // e o alto-falante recebe só um quarto dela.
    const mestre = ctx.createGain();
    mestre.gain.value = 1;
    const an = ctx.createAnalyser();
    an.fftSize = 1024;
    const volume = ctx.createGain();
    volume.gain.value = 0.22;
    mestre.connect(an).connect(volume).connect(ctx.destination);
    setAnalyser(an);

    const len = Math.floor(ctx.sampleRate * 0.3);
    const ruido = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = ruido.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    const env = (pico: number, dur: number, t: number) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(pico, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      g.connect(mestre);
      return g;
    };
    const osc = (forma: OscillatorType, de: number, ate: number, pico: number, dur: number, t: number) => {
      const o = ctx.createOscillator();
      o.type = forma;
      o.frequency.setValueAtTime(de, t);
      if (ate !== de) o.frequency.exponentialRampToValueAtTime(ate, t + dur * 0.5);
      o.connect(env(pico, dur, t));
      o.start(t);
      o.stop(t + dur + 0.02);
    };
    const chiado = (pico: number, dur: number, t: number) => {
      const s = ctx.createBufferSource();
      s.buffer = ruido;
      const f = ctx.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = 7000;
      s.connect(f).connect(env(pico, dur, t));
      s.start(t, 0, dur + 0.02);
    };

    let passo = 0;
    let proximo = ctx.currentTime + 0.05;
    const agendar = () => {
      // Folga de 120 ms: o `setInterval` atrasa, o relógio do áudio não.
      while (proximo < ctx.currentTime + 0.12) {
        const i = passo % 16;
        if (i % 4 === 0) osc("sine", 140, 45, 0.9, 0.22, proximo);
        if (i % 4 === 2) chiado(0.25, 0.05, proximo);
        if (BAIXO[i]) osc("sawtooth", BAIXO[i], BAIXO[i], 0.28, PASSO * 2.5, proximo);
        if (ARPEJO[i]) osc("triangle", ARPEJO[i], ARPEJO[i], 0.18, PASSO * 1.6, proximo);
        proximo += PASSO;
        passo += 1;
      }
    };
    agendar();
    const id = window.setInterval(agendar, 30);

    return () => {
      window.clearInterval(id);
      // Solta a cauda das notas em vez de cortar no meio.
      volume.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03);
      window.setTimeout(() => volume.disconnect(), 200);
      setAnalyser(null);
    };
  }, [ligado]);

  React.useEffect(
    () => () => {
      void ctxRef.current?.close();
      ctxRef.current = null;
    },
    []
  );

  return analyser;
}
