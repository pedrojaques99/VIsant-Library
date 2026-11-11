"use client";

/**
 * O gravador de bolso com microfone de mentira: gravar corre o relógio e um nível sintético,
 * parar vira uma nota nova que "transcreve" por um instante, tocar anda pela duração da nota.
 * A peça não sabe de nada disso; ela só recebe estado e devolve ações.
 */

import * as React from "react";

import { VoiceRecorder, type RecorderNote, type RecorderState } from "../../../registry/visant/ui/voice-recorder";

const AGORA = Date.now();
const NOTAS: RecorderNote[] = [
  { id: "n3", title: "Ideia para a abertura", durationMs: 42_000, date: AGORA - 3_600_000, transcript: "Abrir no detalhe do cobogó, a luz passando, e só depois mostrar a fachada inteira." },
  { id: "n2", title: "Lista do mercado", durationMs: 18_000, date: AGORA - 86_400_000, transcript: "Café, pão, tomate e o filtro da cafeteira." },
  { id: "n1", title: "Retorno do cliente", durationMs: 95_000, date: AGORA - 2 * 86_400_000, transcript: "Gostaram da paleta; pediram a marca um pouco maior no fechamento." },
];

export default function VoiceRecorderDemo() {
  const [estado, setEstado] = React.useState<RecorderState>("idle");
  const [notas, setNotas] = React.useState(NOTAS);
  const [sel, setSel] = React.useState<string | null>(NOTAS[0].id);
  const [tempo, setTempo] = React.useState(0);
  const [volume, setVolume] = React.useState(0.8);
  const relogio = React.useRef<number>(0);
  const t0 = React.useRef(0);
  const acumulado = React.useRef(0);
  const espera = React.useRef<number>(0);
  React.useEffect(() => () => { window.clearInterval(relogio.current); window.clearTimeout(espera.current); }, []);

  const correr = (ate?: number) => {
    window.clearInterval(relogio.current);
    t0.current = Date.now();
    relogio.current = window.setInterval(() => {
      const t = acumulado.current + Date.now() - t0.current;
      if (ate && t >= ate) { window.clearInterval(relogio.current); setEstado("idle"); setTempo(0); return; }
      setTempo(t);
    }, 100);
  };
  const congelar = () => { window.clearInterval(relogio.current); acumulado.current += Date.now() - t0.current; };

  const gravar = () => {
    if (estado === "paused") { setEstado("recording"); correr(); return; }
    acumulado.current = 0; setTempo(0); setEstado("recording"); correr();
  };
  const parar = () => {
    if (estado === "playing") { window.clearInterval(relogio.current); setEstado("idle"); setTempo(0); return; }
    congelar();
    const nova: RecorderNote = { id: `g${Date.now()}`, title: "Nota nova", durationMs: acumulado.current, date: Date.now(), pending: true };
    setNotas((l) => [nova, ...l]);
    setSel(nova.id);
    setEstado("transcribing");
    espera.current = window.setTimeout(() => {
      setNotas((l) => l.map((n) => (n.id === nova.id ? { ...n, pending: false, transcript: "Teste de microfone, um, dois." } : n)));
      setEstado("idle");
    }, 1600);
  };
  const tocar = (id: string) => {
    const n = notas.find((x) => x.id === id);
    if (!n) return;
    setSel(id); acumulado.current = 0; setTempo(0); setEstado("playing"); correr(n.durationMs);
  };
  // Nível sintético: fala tem sílabas, então um seno lento modulando ruído.
  const nivel = React.useCallback(() => {
    const t = performance.now() / 1000;
    return Math.max(0, Math.sin(t * 5.3) * 0.5 + 0.35) * (0.6 + Math.random() * 0.4);
  }, []);

  return (
    <VoiceRecorder
      state={estado} timeMs={tempo} getLevel={nivel} notes={notas} selectedId={sel} volume={volume}
      onRecord={gravar} onPause={() => { congelar(); setEstado("paused"); }} onStop={parar}
      onDiscard={() => { window.clearInterval(relogio.current); setTempo(0); setEstado("idle"); }}
      onPlay={tocar} onVolumeChange={setVolume} onSelect={setSel}
    />
  );
}
